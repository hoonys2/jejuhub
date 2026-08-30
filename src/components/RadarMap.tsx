import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FlightItem } from '../types/flight';
import { AIRPORTS, AIRWAYS } from '../data/airports';
import { AIRLINES } from '../data/airlines';
import {
  getAviationPositionDescription,
  getFlightStatusDisplay,
} from '../utils/flightSimulation';
import {
  Plane,
  Play,
  Pause,
  Compass,
  Gauge,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Layers,
  Crosshair,
  Radio,
  MapPin,
  CheckCircle2,
  Navigation,
  Activity,
  Maximize2,
} from 'lucide-react';

interface RadarMapProps {
  flights: FlightItem[];
  selectedFlight: FlightItem | null;
  onSelectFlight: (flight: FlightItem) => void;
  onOpenSeatMap: (flight: FlightItem) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
}

export const RadarMap: React.FC<RadarMapProps> = ({
  flights,
  selectedFlight,
  onSelectFlight,
  onOpenSeatMap,
  simulationSpeed,
  setSimulationSpeed,
  isSimulating,
  setIsSimulating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const aircraftMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const activeTrailRef = useRef<L.Polyline | null>(null);
  const remainingTrailRef = useRef<L.Polyline | null>(null);

  const [followSelected, setFollowSelected] = useState(true);
  const [mapStyle, setMapStyle] = useState<'DARK' | 'VOYAGER' | 'SATELLITE'>('DARK');
  const [flightFilter, setFlightFilter] = useState<'ALL' | 'DEP' | 'ARR'>('ALL');

  // Currently airborne active flights
  const airborneFlights = flights.filter((f) => ['DEPARTED', 'APPROACHING'].includes(f.status));

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create map centered on Southern Korea / Jeju corridor
    const map = L.map(mapContainerRef.current, {
      center: selectedFlight ? [selectedFlight.lat, selectedFlight.lng] : [34.8, 127.0],
      zoom: 8,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
    });

    // Custom dark aerospace tile layer (CartoDB Dark Matter)
    const tileUrl =
      mapStyle === 'VOYAGER'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : mapStyle === 'SATELLITE'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; CartoDB & OpenStreetMap & Jeju Flight Radar',
      maxZoom: 19,
    }).addTo(map);

    // Layer group for airways
    const airwaysGroup = L.layerGroup().addTo(map);
    AIRWAYS.forEach((airway) => {
      L.polyline(airway.points, {
        color: '#C5A36A',
        weight: 1.2,
        dashArray: '3, 6',
        opacity: 0.35,
      }).addTo(airwaysGroup);
    });

    // Layer group for domestic airports
    const airportsGroup = L.layerGroup().addTo(map);
    Object.values(AIRPORTS).forEach((airport) => {
      const isJeju = airport.code === 'CJU';

      const customAirportIcon = L.divIcon({
        className: 'custom-airport-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="${
              isJeju
                ? 'w-7 h-7 bg-[#C5A36A]/20 border-2 border-[#C5A36A] rounded-full animate-ping'
                : 'w-4 h-4 bg-[#161B22] border border-[#1F242D] rounded-full'
            }"></div>
            <div class="absolute w-2.5 h-2.5 ${
              isJeju ? 'bg-[#C5A36A]' : 'bg-[#E0E2E5]/60'
            } rounded-full shadow-[0_0_10px_#C5A36A]"></div>
            <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 bg-[#090B0E] border border-[#1F242D] text-[9px] font-mono tracking-widest uppercase ${
              isJeju ? 'text-[#C5A36A] border-[#C5A36A]/70 font-bold shadow-[0_0_8px_rgba(197,163,106,0.3)]' : 'text-[#E0E2E5]/70'
            }">
              ${airport.code} (${airport.city})
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([airport.lat, airport.lng], { icon: customAirportIcon })
        .bindTooltip(`<b>${airport.nameKr} (${airport.code})</b><br/>활주로: ${airport.runways.join(', ')}`, {
          direction: 'top',
          className: 'custom-leaflet-tooltip',
        })
        .addTo(airportsGroup);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStyle]);

  // Center on selected flight whenever selectedFlight changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFlight) return;

    map.flyTo([selectedFlight.lat, selectedFlight.lng], 9, {
      animate: true,
      duration: 0.8,
    });
  }, [selectedFlight?.id]);

  // Update Aircraft markers & Trailed Path in real-time
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = aircraftMarkersRef.current;
    const activeFlightIds = new Set<string>();

    flights.forEach((flight) => {
      if (flight.status === 'CANCELLED') return;

      // Filter check
      if (flightFilter === 'DEP' && flight.type !== 'DEPARTURE') return;
      if (flightFilter === 'ARR' && flight.type !== 'ARRIVAL') return;

      activeFlightIds.add(flight.id);
      const airline = AIRLINES[flight.airlineCode] || AIRLINES.KE;
      const isSelected = selectedFlight?.id === flight.id;
      const planeColor = isSelected ? '#000000' : airline.logoColor || '#E0E2E5';
      const posDesc = getAviationPositionDescription(
        flight.lat,
        flight.lng,
        flight.progressPct,
        flight.type,
        flight.origin,
        flight.destination
      );

      // SVG airplane marker
      const customPlaneIcon = L.divIcon({
        className: 'custom-plane-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group">
            ${
              isSelected
                ? `
              <!-- Huge Target Pulse Radar Lock -->
              <div class="absolute -inset-4 rounded-full bg-[#C5A36A]/25 animate-ping pointer-events-none"></div>
              <div class="absolute -inset-2 rounded-full border-2 border-[#C5A36A] animate-pulse pointer-events-none"></div>
              <div class="absolute w-8 h-8 rounded-full border border-dashed border-[#C5A36A] animate-spin pointer-events-none" style="animation-duration: 6s;"></div>
            `
                : ''
            }

            <!-- Airplane Body Icon -->
            <div class="relative z-10 p-1.5 rounded-full ${
              isSelected
                ? 'bg-[#C5A36A] text-black shadow-[0_0_16px_#C5A36A] scale-125 border-2 border-black'
                : 'bg-[#0D1014] border border-[#1F242D] text-[#E0E2E5] hover:scale-110 hover:border-[#C5A36A]/80 shadow-lg'
            } transition-all duration-300" style="transform: rotate(${flight.headingDeg}deg)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="${planeColor}" stroke="${
          isSelected ? '#000000' : '#0A0C10'
        }" stroke-width="1.8">
                <path d="M12 2L9 9H3L2 12L9 14L10 22L12 21L14 22L15 14L22 12L21 9H15L12 2Z" />
              </svg>
            </div>

            <!-- Callout Information Tag -->
            <div class="relative z-20 mt-1.5 flex flex-col items-center pointer-events-none">
              <div class="px-2 py-0.5 ${
                isSelected
                  ? 'bg-[#C5A36A] text-black font-extrabold shadow-[0_0_12px_rgba(197,163,106,0.5)] border border-black'
                  : 'bg-[#090B0E]/95 text-[#E0E2E5] border border-[#1F242D]'
              } text-[10px] font-mono whitespace-nowrap shadow-md tracking-wider flex items-center gap-1">
                ${isSelected ? '<span class="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>' : ''}
                <span>${flight.flightNumber}</span>
                <span class="opacity-80">· FL${Math.round(flight.altitudeFt / 100)}</span>
              </div>

              ${
                isSelected
                  ? `
                <div class="mt-0.5 px-2 py-0.5 bg-[#090B0E]/95 border border-[#C5A36A] text-[#C5A36A] text-[9px] font-mono whitespace-nowrap shadow-lg">
                  📍 ${posDesc}
                </div>
              `
                  : ''
              }
            </div>
          </div>
        `,
        iconSize: isSelected ? [48, 64] : [36, 48],
        iconAnchor: isSelected ? [24, 24] : [18, 18],
      });

      if (currentMarkers.has(flight.id)) {
        const marker = currentMarkers.get(flight.id)!;
        marker.setLatLng([flight.lat, flight.lng]);
        marker.setIcon(customPlaneIcon);
        if (isSelected) {
          marker.setZIndexOffset(1000);
        } else {
          marker.setZIndexOffset(100);
        }
      } else {
        const marker = L.marker([flight.lat, flight.lng], { icon: customPlaneIcon });
        marker.on('click', () => {
          onSelectFlight(flight);
        });
        marker.addTo(map);
        currentMarkers.set(flight.id, marker);
      }
    });

    // Clean up expired markers
    currentMarkers.forEach((marker, id) => {
      if (!activeFlightIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Draw active flight trail for selected flight
    if (selectedFlight && map) {
      if (activeTrailRef.current) activeTrailRef.current.remove();
      if (remainingTrailRef.current) remainingTrailRef.current.remove();

      const waypoints = selectedFlight.routeWaypoints;
      const currentPos: [number, number] = [selectedFlight.lat, selectedFlight.lng];

      // Calculate path up to current point and remaining path
      const originAirport = AIRPORTS[selectedFlight.origin] || AIRPORTS.CJU;
      const destAirport = AIRPORTS[selectedFlight.destination] || AIRPORTS.GMP;

      // Traveled segment (Origin -> Current position)
      const passedPoints: [number, number][] = [[originAirport.lat, originAirport.lng], currentPos];
      const trail = L.polyline(passedPoints, {
        color: '#C5A36A',
        weight: 3.5,
        opacity: 0.95,
      }).addTo(map);
      activeTrailRef.current = trail;

      // Remaining segment (Current position -> Destination)
      const remainPoints: [number, number][] = [currentPos, [destAirport.lat, destAirport.lng]];
      const remainTrail = L.polyline(remainPoints, {
        color: '#C5A36A',
        weight: 2,
        dashArray: '5, 8',
        opacity: 0.5,
      }).addTo(map);
      remainingTrailRef.current = remainTrail;

      if (followSelected) {
        map.panTo([selectedFlight.lat, selectedFlight.lng], { animate: true, duration: 0.4 });
      }
    } else {
      if (activeTrailRef.current) {
        activeTrailRef.current.remove();
        activeTrailRef.current = null;
      }
      if (remainingTrailRef.current) {
        remainingTrailRef.current.remove();
        remainingTrailRef.current = null;
      }
    }
  }, [flights, selectedFlight, followSelected, flightFilter, onSelectFlight]);

  // Center map on currently selected aircraft immediately
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !selectedFlight) return;
    mapInstanceRef.current.flyTo([selectedFlight.lat, selectedFlight.lng], 9, {
      animate: true,
      duration: 0.6,
    });
  };

  // Selected Flight Details computation
  const targetAirportCode = selectedFlight
    ? selectedFlight.type === 'DEPARTURE'
      ? selectedFlight.destination
      : selectedFlight.origin
    : 'GMP';
  const targetAirport = AIRPORTS[targetAirportCode] || AIRPORTS.GMP;
  const jejuAirport = AIRPORTS.CJU;
  const selectedAirline = selectedFlight ? AIRLINES[selectedFlight.airlineCode] || AIRLINES.KE : AIRLINES.KE;
  const selectedStatusInfo = selectedFlight ? getFlightStatusDisplay(selectedFlight) : null;
  const currentPosDescription = selectedFlight
    ? getAviationPositionDescription(
        selectedFlight.lat,
        selectedFlight.lng,
        selectedFlight.progressPct,
        selectedFlight.type,
        selectedFlight.origin,
        selectedFlight.destination
      )
    : '';

  return (
    <div className="relative w-full h-[680px] lg:h-[760px] overflow-hidden border border-[#1F242D] shadow-2xl bg-[#0A0C10]">
      {/* The Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Simulation & Filter Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-[#111418]/95 border border-[#1F242D] p-2 shadow-2xl text-xs backdrop-blur-md">
        {/* Play/Pause */}
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-3 py-1.5 font-bold flex items-center gap-1.5 transition-all text-xs tracking-wider uppercase border ${
            isSimulating
              ? 'bg-[#C5A36A] hover:bg-[#b08f58] text-black border-[#C5A36A]'
              : 'bg-[#161B22] hover:bg-[#1F242D] text-[#C5A36A] border-[#1F242D]'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isSimulating ? '레이더 시뮬레이션 가동' : '일시정지'}</span>
        </button>

        {/* Speed Multiplier */}
        <div className="flex items-center bg-[#0D1014] p-1 border border-[#1F242D]">
          {[1, 3, 5, 10].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimulationSpeed(spd)}
              className={`px-2 py-1 font-mono font-bold transition-all text-xs ${
                simulationSpeed === spd
                  ? 'bg-[#C5A36A] text-black'
                  : 'text-[#E0E2E5]/50 hover:text-[#E0E2E5]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Direction Filter */}
        <div className="flex items-center bg-[#0D1014] p-1 border border-[#1F242D]">
          <button
            onClick={() => setFlightFilter('ALL')}
            className={`px-2.5 py-1 font-medium transition-all text-xs tracking-wider uppercase ${
              flightFilter === 'ALL' ? 'bg-[#161B22] text-[#C5A36A] font-bold' : 'text-[#E0E2E5]/50 hover:text-[#E0E2E5]'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFlightFilter('DEP')}
            className={`px-2.5 py-1 font-medium transition-all text-xs tracking-wider uppercase ${
              flightFilter === 'DEP' ? 'bg-[#161B22] text-[#C5A36A] font-bold' : 'text-[#E0E2E5]/50 hover:text-[#E0E2E5]'
            }`}
          >
            제주출발
          </button>
          <button
            onClick={() => setFlightFilter('ARR')}
            className={`px-2.5 py-1 font-medium transition-all text-xs tracking-wider uppercase ${
              flightFilter === 'ARR' ? 'bg-[#161B22] text-[#C5A36A] font-bold' : 'text-[#E0E2E5]/50 hover:text-[#E0E2E5]'
            }`}
          >
            제주도착
          </button>
        </div>

        {/* Follow Selected Plane Toggle */}
        <button
          onClick={() => setFollowSelected(!followSelected)}
          title="선택 항공기 자동 추적"
          className={`px-2.5 py-1.5 border flex items-center gap-1 transition-all text-xs uppercase tracking-wider ${
            followSelected
              ? 'bg-[#161B22] text-[#C5A36A] border-[#C5A36A] font-bold'
              : 'bg-[#0D1014] text-[#E0E2E5]/50 border-[#1F242D] hover:text-[#E0E2E5]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>기체추적 {followSelected ? 'ON' : 'OFF'}</span>
        </button>

        {/* Re-center Target Button */}
        {selectedFlight && (
          <button
            onClick={handleRecenter}
            title="항공기 화면 정중앙으로 이동"
            className="px-2.5 py-1.5 bg-[#C5A36A] text-black font-bold border border-[#C5A36A] flex items-center gap-1 transition-all text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(197,163,106,0.3)]"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>타겟 중앙 포커스</span>
          </button>
        )}
      </div>

      {/* Top Right: Layer Switcher & Airway legend */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 text-xs">
        <div className="bg-[#111418]/95 border border-[#1F242D] p-1.5 shadow-2xl flex items-center gap-1 backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-[#C5A36A] ml-1.5" />
          {(['DARK', 'VOYAGER', 'SATELLITE'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setMapStyle(style)}
              className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold transition-all ${
                mapStyle === style ? 'bg-[#C5A36A] text-black' : 'text-[#E0E2E5]/50 hover:text-[#E0E2E5]'
              }`}
            >
              {style === 'DARK' ? '다크 레이더' : style === 'VOYAGER' ? '일반 지도' : '위성'}
            </button>
          ))}
        </div>

        <div className="bg-[#0D1014]/90 border border-[#1F242D] px-3 py-1.5 text-[10px] text-[#E0E2E5]/70 flex items-center gap-3 tracking-wider font-mono">
          <span className="flex items-center gap-1 text-[#E0E2E5]/70">
            <span className="w-2.5 h-0.5 bg-[#C5A36A] inline-block opacity-40" /> Y711/Y722 관제항로
          </span>
          <span className="flex items-center gap-1 text-[#C5A36A]">
            <span className="w-2.5 h-0.5 bg-[#C5A36A] inline-block shadow-[0_0_6px_#C5A36A]" /> 추적 중 항적
          </span>
        </div>
      </div>

      {/* Quick Airborne Selector Strip (1-Click Aircraft Tracker) */}
      <div className="absolute top-20 left-4 z-10 hidden sm:flex items-center gap-1.5 bg-[#090B0E]/90 border border-[#1F242D] p-1.5 max-w-[calc(100vw-350px)] overflow-x-auto shadow-2xl backdrop-blur-md">
        <span className="text-[10px] font-mono text-[#C5A36A] px-2 py-0.5 font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
          <Activity className="w-3 h-3 text-[#C5A36A] animate-pulse" />
          비행중 편명:
        </span>
        {airborneFlights.map((flight) => {
          const isSel = selectedFlight?.id === flight.id;
          return (
            <button
              key={flight.id}
              onClick={() => onSelectFlight(flight)}
              className={`px-2.5 py-1 text-xs font-mono font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                isSel
                  ? 'bg-[#C5A36A] text-black border-[#C5A36A] shadow-[0_0_8px_#C5A36A]'
                  : 'bg-[#161B22] text-[#E0E2E5]/70 border-[#1F242D] hover:border-[#C5A36A]/60 hover:text-[#E0E2E5]'
              }`}
            >
              <span>{flight.flightNumber}</span>
              <span className={`text-[10px] ${isSel ? 'text-black/80' : 'text-[#C5A36A]'}`}>
                ({flight.type === 'DEPARTURE' ? '제주발' : '제주행'})
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Floating Telemetry HUD Card (Flightradar24 Style Inspector) */}
      {selectedFlight && selectedStatusInfo ? (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[460px] z-20 bg-[#111418]/95 border border-[#1F242D] shadow-2xl p-4 sm:p-5 text-[#E0E2E5] backdrop-blur-md transition-all">
          {/* Top Bar: Flight & Airline badge */}
          <div className="flex items-start justify-between pb-3 border-b border-[#1F242D]">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#0D1014] text-[#C5A36A] border border-[#C5A36A]/40">
                {selectedFlight.airlineCode}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold tracking-wider font-mono text-[#E0E2E5]">
                    {selectedFlight.flightNumber}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-[#161B22] border border-[#1F242D] text-[#C5A36A] font-mono">
                    HL-{selectedFlight.regNumber}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-[#C5A36A]/10 text-[#C5A36A] border border-[#C5A36A]/30 font-semibold font-sans">
                    {selectedFlight.type === 'DEPARTURE' ? '제주 출발편' : '제주 도착편'}
                  </span>
                </div>
                <p className="text-xs text-[#E0E2E5]/50 font-sans mt-0.5">
                  {selectedAirline.nameKr} · {selectedFlight.aircraftType}
                </p>
              </div>
            </div>

            <button
              onClick={handleRecenter}
              title="지도 중심 맞춤"
              className="text-[#C5A36A] hover:text-black hover:bg-[#C5A36A] text-xs px-2.5 py-1 bg-[#161B22] border border-[#C5A36A] font-bold uppercase tracking-wider font-mono transition-all flex items-center gap-1"
            >
              <Crosshair className="w-3 h-3" />
              <span>포커스</span>
            </button>
          </div>

          {/* Current Geographic Location Radar Tag */}
          <div className="mt-3 p-2.5 bg-[#0D1014] border border-[#C5A36A]/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <MapPin className="w-4 h-4 text-[#C5A36A] shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-[#E0E2E5]/50 uppercase tracking-wider block">실시간 관제 공역 위치</span>
                <span className="text-xs font-bold text-[#E0E2E5] font-sans truncate">{currentPosDescription}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-[#161B22] text-[#C5A36A] border border-[#C5A36A]/50">
                {selectedStatusInfo.mainStatus}
              </span>
            </div>
          </div>

          {/* Route & Progress Visualizer */}
          <div className="my-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="text-left">
                <div className="text-base font-serif font-bold text-[#E0E2E5]">
                  {selectedFlight.type === 'DEPARTURE' ? jejuAirport.code : targetAirport.code}
                </div>
                <div className="text-[11px] text-[#E0E2E5]/50">
                  {selectedFlight.type === 'DEPARTURE' ? jejuAirport.city : targetAirport.city}
                </div>
              </div>

              <div className="flex-1 px-4 flex flex-col items-center">
                <div className="text-[10px] font-mono text-[#C5A36A] tracking-wider font-semibold mb-1">
                  진행률 {selectedFlight.progressPct}% (~{Math.round(selectedFlight.distanceKm * (1 - selectedFlight.progressPct / 100))}km 잔여)
                </div>
                <div className="w-full h-1.5 bg-[#0D1014] border border-[#1F242D] overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#C5A36A]/50 to-[#C5A36A] transition-all duration-300 shadow-[0_0_8px_#C5A36A]"
                    style={{ width: `${selectedFlight.progressPct}%` }}
                  />
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-serif font-bold text-[#E0E2E5]">
                  {selectedFlight.type === 'DEPARTURE' ? targetAirport.code : jejuAirport.code}
                </div>
                <div className="text-[11px] text-[#E0E2E5]/50">
                  {selectedFlight.type === 'DEPARTURE' ? targetAirport.city : jejuAirport.city}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Aviation Telemetry Grid */}
          <div className="grid grid-cols-4 gap-2 my-2 text-center">
            <div className="bg-[#0D1014] p-2 border border-[#1F242D]">
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">고도 (ALT)</div>
              <div className="text-xs font-bold font-mono text-[#C5A36A]">
                {selectedFlight.altitudeFt.toLocaleString()}<span className="text-[9px] text-[#E0E2E5]/50 ml-0.5">ft</span>
              </div>
            </div>

            <div className="bg-[#0D1014] p-2 border border-[#1F242D]">
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">속도 (SPD)</div>
              <div className="text-xs font-bold font-mono text-[#E0E2E5]">
                {selectedFlight.speedKts}<span className="text-[9px] text-[#E0E2E5]/50 ml-0.5">kts</span>
              </div>
            </div>

            <div className="bg-[#0D1014] p-2 border border-[#1F242D]">
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">방위 (HDG)</div>
              <div className="text-xs font-bold font-mono text-[#C5A36A]">
                {Math.round(selectedFlight.headingDeg)}°
              </div>
            </div>

            <div className="bg-[#0D1014] p-2 border border-[#1F242D]">
              <div className="text-[9px] uppercase tracking-wider text-[#E0E2E5]/50 font-sans">수직속도 (V/S)</div>
              <div className="text-xs font-bold font-mono text-[#E0E2E5]">
                {selectedFlight.verticalSpeedFpm > 0 ? `+${selectedFlight.verticalSpeedFpm}` : selectedFlight.verticalSpeedFpm}
              </div>
            </div>
          </div>

          {/* Quick Seat Map Direct Link Button */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => onOpenSeatMap(selectedFlight)}
              className="w-full py-2.5 px-4 bg-[#C5A36A] hover:bg-[#b08f58] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(197,163,106,0.3)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>기종({selectedFlight.aircraftType}) 좌석배치도 & 한라산 뷰 명당석 보기</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-4 left-4 z-10 bg-[#111418]/95 border border-[#1F242D] px-4 py-2.5 shadow-2xl text-xs text-[#E0E2E5]/80 flex items-center gap-2 font-mono">
          <Radio className="w-4 h-4 text-[#C5A36A] animate-pulse" />
          <span>지도의 비행기 아이콘이나 상단의 비행중 편명을 클릭하면 실시간 추적 레이더가 활성화됩니다.</span>
        </div>
      )}
    </div>
  );
};
