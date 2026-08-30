import React, { useState, useEffect } from 'react';
import { Plane, Search, Clock, ShieldAlert, Compass, Sparkles, MapPin, Radio } from 'lucide-react';
import { JejuWeather } from '../types/flight';

interface NavbarProps {
  activeTab: 'BOARD' | 'RADAR' | 'SEAT' | 'RESIDENT';
  setActiveTab: (tab: 'BOARD' | 'RADAR' | 'SEAT' | 'RESIDENT') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  weather: JejuWeather;
  inFlightCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  weather,
  inFlightCount,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const kstTime = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const kstDate = now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });
      setTimeStr(kstTime);
      setDateStr(kstDate);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#111418] border-b border-[#1F242D] shadow-2xl">
      {/* Top telemetry ticker strip */}
      <div className="bg-[#090B0E] px-4 sm:px-8 py-1.5 text-xs border-b border-[#1F242D] flex flex-wrap items-center justify-between text-[#E0E2E5]/70 tracking-widest uppercase text-[10px]">
        <div className="flex items-center space-x-4 flex-wrap">
          <span className="flex items-center text-[#C5A36A] font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C5A36A] shadow-[0_0_8px_#C5A36A] animate-pulse mr-1.5" />
            CJU / RKPC TOWER ACTIVE
          </span>
          <span className="hidden sm:inline-flex items-center text-[#E0E2E5]/80 font-mono">
            📅 {dateStr}
          </span>
          <span className="hidden md:inline-flex items-center text-[#E0E2E5]/80">
            <Compass className="w-3 h-3 mr-1 text-[#C5A36A]" />
            WIND {weather.windDirectionDeg}° / {weather.windSpeedKt}KT (GUST {weather.gustKt}KT)
          </span>
          {weather.windshearStatus !== 'NORMAL' && (
            <span className="hidden md:inline-flex items-center text-[#C5A36A] bg-[#161B22] px-2 py-0.5 border border-[#C5A36A]/40 font-serif italic text-[11px]">
              <ShieldAlert className="w-3 h-3 mr-1 text-[#C5A36A]" />
              WINDSHEAR ADVISORY
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-[#E0E2E5]/70">
            AIRBORNE: <strong className="text-[#C5A36A] font-mono">{inFlightCount} FLIGHTS</strong>
          </span>
          <span className="text-[#1F242D]">|</span>
          <span className="flex items-center text-[#E0E2E5] font-mono">
            <Clock className="w-3 h-3 mr-1 text-[#C5A36A]" />
            {timeStr} KST
          </span>
          <div className="hidden lg:block px-2.5 py-0.5 border border-[#C5A36A] text-[#C5A36A] text-[9px] tracking-[0.2em] font-serif uppercase">
            Resident Concierge
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Brand Identity */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('BOARD')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0 group"
          >
            <div className="w-9 h-9 bg-[#C5A36A] rounded-full flex items-center justify-center text-black font-bold text-base shadow-[0_0_15px_rgba(197,163,106,0.3)] transition-transform group-hover:scale-105">
              J
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg tracking-[0.18em] uppercase font-serif font-bold text-[#C5A36A]">
                  JEJU SKY-PASS
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] tracking-wider uppercase border border-[#C5A36A]/50 text-[#C5A36A] bg-[#161B22]">
                  Hub
                </span>
              </div>
              <p className="text-[10px] text-[#E0E2E5]/50 tracking-wider uppercase hidden xs:block">
                출도착 현황 · 항적 레이더 · 좌석 컨시어지
              </p>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="flex-1 max-w-xs md:max-w-md">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#C5A36A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-flight-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="편명(KE1236, 7C118), 공항(GMP, PUS), 항공사..."
                className="w-full bg-[#0D1014] border border-[#1F242D] pl-8 pr-3 py-1.5 text-xs text-[#E0E2E5] placeholder-[#E0E2E5]/30 focus:outline-none focus:border-[#C5A36A] focus:ring-1 focus:ring-[#C5A36A] transition-all shadow-inner tracking-wide"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#E0E2E5]/40 hover:text-[#C5A36A] px-1.5 py-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs with Sophisticated Dark Aesthetics */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              id="nav-tab-board"
              onClick={() => setActiveTab('BOARD')}
              className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'BOARD'
                  ? 'bg-[#C5A36A] text-black border-[#C5A36A] shadow-[0_0_12px_rgba(197,163,106,0.3)]'
                  : 'bg-[#161B22] text-[#E0E2E5]/70 border-[#1F242D] hover:text-[#C5A36A] hover:border-[#C5A36A]/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">출도착 현황</span>
              <span className="sm:hidden">운항표</span>
            </button>

            <button
              id="nav-tab-radar"
              onClick={() => setActiveTab('RADAR')}
              className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'RADAR'
                  ? 'bg-[#C5A36A] text-black border-[#C5A36A] shadow-[0_0_12px_rgba(197,163,106,0.3)]'
                  : 'bg-[#161B22] text-[#E0E2E5]/70 border-[#1F242D] hover:text-[#C5A36A] hover:border-[#C5A36A]/50'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${activeTab === 'RADAR' ? 'text-black' : 'text-[#C5A36A]'}`} />
              <span className="hidden sm:inline">실시간 레이더</span>
              <span className="sm:hidden">레이더</span>
              <span className={`px-1 py-0.2 text-[8px] tracking-widest font-mono ${
                activeTab === 'RADAR' ? 'bg-black text-[#C5A36A]' : 'bg-[#C5A36A]/20 text-[#C5A36A]'
              }`}>
                LIVE
              </span>
            </button>

            <button
              id="nav-tab-seat"
              onClick={() => setActiveTab('SEAT')}
              className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'SEAT'
                  ? 'bg-[#C5A36A] text-black border-[#C5A36A] shadow-[0_0_12px_rgba(197,163,106,0.3)]'
                  : 'bg-[#161B22] text-[#E0E2E5]/70 border-[#1F242D] hover:text-[#C5A36A] hover:border-[#C5A36A]/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">기종 좌석배치도</span>
              <span className="sm:hidden">좌석도</span>
            </button>

            <button
              id="nav-tab-resident"
              onClick={() => setActiveTab('RESIDENT')}
              className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                activeTab === 'RESIDENT'
                  ? 'bg-[#C5A36A] text-black border-[#C5A36A] shadow-[0_0_12px_rgba(197,163,106,0.3)]'
                  : 'bg-[#161B22] text-[#E0E2E5]/70 border-[#1F242D] hover:text-[#C5A36A] hover:border-[#C5A36A]/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden md:inline">도민 혜택 & 공항정보</span>
              <span className="md:hidden">도민허브</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
