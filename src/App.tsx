import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlightItem, JejuWeather } from './types/flight';
import { INITIAL_JEJU_WEATHER, getPositionAlongRoute } from './utils/flightSimulation';
import { fetchLiveFlights, FetchFlightsResult } from './services/flightApi';
import { Navbar } from './components/Navbar';
import { WeatherBanner } from './components/WeatherBanner';
import { FlightBoard } from './components/FlightBoard';
import { RadarMap } from './components/RadarMap';
import { SeatMapViewer } from './components/SeatMapViewer';
import { JejuResidentHub } from './components/JejuResidentHub';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Plane, Radio, Clock, Sparkles, MapPin } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'BOARD' | 'RADAR' | 'SEAT' | 'RESIDENT'>('BOARD');
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightItem | null>(null);
  const [selectedSeatAircraft, setSelectedSeatAircraft] = useState<string>('B737-800');
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState<JejuWeather>(INITIAL_JEJU_WEATHER);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // KAC Live API state
  const [dataSource, setDataSource] = useState<'KAC_LIVE' | 'SIMULATION'>('SIMULATION');
  const [isFetchingFlights, setIsFetchingFlights] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Load flights from KAC API or fallback simulation
  const loadFlightData = useCallback(async (customKey?: string) => {
    setIsFetchingFlights(true);
    try {
      const result: FetchFlightsResult = await fetchLiveFlights(customKey);
      setDataSource(result.source);
      setFlights(result.flights);

      // Set initial selected flight if none or not found
      setSelectedFlight((prev) => {
        if (!prev) {
          return (
            result.flights.find((f) => ['DEPARTED', 'APPROACHING'].includes(f.status)) ||
            result.flights[0] ||
            null
          );
        }
        const updated = result.flights.find((f) => f.flightNumber === prev.flightNumber);
        return updated || prev;
      });
    } catch (err) {
      console.error('Failed to load flight data:', err);
    } finally {
      setIsFetchingFlights(false);
    }
  }, []);

  // Initial load and 60s periodic polling
  useEffect(() => {
    loadFlightData();

    const pollInterval = setInterval(() => {
      loadFlightData();
    }, 60000); // Poll every 60s

    return () => clearInterval(pollInterval);
  }, [loadFlightData]);

  // Real-time Flight advancement ticker (1s interval)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setFlights((prevFlights) => {
        return prevFlights.map((flight) => {
          if (flight.status === 'CANCELLED' || flight.status === 'LANDED') {
            return flight;
          }

          // Advance progress based on simulation speed
          const stepIncrement = 0.15 * simulationSpeed;
          let newProgress = flight.progressPct + stepIncrement;

          let newStatus = flight.status;
          if (newProgress >= 100) {
            newProgress = 100;
            newStatus = 'LANDED';
          } else if (newProgress >= 90) {
            newStatus = 'APPROACHING';
          } else if (newProgress > 0 && flight.status !== 'DELAYED') {
            newStatus = 'DEPARTED';
          }

          const pos = getPositionAlongRoute(flight.routeWaypoints, newProgress);

          const updatedFlight: FlightItem = {
            ...flight,
            progressPct: Math.round(newProgress * 10) / 10,
            status: newStatus,
            lat: pos.lat,
            lng: pos.lng,
            altitudeFt: pos.altitude,
            speedKts: pos.speedKts,
            headingDeg: pos.heading,
            verticalSpeedFpm: pos.verticalSpeed,
          };

          // If this is currently selected flight, update selected state too
          if (selectedFlight && selectedFlight.id === flight.id) {
            setSelectedFlight(updatedFlight);
          }

          return updatedFlight;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, selectedFlight]);

  // Handle selecting a flight to track on radar
  const handleSelectFlightForRadar = useCallback((flight: FlightItem) => {
    setSelectedFlight(flight);
    setActiveTab('RADAR');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle opening seat map for a specific flight
  const handleSelectFlightForSeatMap = useCallback((flight: FlightItem) => {
    setSelectedFlight(flight);
    setSelectedSeatAircraft(flight.aircraftType);
    setActiveTab('SEAT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefreshWeather = () => {
    setWeather((prev) => ({
      ...prev,
      windSpeedKt: 22 + Math.floor(Math.random() * 6),
      gustKt: 34 + Math.floor(Math.random() * 8),
      tempC: Math.round((18 + Math.random() * 2) * 10) / 10,
      updatedAt: '방금 전 갱신됨',
    }));
  };

  const handleSaveApiKey = (newKey: string) => {
    loadFlightData(newKey);
  };

  const inFlightCount = flights.filter((f) => ['DEPARTED', 'APPROACHING'].includes(f.status)).length;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E0E2E5] flex flex-col selection:bg-[#C5A36A] selection:text-black font-sans antialiased">
      {/* Top Fixed / Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        weather={weather}
        inFlightCount={inFlightCount}
        dataSource={dataSource}
        isFetchingFlights={isFetchingFlights}
        onRefreshFlights={() => loadFlightData()}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Jeju Weather & ATC Alert Banner */}
        <WeatherBanner weather={weather} onRefreshWeather={handleRefreshWeather} />

        {/* View Component Switcher */}
        {activeTab === 'BOARD' && (
          <FlightBoard
            flights={flights}
            selectedFlightId={selectedFlight?.id || null}
            onSelectFlightForRadar={handleSelectFlightForRadar}
            onSelectFlightForSeatMap={handleSelectFlightForSeatMap}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        )}

        {activeTab === 'RADAR' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif italic text-[#C5A36A] font-bold flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#C5A36A] animate-pulse" />
                  한반도-제주 실시간 항공기 레이더 (Flightradar24 Live)
                </h2>
                <p className="text-xs text-[#E0E2E5]/50 mt-0.5 tracking-wide">
                  제주공항(CJU)과 전국 공항을 오가는 비행기의 실시간 위치, 고도, 속도, 항적을 추적합니다.
                </p>
              </div>
            </div>

            <RadarMap
              flights={flights}
              selectedFlight={selectedFlight}
              onSelectFlight={(f) => setSelectedFlight(f)}
              onOpenSeatMap={handleSelectFlightForSeatMap}
              simulationSpeed={simulationSpeed}
              setSimulationSpeed={setSimulationSpeed}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
            />
          </div>
        )}

        {activeTab === 'SEAT' && (
          <SeatMapViewer
            initialAircraft={selectedSeatAircraft}
            onSelectSeat={(seatId) => console.log('Selected seat:', seatId)}
          />
        )}

        {activeTab === 'RESIDENT' && <JejuResidentHub />}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
        dataSource={dataSource}
      />

      {/* Bottom Footer */}
      <footer className="bg-[#090B0E] border-t border-[#1F242D] py-6 px-4 text-xs text-[#E0E2E5]/40 text-center font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            제주 플라이트 허브 (JEJU FLIGHT HUB) — 한국공항공사(KAC) 실시간 출도착 연동 규격 & 항공사별 좌석 가이드
          </p>
          <p className="text-[#C5A36A]">
            제주국제공항(RKPC / CJU) 관제 데이터 실시간 기반
          </p>
        </div>
      </footer>
    </div>
  );
}
