import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  Trash2,
  Sparkles,
  FileSpreadsheet,
  FileCheck,
  CheckCircle2,
  Info,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { PolicyDocument } from '../types/index.js';

interface NewContentFlowProps {
  onStartProcess: (
    file: File | null,
    directText: string,
    supportingText: string,
    useOcr: boolean
  ) => Promise<void>;
  isLoading: boolean;
}

export const SAMPLE_POLICY_TEXT = `[Bagian Pembuka]
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN
REPUBLIK INDONESIA
Jalan Medan Merdeka Barat No. 15, Jakarta Pusat 10110

SURAT EDARAN NOMOR: SE-08/POLKAM/XI/2024
TENTANG
PENGUATAN KOORDINASI TANGGAP KRISIS INFORMASI DAN KETAHANAN RUANG SIBER NASIONAL

[Halaman 1]
1. Latar Belakang:
Perkembangan lanskap geopolitik dan percepatan transformasi digital menuntut konsolidasi komunikasi publik yang kokoh di seluruh kementerian/lembaga. Kemenko Polkam mencatat peningkatan serangan disinformasi siber sebesar 34,8% selama triwulan III tahun 2024, yang berpotensi memecah belah kohesi sosial masyarakat.

2. Dasar Hukum:
a. Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik.
b. Undang-Undang Nomor 1 Tahun 2024 tentang Perubahan Kedua atas UU Nomor 11 Tahun 2008 tentang ITE.
c. Peraturan Presiden Nomor 73 Tahun 2020 tentang Kementerian Koordinator Bidang Politik, Hukum, dan Keamanan.
d. Instruksi Presiden Nomor 9 Tahun 2015 tentang Pengelolaan Komunikasi Publik.

[Halaman 2]
3. Fakta dan Data Strategis:
a. Alokasi anggaran penguatan infrastruktur tangkal hoaks dan krisis komunikasi sebesar Rp 150 miliar pada tahun anggaran 2025.
b. Sebanyak 8.420 personel analis media dan pranata humas di 38 provinsi telah dipersiapkan dalam jaringan respon cepat 24/7.
c. Target penurunan paparan hoaks strategis nasional ditargetkan mencapai 65% dalam 100 hari kerja pertama.

4. Pernyataan Resmi Pejabat:
Menteri Koordinator Bidang Politik dan Keamanan (Menko Polkam) menyatakan secara tegas:
"Ketahanan informasi dan kedaulatan ruang digital adalah fondasi mutlak stabilitas nasional. Kita tidak boleh membiarkan ruang publik diracuni manipulasi informasi yang mengancam keutuhan NKRI."

[Halaman 3]
5. Waktu dan Lokasi Implementasi:
Surat Edaran ini berlaku efektif mulai tanggal 15 Januari 2025 di seluruh wilayah Negara Kesatuan Republik Indonesia, dengan koordinasi terpusat di Jakarta.

6. Pesan Utama Kebijakan:
a. Membangun kanal komunikasi terverifikasi satu pintu di bawah koordinasi Asisten Deputi Kominfo Kemenko Polkam.
b. Mewajibkan seluruh instansi anggota desk koordinasi menanggapi isu hoaks keamanan dalam waktu maksimal 60 menit.
c. Memperkuat literasi keamanan digital bagi 12 juta masyarakat rentan melalui kolaborasi multi-stakeholder.

7. Dampak dan Manfaat bagi Masyarakat:
Masyarakat memperoleh kepastian informasi yang akurat, terhindar dari penipuan daring bermotif politik, serta terciptanya suasana damai dan kondusif dalam kehidupan berbangsa.`;

export const NewContentFlow: React.FC<NewContentFlowProps> = ({
  onStartProcess,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [directText, setDirectText] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [useOcr, setUseOcr] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'pptx', 'txt'].includes(ext || '')) {
        setErrorMsg('Format file tidak didukung. Harap unggah berkas PDF, DOCX, PPTX, atau TXT.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('Ukuran berkas melebihi batas maksimal 20 MB.');
        return;
      }
      setSelectedFile(file);
      setDirectText(''); // Clear direct text when file is selected
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'pptx', 'txt'].includes(ext || '')) {
        setErrorMsg('Format file tidak didukung. Harap unggah berkas PDF, DOCX, PPTX, atau TXT.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('Ukuran berkas melebihi batas maksimal 20 MB.');
        return;
      }
      setSelectedFile(file);
      setDirectText('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = () => {
    setSelectedFile(null);
    setDirectText(SAMPLE_POLICY_TEXT);
    setSupportingText('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFile && directText.trim().length === 0) {
      setErrorMsg('Harap unggah berkas dokumen atau masukkan teks kebijakan secara langsung.');
      return;
    }

    if (!selectedFile && directText.trim().length < 200) {
      setErrorMsg(`Teks langsung terlalu pendek (${directText.trim().length} karakter). Diperlukan minimal 200 karakter untuk dianalisis.`);
      return;
    }

    try {
      await onStartProcess(selectedFile, directText, supportingText, useOcr);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses dokumen.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Title & Guidelines */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-[#0B1F3A] text-xs font-semibold">
          <FileText className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span>Langkah 1: Input Dokumen Kebijakan</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
          Unggah dokumen kebijakan Anda di sini
        </h2>
        <p className="text-sm text-slate-600">
          PDF, DOCX, PPTX, atau masukkan teks secara langsung. Dokumen ini menjadi satu-satunya sumber utama generasi 5 produk.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#D32F2F] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Gagal Diproses:</span>
            <p className="text-xs leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Drag & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
            selectedFile
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-[#0B1F3A] bg-white hover:bg-slate-50/50 cursor-pointer'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.pptx,.txt"
            className="hidden"
          />

          {!selectedFile ? (
            <div className="space-y-3 max-w-md mx-auto">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-[#0B1F3A] shadow-2xs">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900">
                  Tarik & letakkan berkas ke sini, atau{' '}
                  <span className="text-[#D32F2F] underline underline-offset-2">pilih dari perangkat</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Format yang didukung: <strong>PDF, DOCX, PPTX, TXT</strong> (Maksimal 20 MB)
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Ekstraksi aman & stateless di memori server</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center gap-3.5 text-left min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                  {selectedFile.name.split('.').pop()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate max-w-md">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Siap diekstrak
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Hapus berkas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* OCR Option Checkbox */}
        <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <input
            type="checkbox"
            id="ocr-toggle"
            checked={useOcr}
            onChange={(e) => setUseOcr(e.target.checked)}
            className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#0B1F3A]"
          />
          <div className="flex-1">
            <label htmlFor="ocr-toggle" className="font-semibold text-slate-900 cursor-pointer">
              Gunakan OCR AI (Khusus jika dokumen Anda berupa PDF hasil pindaian / gambar dokumen scan)
            </label>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Jika dicentang, sistem akan memproses teks dengan visi Gemini AI. Hasil akan diberi label "Teks hasil OCR, perlu diperiksa".
            </p>
          </div>
        </div>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-[#f8fafc] px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Atau Masukkan Teks Langsung
          </span>
        </div>

        {/* Direct Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Kolom Teks Naskah Kebijakan Langsung
            </label>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-semibold text-[#0B1F3A] hover:text-[#D32F2F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gunakan Contoh Dokumen Kebijakan Kemenko Polkam</span>
            </button>
          </div>
          <textarea
            rows={7}
            placeholder="Ketik atau tempel teks naskah kebijakan, regulasi, nota dinas, atau materi paparan rapat di sini (minimal 200 karakter)..."
            value={directText}
            onChange={(e) => {
              setDirectText(e.target.value);
              if (selectedFile) setSelectedFile(null); // Clear selected file when typing direct text
            }}
            className="w-full p-4 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/30 focus:border-[#0B1F3A] font-mono leading-relaxed bg-white shadow-2xs"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Jumlah karakter: <strong>{directText.length}</strong> (min. 200)
            </span>
            {directText.length > 0 && directText.length < 200 && (
              <span className="text-[#D32F2F] font-semibold">Kurang {200 - directText.length} karakter</span>
            )}
          </div>
        </div>

        {/* Supporting Source Section (Optional & Separate) */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-600" />
            <label className="text-xs font-bold text-slate-800">
              Sumber Pendukung (Opsional — Dilabeli Terpisah)
            </label>
          </div>
          <p className="text-[11px] text-slate-500">
            Hanya isi jika Anda memiliki catatan tambahan, latar belakang konteks, atau Q&A resmi pendukung. AI tidak akan menganggap data eksternal di luar kolom ini.
          </p>
          <textarea
            rows={3}
            placeholder="Masukkan data pendukung resmi (opsional)..."
            value={supportingText}
            onChange={(e) => setSupportingText(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 bg-white"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || (!selectedFile && directText.trim().length < 200)}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 shadow-md transition-all ${
              isLoading || (!selectedFile && directText.trim().length < 200)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#0B1F3A] hover:bg-[#16365C] text-white cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <span>ANALISIS & GENERATE 5 PRODUK</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
