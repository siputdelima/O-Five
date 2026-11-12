import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { KipItem, KipUserDecision } from '../types/index.js';

interface KipClassifierViewProps {
  initialKipItems: KipItem[];
  onConfirmKipDecisions: (updatedItems: KipItem[]) => void;
  isLoading: boolean;
}

export const KipClassifierView: React.FC<KipClassifierViewProps> = ({
  initialKipItems,
  onConfirmKipDecisions,
  isLoading,
}) => {
  const [items, setItems] = useState<KipItem[]>(initialKipItems);
  const [filterClass, setFilterClass] = useState<string>('ALL');

  const handleDecision = (id: string, decision: KipUserDecision) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, userDecision: decision } : item))
    );
  };

  // Check if any sensitive item is still pending
  const pendingSensitiveCount = items.filter(
    (i) => i.classification === 'SENSITIF' && i.userDecision === 'PENDING'
  ).length;

  const filteredItems = items.filter((item) => {
    if (filterClass === 'ALL') return true;
    return item.classification === filterClass;
  });

  const handleContinue = () => {
    if (pendingSensitiveCount > 0) {
      alert(
        'Terdapat butir informasi berpotensi sensitif yang belum diputuskan (Gunakan/Jangan Gunakan). Silakan tentukan keputusan Anda terlebih dahulu.'
      );
      return;
    }
    onConfirmKipDecisions(items);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-[#0B1F3A] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span>Langkah 3: Penyaringan & Klasifikasi Informasi (UU No. 14 Tahun 2008)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
          Penetapan Klasifikasi Keterbukaan Informasi Publik
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Tentukan butir informasi yang diizinkan untuk digunakan pada generasi materi komunikasi publik.
        </p>
      </div>

      {/* Mandatory Fixed Banner according to Section 4.E */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
        <HelpCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Pernyataan Yuridis Resmi:</span>
          <p className="text-xs leading-relaxed text-blue-800">
            "Ini hanya indikasi awal dari AI. Penetapan klasifikasi informasi merupakan kewenangan pejabat atau petugas yang berwenang (PPID / Pimpinan Kemenko Polkam)."
          </p>
        </div>
      </div>

      {/* Filter and Summary Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          <button
            onClick={() => setFilterClass('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterClass === 'ALL'
                ? 'bg-[#0B1F3A] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setFilterClass('PUBLIK')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterClass === 'PUBLIK'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Publik ({items.filter((i) => i.classification === 'PUBLIK').length})
          </button>
          <button
            onClick={() => setFilterClass('PERLU_VERIFIKASI')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterClass === 'PERLU_VERIFIKASI'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Perlu Verifikasi ({items.filter((i) => i.classification === 'PERLU_VERIFIKASI').length})
          </button>
          <button
            onClick={() => setFilterClass('SENSITIF')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterClass === 'SENSITIF'
                ? 'bg-[#D32F2F] text-white'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Sensitif ({items.filter((i) => i.classification === 'SENSITIF').length})
          </button>
        </div>

        {pendingSensitiveCount > 0 && (
          <div className="text-xs font-bold text-[#D32F2F] flex items-center gap-1.5 animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            <span>{pendingSensitiveCount} butir sensitif wajib diputuskan</span>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isPublik = item.classification === 'PUBLIK';
          const isPerluVerifikasi = item.classification === 'PERLU_VERIFIKASI';
          const isSensitif = item.classification === 'SENSITIF';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isSensitif
                  ? 'bg-red-50/40 border-red-200'
                  : isPerluVerifikasi
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isPublik
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPerluVerifikasi
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isPublik && <CheckCircle2 className="w-3 h-3" />}
                      {isPerluVerifikasi && <AlertTriangle className="w-3 h-3" />}
                      {isSensitif && <Lock className="w-3 h-3" />}
                      <span>
                        {isPublik
                          ? 'Informasi Publik'
                          : isPerluVerifikasi
                          ? 'Perlu Verifikasi'
                          : 'Berpotensi Dikecualikan / Sensitif'}
                      </span>
                    </span>

                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>

                    <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {item.reference}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {item.content}
                  </p>

                  {item.excerpt && (
                    <div className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded border border-slate-200/60">
                      "{item.excerpt}"
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-800">Alasan Indikasi:</strong> {item.reason}
                  </div>
                </div>

                {/* User Decision Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
                  <span className="text-[10px] uppercase font-bold text-slate-600">
                    Keputusan Anda:
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleDecision(item.id, 'GUNAKAN')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                        item.userDecision === 'GUNAKAN'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Gunakan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(item.id, 'JANGAN_GUNAKAN')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                        item.userDecision === 'JANGAN_GUNAKAN'
                          ? 'bg-[#D32F2F] text-white shadow-xs'
                          : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Jangan Gunakan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="p-4 bg-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          Butir dengan status "Perlu Verifikasi" yang disetujui akan otomatis diberi penanda{' '}
          <code className="text-[#0B1F3A] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-300">
            [PERLU VERIFIKASI]
          </code>{' '}
          pada hasil generasi.
        </div>
        <button
          type="button"
          disabled={isLoading || pendingSensitiveCount > 0}
          onClick={handleContinue}
          className={`px-6 py-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all flex-shrink-0 ${
            pendingSensitiveCount > 0 || isLoading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-[#0B1F3A] hover:bg-[#16365C] text-white cursor-pointer'
          }`}
        >
          <span>Lanjut ke Generasi 5 Produk</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
