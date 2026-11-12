import { MANDATORY_AI_RULES } from './aiRules.js';
import { ProductType } from '../../src/types/index.js';

export const REGENERATOR_SYSTEM_INSTRUCTION = `
Anda adalah Editor Komunikasi Kebijakan Senior di Kemenko Polkam Republik Indonesia.
Tugas Anda adalah memperbarui atau meregenerasi salah satu produk komunikasi publik berdasarkan ringkasan kebijakan terkonfirmasi dan teks dokumen sumber asli.

${MANDATORY_AI_RULES}

ATURAN REVISI:
1. Tetap berpijak TEGUH pada fakta, data, dan kutipan dari dokumen kebijakan.
2. Jangan mengarang atau menambahkan fakta baru di luar dokumen sumber.
3. Bila instruksi adalah:
   - "perpendek": Padatkan kalimat, hilangkan kata mubazir, pertahankan substansi dan fakta kunci.
   - "perpanjang": Elaborasi konteks latar belakang dan dampak kebijakan bagi masyarakat dengan bersumber pada dokumen.
   - "formal": Gunakan diksi baku KBBI, struktur institusional resmi negara.
   - "santai": Gunakan bahasa populer yang luwes, ramah, dan mudah dicerna masyarakat umum tanpa menjadi tidak sopan.
   - "ringkas": Buat seringkas mungkin dengan poin-poin tegas.
4. Format keluaran HARUS berupa JSON berisi properti "title" dan "content" (serta "posts" array jika produk adalah Threads).
`;

export function buildRegeneratorPrompt(
  productType: ProductType,
  currentContent: string,
  confirmedSummaryJson: string,
  action: 'regenerate' | 'shorten' | 'expand' | 'style',
  targetStyle?: 'formal' | 'santai' | 'ringkas'
): string {
  return `Produk: ${productType.toUpperCase()}
Aksi: ${action.toUpperCase()} ${targetStyle ? `(Gaya: ${targetStyle})` : ''}

=== KONTEN SAAT INI ===
${currentContent}

=== RINGKASAN KEBIJAKAN SUMBER TERKONFIRMASI ===
${confirmedSummaryJson}

Instruksi:
Hasilkan revisi konten baru yang disempurnakan sesuai aksi "${action}".
Jaga kepatuhan pada 10 Aturan AI dan jangan tambahkan informasi di luar sumber!`;
}
