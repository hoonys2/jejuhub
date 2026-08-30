import { FlightItem, FlightStatus } from '../types/flight';
import { generateRouteWaypoints, getPositionAlongRoute, getDistanceFromLatLonInKm } from '../utils/flightSimulation';
import { AIRPORTS } from './airports';

export interface FlightBlueprint {
  flightNumber: string;
  airlineCode: string;
  aircraftType: string;
  regNumber: string;
  origin: string;
  destination: string;
  type: 'DEPARTURE' | 'ARRIVAL';
  timeOffsetMinutes: number; // Offset in minutes from current time (e.g., -180 = 3h ago, +120 = 2h from now)
  fixedHourMinute?: { hour: number; minute: number }; // Baseline daily schedule slot (06:00 to 23:00)
  gate: string;
  checkInCounter?: string;
  carousel?: string;
  isDelayed?: boolean;
  delayMinutes?: number;
  delayReason?: string;
}

// Master templates for daily Jeju flights across all operating domestic carriers
const DAILY_FLIGHT_BLUEPRINTS: FlightBlueprint[] = [
  // === EARLY MORNING (06:30 ~ 09:00) ===
  {
    flightNumber: 'KE1202',
    airlineCode: 'KE',
    aircraftType: 'A321neo',
    regNumber: 'HL8530',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: -300,
    fixedHourMinute: { hour: 6, minute: 40 },
    gate: '8',
    checkInCounter: '3층 1-12번',
  },
  {
    flightNumber: '7C102',
    airlineCode: '7C',
    aircraftType: 'B737-800',
    regNumber: 'HL8301',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -290,
    fixedHourMinute: { hour: 7, minute: 10 },
    gate: '14',
    carousel: '3번',
  },
  {
    flightNumber: 'OZ8904',
    airlineCode: 'OZ',
    aircraftType: 'A330-300',
    regNumber: 'HL7792',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: -270,
    fixedHourMinute: { hour: 7, minute: 25 },
    gate: '11',
    checkInCounter: '3층 13-24번',
  },
  {
    flightNumber: 'BX8802',
    airlineCode: 'BX',
    aircraftType: 'A321neo',
    regNumber: 'HL8356',
    origin: 'PUS',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -250,
    fixedHourMinute: { hour: 7, minute: 45 },
    gate: '7',
    carousel: '1번',
  },
  {
    flightNumber: 'LJ304',
    airlineCode: 'LJ',
    aircraftType: 'B777-200ER',
    regNumber: 'HL7733',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: -230,
    fixedHourMinute: { hour: 8, minute: 0 },
    gate: '16',
    checkInCounter: '3층 37-46번',
  },
  {
    flightNumber: 'TW704',
    airlineCode: 'TW',
    aircraftType: 'B737-800',
    regNumber: 'HL8327',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -210,
    fixedHourMinute: { hour: 8, minute: 20 },
    gate: '5',
    carousel: '4번',
  },
  {
    flightNumber: 'RF602',
    airlineCode: 'RF',
    aircraftType: 'A320-200',
    regNumber: 'HL8384',
    origin: 'CJU',
    destination: 'CJJ',
    type: 'DEPARTURE',
    timeOffsetMinutes: -190,
    fixedHourMinute: { hour: 8, minute: 40 },
    gate: '2',
    checkInCounter: '3층 79-84번',
  },

  // === MORNING PEAK (09:00 ~ 12:00) ===
  {
    flightNumber: 'ZE206',
    airlineCode: 'ZE',
    aircraftType: 'B737-8',
    regNumber: 'HL8541',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -170,
    fixedHourMinute: { hour: 9, minute: 15 },
    gate: '12',
    carousel: '5번',
  },
  {
    flightNumber: 'KE1910',
    airlineCode: 'KE',
    aircraftType: 'B737-900',
    regNumber: 'HL7569',
    origin: 'CJU',
    destination: 'TAE',
    type: 'DEPARTURE',
    timeOffsetMinutes: -150,
    fixedHourMinute: { hour: 9, minute: 35 },
    gate: '6',
    checkInCounter: '3층 1-12번',
  },
  {
    flightNumber: 'RS904',
    airlineCode: 'RS',
    aircraftType: 'A321-200',
    regNumber: 'HL8255',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -130,
    fixedHourMinute: { hour: 10, minute: 5 },
    gate: '9',
    carousel: '2번',
  },
  {
    flightNumber: 'OZ8980',
    airlineCode: 'OZ',
    aircraftType: 'A321-200',
    regNumber: 'HL8071',
    origin: 'CJU',
    destination: 'KWJ',
    type: 'DEPARTURE',
    timeOffsetMinutes: -110,
    fixedHourMinute: { hour: 10, minute: 30 },
    gate: '1',
    checkInCounter: '3층 13-24번',
  },
  {
    flightNumber: '7C512',
    airlineCode: '7C',
    aircraftType: 'B737-800',
    regNumber: 'HL8315',
    origin: 'PUS',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -90,
    fixedHourMinute: { hour: 11, minute: 0 },
    gate: '4',
    carousel: '6번',
  },
  {
    flightNumber: 'TW802',
    airlineCode: 'TW',
    aircraftType: 'A330-300',
    regNumber: 'HL8501',
    origin: 'CJU',
    destination: 'CJJ',
    type: 'DEPARTURE',
    timeOffsetMinutes: -70,
    fixedHourMinute: { hour: 11, minute: 25 },
    gate: '15',
    checkInCounter: '3층 47-56번',
  },

  // === MIDDAY / CURRENT ACTIVE WINDOW (-60m ~ +60m relative to now) ===
  {
    flightNumber: 'KE1236',
    airlineCode: 'KE',
    aircraftType: 'A321neo',
    regNumber: 'HL8530',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: -25, // Departed 25 min ago -> in flight
    gate: '8',
    checkInCounter: '3층 1-12번',
  },
  {
    flightNumber: '7C115',
    airlineCode: '7C',
    aircraftType: 'B737-800',
    regNumber: 'HL8305',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -10, // Arriving in 10 min -> approaching
    gate: '15',
    carousel: '5번',
  },
  {
    flightNumber: 'OZ8942',
    airlineCode: 'OZ',
    aircraftType: 'A330-300',
    regNumber: 'HL7792',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 10, // In 10 min -> boarding now
    gate: '11',
    checkInCounter: '3층 13-24번',
  },
  {
    flightNumber: 'LJ318',
    airlineCode: 'LJ',
    aircraftType: 'B737-800',
    regNumber: 'HL7562',
    origin: 'CJU',
    destination: 'PUS',
    type: 'DEPARTURE',
    timeOffsetMinutes: -35, // Departed 35m ago -> near destination
    gate: '3',
    checkInCounter: '3층 37-46번',
  },
  {
    flightNumber: 'TW724',
    airlineCode: 'TW',
    aircraftType: 'A330-300',
    regNumber: 'HL8501',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 25, // In 25 min -> scheduled / gate open
    gate: '14',
    checkInCounter: '3층 47-56번',
  },
  {
    flightNumber: 'BX8820',
    airlineCode: 'BX',
    aircraftType: 'A321neo',
    regNumber: 'HL8356',
    origin: 'CJU',
    destination: 'PUS',
    type: 'DEPARTURE',
    timeOffsetMinutes: -15, // Departed 15 min ago
    gate: '7',
    checkInCounter: '3층 57-64번',
  },
  {
    flightNumber: '7C118',
    airlineCode: '7C',
    aircraftType: 'B737-800',
    regNumber: 'HL8301',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 35,
    isDelayed: true,
    delayMinutes: 20,
    delayReason: '제주공항 돌풍/윈드시어 항로 간격 조정',
    gate: '4',
    checkInCounter: '3층 25-36번',
  },
  {
    flightNumber: 'OZ8937',
    airlineCode: 'OZ',
    aircraftType: 'A321neo',
    regNumber: 'HL8364',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -20, // In air heading to Jeju
    gate: '10',
    carousel: '2번',
  },
  {
    flightNumber: 'LJ315',
    airlineCode: 'LJ',
    aircraftType: 'B777-200ER',
    regNumber: 'HL7733',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -30,
    gate: '16',
    carousel: '7번 (대형기)',
  },
  {
    flightNumber: 'TW719',
    airlineCode: 'TW',
    aircraftType: 'B737-800',
    regNumber: 'HL8327',
    origin: 'PUS',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: -40,
    gate: '13',
    carousel: '4번',
  },
  {
    flightNumber: 'RF612',
    airlineCode: 'RF',
    aircraftType: 'A320-200',
    regNumber: 'HL8384',
    origin: 'CJU',
    destination: 'CJJ',
    type: 'DEPARTURE',
    timeOffsetMinutes: -8,
    gate: '2',
    checkInCounter: '3층 79-84번',
  },

  // === AFTERNOON & EVENING (Current + 1h ~ +5h) ===
  {
    flightNumber: 'ZE214',
    airlineCode: 'ZE',
    aircraftType: 'B737-8',
    regNumber: 'HL8541',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 50,
    gate: '5',
    checkInCounter: '3층 71-78번',
  },
  {
    flightNumber: 'RS912',
    airlineCode: 'RS',
    aircraftType: 'A321-200',
    regNumber: 'HL8255',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 70,
    gate: '9',
    checkInCounter: '3층 65-70번',
  },
  {
    flightNumber: 'BX8817',
    airlineCode: 'BX',
    aircraftType: 'A321neo',
    regNumber: 'HL8358',
    origin: 'PUS',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: 60,
    gate: '6',
    carousel: '1번',
  },
  {
    flightNumber: 'KE1912',
    airlineCode: 'KE',
    aircraftType: 'B737-900',
    regNumber: 'HL7569',
    origin: 'CJU',
    destination: 'TAE',
    type: 'DEPARTURE',
    timeOffsetMinutes: 85,
    gate: '6',
    checkInCounter: '3층 1-12번',
  },
  {
    flightNumber: 'OZ8982',
    airlineCode: 'OZ',
    aircraftType: 'A321-200',
    regNumber: 'HL8071',
    origin: 'CJU',
    destination: 'KWJ',
    type: 'DEPARTURE',
    timeOffsetMinutes: 100,
    isDelayed: true,
    delayMinutes: 25,
    delayReason: '기체 연결(광주공항 기상 악화)',
    gate: '1',
    checkInCounter: '3층 13-24번',
  },
  {
    flightNumber: 'RF611',
    airlineCode: 'RF',
    aircraftType: 'A320-200',
    regNumber: 'HL8385',
    origin: 'CJJ',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: 115,
    gate: '18',
    carousel: '6번',
  },
  {
    flightNumber: 'ZE211',
    airlineCode: 'ZE',
    aircraftType: 'B737-800',
    regNumber: 'HL8343',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: 130,
    isDelayed: true,
    delayMinutes: 20,
    delayReason: '김포공항 지상 조업 지연',
    gate: '17',
    carousel: '5번',
  },
  {
    flightNumber: 'KE1248',
    airlineCode: 'KE',
    aircraftType: 'B777-300',
    regNumber: 'HL7534',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 155,
    gate: '11',
    checkInCounter: '3층 1-12번',
  },
  {
    flightNumber: '7C124',
    airlineCode: '7C',
    aircraftType: 'B737-800',
    regNumber: 'HL8089',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: 175,
    gate: '4',
    carousel: '3번',
  },
  {
    flightNumber: 'OZ8960',
    airlineCode: 'OZ',
    aircraftType: 'A321neo',
    regNumber: 'HL8361',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 195,
    gate: '12',
    checkInCounter: '3층 13-24번',
  },
  {
    flightNumber: 'TW732',
    airlineCode: 'TW',
    aircraftType: 'B737-800',
    regNumber: 'HL8306',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 220,
    gate: '14',
    checkInCounter: '3층 47-56번',
  },

  // === NIGHT & FINAL FLIGHTS (Current + 4h ~ +7h / Late Evening) ===
  {
    flightNumber: 'BX8836',
    airlineCode: 'BX',
    aircraftType: 'A321neo',
    regNumber: 'HL8359',
    origin: 'CJU',
    destination: 'PUS',
    type: 'DEPARTURE',
    timeOffsetMinutes: 250,
    gate: '7',
    checkInCounter: '3층 57-64번',
  },
  {
    flightNumber: 'KE1260',
    airlineCode: 'KE',
    aircraftType: 'A330-300',
    regNumber: 'HL7584',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: 275,
    gate: '16',
    carousel: '7번 (대형기)',
  },
  {
    flightNumber: 'LJ326',
    airlineCode: 'LJ',
    aircraftType: 'B737-800',
    regNumber: 'HL7560',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 305,
    gate: '3',
    checkInCounter: '3층 37-46번',
  },
  {
    flightNumber: '7C138',
    airlineCode: '7C',
    aircraftType: 'B737-800',
    regNumber: 'HL8088',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 335,
    gate: '5',
    checkInCounter: '3층 25-36번',
  },
  {
    flightNumber: 'OZ8974',
    airlineCode: 'OZ',
    aircraftType: 'A321neo',
    regNumber: 'HL8365',
    origin: 'GMP',
    destination: 'CJU',
    type: 'ARRIVAL',
    timeOffsetMinutes: 360,
    gate: '10',
    carousel: '2번',
  },
  {
    flightNumber: 'TW904',
    airlineCode: 'TW',
    aircraftType: 'B737-800',
    regNumber: 'HL8329',
    origin: 'CJU',
    destination: 'PUS',
    type: 'DEPARTURE',
    timeOffsetMinutes: 385,
    gate: '13',
    checkInCounter: '3층 47-56번',
  },
  {
    flightNumber: 'KE1270',
    airlineCode: 'KE',
    aircraftType: 'A321neo',
    regNumber: 'HL8531',
    origin: 'CJU',
    destination: 'GMP',
    type: 'DEPARTURE',
    timeOffsetMinutes: 410,
    gate: '8',
    checkInCounter: '3층 1-12번',
  },
];

// Helper to format date & time
function formatTimeHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function createInitialFlights(): FlightItem[] {
  const now = new Date();

  return DAILY_FLIGHT_BLUEPRINTS.map((bp, index) => {
    // Calculate scheduled time based on current time + offset
    const schedDate = new Date(now.getTime() + bp.timeOffsetMinutes * 60 * 1000);
    const scheduledTime = formatTimeHHMM(schedDate);

    // If delayed, estimated is shifted by delayMinutes
    let estimatedTime = scheduledTime;
    if (bp.isDelayed && bp.delayMinutes) {
      const estDate = new Date(schedDate.getTime() + bp.delayMinutes * 60 * 1000);
      estimatedTime = formatTimeHHMM(estDate);
    }

    // Determine realistic status and progress percentage based on time difference from now
    const diffMinutes = bp.timeOffsetMinutes; // negative = past, positive = future
    let status: FlightStatus = 'SCHEDULED';
    let progressPct = 0;

    if (bp.isDelayed) {
      status = 'DELAYED';
      if (diffMinutes < -15) {
        progressPct = Math.min(85, Math.max(10, Math.round(Math.abs(diffMinutes) * 1.5)));
      } else {
        progressPct = 0;
      }
    } else if (diffMinutes < -65) {
      // Completed flight earlier today
      status = 'LANDED';
      progressPct = 100;
    } else if (diffMinutes < -45) {
      // Just arrived or approaching final gate
      status = bp.type === 'ARRIVAL' ? 'LANDED' : 'DEPARTED';
      progressPct = 95;
    } else if (diffMinutes < -5) {
      // Actively in flight (Airborne / Cruise / Descent)
      status = 'DEPARTED';
      // Flight duration is approx 55 min -> calculate progress (5m to 55m elapsed)
      const elapsed = Math.abs(diffMinutes);
      progressPct = Math.min(95, Math.max(15, Math.round((elapsed / 55) * 100)));
      if (progressPct >= 90) {
        status = 'APPROACHING';
      }
    } else if (diffMinutes <= 15) {
      // Right around departure/arrival (Boarding or Final Approach)
      if (bp.type === 'DEPARTURE') {
        status = 'BOARDING';
        progressPct = 0;
      } else {
        status = 'APPROACHING';
        progressPct = 92;
      }
    } else {
      // Future flight today
      status = 'SCHEDULED';
      progressPct = 0;
    }

    const waypoints = generateRouteWaypoints(bp.origin, bp.destination);
    const pos = getPositionAlongRoute(waypoints, progressPct);
    const origAirport = AIRPORTS[bp.origin] || AIRPORTS.CJU;
    const destAirport = AIRPORTS[bp.destination] || AIRPORTS.GMP;
    const distanceKm = Math.round(getDistanceFromLatLonInKm(origAirport.lat, origAirport.lng, destAirport.lat, destAirport.lng));

    return {
      id: `${bp.flightNumber}-${index}`,
      flightNumber: bp.flightNumber,
      airlineCode: bp.airlineCode,
      aircraftType: bp.aircraftType,
      regNumber: bp.regNumber,
      origin: bp.origin,
      destination: bp.destination,
      type: bp.type,
      scheduledTime,
      estimatedTime,
      status,
      gate: bp.gate,
      checkInCounter: bp.checkInCounter,
      carousel: bp.carousel,
      isDelayed: bp.isDelayed,
      delayMinutes: bp.delayMinutes,
      delayReason: bp.delayReason,
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
}
