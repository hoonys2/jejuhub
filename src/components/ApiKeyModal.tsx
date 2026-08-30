import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, ExternalLink, X, RefreshCw, Info } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  dataSource: 'KAC_LIVE' | 'SIMULATION';
  apiStatusMessage?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dataSource,
  apiStatusMessage,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('jeju_kac_api_key') || '';
    setApiKey(saved);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (cleanKey) {
      localStorage.setItem('jeju_kac_api_key', cleanKey);
    } else {
      localStorage.removeItem('jeju_kac_api_key');
    }
    setSavedSuccess(true);
    onSave(cleanKey);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    localStorage.removeItem('jeju_kac_api_key');
    setApiKey('');
    onSave('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111418] border border-[#C5A36A]/60 max-w-lg w-full p-6 shadow-2xl relative text-[#E0E2E5]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#E0E2E5]/50 hover:text-[#C5A36A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-[#1F242D] pb-3">
          <div className="p-2.5 bg-[#161B22] border border-[#C5A36A] text-[#C5A36A]">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#E0E2E5]">
              공공데이터포털 KAC API 연동 및 진단
            </h2>
            <p className="text-xs text-[#E0E2E5]/60">
              한국공항공사 실시간 항공기 운항정보 오픈 API
            </p>
          </div>
        </div>

        {/* Current Connection Status Pill */}
        <div className="mb-4 p-3 bg-[#0D1014] border border-[#1F242D] space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#E0E2E5]/60">현재 연동 상태:</span>
            {dataSource === 'KAC_LIVE' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                🟢 KAC 실시간 라이브 연동 중
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#C5A36A] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#C5A36A] inline-block" />
                🟡 시뮬레이션 모드 (모의 데이터)
              </span>
            )}
          </div>
          {apiStatusMessage && (
            <div className="text-[11px] text-[#E0E2E5]/70 pt-1 border-t border-[#1F242D]/50 break-all font-sans">
              <span className="text-[#C5A36A] font-mono">[서버 응답 진단]:</span> {apiStatusMessage}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#E0E2E5]/80 mb-1">
              공공데이터포털 일반 인증키 (Encoding 또는 Decoding 키)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="발급받으신 ServiceKey를 붙여넣으세요..."
              className="w-full bg-[#0D1014] border border-[#1F242D] focus:border-[#C5A36A] px-3 py-2 text-xs text-[#E0E2E5] font-mono placeholder-[#E0E2E5]/30 focus:outline-none"
            />
            <p className="text-[11px] text-[#E0E2E5]/50 mt-1.5 leading-relaxed">
              입력하신 키는 브라우저 로컬 저장소에 안전하게 보관되며, Netlify 서버리스 함수를 통해서만 호출됩니다.
            </p>
          </div>

          {/* Guide box */}
          <div className="bg-[#161B22] p-3.5 border border-[#1F242D] text-xs text-[#E0E2E5]/70 space-y-2">
            <div className="font-bold text-[#C5A36A] flex items-center gap-1.5 font-serif">
              <AlertCircle className="w-4 h-4 text-[#C5A36A]" />
              Netlify 환경변수 등록 시 꼭 확인하세요!
            </div>
            <ul className="text-[11px] space-y-1.5 list-disc pl-4 text-[#E0E2E5]/60">
              <li>
                <strong>재배포(Trigger Deploy) 필수</strong>: Netlify 대시보드에서 환경변수(<code className="text-[#C5A36A]">KAC_API_KEY</code>)를 추가한 후, <strong>Deploys &gt; Trigger deploy &gt; Deploy site</strong>를 눌러 사이트를 다시 배포해야 서버리스 함수에 키가 주입됩니다.
              </li>
              <li>
                <strong>공공데이터포털 승인 동기화 시간</strong>: 공공데이터포털에서 API 신청 직후에는 공항공사 게이트웨이 동기화까지 약 <strong>30분~1시간</strong> 정도 소요될 수 있습니다. (그동안은 시뮬레이션 모드로 작동)
              </li>
              <li>
                <strong>즉시 테스트</strong>: 위 입력창에 인증키를 붙여넣고 저장하시면 Netlify 환경변수와 무관하게 브라우저에서 즉시 테스트할 수 있습니다.
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs text-[#E0E2E5]/50 hover:text-red-400 border border-[#1F242D] hover:border-red-900 transition-all uppercase tracking-wider"
            >
              키 초기화 (시뮬레이션)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[#E0E2E5]/70 hover:text-[#E0E2E5] border border-[#1F242D]"
              >
                닫기
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#C5A36A] hover:bg-[#b08f58] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(197,163,106,0.3)] flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>적용 완료!</span>
                  </>
                ) : (
                  <span>저장 및 즉시 연동</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
