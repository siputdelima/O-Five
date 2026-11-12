import React from 'react';
import {
  FileText,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  FolderOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { PolicyDocument, FullGenerationResult } from '../types/index.js';

interface DashboardViewProps {
  documents: PolicyDocument[];
  generations: FullGenerationResult[];
  onStartNewContent: () => void;
  onOpenDocument: (doc: PolicyDocument) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  generations,
  onStartNewContent,
  onOpenDocument,
}) => {
  // Real calculations from IndexedDB
  const totalDocs = documents.length;
  const totalProducts = generations.length * 5;

  // Pending verification count: documents that have at least one product NOT yet marked as TERVERIFIKASI
  const pendingVerificationDocs = generations.filter((gen) => {
    return Object.values(gen.products).some((p) => p.verificationStatus !== 'TERVERIFIKASI');
  }).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1F3A] via-[#16365C] to-[#0B1F3A] text-white p-6 sm:p-8 shadow-lg border border-slate-700/50">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide uppercase text-slate-200 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#D32F2F]"></span>
            Asisten Deputi Koordinasi Media Komunikasi & Informasi
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Selamat Datang di O-FIVE
          </h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Ubah satu dokumen kebijakan menjadi lima produk komunikasi publik secara cepat, konsisten, dan akurat.
          </p>
          <div className="pt-2">
            <button
              onClick={onStartNewContent}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#D32F2F] hover:bg-[#b71c1c] text-white font-semibold text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
            >
              <span>Mulai Buat Konten</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative background geometry */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Layers className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Dokumen Diproses */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Dokumen Diproses
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-[#0B1F3A]">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mb-1">
            {totalDocs}
          </div>
          <p className="text-xs text-slate-600">
            {totalDocs === 0
              ? 'Belum ada dokumen yang diproses'
              : `${totalDocs} dokumen naskah dinas tersimpan`}
          </p>
        </div>

        {/* Card 2: Produk Komunikasi Dihasilkan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Produk Dihasilkan
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mb-1">
            {totalProducts}
          </div>
          <p className="text-xs text-slate-600">
            {totalProducts === 0
              ? 'Belum ada produk dihasilkan'
              : `Dari 5 format: Siaran Pers, IG, Threads, TikTok, Berita`}
          </p>
        </div>

        {/* Card 3: Dokumen Menunggu Verifikasi */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Menunggu Verifikasi
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-[#D32F2F]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mb-1">
            {pendingVerificationDocs}
          </div>
          <p className="text-xs text-slate-600">
            {pendingVerificationDocs === 0
              ? 'Semua dokumen telah terverifikasi'
              : `${pendingVerificationDocs} dokumen perlu audit sebelum publikasi`}
          </p>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F3A]">Aktivitas Dokumen Terbaru</h3>
            <p className="text-xs text-slate-500">Daftar naskah kebijakan yang telah dianalisis di O-FIVE</p>
          </div>
          {documents.length > 0 && (
            <button
              onClick={onStartNewContent}
              className="text-xs font-semibold text-[#0B1F3A] hover:text-[#D32F2F] flex items-center gap-1 cursor-pointer"
            >
              <span>+ Tambah Dokumen</span>
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto">
              <h4 className="text-sm font-semibold text-slate-700">Belum Ada Dokumen Kebijakan</h4>
              <p className="text-xs text-slate-500 mt-1">
                Mulai dengan mengunggah dokumen PDF, DOCX, PPTX, atau memasukkan teks regulasi secara langsung.
              </p>
            </div>
            <button
              onClick={onStartNewContent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-medium shadow-xs cursor-pointer"
            >
              <span>Unggah Dokumen Pertama</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.slice(0, 5).map((doc) => {
              const gen = generations.find((g) => g.documentId === doc.id);
              const isVerified =
                gen && Object.values(gen.products).every((p) => p.verificationStatus === 'TERVERIFIKASI');

              return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-[#0B1F3A] flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-md">
                          {doc.fileName}
                        </h4>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {doc.fileType}
                        </span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <ShieldAlert className="w-3 h-3" />
                            Draf / Perlu Review
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(doc.uploadedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{doc.wordCount.toLocaleString('id-ID')} kata</span>
                        {doc.pageCount && (
                          <>
                            <span>•</span>
                            <span>{doc.pageCount} halaman</span>
                          </>
                        )}
                        {doc.slideCount && (
                          <>
                            <span>•</span>
                            <span>{doc.slideCount} slide</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <button
                      onClick={() => onOpenDocument(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0B1F3A] cursor-pointer"
                    >
                      <span>Buka Hasil</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5 Communications Products Feature Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#0B1F3A]">5 Output Komunikasi Strategis</h3>
        <p className="text-xs text-slate-500">
          Satu dokumen kebijakan diolah menjadi lima format spesifik dengan substansi tunggal yang konsisten:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block">01. Formal</span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5">Siaran Pers</h4>
            <p className="text-[11px] text-slate-500 mt-1">Piramida terbalik, kutipan pejabat resmi, kontak media.</p>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block">02. Visual</span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5">Caption Instagram</h4>
            <p className="text-[11px] text-slate-500 mt-1">Hook memikat, poin manfaat publik, maksimal 2.200 karakter.</p>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block">03. Rangkaian</span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5">Konten Threads</h4>
            <p className="text-[11px] text-slate-500 mt-1">Untaian postingan beruntun, maksimal 500 karakter per unggahan.</p>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block">04. Populer</span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5">Caption TikTok</h4>
            <p className="text-[11px] text-slate-500 mt-1">Hook pembuka kuat, narasi singkat profesional, hashtag tren.</p>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block">05. Jurnalistik</span>
            <h4 className="text-xs font-bold text-slate-800 mt-0.5">Artikel Berita</h4>
            <p className="text-[11px] text-slate-500 mt-1">Lead 5W+1H, kronologis, berimbang untuk portal berita.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
