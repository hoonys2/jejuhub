import React from 'react';
import { AIRLINES } from '../data/airlines';
import {
  ShieldCheck,
  Percent,
  Car,
  AlertTriangle,
  Fingerprint,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

export const JejuResidentHub: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-[#111418] border border-[#1F242D] p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#161B22] text-[#C5A36A] border border-[#C5A36A]/40 text-xs font-mono tracking-wider uppercase mb-3">
            <ShieldCheck className="w-4 h-4" />
            JEJU RESIDENT TRANSIT ESSENTIALS
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#E0E2E5] tracking-tight">
            비행기가 생활 교통인 도민을 위한 특화 허브
          </h1>
          <p className="text-xs sm:text-sm text-[#E0E2E5]/60 mt-2 leading-relaxed">
            항공사별 도민할인(10~20%) 사전 등록법, 결항/지연 시 대기표 선점 팁, 제주공항 주차요금 50% 감면 및 바이오패스 빠른 탑승 가이드를 한곳에서 확인하세요.
          </p>
        </div>
      </div>

      {/* Grid of Key Resident Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Module 1: Airline Resident Discounts */}
        <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#C5A36A] font-serif italic font-bold text-sm mb-3">
              <Percent className="w-4 h-4" /> 항공사별 도민할인 비교 & 신청
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-[#0D1014] border border-[#1F242D]">
                <span className="font-semibold text-[#E0E2E5]">제주항공 (7C)</span>
                <span className="text-[#C5A36A] font-mono font-bold">정규운임 최대 20%</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#0D1014] border border-[#1F242D]">
                <span className="font-semibold text-[#E0E2E5]">대한항공 (KE)</span>
                <span className="text-[#C5A36A] font-mono">주중 10% / 주말 5%</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#0D1014] border border-[#1F242D]">
                <span className="font-semibold text-[#E0E2E5]">아시아나항공 (OZ)</span>
                <span className="text-[#C5A36A] font-mono">상시 10% (도민인증)</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#0D1014] border border-[#1F242D]">
                <span className="font-semibold text-[#E0E2E5]">진에어 / 티웨이 / 이스타</span>
                <span className="text-[#C5A36A] font-mono">주중 10% / 주말 5%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F242D] text-[11px] text-[#E0E2E5]/50">
            💡 팁: 최초 1회 항공사 웹에서 주민등록등본/신분증으로 [도민 인증]을 완료하면 결제 시 자동 적용됩니다.
          </div>
        </div>

        {/* Module 2: Airport Parking 50% Discount */}
        <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#C5A36A] font-serif italic font-bold text-sm mb-3">
              <Car className="w-4 h-4" /> 제주공항 주차요금 50% 감면
            </div>
            <div className="space-y-2 text-xs text-[#E0E2E5]/70 leading-relaxed">
              <div className="p-3 bg-[#0D1014] border border-[#1F242D]">
                <strong className="text-[#E0E2E5] block mb-1">도민 및 다자녀 감면 혜택</strong>
                <p className="text-[11px] text-[#E0E2E5]/50">
                  제주도민 차량 및 저공해/전기차, 다자녀 가구는 제주공항 여객주차장 1일 주차요금(기본 10,000원)을 50% 할인(5,000원)받습니다.
                </p>
              </div>
              <div className="p-3 bg-[#0D1014] border border-[#1F242D]">
                <strong className="text-[#E0E2E5] block mb-1">사전등록 하이패스 정산</strong>
                <p className="text-[11px] text-[#E0E2E5]/50">
                  한국공항공사 주차 예약 사이트에서 차량번호 사전등록 시 출차 시 영수증 제시 없이 50% 자동 감면 출차됩니다.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F242D] text-[11px] text-[#E0E2E5]/50">
            🚗 주차 구역 팁: P1(국내선 정면) 만차 시 화물청사 앞 장기주차장이 가장 여유롭습니다.
          </div>
        </div>

        {/* Module 3: Fast Biometric Pass (바이오패스) */}
        <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#C5A36A] font-serif italic font-bold text-sm mb-3">
              <Fingerprint className="w-4 h-4" /> 손바닥(정맥) 바이오패스
            </div>
            <div className="space-y-2 text-xs text-[#E0E2E5]/70 leading-relaxed">
              <div className="p-3 bg-[#0D1014] border border-[#1F242D]">
                <strong className="text-[#E0E2E5] block mb-1">신분증 없는 3초 전용 게이트</strong>
                <p className="text-[11px] text-[#E0E2E5]/50">
                  제주공항 3층 출발장 바이오 등록대에서 손바닥 정맥을 1회 등록하면 전국 14개 공항 국내선 검색대를 신분증 검사 없이 전용 레인으로 3초 만에 통과합니다.
                </p>
              </div>
              <div className="p-3 bg-[#0D1014] border border-[#1F242D]">
                <strong className="text-[#E0E2E5] block mb-1">모바일 운전면허증 & PASS 연동</strong>
                <p className="text-[11px] text-[#E0E2E5]/50">
                  정맥 미등록 시에도 PASS 앱 모바일 신분증 QR로 신분 확인이 즉시 가능합니다.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F242D] text-[11px] text-[#E0E2E5]/50">
            ⚡ 출퇴근 시간대 일반 검색대 대기시간(15~20분)을 2분 이내로 단축시켜 줍니다.
          </div>
        </div>
      </div>

      {/* Typhoon & Windshear Standby Ticket Strategy (대기표 잡기 팁) */}
      <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl">
        <div className="flex items-center gap-2 text-[#C5A36A] font-serif italic font-bold text-base mb-3">
          <AlertTriangle className="w-5 h-5 text-[#C5A36A]" /> 제주 태풍/대설/윈드시어 결항 시 실전 대처 가이드
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#E0E2E5]/70">
          <div className="p-3.5 bg-[#0D1014] border border-[#1F242D]">
            <div className="font-bold text-[#C5A36A] mb-1 font-serif">1. 결항 확정 전 문자 수신 즉시 대처</div>
            <p className="text-[11px] text-[#E0E2E5]/50 leading-relaxed">
              공항 현장 카운터는 수백 명이 몰려 대기가 2~3시간 발생합니다. 카운터로 이동하는 동안 모바일 앱이나 항공사 고객센터로 전화하여 다음 날 첫 비행편으로 즉시 무료 변경하세요.
            </p>
          </div>
          <div className="p-3.5 bg-[#0D1014] border border-[#1F242D]">
            <div className="font-bold text-[#C5A36A] mb-1 font-serif">2. 광동체 대형기(A330, B777) 우선 노리기</div>
            <p className="text-[11px] text-[#E0E2E5]/50 leading-relaxed">
              기상 특보 해제 직후 항공사는 대형기(300~400석) 임시편을 우선 편성합니다. 대한항공, 아시아나, 티웨이의 A330 좌석을 노리는 것이 소형기보다 잔여석 획득 확률이 3배 높습니다.
            </p>
          </div>
          <div className="p-3.5 bg-[#0D1014] border border-[#1F242D]">
            <div className="font-bold text-[#C5A36A] mb-1 font-serif">3. 제주항 연안여객선(퀸제누비아호 등) 대체</div>
            <p className="text-[11px] text-[#E0E2E5]/50 leading-relaxed">
              비행기가 완전 올스톱될 정도의 강풍이라도 대형 카페리선(목포/완도/여수행)은 정상 출항하는 경우가 많습니다. 급한 육지 방문 시 제주항 여객선터미널로 우회하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Airlines Direct Portal & Customer Service Directory */}
      <div className="bg-[#111418] border border-[#1F242D] p-5 shadow-2xl">
        <h3 className="text-sm font-serif italic font-bold text-[#C5A36A] mb-3 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-[#C5A36A]" />
          국내선 항공사 바로가기 & 제주공항 카운터 안내
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.values(AIRLINES).map((airline) => (
            <div
              key={airline.code}
              className="p-3.5 bg-[#0D1014] border border-[#1F242D] hover:border-[#C5A36A]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#161B22] text-[#C5A36A] border border-[#C5A36A]/40">
                    {airline.code}
                  </span>
                  <span className="text-[10px] text-[#E0E2E5]/40 font-mono">{airline.icao}</span>
                </div>
                <div className="font-bold text-sm text-[#E0E2E5]">{airline.nameKr}</div>
                <div className="text-[11px] text-[#E0E2E5]/50 mt-1">{airline.checkInCounterJeju}</div>
                <div className="text-[11px] text-[#C5A36A] font-medium mt-1 font-mono">
                  무료 수하물: {airline.baggageFreeKg}kg
                </div>
              </div>

              <a
                href={airline.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 py-1.5 px-2 bg-[#161B22] hover:bg-[#1F242D] text-[#C5A36A] text-xs font-bold rounded-none flex items-center justify-center gap-1 border border-[#1F242D] hover:border-[#C5A36A]/60 transition-all uppercase tracking-wider"
              >
                <span>예약/도민할인 확인</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
