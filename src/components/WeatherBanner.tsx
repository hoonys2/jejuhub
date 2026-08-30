import React, { useState } from 'react';
import { JejuWeather } from '../types/flight';
import { Wind, ShieldAlert, Thermometer, Eye, Car, UserCheck, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface WeatherBannerProps {
  weather: JejuWeather;
  onRefreshWeather: () => void;
}

export const WeatherBanner: React.FC<WeatherBannerProps> = ({ weather, onRefreshWeather }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshWeather();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="bg-[#111418] border border-[#1F242D] p-4 sm:p-5 shadow-2xl transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Airport & Wind overview */}
        <div className="flex items-start sm:items-center space-x-4">
          <div className="relative w-12 h-12 bg-[#161B22] border border-[#C5A36A]/40 flex items-center justify-center shrink-0 shadow-inner">
            <Wind className="w-5 h-5 text-[#C5A36A]" />
            {/* Wind direction needle indicator */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-700 pointer-events-none"
              style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
            >
              <div className="w-1 h-6 bg-gradient-to-t from-transparent via-[#C5A36A] to-white rounded-full shadow-[0_0_6px_#C5A36A]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif italic text-base sm:text-lg text-[#C5A36A] font-bold">
                제주국제공항 기상 & 활주로 관제
              </h2>
              <span className="text-[11px] px-2 py-0.5 bg-[#161B22] border border-[#1F242D] text-[#E0E2E5]/80 font-mono tracking-wider">
                {weather.runwayInUse}
              </span>
              {weather.windshearStatus !== 'NORMAL' && (
                <span className="text-[11px] px-2 py-0.5 bg-[#1F242D] border border-red-800/80 text-red-400 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  윈드시어(급변풍) 주의보
                </span>
              )}
            </div>
            <p className="text-xs text-[#E0E2E5]/60 mt-0.5 tracking-wide">
              풍향 <strong className="text-[#E0E2E5] font-mono">{weather.windDirectionDeg}° (NW)</strong> · 풍속 <strong className="text-[#C5A36A] font-mono">{weather.windSpeedKt}kt</strong> (최대 돌풍 <strong className="text-[#C5A36A] font-mono">{weather.gustKt}kt</strong>) · 측풍 {weather.crosswindKt}kt
            </p>
          </div>
        </div>

        {/* Right: Essential metrics quick chips */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="bg-[#161B22] border border-[#1F242D] px-3 py-1.5 flex items-center gap-2.5">
            <Thermometer className="w-4 h-4 text-[#C5A36A]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50">기온 / 기압</div>
              <div className="text-xs font-semibold font-mono text-[#E0E2E5]">{weather.tempC}°C · {weather.qnhHpa}hPa</div>
            </div>
          </div>

          <div className="bg-[#161B22] border border-[#1F242D] px-3 py-1.5 flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#C5A36A]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50">시정 / 운고</div>
              <div className="text-xs font-semibold font-mono text-[#E0E2E5]">{weather.visibilityKm}km+ · {weather.cloudBaseFt}ft</div>
            </div>
          </div>

          <div className="bg-[#161B22] border border-[#1F242D] px-3 py-1.5 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#C5A36A]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50">보안검색 대기</div>
              <div className="text-xs font-semibold text-[#C5A36A]">약 10~15분 (원활)</div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            title="기상 새로고침"
            className="p-2 bg-[#161B22] hover:bg-[#1F242D] text-[#E0E2E5]/70 hover:text-[#C5A36A] transition-all border border-[#1F242D]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C5A36A]' : ''}`} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 bg-[#161B22] hover:bg-[#1F242D] text-xs text-[#E0E2E5]/80 hover:text-[#C5A36A] flex items-center gap-1 border border-[#1F242D] tracking-wider uppercase text-[11px]"
          >
            <span>{isExpanded ? '상세 닫기' : '주차/특보 가이드'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#C5A36A]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#C5A36A]" />}
          </button>
        </div>
      </div>

      {/* Expanded Details: Parking & Delays Risk */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#1F242D] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Parking occupancy */}
          <div className="bg-[#0D1014] p-3.5 border border-[#1F242D]">
            <div className="flex items-center justify-between font-serif text-[#C5A36A] mb-2 border-b border-[#1F242D] pb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <Car className="w-3.5 h-3.5 text-[#C5A36A]" /> 공항 주차장 현황
              </span>
              <span className="text-[10px] text-[#C5A36A] border border-[#C5A36A]/40 px-1.5 py-0.2">도민 50% 감면</span>
            </div>
            <div className="space-y-1.5 text-[#E0E2E5]/70 text-[11px]">
              <div className="flex justify-between">
                <span>P1 여객주차장 (국내선 정면)</span>
                <span className="text-[#C5A36A] font-mono font-medium">여유 (182대 가능)</span>
              </div>
              <div className="flex justify-between">
                <span>P2 여객주차빌딩</span>
                <span className="text-amber-400 font-mono font-medium">혼잡 (24대 가능)</span>
              </div>
              <div className="flex justify-between">
                <span>화물청사 주차장</span>
                <span className="text-[#C5A36A] font-mono font-medium">원활 (310대 가능)</span>
              </div>
            </div>
          </div>

          {/* Windshear & Runway Guide */}
          <div className="bg-[#0D1014] p-3.5 border border-[#1F242D]">
            <div className="flex items-center gap-1.5 font-serif text-[#C5A36A] text-xs font-bold uppercase tracking-wider mb-2 border-b border-[#1F242D] pb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#C5A36A]" /> 제주 돌풍 특성 및 결항 예측
            </div>
            <p className="text-[#E0E2E5]/60 leading-relaxed text-[11px]">
              북서 계절풍(310°) 유입 시 한라산 배후 와류로 인해 진입 항로에 난기류가 형성될 수 있습니다. 
              A330/B777 대형기는 안정 착륙하며, 소형 B737/A321은 5~15분 대기 홀딩이 발생할 수 있습니다.
            </p>
          </div>

          {/* Quick tips for resident travelers */}
          <div className="bg-[#0D1014] p-3.5 border border-[#1F242D]">
            <div className="flex items-center gap-1.5 font-serif text-[#C5A36A] text-xs font-bold uppercase tracking-wider mb-2 border-b border-[#1F242D] pb-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#C5A36A]" /> 도민 신속 탑승 가이드
            </div>
            <ul className="text-[#E0E2E5]/60 space-y-1 text-[11px] leading-relaxed">
              <li>• 바이오정보(손바닥 정맥) 사전 등록 시 3층 전용 레인 2분 내 통과</li>
              <li>• 기상 악화 시 항공사 모바일 앱의 결항/지연 푸시 즉시 확인</li>
              <li>• 현장 대기보다 모바일 앱/고객센터 무료 일정 변경이 신속합니다.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
