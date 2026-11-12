import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Table2, ShieldAlert } from 'lucide-react';
import { ConsistencyComparisonRow, ProductType } from '../types/index.js';

interface ConsistencyMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: ConsistencyComparisonRow[];
}

const PRODUCT_COLS: { key: ProductType; label: string }[] = [
  { key: 'siaran_pers', label: 'Siaran Pers' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'threads', label: 'Threads' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'berita', label: 'Berita' },
];

export const ConsistencyMatrixModal: React.FC<ConsistencyMatrixModalProps> = ({
  isOpen,
  onClose,
  rows,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#0B1F3A] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Matriks Perbandingan Konsistensi Antar-Produk
              </h3>
              <p className="text-xs text-slate-300">
                Audit keselarasan pesan utama, angka, tanggal, dan nama pejabat di kelima produk komunikasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
          <span className="font-bold text-slate-700">Keterangan Status:</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Tercakup Konsisten
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-500">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            Tidak Tercakup (Sesuai Batas Format)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[#D32F2F]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D32F2F]" />
            Berpotensi Berbeda / Perlu Diselaraskan
          </span>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Belum ada data perbandingan konsistensi. Jalankan audit verifikasi untuk memunculkan tabel perbandingan.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B1F3A] text-white">
                    <th className="p-3 font-bold border-r border-slate-700 w-1/4">
                      Isu / Data Kebijakan
                    </th>
                    {PRODUCT_COLS.map((col) => (
                      <th
                        key={col.key}
                        className="p-3 font-bold text-center border-r border-slate-700 last:border-r-0"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 border-r border-slate-200 align-top bg-slate-50/50">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                          {row.category}
                        </span>
                        <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                          {row.keyTopic}
                        </span>
                      </td>

                      {PRODUCT_COLS.map((col) => {
                        const cell = row.products[col.key];
                        if (!cell) {
                          return (
                            <td
                              key={col.key}
                              className="p-3 text-center text-slate-400 border-r border-slate-200 last:border-r-0 align-top"
                            >
                              -
                            </td>
                          );
                        }

                        const isTercakup = cell.status === 'TERCAKUP';
                        const isBerbeda = cell.status === 'BERBEDA';

                        return (
                          <td
                            key={col.key}
                            className={`p-3 border-r border-slate-200 last:border-r-0 align-top ${
                              isBerbeda ? 'bg-red-50/60' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {isTercakup ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Tercakup
                                  </span>
                                ) : isBerbeda ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D32F2F] bg-red-100 px-1.5 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" />
                                    Berbeda
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    <XCircle className="w-3 h-3" />
                                    Tidak tercakup
                                  </span>
                                )}
                              </div>

                              {cell.excerpt && (
                                <p className="text-[11px] text-slate-700 line-clamp-3 leading-snug">
                                  {cell.excerpt}
                                </p>
                              )}

                              {cell.flagDifference && (
                                <div className="text-[10px] text-[#D32F2F] font-bold flex items-start gap-1 mt-1 bg-red-100/70 p-1.5 rounded">
                                  <ShieldAlert className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <span>{cell.flagDifference}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Memastikan satu sumber kebijakan tidak mengalami penyimpangan makna di tiap platform.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white rounded font-medium text-xs cursor-pointer"
          >
            Tutup Matriks
          </button>
        </div>
      </div>
    </div>
  );
};
