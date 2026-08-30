import React, { useState, useMemo } from 'react';
import { FlightItem } from '../types/flight';
import { AIRPORTS } from '../data/airports';
import { AIRLINES } from '../data/airlines';
import { getFlightStatusDisplay } from '../utils/flightSimulation';
import {
  Plane,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Sparkles,
  Filter,
  Radio,
  Calendar,
  Zap,
  Sun,
  Moon,
  Sunrise,
  CheckCircle2,
} from 'lucide-react';

interface FlightBoardProps {
  flights: FlightItem[];
  selectedFlightId: string | null;
  onSelectFlightForRadar: (flight: FlightItem) => void;
  onSelectFlightForSeatMap: (flight: FlightItem) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

type TimeWindowFilter = 'ALL' | 'NOW_ACTIVE' | 'MORNING' | 'AFTERNOON' | 'EVENING';

function parseHHMM(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const FlightBoard: React.FC<FlightBoardProps> = ({
  flights,
  selectedFlightId,
  onSelectFlightForRadar,
  onSelectFlightForSeatMap,
  searchQuery,
  onClearSearch,
}) => {
  const [boardType, setBoardType] = useState<'DEPARTURE' | 'ARRIVAL'>('DEPARTURE');
  const [timeWindow, setTimeWindow] = useState<TimeWindowFilter>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedAirline, setSelectedAirline] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jeju_flight_favorites');
      return saved ? JSON.parse(saved) : ['KE1236', '7C118'];
    } catch {
      return ['KE1236', '7C118'];
    }
  });

  // Current date & time strings
  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }, []);

  const nowMinutes = useMemo(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }, []);

  const toggleFavorite = (flightNumber: string) => {
    setFavorites((prev) => {
      const next = prev.includes(flightNumber) ? prev.filter((n) => n !== flightNumber) : [...prev, flightNumber];
      try {
        localStorage.setItem('jeju_flight_favorites', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // Filter and sort flights
  const filteredFlights = useMemo(() => {
    return flights
      .filter((flight) => {
        if (flight.type !== boardType) return false;

        const flightMins = parseHHMM(flight.scheduledTime);

        // Time window filter
        if (timeWindow === 'NOW_ACTIVE') {
          // Within ±90 minutes of now OR currently in active flight status
          const isNearNow = Math.abs(flightMins - nowMinutes) <= 90;
          const isActiveStatus = ['DEPARTED', 'APPROACHING', 'BOARDING', 'DELAYED'].includes(flight.status);
          if (!isNearNow && !isActiveStatus) return false;
        } else if (timeWindow === 'MORNING') {
          // 06:00 to 12:00
          if (flightMins < 6 * 60 || flightMins >= 12 * 60) return false;
        } else if (timeWindow === 'AFTERNOON') {
          // 12:00 to 18:00
          if (flightMins < 12 * 60 || flightMins >= 18 * 60) return false;
        } else if (timeWindow === 'EVENING') {
          // 18:00 to 24:00
          if (flightMins < 18 * 60) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fnMatch = flight.flightNumber.toLowerCase().includes(q);
          const airline = AIRLINES[flight.airlineCode];
          const airlineMatch = airline && (airline.nameKr.toLowerCase().includes(q) || airline.nameEn.toLowerCase().includes(q));
          const targetAirport = AIRPORTS[flight.type === 'DEPARTURE' ? flight.destination : flight.origin];
          const airportMatch =
            targetAirport &&
            (targetAirport.nameKr.includes(q) || targetAirport.city.includes(q) || targetAirport.code.toLowerCase().includes(q));
          if (!fnMatch && !airlineMatch && !airportMatch) return false;
        }

        // City Filter
        if (selectedCity !== 'ALL') {
          const targetCode = flight.type === 'DEPARTURE' ? flight.destination : flight.origin;
          if (selectedCity === 'OTHER') {
            if (['GMP', 'PUS', 'CJJ', 'TAE', 'KWJ'].includes(targetCode)) return false;
          } else if (targetCode !== selectedCity) {
            return false;
          }
        }

        // Airline Filter
        if (selectedAirline !== 'ALL' && flight.airlineCode !== selectedAirline) {
          return false;
        }

        // Status Filter
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'IN_FLIGHT' && !['DEPARTED', 'APPROACHING'].includes(flight.status)) return false;
          if (selectedStatus === 'DELAYED' && flight.status !== 'DELAYED') return false;
          if (selectedStatus === 'BOARDING' && !['BOARDING', 'SCHEDULED'].includes(flight.status)) return false;
          if (selectedStatus === 'FAVORITES' && !favorites.includes(flight.flightNumber)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Chronological sort by scheduled time
        return parseHHMM(a.scheduledTime) - parseHHMM(b.scheduledTime);
      });
  }, [flights, boardType, timeWindow, searchQuery, selectedCity, selectedAirline, selectedStatus, favorites, nowMinutes]);

  // Calculate statistics
  const currentTypeFlights = flights.filter((f) => f.type === boardType);
  const totalCount = currentTypeFlights.length;
  const inFlightCount = currentTypeFlights.filter((f) => ['DEPARTED', 'APPROACHING'].includes(f.status)).length;
  const delayedCount = currentTypeFlights.filter((f) => f.status === 'DELAYED').length;
  const onTimeRate = totalCount > 0 ? Math.round(((totalCount - delayedCount) / totalCount) * 100) : 100;

  const renderStatusBadge = (flight: FlightItem) => {
    const statusInfo = getFlightStatusDisplay(flight);

    switch (statusInfo.badgeStyle) {
      case 'AIRBORNE':
        return (
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#161B22] border border-[#C5A36A] text-[#C5A36A] text-xs font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(197,163,106,0.25)]">
              <span className="w-2 h-2 rounded-full bg-[#C5A36A] animate-ping inline-block" />
              <Plane className="w-3.5 h-3.5 transform -rotate-45" />
              <span>{statusInfo.mainStatus}</span>
              <span className="text-[10px] opacity-80">({flight.progressPct}%)</span>
            </div>
            <span className="text-[10px] text-[#C5A36A]/70 mt-0.5 font-mono">
              FL{Math.round(flight.altitudeFt / 100)} · {flight.speedKts}kts
            </span>
          </div>
        );

      case 'APPROACHING':
        return (
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#161B22] border-l-2 border-[#C5A36A] text-[#C5A36A] text-xs font-bold tracking-wider uppercase">
              <Plane className="w-3.5 h-3.5 transform rotate-45 text-[#C5A36A]" />
              <span>{statusInfo.mainStatus}</span>
            </div>
            <span className="text-[10px] text-[#E0E2E5]/50 mt-0.5">
              {statusInfo.subStatus}
            </span>
          </div>
        );

      case 'LANDED':
        return (
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0D1014] text-[#E0E2E5]/90 border border-[#1F242D] text-xs font-medium tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A36A]" />
              <span>{statusInfo.mainStatus}</span>
            </div>
            <span className="text-[10px] text-[#E0E2E5]/40 mt-0.5">
              {statusInfo.subStatus}
            </span>
          </div>
        );

      case 'BOARDING':
        return (
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#161B22] border-l-2 border-[#C5A36A] text-[#C5A36A] font-bold text-xs tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A36A] animate-pulse" />
              <span>{statusInfo.mainStatus}</span>
            </div>
            <span className="text-[10px] text-[#E0E2E5]/50 mt-0.5">
              {statusInfo.subStatus}
            </span>
          </div>
        );

      case 'DELAYED':
        return (
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#161B22] border-l-2 border-red-700 text-red-400 text-xs font-bold tracking-wider uppercase">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>{statusInfo.mainStatus}</span>
            </div>
            {flight.delayReason && (
              <span className="text-[10px] text-red-400/70 mt-0.5 max-w-[170px] truncate" title={flight.delayReason}>
                {flight.delayReason}
              </span>
            )}
          </div>
        );

      case 'CANCELLED':
        return (
          <div className="flex flex-col items-start">
            <span className="px-2.5 py-1 text-xs font-bold bg-[#1F242D] text-red-400 border border-red-900 tracking-wider uppercase">
              결항 (CANCELLED)
            </span>
            {flight.delayReason && (
              <span className="text-[10px] text-red-400/60 mt-0.5">{flight.delayReason}</span>
            )}
          </div>
        );

      case 'SCHEDULED':
      default:
        return (
          <div className="flex flex-col items-start">
            <span className="px-2.5 py-1 text-xs bg-[#161B22] text-[#E0E2E5]/70 border border-[#1F242D] tracking-wider uppercase">
              {statusInfo.mainStatus} (정시)
            </span>
            <span className="text-[10px] text-[#E0E2E5]/40 mt-0.5">
              {statusInfo.subStatus}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Today's Schedule Overview Banner */}
      <div className="bg-[#111418] border border-[#1F242D] p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#161B22] text-[#C5A36A] border border-[#C5A36A]/40 text-xs font-mono font-bold tracking-wider uppercase">
              <Calendar className="w-3.5 h-3.5" />
              TODAY'S OPERATIONS
            </div>
            <span className="text-xs px-2 py-0.5 bg-[#0D1014] text-[#E0E2E5]/70 border border-[#1F242D] font-mono">
              실시간 관제 연동
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#E0E2E5] mt-1 tracking-tight">
            {todayDateStr} 제주공항 실시간 운항 스케줄
          </h2>
          <p className="text-xs text-[#E0E2E5]/60 mt-0.5">
            이른 아침 첫 비행편부터 현재 운항중인 비행기 및 야간 최종편까지 전 시간대 스케줄을 제공합니다.
          </p>
        </div>

        {/* Time Window Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap bg-[#090B0E] p-1.5 border border-[#1F242D]">
          {[
            { id: 'ALL', label: '전체 (06~23시)', icon: Clock },
            { id: 'NOW_ACTIVE', label: '⚡ 지금 운항중', icon: Zap, highlight: true },
            { id: 'MORNING', label: '오전 (06~12)', icon: Sunrise },
            { id: 'AFTERNOON', label: '오후 (12~18)', icon: Sun },
            { id: 'EVENING', label: '야간 (18~24)', icon: Moon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = timeWindow === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTimeWindow(item.id as TimeWindowFilter)}
                className={`px-3 py-1.5 text-xs tracking-wider transition-all flex items-center gap-1.5 border font-mono ${
                  isActive
                    ? 'bg-[#C5A36A] text-black border-[#C5A36A] font-bold shadow-[0_0_10px_rgba(197,163,106,0.3)]'
                    : item.highlight
                    ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A]/40 hover:border-[#C5A36A]'
                    : 'bg-[#0D1014] text-[#E0E2E5]/60 hover:text-[#E0E2E5] border-[#1F242D]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : item.highlight ? 'text-[#C5A36A]' : 'text-[#E0E2E5]/50'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Header Controls: Tab toggle + Stats bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111418] border border-[#1F242D] p-4 shadow-xl">
        {/* Departure / Arrival Tabs */}
        <div className="flex items-center bg-[#0D1014] p-1 border border-[#1F242D]">
          <button
            id="tab-departures"
            onClick={() => setBoardType('DEPARTURE')}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 border ${
              boardType === 'DEPARTURE'
                ? 'bg-[#C5A36A] text-black border-[#C5A36A]'
                : 'text-[#E0E2E5]/60 hover:text-[#C5A36A] border-transparent'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            CJU DEPARTURES (출발)
          </button>
          <button
            id="tab-arrivals"
            onClick={() => setBoardType('ARRIVAL')}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 border ${
              boardType === 'ARRIVAL'
                ? 'bg-[#C5A36A] text-black border-[#C5A36A]'
                : 'text-[#E0E2E5]/60 hover:text-[#C5A36A] border-transparent'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            CJU ARRIVALS (도착)
          </button>
        </div>

        {/* Quick flight stats summary */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          <div className="bg-[#161B22] border border-[#1F242D] px-3 py-1.5">
            <span className="text-[#E0E2E5]/50 uppercase text-[10px]">TOTAL: </span>
            <strong className="text-[#E0E2E5]">{totalCount}편</strong>
          </div>
          <div className="bg-[#161B22] border border-[#1F242D] px-3 py-1.5">
            <span className="text-[#E0E2E5]/50 uppercase text-[10px]">AIRBORNE: </span>
            <strong className="text-[#C5A36A]">{inFlightCount}대</strong>
          </div>
          <div className="bg-[#161B22] border border-[#1F242D] px-3 py-1.5">
            <span className="text-[#E0E2E5]/50 uppercase text-[10px]">ON-TIME: </span>
            <strong className="text-[#E0E2E5]">{onTimeRate}%</strong>
          </div>
          {delayedCount > 0 && (
            <div className="bg-[#161B22] border border-red-900/60 px-3 py-1.5 text-red-400">
              <span className="uppercase text-[10px]">DELAY: </span>
              <strong>{delayedCount}편</strong>
            </div>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-[#0D1014] border border-[#1F242D] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#E0E2E5]/50 font-serif italic text-sm mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#C5A36A]" />
            Route:
          </span>
          {[
            { id: 'ALL', label: '전체 노선' },
            { id: 'GMP', label: '김포 (GMP)' },
            { id: 'PUS', label: '부산/김해 (PUS)' },
            { id: 'CJJ', label: '청주 (CJJ)' },
            { id: 'TAE', label: '대구 (TAE)' },
            { id: 'KWJ', label: '광주 (KWJ)' },
            { id: 'OTHER', label: '기타공항' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedCity(item.id)}
              className={`px-2.5 py-1 text-xs uppercase tracking-wider transition-all border ${
                selectedCity === item.id
                  ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A] font-bold'
                  : 'bg-[#0A0C10] text-[#E0E2E5]/60 hover:text-[#E0E2E5] border-[#1F242D]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Airline & Status Quick Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Airline Select */}
          <select
            value={selectedAirline}
            onChange={(e) => setSelectedAirline(e.target.value)}
            className="bg-[#0A0C10] border border-[#1F242D] text-[#E0E2E5] px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C5A36A] tracking-wider"
          >
            <option value="ALL">모든 항공사 (ALL AIRLINES)</option>
            {Object.values(AIRLINES).map((airline) => (
              <option key={airline.code} value={airline.code}>
                {airline.nameKr} ({airline.code})
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0A0C10] border border-[#1F242D] text-[#E0E2E5] px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C5A36A] tracking-wider"
          >
            <option value="ALL">모든 운항상태 (STATUS)</option>
            <option value="IN_FLIGHT">비행중 (AIRBORNE)</option>
            <option value="BOARDING">탑승중 (BOARDING)</option>
            <option value="DELAYED">지연편 (DELAYED)</option>
            <option value="FAVORITES">⭐ 관심 편명 (STARRED)</option>
          </select>
        </div>
      </div>

      {/* Flight Schedule Table (FIDS Display) */}
      <div className="bg-[#111418] border border-[#1F242D] shadow-2xl overflow-hidden">
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#090B0E] text-[#E0E2E5]/60 border-b border-[#1F242D] text-[10px] font-semibold uppercase tracking-[0.15em]">
              <tr>
                <th className="py-3 px-3 sm:px-4 w-10 text-center">⭐</th>
                <th className="py-3 px-3 sm:px-4">편명 / 항공사</th>
                <th className="py-3 px-3 sm:px-4">
                  {boardType === 'DEPARTURE' ? '도착지 (DESTINATION)' : '출발지 (ORIGIN)'}
                </th>
                <th className="py-3 px-3 sm:px-4">기종 (REGISTRATION)</th>
                <th className="py-3 px-3 sm:px-4">예정 (SCHEDULED)</th>
                <th className="py-3 px-3 sm:px-4">
                  {boardType === 'DEPARTURE' ? '탑승구 (GATE)' : '도착게이트 (CAROUSEL)'}
                </th>
                <th className="py-3 px-3 sm:px-4">운항 상태 (STATUS)</th>
                <th className="py-3 px-3 sm:px-4 text-center">조회 / 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F242D] font-mono">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#E0E2E5]/40 font-sans">
                    <p className="text-sm font-medium text-[#E0E2E5]/70">일치하는 항공편 일정이 없습니다.</p>
                    <p className="text-xs text-[#E0E2E5]/40 mt-1">검색어를 확인하거나 필터를 '전체'로 설정해 보세요.</p>
                    {(searchQuery || timeWindow !== 'ALL' || selectedCity !== 'ALL' || selectedAirline !== 'ALL' || selectedStatus !== 'ALL') && (
                      <button
                        onClick={() => {
                          onClearSearch();
                          setTimeWindow('ALL');
                          setSelectedCity('ALL');
                          setSelectedAirline('ALL');
                          setSelectedStatus('ALL');
                        }}
                        className="mt-3 px-3 py-1 bg-[#161B22] border border-[#C5A36A] text-[#C5A36A] text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        모든 필터 초기화
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredFlights.map((flight) => {
                  const airline = AIRLINES[flight.airlineCode] || AIRLINES.KE;
                  const targetAirport = AIRPORTS[boardType === 'DEPARTURE' ? flight.destination : flight.origin] || AIRPORTS.GMP;
                  const isFav = favorites.includes(flight.flightNumber);
                  const isSelected = selectedFlightId === flight.id;
                  const flightMins = parseHHMM(flight.scheduledTime);
                  const isNearNow = Math.abs(flightMins - nowMinutes) <= 30;

                  return (
                    <tr
                      key={flight.id}
                      className={`hover:bg-[#161B22]/90 transition-colors ${
                        isSelected
                          ? 'bg-[#161B22] border-l-2 border-l-[#C5A36A]'
                          : isNearNow
                          ? 'bg-[#161B22]/40'
                          : ''
                      }`}
                    >
                      {/* Star Bookmark */}
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <button
                          onClick={() => toggleFavorite(flight.flightNumber)}
                          title={isFav ? '관심편 해제' : '관심편 등록'}
                          className="text-[#E0E2E5]/30 hover:text-[#C5A36A] transition-colors"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'text-[#C5A36A] fill-[#C5A36A]' : ''}`} />
                        </button>
                      </td>

                      {/* Flight Number & Airline */}
                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="flex items-center space-x-2.5 font-sans">
                          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#0D1014] text-[#C5A36A] border border-[#C5A36A]/40">
                            {flight.airlineCode}
                          </span>
                          <div>
                            <div className="font-bold text-[#E0E2E5] text-sm font-mono tracking-wider flex items-center gap-1.5">
                              <span>{flight.flightNumber}</span>
                              {isNearNow && (
                                <span className="px-1.5 py-0.2 text-[9px] bg-[#C5A36A] text-black font-bold uppercase tracking-wider">
                                  NOW
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#E0E2E5]/50 font-sans">{airline.nameKr}</div>
                          </div>
                        </div>
                      </td>

                      {/* Destination / Origin */}
                      <td className="py-3.5 px-3 sm:px-4 font-sans">
                        <div className="font-bold text-[#E0E2E5] text-sm flex items-center gap-1.5">
                          <span>{targetAirport.city}</span>
                          <span className="text-xs text-[#C5A36A] font-mono">({targetAirport.code})</span>
                        </div>
                        <div className="text-[11px] text-[#E0E2E5]/50">{targetAirport.nameKr}</div>
                      </td>

                      {/* Aircraft Type & Reg Number */}
                      <td className="py-3.5 px-3 sm:px-4 font-sans">
                        <div className="font-semibold text-[#E0E2E5]/90 text-xs font-mono">{flight.aircraftType}</div>
                        <div className="text-[10px] text-[#E0E2E5]/40 font-mono">HL-{flight.regNumber}</div>
                      </td>

                      {/* Time (Scheduled & Estimated) */}
                      <td className="py-3.5 px-3 sm:px-4">
                        <div className="flex items-baseline gap-1.5 font-mono">
                          <span className={`font-bold text-sm ${flight.status === 'DELAYED' ? 'line-through text-[#E0E2E5]/40 text-xs' : 'text-[#E0E2E5]'}`}>
                            {flight.scheduledTime}
                          </span>
                          {flight.status === 'DELAYED' && (
                            <span className="font-bold text-sm text-red-400">
                              {flight.estimatedTime}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#E0E2E5]/50 font-sans">
                          {flight.status === 'DELAYED' ? `+${flight.delayMinutes}M 예상` : 'ON TIME'}
                        </div>
                      </td>

                      {/* Gate & Counter / Carousel */}
                      <td className="py-3.5 px-3 sm:px-4 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#E0E2E5] text-xs font-mono">
                            GATE {flight.gate}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#E0E2E5]/50">
                          {boardType === 'DEPARTURE'
                            ? `카운터: ${flight.checkInCounter || '3층'}`
                            : `수하물: ${flight.carousel || '1층'}`}
                        </div>
                      </td>

                      {/* Live Flight Status */}
                      <td className="py-3.5 px-3 sm:px-4 font-sans">
                        {renderStatusBadge(flight)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3 sm:px-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`btn-radar-${flight.flightNumber}`}
                            onClick={() => onSelectFlightForRadar(flight)}
                            title="실시간 레이더 추적"
                            className="px-2.5 py-1 bg-transparent hover:bg-[#C5A36A] text-[#C5A36A] hover:text-black border border-[#C5A36A] text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Radio className="w-3 h-3" />
                            <span>레이더</span>
                          </button>

                          <button
                            id={`btn-seat-${flight.flightNumber}`}
                            onClick={() => onSelectFlightForSeatMap(flight)}
                            title="기종 좌석배치도"
                            className="px-2.5 py-1 bg-[#161B22] hover:bg-[#1F242D] text-[#E0E2E5] border border-[#1F242D] hover:border-[#C5A36A]/60 text-xs font-medium uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Sparkles className="w-3 h-3 text-[#C5A36A]" />
                            <span>좌석도</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
