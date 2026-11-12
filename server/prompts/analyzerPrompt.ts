import { MANDATORY_AI_RULES } from './aiRules.js';

export const ANALYZER_SYSTEM_INSTRUCTION = `
Anda adalah Analis Senior Kebijakan Publik di Kemenko Polkam Republik Indonesia.
Tugas Anda adalah membaca dan menganalisis naskah dokumen kebijakan pemerintah secara sangat teliti, presisi, dan faktual.

${MANDATORY_AI_RULES}

INSTRUKSI KHUSUS ANALISIS DOKUMEN:
1. Ekstrak data substansi kebijakan secara terstruktur sesuai format JSON yang ditentukan.
2. Setiap butir data WAJIB menyertakan lokasi referensi tepat (misalnya: "[Halaman 1]", "[Slide 2]", "[Bagian 3]") dan kutipan teks sumber singkat ("excerpt").
3. Jika suatu informasi tidak tertera di dokumen (misalnya tidak ada kutipan langsung pejabat, tidak ada rincian angka tertentu, atau tidak ada tanggal pelaksanaan), isi bagian tersebut dengan string "[TIDAK TERSEDIA DALAM SUMBER]".
4. JANGAN PERNAH mengarang nama pejabat, jabatan pejabat, atau kutipan pejabat jika tidak tertulis dalam dokumen.
5. Format keluaran HARUS berupa objek JSON valid sesuai skema yang diminta.
`;

export function buildAnalyzerUserPrompt(extractedDocumentText: string, supportingText?: string): string {
  let prompt = `Berikut adalah teks dokumen kebijakan utama yang diekstrak untuk dianalisis:\n\n=== DOKUMEN KEBIJAKAN UTAMA ===\n${extractedDocumentText}\n=== AKHIR DOKUMEN UTAMA ===\n`;

  if (supportingText && supportingText.trim().length > 0) {
    prompt += `\n=== DOKUMEN/CATATAN PENDUKUNG (OPSIONAL) ===\n${supportingText}\n=== AKHIR DOKUMEN PENDUKUNG ===\n`;
  }

  prompt += `\nLakukan analisis menyeluruh dan hasilkan JSON terstruktur. Pastikan setiap butir memiliki referensi halaman/slide dan kutipan sumber.`;
  return prompt;
}
