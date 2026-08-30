import { AircraftSeatMap, SeatInfo, SeatFeature, SeatClass } from '../types/flight';

// Helper to generate standard 3-3 single aisle seat map
function generateB737Layout(): AircraftSeatMap {
  const seats: Record<string, SeatInfo> = {};
  const rows = 32;
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const wingStart = 12;
  const wingEnd = 21;
  const exitRows = [15, 16];

  for (let r = 1; r <= rows; r++) {
    // Skip row 13 in some configs, but standard Korean LCC numbering:
    for (const c of cols) {
      const seatId = `${r}${c}`;
      const features: SeatFeature[] = [];
      let seatClass: SeatClass = 'ECONOMY';
      let pitchInch = 29;
      let widthInch = 17.2;
      let reclineInch = 4;
      let rating: SeatInfo['rating'] = 'STANDARD';
      let desc = '일반 이코노미 좌석';
      let viewTip = undefined;

      // Row 1: Front extra legroom
      if (r === 1) {
        features.push('EXTRA_LEGROOM', 'FAST_EXIT');
        pitchInch = 36;
        rating = 'BEST';
        desc = '맨 앞좌석 (추가 요금 좌석): 레그룸이 매우 넓고 비행기 착륙 후 가장 빠른 하차가 가능합니다.';
      } else if (r <= 5) {
        features.push('FAST_EXIT');
        rating = 'GOOD';
        desc = '전방 선호 좌석: 김포/제주 도착 후 빠른 수하물 수취 및 출구 이동에 유리합니다.';
      }

      // Exit rows
      if (exitRows.includes(r)) {
        features.push('EXTRA_LEGROOM', 'EXIT_ROW');
        pitchInch = r === 16 ? 38 : 34;
        if (r === 15) {
          features.push('NO_RECLINE');
          rating = 'GOOD';
          desc = '비상구 앞열 좌석: 다리 공간이 넓으나 뒤쪽 비상탈출로 확보를 위해 등받이 젖힘이 제한됩니다.';
        } else {
          rating = 'BEST';
          desc = '비상구 명당 좌석: 다리 공간이 가장 넉넉하며 등받이 리클라인이 정상 작동합니다.';
        }
      }

      // Last row
      if (r === rows) {
        features.push('NO_RECLINE', 'NEAR_LAVATORY');
        rating = 'POOR';
        desc = '맨 뒷자리: 등받이 젖힘 불가 및 후방 화장실/갤리 대기 승객 소음이 발생할 수 있습니다.';
      }

      // Window alignment & views
      if (c === 'A' || c === 'F') {
        if (r === 11 || r === 12) {
          features.push('NO_WINDOW');
          rating = 'POOR';
          desc = '창문 정렬 불량 좌석: 벽면과 맞닿아 창문이 거의 보이지 않는 자리입니다.';
        } else if (r >= wingStart && r <= wingEnd) {
          features.push('WING_VIEW');
          desc += ' (날개 위 위치로 지상 조망 일부 가려짐)';
        } else {
          if (c === 'F') {
            features.push('HALLASAN_VIEW');
            viewTip = '제주 출발(김포/부산행) 이륙 직후 및 한반도 남하 시 한라산 백록담과 일출 뷰 명당!';
          } else {
            viewTip = '김포 출발 제주행 착륙 시 비양도, 협재 및 서해안 바다 조망 명당!';
          }
        }
      }

      seats[seatId] = {
        seatId,
        row: r,
        col: c,
        seatClass,
        pitchInch,
        widthInch,
        reclineInch,
        features,
        rating,
        description: desc,
        powerOutlet: r <= 5 || exitRows.includes(r),
        viewTip,
      };
    }
  }

  return {
    aircraftModel: 'B737-800',
    modelNameKr: '보잉 737-800 / B737-8 MAX',
    commonAirlines: ['제주항공 (7C)', '진에어 (LJ)', '티웨이항공 (TW)', '이스타항공 (ZE)', '대한항공 (KE)'],
    totalSeats: 189,
    seatLayout: '3-3',
    columns: cols,
    rows,
    wingRows: [wingStart, wingEnd],
    exitRows,
    seats,
    proTips: [
      '✈️ 도민 필수 팁: 김포행 탑승 시 오른쪽(F열)에 앉으시면 이륙 후 웅장한 한라산과 오름 군락을 조망할 수 있습니다.',
      '🏃 빠른 이동 팁: 제주공항 도착 후 렌터카 셔틀이나 버스를 급히 타셔야 한다면 1~5열 통로측(C/D열) 좌석 지정을 추천합니다.',
      '🦵 다리 편한 좌석: 16열 비상구 좌석은 38인치의 여유로운 피치로 비즈니스급 편안함을 제공합니다 (15열은 등받이 고정).',
      '⚠️ 비추천 좌석: 11A, 11F 좌석은 에어컨 덕트 위치로 인해 창문이 없는 벽면 좌석입니다.',
    ],
  };
}

// Airbus A321neo layout (Korean Air, Asiana, Air Busan, Air Seoul)
function generateA321neoLayout(): AircraftSeatMap {
  const seats: Record<string, SeatInfo> = {};
  const rows = 36;
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const wingStart = 14;
  const wingEnd = 24;
  const exitRows = [12, 26];

  for (let r = 1; r <= rows; r++) {
    // Rows 1-2: Prestige / Business class on Korean Air & Asiana
    const isBiz = r <= 2;
    for (const c of cols) {
      // If business class, only A, C, D, F exist
      if (isBiz && (c === 'B' || c === 'E')) continue;

      const seatId = `${r}${c}`;
      const features: SeatFeature[] = [];
      let seatClass: SeatClass = isBiz ? 'BUSINESS' : 'ECONOMY';
      let pitchInch = isBiz ? 42 : 31;
      let widthInch = isBiz ? 21 : 18;
      let reclineInch = isBiz ? 7 : 4.5;
      let rating: SeatInfo['rating'] = isBiz ? 'BEST' : 'STANDARD';
      let desc = isBiz ? '프레스티지/비즈니스 클래스: 넓은 독립형 좌석, 13인치 개인 모니터 및 전자기기 무선충전 지원' : '일반 이코노미 좌석';
      let viewTip = undefined;

      if (!isBiz) {
        if (r <= 6) {
          features.push('FAST_EXIT');
          rating = 'GOOD';
          desc = '전방 선호 좌석: 신속한 탑승 및 하차가 가능합니다.';
        }
        if (exitRows.includes(r)) {
          features.push('EXTRA_LEGROOM', 'EXIT_ROW');
          pitchInch = 37;
          rating = 'BEST';
          desc = '비상구 넓은 좌석: 전방 공간이 넉넉합니다.';
        }
        if (r === rows) {
          features.push('NO_RECLINE', 'NEAR_LAVATORY');
          rating = 'POOR';
          desc = '맨 뒷자리: 리클라인 제한 및 화장실 인접';
        }
        if (r >= wingStart && r <= wingEnd) {
          features.push('WING_VIEW');
        }
        if (c === 'F') {
          features.push('HALLASAN_VIEW');
          viewTip = '제주 출발 시 한라산 파노라마 뷰!';
        } else if (c === 'A') {
          viewTip = '제주 착륙 시 해안선 조망 명당';
        }
      }

      seats[seatId] = {
        seatId,
        row: r,
        col: c,
        seatClass,
        pitchInch,
        widthInch,
        reclineInch,
        features,
        rating,
        description: desc,
        powerOutlet: true,
        viewTip,
      };
    }
  }

  return {
    aircraftModel: 'A321neo',
    modelNameKr: '에어버스 A321neo / A321-200',
    commonAirlines: ['대한항공 (KE)', '아시아나항공 (OZ)', '에어부산 (BX)', '에어서울 (RS)'],
    totalSeats: 182,
    seatLayout: '3-3 (전방 2-2)',
    columns: cols,
    rows,
    wingRows: [wingStart, wingEnd],
    exitRows,
    seats,
    proTips: [
      '⚡ 최신 기재 특징: A321neo는 모든 좌석에 개별 USB 충전포트와 스마트폰 거치대가 마련되어 있습니다.',
      '🎧 저소음 기종: 신형 LEAP-1A 엔진이 탑재되어 기존 B737 대비 객실 소음이 50% 적고 쾌적합니다.',
      '💺 에어서울 특화: 에어서울 A321은 LCC 중 가장 넓은 32인치 좌석 간격을 자랑합니다.',
      '🚪 26열 추천: 26열 비상구 좌석은 앞 공간이 완전히 뚫려 있어 키가 큰 승객에게 최적입니다.',
    ],
  };
}

// Airbus A330-300 Widebody layout (Korean Air, Asiana, T'way high capacity)
function generateA330Layout(): AircraftSeatMap {
  const seats: Record<string, SeatInfo> = {};
  const rows = 40;
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const wingStart = 15;
  const wingEnd = 28;
  const exitRows = [14, 29];

  for (let r = 1; r <= rows; r++) {
    const isBiz = r <= 5;
    for (const c of cols) {
      if (isBiz && (c === 'B' || c === 'G')) continue;

      const seatId = `${r}${c}`;
      const features: SeatFeature[] = [];
      let seatClass: SeatClass = isBiz ? 'BUSINESS' : 'ECONOMY';
      let pitchInch = isBiz ? 60 : 32;
      let widthInch = isBiz ? 21.5 : 18;
      let reclineInch = isBiz ? 10 : 5;
      let rating: SeatInfo['rating'] = isBiz ? 'BEST' : 'STANDARD';
      let desc = isBiz ? '비즈니스 / 프레스티지 스위트 (풀플랫 베드 또는 슬리퍼)' : '이코노미 좌석 (2-4-2 배열)';
      let viewTip = undefined;

      if (!isBiz) {
        if (r <= 10) {
          features.push('FAST_EXIT');
          rating = 'GOOD';
        }
        if (exitRows.includes(r)) {
          features.push('EXTRA_LEGROOM', 'EXIT_ROW');
          pitchInch = 39;
          rating = 'BEST';
          desc = '비상구 대형 복도 앞 넓은 좌석';
        }
        if (r >= wingStart && r <= wingEnd) {
          features.push('WING_VIEW');
        }
        if (c === 'H') {
          features.push('HALLASAN_VIEW');
          viewTip = '한라산 정상 & 남해 다도해 조망';
        } else if (c === 'A') {
          viewTip = '서해안 해넘이 및 제주 북부 해안선';
        }
      }

      seats[seatId] = {
        seatId,
        row: r,
        col: c,
        seatClass,
        pitchInch,
        widthInch,
        reclineInch,
        features,
        rating,
        description: desc,
        powerOutlet: true,
        viewTip,
      };
    }
  }

  return {
    aircraftModel: 'A330-300',
    modelNameKr: '에어버스 A330-300 (대형 광동체기)',
    commonAirlines: ['대한항공 (KE)', '아시아나항공 (OZ)', '티웨이항공 (TW)'],
    totalSeats: 347,
    seatLayout: '2-4-2 (광동체 듀얼 복도)',
    columns: cols,
    rows,
    wingRows: [wingStart, wingEnd],
    exitRows,
    seats,
    proTips: [
      '👫 2인 여행객 강력 추천: 복도 2개 구조의 2-4-2 배열로 창가 2열(A-B / G-H) 선택 시 일행끼리만 프라이빗하게 탑승 가능합니다.',
      '✈️ 흔들림 최소화: 중대형 광동체 항공기로 제주 특유의 돌풍 및 윈드시어 상황에서도 소형기보다 훨씬 안정적인 비행감을 제공합니다.',
      '🛌 티웨이 비즈니스 세이버: LCC 중 유일하게 180도 플랫베드 프리미엄 좌석을 국내선 제주 노선에 특가로 운영합니다.',
    ],
  };
}

export const AIRCRAFT_SEAT_MAPS: Record<string, AircraftSeatMap> = {
  'B737-800': generateB737Layout(),
  'B737-8': generateB737Layout(),
  'B737-900': generateB737Layout(),
  'A321neo': generateA321neoLayout(),
  'A321-200': generateA321neoLayout(),
  'A330-300': generateA330Layout(),
  'B777-200ER': generateA330Layout(),
};
