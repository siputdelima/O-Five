import React, { useState } from 'react';
import {
  FileText,
  Search,
  Trash2,
  ExternalLink,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { FullGenerationResult, PolicyDocument } from '../types/index.js';

interface HistoryViewProps {
  documents: PolicyDocument[];
  generations: FullGenerationResult[];
  onOpenDocument: (doc: PolicyDocument) => void;
  onDeleteDocument: (id: string) => Promise<void>;
  onStartNew: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  documents,
  generations,
  onOpenDocument,
  onDeleteDocument,
  onStartNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus dokumen "${name}" beserta seluruh produk komunikasinya dari penyimpanan lokal browser?`)) {
      setDeletingId(id);
      await onDeleteDocument(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
            Riwayat Dokumen Kebijakan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar naskah dinas dan 5 produk komunikasi yang tersimpan di IndexedDB browser lokal Anda.
          </p>
        </div>

        <button
          onClick={onStartNew}
          className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
        >
          + Buat Konten Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama file dokumen kebijakan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 shadow-2xs"
        />
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Riwayat</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dokumen yang Anda proses di O-FIVE akan tersimpan otomatis di sini.
          </p>
          <button
            onClick={onStartNew}
            className="mt-2 px-4 py-2 bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Mulai Sekarang
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Tidak ditemukan dokumen yang cocok dengan kata kunci "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const gen = generations.find((g) => g.documentId === doc.id);
            const isVerified =
              gen && Object.values(gen.products).every((p) => p.verificationStatus === 'TERVERIFIKASI');

            return (
              <div
                key={doc.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-slate-100 text-[#0B1F3A] flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-md">
                        {doc.fileName}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {doc.fileType}
                      </span>
                      {isVerified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Terverifikasi Resmi
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Draf / Perlu Review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(doc.uploadedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>{doc.wordCount.toLocaleString('id-ID')} kata</span>
                      {doc.isOcr && <span>• Teks OCR</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <button
                    onClick={() => onOpenDocument(doc)}
                    className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Buka Produk</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    className="p-1.5 text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
