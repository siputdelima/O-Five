import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Edit3,
  Scale,
  Users,
  Quote,
  Clock,
  Compass,
  HeartHandshake,
  ArrowRight,
  Info,
} from 'lucide-react';
import { AnalysisSummary } from '../types/index.js';

interface AnalysisSummaryViewProps {
  initialSummary: AnalysisSummary;
  onConfirmSummary: (confirmedSummary: AnalysisSummary) => void;
  onOpenSourceModal: () => void;
  isLoading: boolean;
}

export const AnalysisSummaryView: React.FC<AnalysisSummaryViewProps> = ({
  initialSummary,
  onConfirmSummary,
  onOpenSourceModal,
  isLoading,
}) => {
  const [summary, setSummary] = useState<AnalysisSummary>(initialSummary);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    onConfirmSummary(summary);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-[#0B1F3A] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>Langkah 2: Telaah & Konfirmasi Ringkasan Dokumen</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight mt-1">
            Ringkasan Substansi Kebijakan Terstruktur
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Periksa data hasil ekstraksi di bawah. Anda dapat menyunting sebelum mengonfirmasi sebagai basis tunggal generasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSourceModal}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Periksa Teks Sumber
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              isEditing
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Selesai Menyunting' : 'Edit Ringkasan'}</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Konfirmasi Ringkasan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Document Type Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Judul Resmi Dokumen
            </label>
            {isEditing ? (
              <input
                type="text"
                value={summary.judul}
                onChange={(e) => setSummary({ ...summary, judul: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded text-sm font-bold text-slate-900"
              />
            ) : (
              <div className="text-base sm:text-lg font-bold text-[#0B1F3A] leading-snug">
                {summary.judul}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Jenis Dokumen
            </label>
            {isEditing ? (
              <input
                type="text"
                value={summary.jenisDokumen}
                onChange={(e) => setSummary({ ...summary, jenisDokumen: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded text-xs text-slate-900 font-semibold"
              />
            ) : (
              <div className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-xs">
                {summary.jenisDokumen}
              </div>
            )}
          </div>
        </div>

        {/* Latar Belakang & Tujuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Latar Belakang Kebijakan</span>
              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {summary.latarBelakang.reference}
              </span>
            </div>
            {isEditing ? (
              <textarea
                rows={3}
                value={summary.latarBelakang.content}
                onChange={(e) =>
                  setSummary({
                    ...summary,
                    latarBelakang: { ...summary.latarBelakang, content: e.target.value },
                  })
                }
                className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                {summary.latarBelakang.content}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tujuan & Substansi Utama</span>
              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {summary.tujuanSubstansi.reference}
              </span>
            </div>
            {isEditing ? (
              <textarea
                rows={3}
                value={summary.tujuanSubstansi.content}
                onChange={(e) =>
                  setSummary({
                    ...summary,
                    tujuanSubstansi: { ...summary.tujuanSubstansi, content: e.target.value },
                  })
                }
                className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                {summary.tujuanSubstansi.content}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Pesan Utama (3-5 butir) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
          <Compass className="w-4 h-4 text-[#D32F2F]" />
          <span>Pesan Utama Kebijakan (3–5 Butir Strategis)</span>
        </div>
        <div className="space-y-2.5">
          {summary.pesanUtama.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={item.poin}
                    onChange={(e) => {
                      const updated = [...summary.pesanUtama];
                      updated[idx].poin = e.target.value;
                      setSummary({ ...summary, pesanUtama: updated });
                    }}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs text-slate-900 font-medium"
                  />
                ) : (
                  <p className="text-slate-800 font-semibold">{item.poin}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    Ref: {item.reference}
                  </span>
                  {item.excerpt && <span className="italic truncate max-w-lg">"{item.excerpt}"</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fakta, Data, dan Dasar Hukum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fakta dan Data */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Fakta & Data Penting</span>
          </div>
          <div className="space-y-2">
            {summary.faktaDataPenting.map((fakta, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B1F3A]">{fakta.angkaData}</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {fakta.reference}
                  </span>
                </div>
                <p className="text-slate-700">{fakta.fakta}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dasar Hukum */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Dasar Hukum</span>
          </div>
          <div className="space-y-2">
            {summary.dasarHukum.map((hukum, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{hukum.aturan}</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {hukum.reference}
                  </span>
                </div>
                <p className="text-slate-600">{hukum.nomorTahun}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pejabat, Pernyataan Resmi, & Dampak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pernyataan Resmi & Pejabat */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
            <Quote className="w-4 h-4 text-emerald-600" />
            <span>Pernyataan Resmi & Pejabat Terkait</span>
          </div>
          {summary.pernyataanResmi.length === 0 || summary.pernyataanResmi[0].kutipan.includes('[TIDAK TERSEDIA') ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Tidak ada kutipan langsung pejabat pada dokumen sumber asli. Sesuai Aturan AI #2, dilarang mengarang pernyataan pejabat.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.pernyataanResmi.map((stmt, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border-l-3 border-[#0B1F3A]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B1F3A]">
                      {stmt.penutur} — <span className="font-normal text-slate-600">{stmt.jabatan}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {stmt.reference}
                    </span>
                  </div>
                  <p className="italic text-slate-700">"{stmt.kutipan}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dampak & Manfaat bagi Masyarakat */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
            <HeartHandshake className="w-4 h-4 text-[#D32F2F]" />
            <span>Dampak & Manfaat bagi Masyarakat</span>
          </div>
          <div className="space-y-2">
            {summary.dampakManfaat.map((dampak, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{dampak.kelompokSasaran}</span>
                  <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {dampak.reference}
                  </span>
                </div>
                <p className="text-slate-600">{dampak.dampak}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Call to Action Button */}
      <div className="p-4 bg-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-800">Catatan Kebijakan:</span> Mengonfirmasi ringkasan di atas akan mengunci substansi ini sebagai basis tunggal generasi ke-5 produk.
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={handleConfirm}
          className="px-6 py-3 bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all flex-shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Konfirmasi & Lanjut ke Penyaringan KIP</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
