import { FlightItem, FlightStatus } from '../types/flight';
import { AIRPORTS } from '../data/airports';
import { AIRLINES } from '../data/airlines';
import {
  generateRouteWaypoints,
  getPositionAlongRoute,
  getDistanceFromLatLonInKm,
} from '../utils/flightSimulation';
import { createInitialFlights } from '../data/mockFlights';

// Airport name mapping for KAC response (both Korean & English airport names)
const AIRPORT_NAME_TO_CODE: Record<string, string> = {
  김포: 'GMP',
  GIMPO: 'GMP',
  GMP: 'GMP',
  김해: 'PUS',
  부산: 'PUS',
  GIMHAE: 'PUS',
  BUSAN: 'PUS',
  PUS: 'PUS',
  청주: 'CJJ',
  CHEONGJU: 'CJJ',
  CJJ: 'CJJ',
  대구: 'TAE',
  DAEGU: 'TAE',
  TAE: 'TAE',
  광주: 'KWJ',
  GWANGJU: 'KWJ',
  KWJ: 'KWJ',
  울산: 'USN',
  ULSAN: 'USN',
  USN: 'USN',
  원주: 'WJU',
  WONJU: 'WJU',
  WJU: 'WJU',
  여수: 'RSU',
  YEOSU: 'RSU',
  RSU: 'RSU',
  포항: 'KPO',
  '포항경주': 'KPO',
  POHANG: 'KPO',
  KPO: 'KPO',
  사천: 'HIN',
  SACHEON: 'HIN',
  HIN: 'HIN',
  군산: 'KUV',
  GUNSAN: 'KUV',
  KUV: 'KUV',
  제주: 'CJU',
  JEJU: 'CJU',
  CJU: 'CJU',
};

// Airline code mapping
function detectAirlineCode(flightNumber: string, airlineKorean?: string): string {
  const cleanFn = (flightNumber || '').toUpperCase().trim();
  if (cleanFn.startsWith('KE') || cleanFn.startsWith('KAL')) return 'KE';
  if (cleanFn.startsWith('OZ') || cleanFn.startsWith('AAR')) return 'OZ';
  if (cleanFn.startsWith('7C') || cleanFn.startsWith('JJA')) return '7C';
  if (cleanFn.startsWith('LJ') || cleanFn.startsWith('JNA')) return 'LJ';
  if (cleanFn.startsWith('TW') || cleanFn.startsWith('TWB')) return 'TW';
  if (cleanFn.startsWith('BX') || cleanFn.startsWith('ABL')) return 'BX';
  if (cleanFn.startsWith('RS') || cleanFn.startsWith('ASV')) return 'RS';
  if (cleanFn.startsWith('ZE') || cleanFn.startsWith('ESR')) return 'ZE';
  if (cleanFn.startsWith('RF') || cleanFn.startsWith('EOK')) return 'RF';

  // Fallback by airline Korean name
  const name = airlineKorean || '';
  if (name.includes('대한')) return 'KE';
  if (name.includes('아시아나')) return 'OZ';
  if (name.includes('제주')) return '7C';
  if (name.includes('진에어')) return 'LJ';
  if (name.includes('티웨이')) return 'TW';
  if (name.includes('에어부산')) return 'BX';
  if (name.includes('에어서울')) return 'RS';
  if (name.includes('이스타')) return 'ZE';
  if (name.includes('에어로케이')) return 'RF';

  return 'KE';
}

function parseKacTime(timeRaw: string | number | undefined): string {
  if (!timeRaw) return '00:00';
  const str = String(timeRaw).padStart(4, '0');
  const hh = str.slice(0, 2);
  const mm = str.slice(2, 4);
  return `${hh}:${mm}`;
}

function mapKacStatus(rmkKor?: string): FlightStatus {
  const rmk = (rmkKor || '').trim();
  if (rmk.includes('결항') || rmk.includes('취소')) return 'CANCELLED';
  if (rmk.includes('지연')) return 'DELAYED';
  if (rmk.includes('출발') || rmk.includes('이륙')) return 'DEPARTED';
  if (rmk.includes('도착') || rmk.includes('착륙')) return 'LANDED';
  if (rmk.includes('탑승중') || rmk.includes('탑승')) return 'BOARDING';
  if (rmk.includes('마감')) return 'CLOSED';
  return 'SCHEDULED';
}

function parseHHMMtoMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export interface FetchFlightsResult {
  source: 'KAC_LIVE' | 'SIMULATION';
  flights: FlightItem[];
  updatedAt: string;
  totalCount: number;
  message?: string;
}

export async function fetchLiveFlights(customApiKey?: string): Promise<FetchFlightsResult> {
  const storedKey = localStorage.getItem('jeju_kac_api_key') || '';
  const effectiveKey = (customApiKey !== undefined ? customApiKey : storedKey).trim();

  let serverMessage = '';

  // Try both /api/flights and direct Netlify function path
  const endpoints = ['/api/flights', '/.netlify/functions/flights'];

  for (const ep of endpoints) {
    try {
      const url = new URL(ep, window.location.origin);
      if (effectiveKey) {
        url.searchParams.set('key', effectiveKey);
      }

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });

      const rawText = await response.text();

      // Guard against HTML SPA fallback (<!doctype html... )
      if (!rawText || rawText.trim().startsWith('<')) {
        serverMessage = '서버리스 함수 라우팅 대기 중 (Netlify 재배포가 필요할 수 있습니다)';
        continue;
      }

      let result: any;
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        serverMessage = '서버 응답 파싱 오류';
        continue;
      }

      serverMessage = result.message || '';

      if (result.status === 'SUCCESS' && Array.isArray(result.data) && result.data.length > 0) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const parsedFlights: FlightItem[] = result.data.map((item: any, idx: number) => {
          const flightNumber = String(item.airFln || `FL${idx}`).toUpperCase();
          const airlineCode = detectAirlineCode(flightNumber, item.airlineKorean);
          const isDep = item.ioType === 'DEPARTURE';

          // Target airport detection
          const rawTarget = isDep
            ? (item.arrivedEng || item.arrivedKor || 'GMP').toUpperCase().trim()
            : (item.boardedEng || item.boardedKor || 'GMP').toUpperCase().trim();

          const targetCode = AIRPORT_NAME_TO_CODE[rawTarget] || 'GMP';
          const origin = isDep ? 'CJU' : targetCode;
          const destination = isDep ? targetCode : 'CJU';

          const scheduledTime = parseKacTime(item.std);
          const estimatedTime = item.etd ? parseKacTime(item.etd) : scheduledTime;

          let status = mapKacStatus(item.rmkKor);
          const schedMins = parseHHMMtoMinutes(scheduledTime);
          const diffFromNow = schedMins - nowMinutes;

          // Calculate progress percentage and real-time physical simulation telemetry
          let progressPct = 0;
          if (status === 'CANCELLED') {
            progressPct = 0;
          } else if (status === 'LANDED') {
            progressPct = 100;
          } else if (status === 'DEPARTED') {
            const elapsed = Math.max(5, Math.min(50, Math.abs(diffFromNow)));
            progressPct = Math.min(95, Math.round((elapsed / 55) * 100));
            if (progressPct >= 90) status = 'APPROACHING';
          } else if (status === 'DELAYED') {
            progressPct = diffFromNow < -15 ? 40 : 0;
          } else if (status === 'BOARDING') {
            progressPct = 0;
          } else {
            if (diffFromNow < -60) {
              status = 'LANDED';
              progressPct = 100;
            } else if (diffFromNow < -5) {
              status = 'DEPARTED';
              progressPct = Math.min(95, Math.round((Math.abs(diffFromNow) / 55) * 100));
              if (progressPct >= 90) status = 'APPROACHING';
            } else if (diffFromNow <= 15) {
              status = isDep ? 'BOARDING' : 'APPROACHING';
              progressPct = isDep ? 0 : 92;
            } else {
              status = 'SCHEDULED';
              progressPct = 0;
            }
          }

          const waypoints = generateRouteWaypoints(origin, destination);
          const pos = getPositionAlongRoute(waypoints, progressPct);
          const origAirport = AIRPORTS[origin] || AIRPORTS.CJU;
          const destAirport = AIRPORTS[destination] || AIRPORTS.GMP;
          const distanceKm = Math.round(
            getDistanceFromLatLonInKm(origAirport.lat, origAirport.lng, destAirport.lat, destAirport.lng)
          );

          const airline = AIRLINES[airlineCode] || AIRLINES.KE;
          const aircraftType =
            airlineCode === 'KE'
              ? 'A321neo'
              : airlineCode === 'OZ'
              ? 'A330-300'
              : airlineCode === 'LJ'
              ? 'B777-200ER'
              : 'B737-800';

          const delayMinutes =
            scheduledTime !== estimatedTime
              ? Math.max(0, parseHHMMtoMinutes(estimatedTime) - parseHHMMtoMinutes(scheduledTime))
              : undefined;

          return {
            id: `${flightNumber}-${idx}-${origin}-${destination}`,
            flightNumber,
            airlineCode,
            aircraftType,
            regNumber: `8${Math.floor(100 + Math.random() * 899)}`,
            origin,
            destination,
            type: isDep ? 'DEPARTURE' : 'ARRIVAL',
            scheduledTime,
            estimatedTime,
            status,
            gate: item.boardingKor ? String(item.boardingKor) : String(Math.floor(1 + Math.random() * 18)),
            checkInCounter: isDep ? `3층 ${airline.code} 카운터` : undefined,
            carousel: !isDep ? (item.baggage ? `${item.baggage}번` : `${Math.floor(1 + Math.random() * 6)}번`) : undefined,
            isDelayed: status === 'DELAYED' || (delayMinutes ? delayMinutes > 0 : false),
            delayMinutes: delayMinutes || (status === 'DELAYED' ? 20 : undefined),
            delayReason: item.rmkKor || (status === 'DELAYED' ? '기상 및 연결편 지연' : undefined),
            distanceKm,
            lat: pos.lat,
            lng: pos.lng,
            altitudeFt: pos.altitude,
            speedKts: pos.speedKts,
            headingDeg: pos.heading,
            verticalSpeedFpm: pos.verticalSpeed,
            progressPct,
            routeWaypoints: waypoints,
          };
        });

        return {
          source: 'KAC_LIVE',
          flights: parsedFlights,
          updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          totalCount: parsedFlights.length,
          message: 'KAC 실시간 항공기 운항정보가 성공적으로 연동되었습니다.',
        };
      } else if (result.status === 'NO_API_KEY') {
        serverMessage = result.message || 'API 키가 설정되지 않았습니다.';
        break; // Stop further endpoint try if no api key
      } else if (result.status === 'API_ERROR') {
        serverMessage = result.message || '공공데이터포털 API 호출 에러';
        break;
      }
    } catch (err: any) {
      serverMessage = err.message || 'API 서버 연결 실패';
    }
  }

  // Fallback to simulation data
  const fallbackList = createInitialFlights();
  return {
    source: 'SIMULATION',
    flights: fallbackList,
    updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    totalCount: fallbackList.length,
    message: serverMessage || '공공데이터포털 KAC API 키를 설정하면 실제 운항정보가 연동됩니다.',
  };
}
