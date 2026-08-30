import { FlightItem, FlightStatus, JejuWeather } from '../types/flight';
import { AIRPORTS } from '../data/airports';

// Calculate distance between two lat/lng in km (Haversine)
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate bearing/heading in degrees from point 1 to point 2
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(deg2rad(lon2 - lon1)) * Math.cos(deg2rad(lat2));
  const x =
    Math.cos(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) -
    Math.sin(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(lon2 - lon1));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Interpolate position along waypoints by progress percentage (0 to 100)
export function getPositionAlongRoute(
  waypoints: [number, number][],
  progressPct: number
): { lat: number; lng: number; heading: number; altitude: number; speedKts: number; verticalSpeed: number } {
  if (waypoints.length === 0) {
    return { lat: 33.5113, lng: 126.493, heading: 0, altitude: 0, speedKts: 0, verticalSpeed: 0 };
  }
  if (waypoints.length === 1 || progressPct <= 0) {
    return { lat: waypoints[0][0], lng: waypoints[0][1], heading: 0, altitude: 0, speedKts: 0, verticalSpeed: 0 };
  }
  if (progressPct >= 100) {
    const last = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2];
    return {
      lat: last[0],
      lng: last[1],
      heading: calculateBearing(prev[0], prev[1], last[0], last[1]),
      altitude: 0,
      speedKts: 0,
      verticalSpeed: 0,
    };
  }

  // Calculate segment lengths
  const segmentDistances: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = getDistanceFromLatLonInKm(
      waypoints[i][0],
      waypoints[i][1],
      waypoints[i + 1][0],
      waypoints[i + 1][1]
    );
    segmentDistances.push(d);
    totalDist += d;
  }

  const targetDist = (progressPct / 100) * totalDist;
  let accumulated = 0;
  let segIndex = 0;
  let segFraction = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    if (accumulated + segmentDistances[i] >= targetDist) {
      segIndex = i;
      segFraction = (targetDist - accumulated) / (segmentDistances[i] || 1);
      break;
    }
    accumulated += segmentDistances[i];
  }

  const p1 = waypoints[segIndex];
  const p2 = waypoints[segIndex + 1];
  const lat = p1[0] + (p2[0] - p1[0]) * segFraction;
  const lng = p1[1] + (p2[1] - p1[1]) * segFraction;
  const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

  // Altitude & Speed physics profile
  // 0% -> 0ft (Takeoff)
  // 0-20% -> Climb to Cruise (24,000 ~ 28,000 ft)
  // 20-75% -> Cruise
  // 75-95% -> Descent
  // 95-100% -> Approach & Touchdown
  let altitude = 0;
  let speedKts = 0;
  let verticalSpeed = 0;

  if (progressPct <= 5) {
    altitude = progressPct * 800; // 0 to 4000ft
    speedKts = 140 + progressPct * 20;
    verticalSpeed = 2200;
  } else if (progressPct < 22) {
    const frac = (progressPct - 5) / 17;
    altitude = 4000 + frac * 22000; // 4,000 to 26,000 ft
    speedKts = 240 + frac * 180; // 240 to 420 kts
    verticalSpeed = 1600;
  } else if (progressPct <= 75) {
    altitude = 26000 + Math.sin(progressPct * 0.1) * 300;
    speedKts = 430 + Math.cos(progressPct * 0.2) * 15;
    verticalSpeed = 0;
  } else if (progressPct <= 95) {
    const frac = (progressPct - 75) / 20;
    altitude = 26000 * (1 - frac) + 2000 * frac;
    speedKts = 420 - frac * 230;
    verticalSpeed = -1500;
  } else {
    const frac = (progressPct - 95) / 5;
    altitude = 2000 * (1 - frac);
    speedKts = 190 - frac * 50;
    verticalSpeed = -700;
  }

  return {
    lat,
    lng,
    heading,
    altitude: Math.max(0, Math.round(altitude)),
    speedKts: Math.max(0, Math.round(speedKts)),
    verticalSpeed,
  };
}

// Generate realistic route waypoints between Jeju and target airport
export function generateRouteWaypoints(originCode: string, destCode: string): [number, number][] {
  const orig = AIRPORTS[originCode] || AIRPORTS.CJU;
  const dest = AIRPORTS[destCode] || AIRPORTS.GMP;

  // Add realistic aviation waypoints
  const midLat = (orig.lat + dest.lat) / 2;
  const midLng = (orig.lng + dest.lng) / 2;

  // West side corridor (Gimpo, Gunsan, etc.)
  if (destCode === 'GMP' || originCode === 'GMP') {
    return [
      [orig.lat, orig.lng],
      [34.350, 126.150], // SOSDO
      [35.450, 126.280], // BEDES
      [36.650, 126.620], // APARU
      [dest.lat, dest.lng],
    ];
  }

  // East/South corridor (Busan, Daegu, Ulsan, Pohang)
  if (['PUS', 'TAE', 'USN', 'KPO'].includes(destCode) || ['PUS', 'TAE', 'USN', 'KPO'].includes(originCode)) {
    return [
      [orig.lat, orig.lng],
      [34.180, 127.150], // DOTOL
      [34.750, 127.700], // RSU
      [midLat, midLng],
      [dest.lat, dest.lng],
    ];
  }

  // Central corridor (Cheongju, Gwangju, Wonju, Muan)
  return [
    [orig.lat, orig.lng],
    [34.400, 126.650], // TOLIS
    [midLat, midLng],
    [dest.lat, dest.lng],
  ];
}

// Return human-readable geographic position sector description in Korean
export function getAviationPositionDescription(
  lat: number,
  lng: number,
  progressPct: number,
  flightType: 'DEPARTURE' | 'ARRIVAL',
  origin: string,
  destination: string
): string {
  if (progressPct <= 3) {
    return flightType === 'DEPARTURE' ? '제주국제공항(CJU) 활주로 이륙중' : `${AIRPORTS[origin]?.nameKr || origin} 활주로 이륙중`;
  }
  if (progressPct >= 97) {
    return flightType === 'DEPARTURE' ? `${AIRPORTS[destination]?.nameKr || destination} 활주로 착륙완료` : '제주국제공항(CJU) 활주로 착륙완료';
  }

  // Geographic sector determination
  if (lat < 33.7) {
    return '제주 북방 근해 25km (RKPC 제주 접근관제)';
  }
  if (lat >= 33.7 && lat < 34.2) {
    if (lng < 126.5) return '추자도-보길도 남방 해상 (Y711 항로)';
    return '여서도-거문도 남방 해상 (Y722 항로)';
  }
  if (lat >= 34.2 && lat < 34.7) {
    if (lng < 126.4) return '완도-진도-해남 남서해안 상공';
    if (lng >= 127.3) return '남해-여수-고흥 연안 상공';
    return '강진-장흥-보성 상공 (남해안 관제)';
  }
  if (lat >= 34.7 && lat < 35.3) {
    if (lng < 126.8) return '광주-나주-무안 상공';
    if (lng >= 127.8) return '진주-사천-창원-부산 가덕도 상공';
    return '순천-지리산 남부-곡성 상공';
  }
  if (lat >= 35.3 && lat < 36.1) {
    if (lng < 127.0) return '전주-군산-익산 서해안 상공';
    if (lng >= 127.8) return '대구-김천-영천-포항 회랑';
    return '전북 무주-장수-대전 남방 상공';
  }
  if (lat >= 36.1 && lat < 36.9) {
    if (lng < 126.8) return '충남 서산-당진-태안 상공';
    if (lng >= 127.5) return '충북 청주-충주-음성 상공';
    return '대전-세종-천안 상공 (중부 관제)';
  }
  if (lat >= 36.9) {
    if (lng < 126.8) return '경기 화성-평택만 상공';
    return '수도권 안양-수원-김포 접근관제구역 (RKSS)';
  }

  return '한반도-제주 회랑 상공';
}

export interface FlightStatusDisplayInfo {
  mainStatus: string;
  subStatus: string;
  badgeStyle: 'AIRBORNE' | 'APPROACHING' | 'BOARDING' | 'LANDED' | 'DELAYED' | 'SCHEDULED' | 'CANCELLED';
  isLiveInFlight: boolean;
}

export function getFlightStatusDisplay(flight: FlightItem): FlightStatusDisplayInfo {
  const isDep = flight.type === 'DEPARTURE';
  const isDelayed = flight.status === 'DELAYED' || (flight.delayMinutes || 0) > 0;
  const delayText = isDelayed ? `(${flight.delayMinutes || 15}분 지연)` : '(정시)';

  // 1. Cancelled
  if (flight.status === 'CANCELLED') {
    return {
      mainStatus: '결항',
      subStatus: flight.delayReason || '기상 악화 결항',
      badgeStyle: 'CANCELLED',
      isLiveInFlight: false,
    };
  }

  // 2. Active Airborne in flight
  if (flight.status === 'DEPARTED' || (flight.progressPct > 5 && flight.progressPct < 90)) {
    return {
      mainStatus: '비행중',
      subStatus: isDep
        ? `순항중 (진행률 ${flight.progressPct}% · FL${Math.round(flight.altitudeFt / 100)})`
        : `제주행 순항 (진행률 ${flight.progressPct}% · FL${Math.round(flight.altitudeFt / 100)})`,
      badgeStyle: 'AIRBORNE',
      isLiveInFlight: true,
    };
  }

  // 3. Approaching
  if (flight.status === 'APPROACHING' || flight.progressPct >= 90) {
    if (flight.progressPct >= 98) {
      return {
        mainStatus: isDep ? `출발완료 ${delayText}` : `도착완료 ${delayText}`,
        subStatus: isDep ? '목적지 공항 착륙완료' : '제주공항 착륙완료 (게이트 이동)',
        badgeStyle: 'LANDED',
        isLiveInFlight: false,
      };
    }
    return {
      mainStatus: '비행중 (착륙접근)',
      subStatus: isDep ? '목적지 활주로 최종 접근중' : '제주공항 07번 활주로 정렬 접근중',
      badgeStyle: 'APPROACHING',
      isLiveInFlight: true,
    };
  }

  // 4. Landed / Departed completed
  if (flight.status === 'LANDED') {
    return {
      mainStatus: isDep ? `출발완료 ${delayText}` : `도착완료 ${delayText}`,
      subStatus: isDep ? '출발 및 운항 종료' : `수하물 수취대: ${flight.carousel || '1층'}`,
      badgeStyle: 'LANDED',
      isLiveInFlight: false,
    };
  }

  // 5. Boarding
  if (flight.status === 'BOARDING') {
    return {
      mainStatus: isDep ? '탑승중' : '출발준비중',
      subStatus: isDep ? `${flight.gate}번 게이트 탑승 수속중` : `${flight.origin}공항 탑승중`,
      badgeStyle: 'BOARDING',
      isLiveInFlight: false,
    };
  }

  // 6. Closed
  if (flight.status === 'CLOSED') {
    return {
      mainStatus: '탑승마감',
      subStatus: '항공기 도어 클로즈 및 유도로 이동',
      badgeStyle: 'BOARDING',
      isLiveInFlight: false,
    };
  }

  // 7. Delayed
  if (flight.status === 'DELAYED' || (isDelayed && flight.progressPct <= 5)) {
    return {
      mainStatus: isDep ? `출발지연 (${flight.delayMinutes || 15}분 지연)` : `도착지연 (${flight.delayMinutes || 15}분 지연)`,
      subStatus: flight.delayReason || '기상 및 연결편 지연',
      badgeStyle: 'DELAYED',
      isLiveInFlight: false,
    };
  }

  // 8. Scheduled
  return {
    mainStatus: isDep ? '출발예정' : '도착예정',
    subStatus: isDep ? `체크인 카운터: ${flight.checkInCounter || '3층'}` : `도착 예정 (${flight.scheduledTime})`,
    badgeStyle: 'SCHEDULED',
    isLiveInFlight: false,
  };
}

export const INITIAL_JEJU_WEATHER: JejuWeather = {
  airportIcao: 'RKPC (제주국제공항)',
  tempC: 18.5,
  windDirectionDeg: 310, // NW wind (typical Jeju winter/spring)
  windSpeedKt: 24,
  gustKt: 36,
  visibilityKm: 10,
  cloudBaseFt: 3500,
  qnhHpa: 1016,
  runwayInUse: 'RWY 31 (북서풍 주 활주로 착륙)',
  windshearStatus: 'CAUTION',
  crosswindKt: 18,
  disruptionRiskPct: 22,
  updatedAt: '실시간 METAR 갱신됨',
};
