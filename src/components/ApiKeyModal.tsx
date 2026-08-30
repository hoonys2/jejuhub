import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, ExternalLink, X, RefreshCw } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  dataSource: 'KAC_LIVE' | 'SIMULATION';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dataSource,
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
              공공데이터포털 KAC API 키 연동 설정
            </h2>
            <p className="text-xs text-[#E0E2E5]/60">
              한국공항공사 실시간 항공기 운항정보 오픈 API
            </p>
          </div>
        </div>

        {/* Current Connection Status Pill */}
        <div className="mb-4 p-3 bg-[#0D1014] border border-[#1F242D] flex items-center justify-between text-xs font-mono">
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
              입력하신 키는 브라우저 로컬 저장소에 안전하게 보관되며, Netlify 서버리스 함수를 통해서만 호출됩니다. (비워둘 시 자체 시뮬레이션 모드로 작동)
            </p>
          </div>

          {/* Guide box */}
          <div className="bg-[#161B22] p-3.5 border border-[#1F242D] text-xs text-[#E0E2E5]/70 space-y-2">
            <div className="font-bold text-[#C5A36A] flex items-center gap-1.5 font-serif">
              <AlertCircle className="w-4 h-4 text-[#C5A36A]" />
              API 키 발급 및 배포 환경 등록 팁
            </div>
            <ul className="text-[11px] space-y-1 list-disc pl-4 text-[#E0E2E5]/60">
              <li>
                공공데이터포털(data.go.kr)에서 <strong>'한국공항공사_항공기 운항정보'</strong> 활용신청 승인 후 발급된 일반 인증키를 사용합니다.
              </li>
              <li>
                Netlify 배포 사이트의 <strong>Site configuration &gt; Environment variables</strong>에 <code className="text-[#C5A36A]">KAC_API_KEY</code> 변수로 등록하시면 사이트 접속자 전원에게 자동 적용됩니다.
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
              키 초기화 (시뮬레이션 복구)
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
