import React from 'react';
import {
  BookOpenText,
  ShieldAlert,
  Scale,
  CheckCircle2,
  FileText,
  Users,
  Compass,
  AlertTriangle,
} from 'lucide-react';

export const GuideView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-[#0B1F3A] text-xs font-semibold">
          <BookOpenText className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span>Panduan Penggunaan Resmi O-FIVE</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
          Panduan Operasional, Etika AI & Alur Verifikasi
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Standar Operasional Prosedur (SOP) Analis Kebijakan dan Analis Media Kemenko Polkam RI.
        </p>
      </div>

      {/* 7 Alur Kerja O-FIVE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#D32F2F]" />
          <span>7 Tahapan Alur Kerja O-FIVE</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <span className="font-bold text-[#0B1F3A]">1. Input Dokumen Kebijakan</span>
            <p className="text-slate-600">Unggah berkas PDF, DOCX, PPTX, atau teks langsung (maks. 20 MB). Server mengekstrak teks dengan penanda halaman/slide.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <span className="font-bold text-[#0B1F3A]">2. Analisis Substansi</span>
            <p className="text-slate-600">AI mengekstrak latar belakang, dasar hukum, data, kutipan pejabat, dan pesan utama dengan referensi dokumen asli.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <span className="font-bold text-[#0B1F3A]">3. Penyaringan KIP (UU 14/2008)</span>
            <p className="text-slate-600">Klasifikasi awal butir informasi (Publik, Perlu Verifikasi, Sensitif). Analis wajib memutuskan butir sensitif sebelum generasi.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <span className="font-bold text-[#0B1F3A]">4. Generasi 5 Produk Komunikasi</span>
            <p className="text-slate-600">Menghasilkan Siaran Pers, Caption IG, Threads, TikTok, dan Berita secara konsisten berbasis ringkasan terkonfirmasi.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <span className="font-bold text-[#0B1F3A]">5. Audit Verifikasi Dua Lapis</span>
            <p className="text-slate-600">Pencocokan deterministik (angka, kutipan, entitas) digabung dengan audit semantik Gemini langsung ke teks sumber asli.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <span className="font-bold text-[#0B1F3A]">6. Human Review (Telaah Analis)</span>
            <p className="text-slate-600">Penyuntingan manual, regenerasi terarah, penghapusan placeholder, dan penandatanganan verifikasi oleh petugas berwenang.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg sm:col-span-2 space-y-1">
            <span className="font-bold text-[#0B1F3A]">7. Output & Ekspor Terstandar</span>
            <p className="text-slate-600">Ekspor berkas DOCX resmi ber-kop Kemenko Polkam dan berkas TXT. Paket "Unduh Semua" menyatukan kelima produk dalam satu berkas.</p>
          </div>
        </div>
      </div>

      {/* 10 Aturan AI O-FIVE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#D32F2F]" />
          <span>10 Aturan Mutlak AI O-FIVE (Kemenko Polkam)</span>
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed">
          <li><strong>Zero Hallucination:</strong> Jangan pernah mengarang fakta, data, angka, nama, jabatan, tanggal, lokasi, atau kutipan.</li>
          <li><strong>Larangan Kutipan Palsu:</strong> Jangan membuat pernyataan pejabat yang tidak ada secara eksplisit di dokumen sumber.</li>
          <li><strong>Integritas Substansi:</strong> Jangan mengubah maksud, substansi, konteks, atau arah kebijakan pemerintah.</li>
          <li><strong>Placeholder Wajib:</strong> Jika informasi tidak ada di sumber, tulis <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">[PERLU DILENGKAPI]</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">[TIDAK TERSEDIA DALAM SUMBER]</code>.</li>
          <li><strong>Single Source of Truth:</strong> Jangan berasumsi dan jangan memakai sumber eksternal tanpa instruksi eksplisit pengguna.</li>
          <li><strong>Status Netral:</strong> Jangan mengubah informasi yang berstatus belum terverifikasi menjadi fakta mutlak.</li>
          <li><strong>Penyederhanaan Bahasa:</strong> Sederhanakan bahasa birokrasi menjadi bahasa publik yang komunikatif tanpa mengubah substansi.</li>
          <li><strong>Larangan Publikasi Otomatis:</strong> Jangan pernah menerbitkan atau mengirim konten otomatis ke media sosial atau kanal pers.</li>
          <li><strong>Kewajiban Human Review:</strong> Semua hasil adalah draf kerja yang wajib melalui pemeriksaan manusia sebelum publikasi.</li>
          <li><strong>Kerahasiaan Dokumen:</strong> Jaga kerahasiaan naskah kebijakan; server beroperasi secara stateless tanpa penyimpanan berkas ke disk.</li>
        </ol>
      </div>

      {/* Catatan KIP UU No. 14 Tahun 2008 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-700" />
          <span>Landasan Hukum Keterbukaan Informasi Publik (UU No. 14 Tahun 2008)</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Berdasarkan Pasal 17 UU KIP, setiap instansi pemerintah wajib menyaring informasi yang berpotensi dikecualikan, antara lain informasi yang apabila dibuka dapat menghambat proses penegakan hukum, mengganggu stabilitas pertahanan dan keamanan negara, merugikan ketahanan ekonomi nasional, atau mengungkap rahasia pribadi seseorang. Di O-FIVE, AI memberikan indikasi awal dan analis pemegang mandat PPID menetapkan keputusan final.
        </p>
      </div>
    </div>
  );
};
