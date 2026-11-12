import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  RotateCcw,
  Minimize2,
  Maximize2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  History,
  Table2,
  Info,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Save,
  Undo2,
} from 'lucide-react';
import {
  AnalysisSummary,
  CommunicationProduct,
  ConsistencyComparisonRow,
  FindingStatus,
  KipItem,
  PolicyDocument,
  ProductType,
  VerificationFinding,
} from '../types/index.js';
import {
  exportSingleProductToDocx,
  exportAllProductsToDocx,
  checkForPlaceholders,
  getProductLabel,
} from '../lib/docxExport.js';
import { downloadFile, exportSingleProductToTxt } from '../lib/txtExport.js';
import { ConsistencyMatrixModal } from './ConsistencyMatrixModal.js';
import { MarkVerifiedModal } from './MarkVerifiedModal.js';

interface ProductsResultViewProps {
  document: PolicyDocument;
  summary: AnalysisSummary;
  kipItems: KipItem[];
  products: Record<ProductType, CommunicationProduct>;
  findings: VerificationFinding[];
  consistencyRows: ConsistencyComparisonRow[];
  onOpenSourceModal: () => void;
  onUpdateProduct: (productType: ProductType, updatedProduct: CommunicationProduct) => void;
  onRegenerateProductAction: (
    productType: ProductType,
    action: 'regenerate' | 'shorten' | 'expand' | 'style',
    style?: 'formal' | 'santai' | 'ringkas'
  ) => Promise<void>;
  onRerunVerification: () => Promise<void>;
  isLoadingAction: boolean;
}

export const ProductsResultView: React.FC<ProductsResultViewProps> = ({
  document,
  summary,
  kipItems,
  products,
  findings,
  consistencyRows,
  onOpenSourceModal,
  onUpdateProduct,
  onRegenerateProductAction,
  onRerunVerification,
  isLoadingAction,
}) => {
  const [activeProductTab, setActiveProductTab] = useState<ProductType>('siaran_pers');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isMarkVerifiedOpen, setIsMarkVerifiedOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [activeHighlightClaim, setActiveHighlightClaim] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<'summary' | 'editor' | 'verification'>('editor');

  const currentProduct = products[activeProductTab];

  // Character limit indicators
  const getCharLimitInfo = (type: ProductType, count: number) => {
    switch (type) {
      case 'instagram':
        return {
          limit: 2200,
          text: `${count}/2.200 karakter`,
          isOver: count > 2200,
        };
      case 'threads':
        return {
          limit: 500,
          text: `Total: ${count} karakter (maks 500/post)`,
          isOver: false,
        };
      default:
        return {
          limit: null,
          text: `${count} karakter`,
          isOver: false,
        };
    }
  };

  const charInfo = getCharLimitInfo(activeProductTab, currentProduct.content.length);
  const currentFindings = findings.filter((f) => f.productType === activeProductTab);

  // Group findings by status
  const verifiedFindings = currentFindings.filter((f) => f.status === 'TERVERIFIKASI');
  const manualFindings = currentFindings.filter((f) => f.status === 'PERLU_PEMERIKSAAN');
  const notFoundFindings = currentFindings.filter((f) => f.status === 'TIDAK_DITEMUKAN');
  const inconsistentFindings = currentFindings.filter((f) => f.status === 'INKONSISTEN');

  // Placeholders check
  const placeholdersInCurrent = checkForPlaceholders(currentProduct.content);

  const handleStartEdit = () => {
    setEditedText(currentProduct.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const updatedHistory = [
      ...currentProduct.versionHistory,
      {
        version: currentProduct.versionHistory.length + 1,
        content: editedText,
        modifiedAt: new Date().toISOString(),
        author: 'User' as const,
        note: 'Penyuntingan manual oleh analis',
      },
    ];

    onUpdateProduct(activeProductTab, {
      ...currentProduct,
      content: editedText,
      characterCount: editedText.length,
      versionHistory: updatedHistory,
      verificationStatus: 'PERLU_PEMERIKSAAN', // Editing invalidates verification
    });

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleUndo = () => {
    if (currentProduct.versionHistory.length <= 1) return;
    const prev = currentProduct.versionHistory[currentProduct.versionHistory.length - 2];
    onUpdateProduct(activeProductTab, {
      ...currentProduct,
      content: prev.content,
      characterCount: prev.content.length,
      versionHistory: currentProduct.versionHistory.slice(0, -1),
      verificationStatus: 'PERLU_PEMERIKSAAN',
    });
  };

  const handleCopy = () => {
    if (placeholdersInCurrent.length > 0) {
      const proceed = window.confirm(
        `Perhatian: Konten masih memuat penanda kekosongan informasi ${placeholdersInCurrent.join(
          ', '
        )}. Apakah Anda tetap ingin menyalin?`
      );
      if (!proceed) return;
    }
    navigator.clipboard.writeText(currentProduct.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDocx = async () => {
    if (placeholdersInCurrent.length > 0) {
      const proceed = window.confirm(
        `Peringatan: Dokumen masih memuat penanda ${placeholdersInCurrent.join(
          ', '
        )}. Apakah Anda tetap ingin mengunduh DOCX?`
      );
      if (!proceed) return;
    }
    const blob = await exportSingleProductToDocx(currentProduct, summary.judul || document.fileName);
    downloadFile(blob, `O-FIVE_${activeProductTab}_${document.fileName.replace(/\.[^/.]+$/, '')}.docx`);
  };

  const handleDownloadTxt = () => {
    if (placeholdersInCurrent.length > 0) {
      const proceed = window.confirm(
        `Peringatan: Dokumen masih memuat penanda ${placeholdersInCurrent.join(
          ', '
        )}. Tetap unduh file TXT?`
      );
      if (!proceed) return;
    }
    exportSingleProductToTxt(currentProduct, summary.judul || document.fileName);
  };

  const handleDownloadAllDocx = async () => {
    const blob = await exportAllProductsToDocx(products, summary.judul || document.fileName);
    downloadFile(blob, `O-FIVE_5-Produk_Lengkap_${document.fileName.replace(/\.[^/.]+$/, '')}.docx`);
  };

  const handleConfirmVerified = (verifiedBy: string, notes: string) => {
    onUpdateProduct(activeProductTab, {
      ...currentProduct,
      verificationStatus: 'TERVERIFIKASI',
      auditRecord: {
        verifiedBy,
        verifiedAt: new Date().toISOString(),
        notes,
        reviewedUnverifiedFindings: true,
      },
    });
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-4">
      {/* Success Notification Banner as requested in Section 4.K */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-xs sm:text-sm font-bold">
              Dokumen berhasil dianalisis. Lima produk komunikasi telah disiapkan untuk ditinjau.
            </div>
            <div className="text-[11px] text-emerald-800">
              Setiap produk bersumber pada substansi tunggal dokumen kebijakan: {document.fileName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMatrixOpen(true)}
            className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Table2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Bandingkan Produk</span>
          </button>
          <button
            onClick={handleDownloadAllDocx}
            className="px-3.5 py-1.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Semua (5 DOCX)</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center border border-slate-200 rounded-lg p-1 bg-white">
        <button
          onClick={() => setMobileSection('summary')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
            mobileSection === 'summary' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setMobileSection('editor')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
            mobileSection === 'editor' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600'
          }`}
        >
          5 Produk Editor
        </button>
        <button
          onClick={() => setMobileSection('verification')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
            mobileSection === 'verification' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600'
          }`}
        >
          Audit Verifikasi ({currentFindings.length})
        </button>
      </div>

      {/* 3-Panel Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL KIRI (3 Cols): Ringkasan Dokumen & Pesan Utama */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileSection === 'summary' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#D32F2F]" />
                Ringkasan Kebijakan
              </span>
              <button
                onClick={onOpenSourceModal}
                className="text-[11px] font-semibold text-[#0B1F3A] hover:underline cursor-pointer"
              >
                Teks Sumber
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                Judul Dokumen
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                {summary.judul}
              </p>
              <span className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold mt-1">
                {summary.jenisDokumen}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                Pesan Utama (Single Truth)
              </span>
              <ul className="mt-1 space-y-1.5 text-xs text-slate-700">
                {summary.pesanUtama.slice(0, 4).map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#D32F2F] font-bold mt-0.5">•</span>
                    <span className="leading-snug">{p.poin}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                Pejabat & Kutipan Resmi
              </span>
              {summary.pernyataanResmi.length > 0 && !summary.pernyataanResmi[0].kutipan.includes('[TIDAK TERSEDIA') ? (
                <div className="mt-1 p-2 bg-slate-50 rounded border-l-2 border-[#0B1F3A] text-[11px]">
                  <div className="font-bold text-slate-900">{summary.pernyataanResmi[0].penutur}</div>
                  <div className="italic text-slate-600 mt-0.5">"{summary.pernyataanResmi[0].kutipan}"</div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  Tidak ada kutipan langsung pejabat di sumber asli.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                Dasar Hukum
              </span>
              <div className="space-y-1 mt-1 text-[11px] text-slate-600">
                {summary.dasarHukum.slice(0, 3).map((h, i) => (
                  <div key={i} className="truncate">
                    • {h.aturan}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL TENGAH (6 Cols): Lima Tab Produk & Editor */}
        <div
          className={`lg:col-span-6 space-y-4 ${
            mobileSection === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* 5 Product Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
              {(
                [
                  { id: 'siaran_pers' as ProductType, label: 'Siaran Pers' },
                  { id: 'instagram' as ProductType, label: 'Instagram' },
                  { id: 'threads' as ProductType, label: 'Threads' },
                  { id: 'tiktok' as ProductType, label: 'TikTok' },
                  { id: 'berita' as ProductType, label: 'Berita' },
                ] as const
              ).map((tab) => {
                const isSelected = activeProductTab === tab.id;
                const prod = products[tab.id];
                const isV = prod?.verificationStatus === 'TERVERIFIKASI';
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (isEditing) {
                        if (!window.confirm('Batalkan perubahan teks yang belum disimpan?')) return;
                        setIsEditing(false);
                      }
                      setActiveProductTab(tab.id);
                    }}
                    className={`px-3.5 py-3 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0B1F3A] text-[#0B1F3A] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isV ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      title={isV ? 'Terverifikasi' : 'Perlu pemeriksaan'}
                    />
                  </button>
                );
              })}
            </div>

            {/* Editor Top Bar & Action Tools */}
            <div className="p-3.5 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{getProductLabel(activeProductTab)}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    currentProduct.verificationStatus === 'TERVERIFIKASI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentProduct.verificationStatus === 'TERVERIFIKASI'
                    ? 'Terverifikasi Sumber'
                    : 'Perlu Verifikasi Ulang'}
                </span>
                <span
                  className={`text-[11px] font-mono ${
                    charInfo.isOver ? 'text-[#D32F2F] font-bold' : 'text-slate-500'
                  }`}
                >
                  {charInfo.text}
                </span>
              </div>

              {/* Version History & Undo Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={currentProduct.versionHistory.length <= 1}
                  className="p-1.5 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  title="Undo ke versi sebelumnya"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsVersionHistoryOpen(!isVersionHistoryOpen)}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>v{currentProduct.versionHistory.length}</span>
                </button>
              </div>
            </div>

            {/* Action Bar (Edit, Regenerate, Shorten, Expand, Restyle, Copy, Export, Verify) */}
            <div className="p-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-[#0B1F3A]" />
                  <span>Edit Konten</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Simpan Perubahan</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}

              {/* AI Refinement Actions */}
              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <button
                disabled={isLoadingAction || isEditing}
                onClick={() => onRegenerateProductAction(activeProductTab, 'regenerate')}
                className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Regenerasi ulang produk ini dari ringkasan"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerasi</span>
              </button>

              <button
                disabled={isLoadingAction || isEditing}
                onClick={() => onRegenerateProductAction(activeProductTab, 'shorten')}
                className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Perpendek kalimat tanpa mengubah fakta"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Perpendek</span>
              </button>

              <button
                disabled={isLoadingAction || isEditing}
                onClick={() => onRegenerateProductAction(activeProductTab, 'expand')}
                className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Perpanjang konteks & dampak dari sumber"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Perpanjang</span>
              </button>

              {/* Gaya Bahasa Dropdown */}
              <select
                disabled={isLoadingAction || isEditing}
                onChange={(e) => {
                  if (e.target.value) {
                    onRegenerateProductAction(
                      activeProductTab,
                      'style',
                      e.target.value as 'formal' | 'santai' | 'ringkas'
                    );
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2 py-1 bg-white border border-slate-300 text-slate-700 font-medium rounded cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled>
                  Ubah Gaya...
                </option>
                <option value="formal">Lebih Formal (Baku)</option>
                <option value="santai">Lebih Santai (Populer)</option>
                <option value="ringkas">Lebih Ringkas (Poin)</option>
              </select>

              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              {/* Copy & Exports */}
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 rounded font-medium flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="px-2 py-1 text-slate-700 hover:bg-slate-200 rounded font-medium flex items-center gap-1 cursor-pointer"
                title="Unduh DOCX"
              >
                <Download className="w-3 h-3" />
                <span>DOCX</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-2 py-1 text-slate-700 hover:bg-slate-200 rounded font-medium flex items-center gap-1 cursor-pointer"
                title="Unduh TXT"
              >
                <span>TXT</span>
              </button>

              <button
                onClick={() => setIsMarkVerifiedOpen(true)}
                className="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Tandai Sudah Diverifikasi</span>
              </button>
            </div>

            {/* Version History Drawer (if opened) */}
            {isVersionHistoryOpen && (
              <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Riwayat Versi ({currentProduct.versionHistory.length} versi)</span>
                  <button
                    onClick={() => setIsVersionHistoryOpen(false)}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Tutup
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {currentProduct.versionHistory.map((v, i) => (
                    <div
                      key={i}
                      className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-slate-900">Versi {v.version}</span>
                        <span className="text-slate-500 ml-2">
                          {new Date(v.modifiedAt).toLocaleTimeString('id-ID')} ({v.author})
                        </span>
                        {v.note && <p className="text-slate-600 italic mt-0.5">{v.note}</p>}
                      </div>
                      <button
                        onClick={() => {
                          onUpdateProduct(activeProductTab, {
                            ...currentProduct,
                            content: v.content,
                            characterCount: v.content.length,
                          });
                        }}
                        className="px-2 py-0.5 text-xs text-[#0B1F3A] hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                      >
                        Pulihkan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholders Banner Alert */}
            {placeholdersInCurrent.length > 0 && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Perhatian: Konten memuat penanda kekosongan informasi:{' '}
                    <strong>{placeholdersInCurrent.join(', ')}</strong>. Lengkapi sebelum distribusi publik.
                  </span>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="p-5">
              {isEditing ? (
                <textarea
                  rows={16}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/30 bg-slate-50"
                />
              ) : (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] leading-snug">
                    {currentProduct.title}
                  </h3>

                  {/* Render content with highlighting for placeholders & selected claim */}
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 font-normal whitespace-pre-wrap select-text">
                    {currentProduct.content.split('\n\n').map((paragraph, pIdx) => {
                      // Highlight placeholders
                      let contentNode: React.ReactNode = paragraph;
                      const hasPlaceholder = /\[(PERLU DILENGKAPI|TIDAK TERSEDIA DALAM SUMBER|PERLU VERIFIKASI)\]/.test(
                        paragraph
                      );

                      if (hasPlaceholder) {
                        contentNode = (
                          <span className="p-1 rounded bg-amber-100/70 text-slate-900 border border-amber-300 block my-1 font-medium">
                            {paragraph}
                          </span>
                        );
                      }

                      // Active claim highlight
                      if (
                        activeHighlightClaim &&
                        paragraph.toLowerCase().includes(activeHighlightClaim.toLowerCase())
                      ) {
                        contentNode = (
                          <div className="p-2 rounded bg-yellow-100 border-2 border-yellow-400 my-1">
                            {paragraph}
                          </div>
                        );
                      }

                      return <p key={pIdx}>{contentNode}</p>;
                    })}
                  </div>

                  {/* Threads preview if thread posts exist */}
                  {currentProduct.threadsPosts && currentProduct.threadsPosts.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Rangkaian Thread Postingan (1 per Box, Maks. 500 Karakter)
                      </span>
                      {currentProduct.threadsPosts.map((post, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span>Post {idx + 1}</span>
                            <span className={post.length > 500 ? 'text-red-600 font-bold' : ''}>
                              {post.length}/500 karakter
                            </span>
                          </div>
                          <p className="text-slate-800">{post}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audit record box if verified */}
                  {currentProduct.auditRecord && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">
                          Diverifikasi oleh: {currentProduct.auditRecord.verifiedBy}
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          Waktu: {new Date(currentProduct.auditRecord.verifiedAt).toLocaleString('id-ID')}
                          {currentProduct.auditRecord.notes && (
                            <span> • Catatan: "{currentProduct.auditRecord.notes}"</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL KANAN (3 Cols): Status Verifikasi & Temuan Audit */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileSection === 'verification' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D32F2F]" />
                Audit Verifikasi Sumber
              </span>
              <button
                onClick={onRerunVerification}
                disabled={isLoadingAction}
                className="text-[11px] font-semibold text-[#0B1F3A] hover:text-[#D32F2F] flex items-center gap-1 cursor-pointer"
                title="Audit ulang produk terhadap teks sumber asli"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAction ? 'animate-spin' : ''}`} />
                <span>Audit Ulang</span>
              </button>
            </div>

            {/* Counts breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="block font-bold text-sm text-emerald-700">
                  {verifiedFindings.length}
                </span>
                <span className="leading-tight">Terverifikasi Sumber</span>
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                <span className="block font-bold text-sm text-amber-700">
                  {manualFindings.length}
                </span>
                <span className="leading-tight">Perlu Pemeriksaan</span>
              </div>
              <div className="p-2 rounded bg-red-50 border border-red-200 text-red-900">
                <span className="block font-bold text-sm text-red-700">
                  {notFoundFindings.length}
                </span>
                <span className="leading-tight">Tidak Ditemukan</span>
              </div>
              <div className="p-2 rounded bg-purple-50 border border-purple-200 text-purple-900">
                <span className="block font-bold text-sm text-purple-700">
                  {inconsistentFindings.length}
                </span>
                <span className="leading-tight">Inkonsisten</span>
              </div>
            </div>

            {/* Findings list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                  Daftar Temuan Produk ({currentFindings.length})
                </span>
                <span className="text-[10px] text-slate-500">Klik untuk menyorot</span>
              </div>

              {currentFindings.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded text-center text-xs text-slate-500">
                  Tidak ada temuan audit pada produk ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {currentFindings.map((finding) => {
                    const isV = finding.status === 'TERVERIFIKASI';
                    const isNotFound = finding.status === 'TIDAK_DITEMUKAN';
                    const isManual = finding.status === 'PERLU_PEMERIKSAAN';
                    const isInconsistent = finding.status === 'INKONSISTEN';

                    return (
                      <div
                        key={finding.id}
                        onClick={() =>
                          setActiveHighlightClaim(
                            activeHighlightClaim === finding.claimText ? null : finding.claimText
                          )
                        }
                        className={`p-2.5 rounded-lg border text-xs space-y-1 cursor-pointer transition-all ${
                          activeHighlightClaim === finding.claimText
                            ? 'ring-2 ring-[#0B1F3A]'
                            : ''
                        } ${
                          isNotFound
                            ? 'bg-red-50/70 border-red-200'
                            : isInconsistent
                            ? 'bg-purple-50/70 border-purple-200'
                            : isManual
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-emerald-50/40 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              isNotFound
                                ? 'bg-[#D32F2F] text-white'
                                : isInconsistent
                                ? 'bg-purple-700 text-white'
                                : isManual
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isV && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {isManual && <AlertTriangle className="w-2.5 h-2.5" />}
                            {isNotFound && <XCircle className="w-2.5 h-2.5" />}
                            {isInconsistent && <ShieldAlert className="w-2.5 h-2.5" />}
                            <span>
                              {isV
                                ? 'Terverifikasi'
                                : isManual
                                ? 'Perlu Periksa'
                                : isNotFound
                                ? 'Tidak Ditemukan'
                                : 'Inkonsisten'}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {finding.reference}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900 leading-snug">
                          {finding.claimText}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-tight">
                          {finding.reason}
                        </p>

                        {finding.sourceExcerpt && finding.sourceExcerpt !== '-' && (
                          <div className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-200/60 truncate">
                            Sumber: "{finding.sourceExcerpt}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sensitive Notes Section */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider block mb-1">
                Catatan KIP & Butir Dikecualikan
              </span>
              <div className="text-[11px] text-slate-600 space-y-1">
                {kipItems
                  .filter((i) => i.userDecision === 'JANGAN_GUNAKAN')
                  .map((item, idx) => (
                    <div key={idx} className="p-1.5 bg-slate-100 rounded text-slate-700 line-through">
                      • {item.content} (Dikecualikan)
                    </div>
                  ))}
                {kipItems.filter((i) => i.userDecision === 'JANGAN_GUNAKAN').length === 0 && (
                  <span className="text-slate-400 italic">Tidak ada butir yang dikecualikan.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consistency Matrix Modal */}
      <ConsistencyMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        rows={consistencyRows}
      />

      {/* Mark Verified Sign-Off Modal */}
      <MarkVerifiedModal
        isOpen={isMarkVerifiedOpen}
        onClose={() => setIsMarkVerifiedOpen(false)}
        productType={activeProductTab}
        unverifiedFindingsCount={notFoundFindings.length + manualFindings.length}
        onConfirmVerification={handleConfirmVerified}
      />
    </div>
  );
};
