import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { ProductType } from '../types/index.js';
import { getProductLabel } from '../lib/docxExport.js';

interface MarkVerifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType: ProductType;
  unverifiedFindingsCount: number;
  onConfirmVerification: (verifiedBy: string, notes: string) => void;
}

export const MarkVerifiedModal: React.FC<MarkVerifiedModalProps> = ({
  isOpen,
  onClose,
  productType,
  unverifiedFindingsCount,
  onConfirmVerification,
}) => {
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [confirmedChecklist, setConfirmedChecklist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectorName.trim()) {
      setError('Nama analis / pejabat pemeriksa wajib diisi.');
      return;
    }
    if (unverifiedFindingsCount > 0 && !confirmedChecklist) {
      setError('Anda wajib mencentang konfirmasi peninjauan temuan yang belum terverifikasi.');
      return;
    }

    onConfirmVerification(inspectorName.trim(), inspectorNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-[#0B1F3A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">
              Tandai Produk Sudah Diverifikasi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Produk yang Diverifikasi:</span>{' '}
            <strong className="text-[#0B1F3A]">{getProductLabel(productType)}</strong>
          </div>

          {unverifiedFindingsCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Peringatan Verifikasi:</strong> Masih terdapat{' '}
                <span className="font-bold underline">{unverifiedFindingsCount} temuan</span> berstatus "Tidak ditemukan dalam sumber" atau "Perlu pemeriksaan". Anda bertanggung jawab penuh atas persetujuan konten ini.
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-[#D32F2F] text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Nama Lengkap Analis / Pejabat Pemeriksa <span className="text-[#D32F2F]">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso, S.Sos., M.Si. (Analis Kebijakan Ahli Muda)"
              value={inspectorName}
              onChange={(e) => {
                setInspectorName(e.target.value);
                setError(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/30"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Catatan Hasil Verifikasi & Telaah (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Masukkan catatan kontekstual atau arahan pimpinan terkait produk ini..."
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/30"
            />
          </div>

          {unverifiedFindingsCount > 0 && (
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <input
                type="checkbox"
                id="confirm-findings"
                checked={confirmedChecklist}
                onChange={(e) => {
                  setConfirmedChecklist(e.target.checked);
                  setError(null);
                }}
                className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#0B1F3A]"
              />
              <label htmlFor="confirm-findings" className="text-slate-800 cursor-pointer font-medium leading-relaxed">
                Saya menyatakan telah memeriksa secara manual seluruh temuan yang tidak tercantum di sumber dokumen dan bertanggung jawab atas kesesuaian materi ini sebelum dipublikasikan.
              </label>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi Terverifikasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
