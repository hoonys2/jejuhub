import { Airport } from '../types/flight';

export const AIRPORTS: Record<string, Airport> = {
  CJU: {
    code: 'CJU',
    icao: 'RKPC',
    nameKr: '제주국제공항',
    nameEn: 'Jeju Intl Airport',
    city: '제주',
    lat: 33.5113,
    lng: 126.4930,
    elevationFt: 118,
    runways: ['07/25 (3,180m)', '13/31 (1,900m)'],
  },
  GMP: {
    code: 'GMP',
    icao: 'RKSS',
    nameKr: '김포국제공항',
    nameEn: 'Gimpo Intl Airport',
    city: '서울/김포',
    lat: 37.5583,
    lng: 126.7906,
    elevationFt: 59,
    runways: ['14R/32L', '14L/32R'],
  },
  PUS: {
    code: 'PUS',
    icao: 'RKPK',
    nameKr: '김해국제공항',
    nameEn: 'Gimhae Intl Airport',
    city: '부산/김해',
    lat: 35.1795,
    lng: 128.9382,
    elevationFt: 13,
    runways: ['18R/36L', '18L/36R'],
  },
  CJJ: {
    code: 'CJJ',
    icao: 'RKTU',
    nameKr: '청주국제공항',
    nameEn: 'Cheongju Intl Airport',
    city: '청주/충청',
    lat: 36.7166,
    lng: 127.4991,
    elevationFt: 191,
    runways: ['06R/24L', '06L/24R'],
  },
  TAE: {
    code: 'TAE',
    icao: 'RKTN',
    nameKr: '대구국제공항',
    nameEn: 'Daegu Intl Airport',
    city: '대구',
    lat: 35.8939,
    lng: 128.6590,
    elevationFt: 116,
    runways: ['13R/31L', '13L/31R'],
  },
  KWJ: {
    code: 'KWJ',
    icao: 'RKJJ',
    nameKr: '광주공항',
    nameEn: 'Gwangju Airport',
    city: '광주',
    lat: 35.1264,
    lng: 126.8089,
    elevationFt: 40,
    runways: ['04R/22L', '04L/22R'],
  },
  RSU: {
    code: 'RSU',
    icao: 'RKJY',
    nameKr: '여수공항',
    nameEn: 'Yeosu Airport',
    city: '여수/순천',
    lat: 34.8423,
    lng: 127.6169,
    elevationFt: 53,
    runways: ['17/35'],
  },
  USN: {
    code: 'USN',
    icao: 'RKPU',
    nameKr: '울산공항',
    nameEn: 'Ulsan Airport',
    city: '울산',
    lat: 35.5936,
    lng: 129.3517,
    elevationFt: 47,
    runways: ['18/36'],
  },
  KUV: {
    code: 'KUV',
    icao: 'RKJK',
    nameKr: '군산공항',
    nameEn: 'Gunsan Airport',
    city: '군산/전북',
    lat: 35.9038,
    lng: 126.6158,
    elevationFt: 29,
    runways: ['18/36'],
  },
  WJU: {
    code: 'WJU',
    icao: 'RKNW',
    nameKr: '원주공항',
    nameEn: 'Wonju Airport',
    city: '원주/횡성',
    lat: 37.4592,
    lng: 127.9622,
    elevationFt: 329,
    runways: ['03/21'],
  },
  KPO: {
    code: 'KPO',
    icao: 'RKTH',
    nameKr: '포항경주공항',
    nameEn: 'Pohang Gyeongju Airport',
    city: '포항/경주',
    lat: 35.9877,
    lng: 129.4206,
    elevationFt: 71,
    runways: ['10/28'],
  },
  MWX: {
    code: 'MWX',
    icao: 'RKJB',
    nameKr: '무안국제공항',
    nameEn: 'Muan Intl Airport',
    city: '무안/전남',
    lat: 34.9914,
    lng: 126.3828,
    elevationFt: 92,
    runways: ['01/19'],
  },
};

// Standard domestic flight route waypoints (Airway corridors between Jeju and mainland)
export const AIRWAYS = [
  {
    name: 'Y711 (남해안 간선 항로)',
    points: [
      [33.5113, 126.4930], // CJU
      [34.1500, 127.2000], // DOTOL
      [34.8423, 127.6169], // RSU
      [35.1795, 128.9382], // PUS
    ] as [number, number][],
  },
  {
    name: 'Y722 (서해안 김포-제주 직행 항로)',
    points: [
      [33.5113, 126.4930], // CJU
      [34.4000, 126.1000], // SOSDO
      [35.5000, 126.2500], // BEDES
      [36.7000, 126.5000], // APARU
      [37.5583, 126.7906], // GMP
    ] as [number, number][],
  },
  {
    name: 'B576 (청주/대구-제주 항로)',
    points: [
      [33.5113, 126.4930], // CJU
      [34.6000, 127.0000], // TOLIS
      [35.8939, 128.6590], // TAE
      [36.7166, 127.4991], // CJJ
    ] as [number, number][],
  },
];
