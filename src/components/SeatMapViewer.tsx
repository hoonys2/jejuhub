import React, { useState } from 'react';
import { AircraftSeatMap, SeatInfo } from '../types/flight';
import { AIRCRAFT_SEAT_MAPS } from '../data/aircraftSeats';
import {
  Sparkles,
  Info,
  Compass,
  Eye,
  ShieldCheck,
  Plane,
} from 'lucide-react';

interface SeatMapViewerProps {
  initialAircraft?: string;
  onSelectSeat?: (seatId: string) => void;
}

export const SeatMapViewer: React.FC<SeatMapViewerProps> = ({ initialAircraft = 'B737-800' }) => {
  const [selectedModel, setSelectedModel] = useState<string>(
    AIRCRAFT_SEAT_MAPS[initialAircraft] ? initialAircraft : 'B737-800'
  );
  const [selectedSeat, setSelectedSeat] = useState<SeatInfo | null>(null);
  const [routeDirection, setRouteDirection] = useState<'CJU_TO_MAINLAND' | 'MAINLAND_TO_CJU'>('CJU_TO_MAINLAND');
  const [filterFeature, setFilterFeature] = useState<'ALL' | 'EXTRA_LEGROOM' | 'FAST_EXIT' | 'VIEW'>('ALL');

  const seatMap: AircraftSeatMap = AIRCRAFT_SEAT_MAPS[selectedModel] || AIRCRAFT_SEAT_MAPS['B737-800'];

  const getSeatColorClass = (seat: SeatInfo) => {
    if (selectedSeat?.seatId === seat.seatId) {
      return 'bg-[#C5A36A] text-black ring-2 ring-white scale-110 font-bold shadow-[0_0_12px_#C5A36A]';
    }

    if (filterFeature === 'EXTRA_LEGROOM' && seat.features.includes('EXTRA_LEGROOM')) {
      return 'bg-[#C5A36A] text-black font-bold ring-2 ring-[#C5A36A] animate-pulse';
    }
    if (filterFeature === 'FAST_EXIT' && seat.features.includes('FAST_EXIT')) {
      return 'bg-[#161B22] text-[#C5A36A] border border-[#C5A36A] font-bold animate-pulse';
    }
    if (filterFeature === 'VIEW' && (seat.features.includes('HALLASAN_VIEW') || seat.col === 'A' || seat.col === 'F')) {
      return 'bg-[#161B22] text-[#C5A36A] border-2 border-[#C5A36A] font-bold animate-pulse';
    }

    if (seat.seatClass === 'BUSINESS') {
      return 'bg-[#161B22] text-[#C5A36A] hover:bg-[#1F242D] border border-[#C5A36A]/60 font-bold';
    }
    if (seat.rating === 'BEST') {
      return 'bg-[#161B22] text-[#C5A36A] hover:bg-[#1F242D] border border-[#C5A36A] font-semibold';
    }
    if (seat.rating === 'GOOD') {
      return 'bg-[#161B22] text-[#E0E2E5] hover:bg-[#1F242D] border border-[#1F242D] hover:border-[#C5A36A]/50';
    }
    if (seat.rating === 'POOR' || seat.features.includes('NO_WINDOW') || seat.features.includes('NO_RECLINE')) {
      return 'bg-[#1F242D] text-red-400 hover:bg-[#2A1F24] border border-red-900/60';
    }
    return 'bg-[#0D1014] text-[#E0E2E5]/70 hover:bg-[#161B22] hover:text-[#C5A36A] border border-[#1F242D]';
  };

  return (
    <div className="space-y-6">
      {/* Top Aircraft Model & Direction Selectors */}
      <div className="bg-[#111418] border border-[#1F242D] p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-[#161B22] border border-[#C5A36A]/40 text-[#C5A36A]">
                <Plane className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-serif italic text-[#C5A36A] font-bold">
                  기종별 좌석배치도 & 명당 좌석 가이드
                </h2>
                <p className="text-xs text-[#E0E2E5]/60 mt-0.5 tracking-wide">
                  국내선 주요 투입 기종의 좌석 간격(Pitch), 비상구, 창문 정렬, 한라산 조망 명당 가이드
                </p>
              </div>
            </div>
          </div>

          {/* Model Switcher Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'B737-800', name: '보잉 B737-800/MAX', tag: '제주·진에어·티웨이' },
              { key: 'A321neo', name: '에어버스 A321neo', tag: '대한·아시아나·에어서울' },
              { key: 'A330-300', name: '에어버스 A330 (대형 광동체)', tag: '2-4-2 배열' },
            ].map((model) => (
              <button
                key={model.key}
                onClick={() => {
                  setSelectedModel(model.key);
                  setSelectedSeat(null);
                }}
                className={`px-3 py-2 text-xs font-medium transition-all text-left border ${
                  selectedModel === model.key
                    ? 'bg-[#C5A36A] text-black border-[#C5A36A] shadow-[0_0_12px_rgba(197,163,106,0.3)]'
                    : 'bg-[#0D1014] text-[#E0E2E5]/70 hover:text-[#C5A36A] border-[#1F242D]'
                }`}
              >
                <div className="font-bold tracking-wider">{model.name}</div>
                <div className={`text-[10px] ${selectedModel === model.key ? 'text-black/70' : 'text-[#E0E2E5]/40'}`}>{model.tag}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Route Direction & Filter Bar */}
        <div className="mt-4 pt-4 border-t border-[#1F242D] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Flight Direction (Crucial for Scenery / Sun View Tips) */}
          <div className="flex items-center gap-2">
            <span className="text-[#E0E2E5]/60 font-serif italic text-sm flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#C5A36A]" />
              Flight Direction:
            </span>
            <div className="flex items-center bg-[#0D1014] p-1 border border-[#1F242D]">
              <button
                onClick={() => setRouteDirection('CJU_TO_MAINLAND')}
                className={`px-3 py-1 text-xs uppercase tracking-wider font-semibold transition-all border ${
                  routeDirection === 'CJU_TO_MAINLAND'
                    ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A]'
                    : 'text-[#E0E2E5]/60 hover:text-[#E0E2E5] border-transparent'
                }`}
              >
                🛫 제주 출발 → 김포/부산행
              </button>
              <button
                onClick={() => setRouteDirection('MAINLAND_TO_CJU')}
                className={`px-3 py-1 text-xs uppercase tracking-wider font-semibold transition-all border ${
                  routeDirection === 'MAINLAND_TO_CJU'
                    ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A]'
                    : 'text-[#E0E2E5]/60 hover:text-[#E0E2E5] border-transparent'
                }`}
              >
                🛬 내륙 출발 → 제주 도착행
              </button>
            </div>
          </div>

          {/* Quick Highlight Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#E0E2E5]/60 font-serif italic text-sm mr-1">Highlight:</span>
            {[
              { id: 'ALL', label: '전체' },
              { id: 'EXTRA_LEGROOM', label: '넓은 레그룸 (비상구/1열)' },
              { id: 'FAST_EXIT', label: '빠른 하차 (전방석)' },
              { id: 'VIEW', label: '⛰️ 한라산/바다 조망석' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterFeature(f.id as any)}
                className={`px-2.5 py-1 text-xs uppercase tracking-wider font-medium transition-all border ${
                  filterFeature === f.id
                    ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A] font-bold'
                    : 'bg-[#0D1014] text-[#E0E2E5]/60 hover:text-[#E0E2E5] border-[#1F242D]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout: Cabin Canvas + Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Fuselage Visual Seat Grid (7 or 8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#111418] border border-[#1F242D] p-4 sm:p-6 shadow-2xl">
          {/* Fuselage Header / Nose */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-12 bg-[#0D1014] rounded-t-full border-t border-x border-[#1F242D] flex items-center justify-center">
              <span className="text-[10px] text-[#C5A36A] font-mono tracking-widest uppercase">COCKPIT</span>
            </div>
            <div className="w-full max-w-sm h-4 bg-[#090B0E] border-x border-[#1F242D] flex items-center justify-between px-3 text-[10px] text-[#E0E2E5]/40 font-mono">
              <span>🚪 GATE L1</span>
              <span>GALLEY / LAV</span>
              <span>🚪 EXIT R1</span>
            </div>
          </div>

          {/* Seat Layout Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs mb-6 text-[#E0E2E5]/70 bg-[#0D1014] p-3 border border-[#1F242D]">
            <span className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-3.5 h-3.5 bg-[#161B22] border border-[#C5A36A]" /> 최고 명당(레그룸)
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-3.5 h-3.5 bg-[#161B22] border border-[#1F242D] text-[#E0E2E5]" /> 전방 빠른하차
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-3.5 h-3.5 bg-[#0D1014] border border-[#1F242D]" /> 일반석
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-3.5 h-3.5 bg-[#1F242D] border border-red-800" /> 비추천(리클라인불가)
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-3.5 h-3.5 bg-[#C5A36A]" /> 비즈니스 / 프레스티지
            </span>
          </div>

          {/* Fuselage Body (Scrollable Container) */}
          <div className="max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="w-full max-w-md mx-auto space-y-2 select-none">
              {Array.from({ length: seatMap.rows }, (_, i) => i + 1).map((rowNum) => {
                const isExitRow = seatMap.exitRows.includes(rowNum);
                const isWingRow = rowNum >= seatMap.wingRows[0] && rowNum <= seatMap.wingRows[1];

                return (
                  <div key={rowNum} className="relative flex items-center justify-between py-0.5 group">
                    {/* Left Wing Indicator */}
                    {isWingRow && (
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-6 bg-[#161B22] border-l border-[#1F242D] text-[8px] text-[#E0E2E5]/50 flex items-center justify-center [writing-mode:vertical-lr] font-mono">
                        WING
                      </div>
                    )}

                    {/* Left Seats (A B C) */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {['A', 'B', 'C'].map((col) => {
                        const seatId = `${rowNum}${col}`;
                        const seat = seatMap.seats[seatId];
                        if (!seat) {
                          return <div key={col} className="w-8 h-8 sm:w-9 sm:h-9 opacity-0" />;
                        }

                        return (
                          <button
                            key={seatId}
                            onClick={() => setSelectedSeat(seat)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 text-xs font-mono font-semibold flex items-center justify-center transition-all ${getSeatColorClass(
                              seat
                            )}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>

                    {/* Center Aisle with Row Number */}
                    <div className="w-8 flex items-center justify-center">
                      <span className={`text-[11px] font-mono font-bold ${isExitRow ? 'text-[#C5A36A] underline' : 'text-[#E0E2E5]/30'}`}>
                        {rowNum}
                      </span>
                    </div>

                    {/* Right Seats (D E F or G H) */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {['D', 'E', 'F'].map((col) => {
                        const seatId = `${rowNum}${col}`;
                        const seat = seatMap.seats[seatId];
                        if (!seat) {
                          return <div key={col} className="w-8 h-8 sm:w-9 sm:h-9 opacity-0" />;
                        }

                        return (
                          <button
                            key={seatId}
                            onClick={() => setSelectedSeat(seat)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 text-xs font-mono font-semibold flex items-center justify-center transition-all ${getSeatColorClass(
                              seat
                            )}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>

                    {/* Exit Row Warning Tag */}
                    {isExitRow && (
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#C5A36A] bg-[#161B22] px-1 py-0.2 border border-[#C5A36A]/50 font-mono">
                        EXIT
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Seat Details Drawer & Resident Pro-Tips (5 or 4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Selected Seat Inspector Card */}
          <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl">
            <h3 className="text-sm font-serif italic text-[#C5A36A] flex items-center gap-2 mb-3 font-bold">
              <Sparkles className="w-4 h-4 text-[#C5A36A]" />
              선택한 좌석 상세 분석
            </h3>

            {selectedSeat ? (
              <div className="space-y-4">
                {/* Seat ID & Classification Badge */}
                <div className="flex items-center justify-between bg-[#0D1014] p-3.5 border border-[#1F242D]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono text-[#C5A36A] bg-[#161B22] px-3.5 py-1 border border-[#C5A36A]/40 shadow-inner">
                      {selectedSeat.seatId}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#E0E2E5]">
                        {selectedSeat.col === 'A' || selectedSeat.col === 'F' ? '창가 좌석 (Window)' : selectedSeat.col === 'C' || selectedSeat.col === 'D' ? '복도 좌석 (Aisle)' : '가운데 좌석 (Middle)'}
                      </div>
                      <div className="text-[11px] text-[#E0E2E5]/50 font-mono">
                        {selectedSeat.seatClass} 클래스
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${
                      selectedSeat.rating === 'BEST'
                        ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A]'
                        : selectedSeat.rating === 'GOOD'
                        ? 'bg-[#161B22] text-[#E0E2E5] border-[#1F242D]'
                        : selectedSeat.rating === 'POOR'
                        ? 'bg-[#1F242D] text-red-400 border-red-900'
                        : 'bg-[#0D1014] text-[#E0E2E5]/70 border-[#1F242D]'
                    }`}
                  >
                    {selectedSeat.rating === 'BEST'
                      ? '최고 명당'
                      : selectedSeat.rating === 'GOOD'
                      ? '우수 좌석'
                      : selectedSeat.rating === 'POOR'
                      ? '비추천'
                      : '일반석'}
                  </span>
                </div>

                {/* Dimensions (Pitch, Width, Recline) */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#0D1014] p-2.5 border border-[#1F242D]">
                    <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">앞뒤 간격 (Pitch)</div>
                    <div className="text-sm font-bold font-mono text-[#C5A36A] mt-0.5">{selectedSeat.pitchInch}인치</div>
                  </div>
                  <div className="bg-[#0D1014] p-2.5 border border-[#1F242D]">
                    <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">좌석 폭 (Width)</div>
                    <div className="text-sm font-bold font-mono text-[#E0E2E5] mt-0.5">{selectedSeat.widthInch}인치</div>
                  </div>
                  <div className="bg-[#0D1014] p-2.5 border border-[#1F242D]">
                    <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">등받이 젖힘</div>
                    <div className="text-sm font-bold font-mono text-[#C5A36A] mt-0.5">
                      {selectedSeat.features.includes('NO_RECLINE') ? '고정 (불가)' : `${selectedSeat.reclineInch}인치`}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-xs text-[#E0E2E5]/70 bg-[#0D1014] p-3.5 border border-[#1F242D] leading-relaxed">
                  {selectedSeat.description}
                </div>

                {/* View Tip based on flight direction */}
                <div className="bg-[#0D1014] border border-[#C5A36A]/40 p-3.5 text-xs space-y-1.5">
                  <div className="font-serif italic text-[#C5A36A] font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#C5A36A]" />
                    {routeDirection === 'CJU_TO_MAINLAND' ? '제주 출발 시 스카이뷰 팁' : '제주 도착 시 스카이뷰 팁'}
                  </div>
                  <p className="text-[#E0E2E5]/70 text-[11px] leading-relaxed">
                    {routeDirection === 'CJU_TO_MAINLAND'
                      ? selectedSeat.col === 'F'
                        ? '⛰️ [명당 추천] 제주 이륙 직후 우측 창문으로 한라산 백록담 정상과 오름 전경이 가장 선명하게 내려다보입니다.'
                        : selectedSeat.col === 'A'
                        ? '🌊 제주 북부 바다 및 추자도, 남해 다도해 섬들이 한눈에 펼쳐집니다.'
                        : '복도측으로 착륙 후 빠른 이동이 가능합니다.'
                      : selectedSeat.col === 'A'
                      ? '🏝️ [명당 추천] 제주 서쪽 접근 시 비양도, 협재 에메랄드빛 해변 및 곽지 해안선이 보입니다.'
                      : selectedSeat.col === 'F'
                      ? '🌅 제주시내 도심과 탑동 방파제, 사라봉 뷰를 감상할 수 있습니다.'
                      : '착륙 후 선반 수하물을 즉시 챙기기에 유리합니다.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#E0E2E5]/40 text-xs font-mono">
                <Info className="w-6 h-6 mx-auto mb-2 text-[#C5A36A]" />
                좌측 좌석도에서 좌석(A~F)을 클릭하시면<br />상세 피치, 리클라인 및 제주 노선 뷰 팁을 확인하실 수 있습니다.
              </div>
            )}
          </div>

          {/* Jeju Resident Pro-Tips Card */}
          <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl">
            <h3 className="text-sm font-serif italic text-[#C5A36A] flex items-center gap-2 mb-3 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#C5A36A]" />
              {seatMap.modelNameKr} 도민 탑승 팁
            </h3>
            <div className="space-y-2.5 text-xs text-[#E0E2E5]/70">
              {seatMap.proTips.map((tip, idx) => (
                <div key={idx} className="bg-[#0D1014] p-3 border border-[#1F242D] leading-relaxed text-[11px]">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
