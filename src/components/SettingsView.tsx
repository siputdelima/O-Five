import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AppSettings } from '../types/index.js';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearAllData,
}) => {
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(currentSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClear = async () => {
    const confirmText = window.prompt(
      'PERINGATAN: Seluruh riwayat dokumen, hasil generasi 5 produk, dan catatan verifikasi di IndexedDB browser ini akan dihapus permanen. Ketik "HAPUS" untuk mengonfirmasi:'
    );

    if (confirmText === 'HAPUS') {
      setIsClearing(true);
      await onClearAllData();
      setIsClearing(false);
      alert('Semua data berhasil dibersihkan.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
          Pengaturan Sistem O-FIVE
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Konfigurasi model AI, gaya bahasa default, dan manajemen penyimpanan lokal.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
            <Cpu className="w-4 h-4 text-[#D32F2F]" />
            <span>Konfigurasi Model Google GenAI</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Model Analisis & Generasi Dokumen
              </label>
              <select
                value={currentSettings.geminiModel}
                onChange={(e) =>
                  setCurrentSettings({ ...currentSettings, geminiModel: e.target.value })
                }
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              >
                <option value="gemini-3.8-flash">
                  Gemini 3.8 Flash (Direkomendasikan - Cepat & Faktual)
                </option>
                <option value="gemini-3.1-flash-lite">
                  Gemini 3.1 Flash Lite (Sangat Cepat)
                </option>
              </select>
              <p className="text-[11px] text-slate-500">
                Model cepat untuk mengekstrak ringkasan dan memproduksi 5 format produk komunikasi.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Model Verifikasi Sumber (Audit Fakta)
              </label>
              <select
                value={currentSettings.verificationModel}
                onChange={(e) =>
                  setCurrentSettings({ ...currentSettings, verificationModel: e.target.value })
                }
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
              >
                <option value="gemini-3.8-flash">
                  Gemini 3.8 Flash (Auditor Standar)
                </option>
                <option value="gemini-3.1-flash-lite">
                  Gemini 3.1 Flash Lite (Auditor Cepat)
                </option>
              </select>
              <p className="text-[11px] text-slate-500">
                Model pemeriksa klaim demi klaim terhadap teks sumber asli.
              </p>
            </div>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F3A]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Gaya Bahasa Default</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'formal' as const, label: 'Formal & Institusional', desc: 'Sesuai tata naskah dinas resmi' },
              { id: 'santai' as const, label: 'Santai & Populer', desc: 'Luwes untuk media sosial publik' },
              { id: 'ringkas' as const, label: 'Padat & Ringkas', desc: 'Fokus pada poin-poin esensial' },
            ].map((tone) => (
              <label
                key={tone.id}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  currentSettings.defaultTone === tone.id
                    ? 'border-[#0B1F3A] bg-blue-50/40 ring-1 ring-[#0B1F3A]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{tone.label}</span>
                  <input
                    type="radio"
                    name="defaultTone"
                    value={tone.id}
                    checked={currentSettings.defaultTone === tone.id}
                    onChange={() =>
                      setCurrentSettings({ ...currentSettings, defaultTone: tone.id })
                    }
                    className="text-[#0B1F3A] focus:ring-[#0B1F3A]"
                  />
                </div>
                <span className="text-[11px] text-slate-500">{tone.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Settings Button */}
        <div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0B1F3A] hover:bg-[#16365C] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>

      {/* Danger Zone: Hapus Semua Data */}
      <div className="bg-white rounded-xl border border-red-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#D32F2F]">
          <AlertTriangle className="w-4 h-4" />
          <span>Hapus Semua Data Penyimpanan Lokal</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          O-FIVE menyimpan seluruh riwayat dokumen dan hasil generasi di IndexedDB browser Anda. Tindakan ini akan mengosongkan seluruh basis data lokal.
        </p>
        <button
          type="button"
          disabled={isClearing}
          onClick={handleClear}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#D32F2F] border border-red-300 font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isClearing ? 'Membersihkan...' : 'Hapus Semua Data (Reset)'}</span>
        </button>
      </div>
    </div>
  );
};
