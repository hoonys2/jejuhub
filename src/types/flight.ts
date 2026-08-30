export interface Airport {
  code: string; // IATA (e.g. CJU, GMP, PUS)
  icao: string; // e.g. RKPC, RKSS
  nameKr: string;
  nameEn: string;
  city: string;
  lat: number;
  lng: number;
  elevationFt: number;
  runways: string[];
}

export interface Airline {
  code: string; // IATA (KE, OZ, 7C, LJ, TW, BX, RS, ZE, RF)
  icao: string;
  nameKr: string;
  nameEn: string;
  logoColor: string;
  badgeBg: string;
  badgeText: string;
  residentDiscount: string;
  bookingUrl: string;
  checkInCounterJeju: string;
  baggageFreeKg: number;
}

export type FlightStatus =
  | 'SCHEDULED'   // 예정 (정시)
  | 'BOARDING'    // 탑승중
  | 'CLOSED'      // 탑승마감
  | 'DEPARTED'    // 출발 (비행중)
  | 'APPROACHING' // 착륙접근
  | 'LANDED'      // 도착완료
  | 'DELAYED'     // 지연
  | 'CANCELLED';  // 결항

export interface FlightItem {
  id: string;
  flightNumber: string; // e.g. KE1235, 7C117
  airlineCode: string;  // e.g. KE
  aircraftType: string; // e.g. B737-800, A321neo, A330-300
  regNumber: string;    // e.g. HL8301
  origin: string;       // IATA code
  destination: string;  // IATA code
  type: 'DEPARTURE' | 'ARRIVAL'; // relative to Jeju (CJU)
  scheduledTime: string; // "14:35"
  estimatedTime: string; // "14:50" (if delayed)
  actualTime?: string;
  status: FlightStatus;
  gate: string;         // e.g. "12", "3A"
  checkInCounter?: string; // e.g. "A1-A12"
  carousel?: string;    // e.g. "3번" (수하물)
  delayMinutes?: number;
  delayReason?: string;
  distanceKm: number;
  // Live flight telemetry
  lat: number;
  lng: number;
  altitudeFt: number;
  speedKts: number;
  headingDeg: number;
  verticalSpeedFpm: number;
  progressPct: number; // 0 to 100
  routeWaypoints: [number, number][];
}

export type SeatClass = 'FIRST' | 'BUSINESS' | 'PREMIUM_ECONOMY' | 'ECONOMY';
export type SeatFeature =
  | 'EXTRA_LEGROOM'
  | 'EXIT_ROW'
  | 'STANDARD'
  | 'NO_RECLINE'
  | 'NO_WINDOW'
  | 'WING_VIEW'
  | 'QUIET_ZONE'
  | 'NEAR_LAVATORY'
  | 'FAST_EXIT'
  | 'HALLASAN_VIEW';

export interface SeatInfo {
  seatId: string;       // e.g. "12A"
  row: number;
  col: string;          // "A", "B", "C", "D", "E", "F"
  seatClass: SeatClass;
  pitchInch: number;    // e.g. 31, 34
  widthInch: number;    // e.g. 17.5
  reclineInch: number;
  features: SeatFeature[];
  rating: 'BEST' | 'GOOD' | 'STANDARD' | 'POOR';
  description: string;
  powerOutlet: boolean;
  viewTip?: string;
}

export interface AircraftSeatMap {
  aircraftModel: string; // e.g. "B737-800"
  modelNameKr: string;
  commonAirlines: string[];
  totalSeats: number;
  seatLayout: string; // e.g. "3-3" or "2-4-2"
  columns: string[];
  rows: number;
  wingRows: [number, number]; // e.g. [14, 23]
  exitRows: number[];         // e.g. [15, 16]
  seats: Record<string, SeatInfo>;
  proTips: string[];
}

export interface JejuWeather {
  airportIcao: string;
  tempC: number;
  windDirectionDeg: number;
  windSpeedKt: number;
  gustKt: number;
  visibilityKm: number;
  cloudBaseFt: number;
  qnhHpa: number;
  runwayInUse: string; // e.g. "RWY 07"
  windshearStatus: 'NORMAL' | 'CAUTION' | 'WARNING';
  crosswindKt: number;
  disruptionRiskPct: number; // 0-100
  updatedAt: string;
}
