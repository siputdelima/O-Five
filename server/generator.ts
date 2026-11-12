import { Type } from '@google/genai';
import { getGeminiClient, DEFAULT_MODEL, hasValidGeminiKey, withTimeout } from './config.js';
import { GENERATOR_SYSTEM_INSTRUCTION, buildGeneratorUserPrompt } from './prompts/generatorPrompt.js';
import { AnalysisSummary, CommunicationProduct, KipItem, ProductType } from '../src/types/index.js';

const productsOutputSchema = {
  type: Type.OBJECT,
  properties: {
    siaran_pers: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        content: { type: Type.STRING, description: 'Teks lengkap siaran pers piramida terbalik' },
      },
      required: ['title', 'content'],
    },
    instagram: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        hook: { type: Type.STRING },
        content: { type: Type.STRING, description: 'Teks lengkap caption Instagram lengkap dengan emoji terukur dan hashtag' },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'content'],
    },
    threads: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        posts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Rangkaian tweet/post bernomor (1/x, 2/x) maksimal 500 karakter per post',
        },
      },
      required: ['title', 'posts'],
    },
    tiktok: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        hook: { type: Type.STRING },
        content: { type: Type.STRING, description: 'Caption TikTok dan konsep narasi video singkat' },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'content'],
    },
    berita: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        leadParagraph: { type: Type.STRING },
        content: { type: Type.STRING, description: 'Artikel berita lengkap 5W+1H piramida terbalik' },
      },
      required: ['title', 'content'],
    },
  },
  required: ['siaran_pers', 'instagram', 'threads', 'tiktok', 'berita'],
};

export function synthesizeProductsDeterministically(
  confirmedSummary: AnalysisSummary,
  kipItems: KipItem[],
  tone: 'formal' | 'santai' | 'ringkas' = 'formal'
): Record<ProductType, CommunicationProduct> {
  const now = new Date().toISOString();
  const dateStr = confirmedSummary.waktuLokasi.waktu !== 'Sesuai naskah dinas'
    ? confirmedSummary.waktuLokasi.waktu
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const lokasiStr = confirmedSummary.waktuLokasi.lokasi || 'JAKARTA';

  const quoteObj = confirmedSummary.pernyataanResmi.find((q) => q.kutipan && !q.kutipan.includes('[TIDAK TERSEDIA'));
  const quoteParagraph = quoteObj
    ? `Menteri Koordinator Bidang Politik dan Keamanan (Menko Polkam) menegaskan: "${quoteObj.kutipan}"`
    : `Pernyataan Pejabat: [TIDAK TERSEDIA DALAM SUMBER]`;

  const faktaLines = confirmedSummary.faktaDataPenting
    .map((f) => `• ${f.fakta} (${f.angkaData})`)
    .join('\n');

  const pesanLines = confirmedSummary.pesanUtama
    .map((p, idx) => `${idx + 1}. ${p.poin}`)
    .join('\n');

  const dasarHukumLines = confirmedSummary.dasarHukum
    .map((d) => `• ${d.aturan}`)
    .join('\n');

  // 1. Siaran Pers
  const siaranPersContent = `SIARAN PERS
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN
REPUBLIK INDONESIA

${confirmedSummary.judul.toUpperCase()}

${lokasiStr.toUpperCase()} — Pemerintah melalui Kementerian Koordinator Bidang Politik dan Keamanan menerbitkan langkah strategis terkait ${confirmedSummary.judul}. Kebijakan ini dilandasi oleh urgensi penguatan koordinasi penanganan informasi dan stabilitas ruang publik nasional secara terpadu.

${confirmedSummary.latarBelakang.content}

Dalam implementasinya, kebijakan ini didukung oleh sejumlah fakta dan sasaran strategis:
${faktaLines}

${quoteParagraph}

Adapun pilar utama kebijakan yang diinstruksikan kepada seluruh instansi terkait meliputi:
${pesanLines}

Penerapan regulasi ini didasarkan pada landasan hukum:
${dasarHukumLines}

Melalui kebijakan ini, ${confirmedSummary.dampakManfaat[0]?.dampak || 'diharapkan stabilitas keamanan informasi nasional terjaga dan masyarakat memperoleh kepastian informasi yang akurat'}.

Narahubung Media / Kontak Pers:
Biro Komunikasi dan Informasi Publik Kemenko Polkam
[PERLU DILENGKAPI]`;

  // 2. Instagram
  const igContent = `🛡️ KOMITMEN KEMENKO POLKAM: ${confirmedSummary.judul}

Waspada disinformasi, perkuat ketahanan nasional! Kemenko Polkam menegaskan langkah terkoordinasi demi menjaga ruang informasi publik yang sehat, aman, dan kondusif bagi seluruh rakyat Indonesia.

📌 POIN KUNCI KEBIJAKAN:
${confirmedSummary.pesanUtama.slice(0, 3).map((p) => `✅ ${p.poin}`).join('\n')}

📊 FAKTA & DATA STRATEGIS:
${confirmedSummary.faktaDataPenting.slice(0, 2).map((f) => `🔹 ${f.fakta} (${f.angkaData})`).join('\n')}

💬 ARAHAN RESMI:
${quoteObj ? `"${quoteObj.kutipan}"` : 'Kebijakan dilaksanakan berlandaskan keterbukaan informasi dan integritas data.'}

👥 MANFAAT BAGI MASYARAKAT:
${confirmedSummary.dampakManfaat[0]?.dampak || 'Masyarakat mendapatkan informasi sahih dan perlindungan ruang digital.'}

Simak salinan regulasi lengkap pada kanal resmi kementerian.
Kontak layanan informasi: [PERLU DILENGKAPI]

#KemenkoPolkam #KetahananNasional #InformasiPublik #KedaulatanDigital #IndonesiaMaju`;

  // 3. Threads
  const threadPosts = [
    `1/5 🧵 Perkembangan ruang digital menuntut respon kebijakan yang cepat dan terkoordinasi. Kemenko Polkam menerbitkan arahan strategis: "${confirmedSummary.judul}". Simak ringkasan pentingnya di utas ini! 👇`,
    `2/5 📊 Mengapa kebijakan ini krusial?\n${confirmedSummary.latarBelakang.content.slice(0, 380)}`,
    `3/5 ⚡ Data & Target Kunci:\n${confirmedSummary.faktaDataPenting.slice(0, 2).map((f) => `• ${f.fakta}: ${f.angkaData}`).join('\n')}`,
    `4/5 🎙️ Menko Polkam menegaskan:\n${quoteObj ? `"${quoteObj.kutipan}"` : 'Semua kementerian/lembaga diwajibkan berkoordinasi satu pintu menanggapi isu publik.'}`,
    `5/5 🇮🇩 Kebijakan ini berlaku per ${dateStr}. Mari bersama jaga keutuhan informasi publik demi stabilitas dan ketahanan bangsa!\nInfo resmi: [PERLU DILENGKAPI]`,
  ];
  const threadCombined = threadPosts.join('\n\n---\n\n');

  // 4. TikTok
  const tiktokContent = `🚨 PENTING: Langkah Tegas Kemenko Polkam Jaga Ruang Digital Nasional!

Tau gak sih? Serangan informasi manipulatif makin marak di ruang siber. Makanya, Kemenko Polkam resmi merilis kebijakan: "${confirmedSummary.judul}".

Targetnya gak main-main:
${confirmedSummary.faktaDataPenting.slice(0, 2).map((f) => `👉 ${f.fakta} (${f.angkaData})`).join('\n')}

Pesan Menko Polkam tegas banget: "${quoteObj ? quoteObj.kutipan : 'Kedaulatan ruang digital adalah fondasi ketahanan nasional.'}"

Tulis tanggapan kamu di kolom komentar! Selalu cek fakta sebelum sebar info ya! 🔍

#KemenkoPolkam #FaktaKebijakan #InfoPemerintah #RuangDigitalAman #EdukasiPublik`;

  // 5. Berita
  const beritaContent = `${confirmedSummary.judul.toUpperCase()}

JAKARTA — Kementerian Koordinator Bidang Politik dan Keamanan (Kemenko Polkam) secara resmi mengeluarkan regulasi terkait ${confirmedSummary.judul}. Kebijakan ini ditetapkan menyusul dinamika ruang publik dan kebutuhan mendesak untuk memperkuat sinergi komunikasi instansi pemerintah di tingkat pusat dan daerah.

Berdasarkan naskah resmi, ${confirmedSummary.latarBelakang.content}

Dalam pelaksanaan di lapangan, pemerintah telah menyiapkan alokasi dan kesiapan operasional konkret:
${faktaLines}

${quoteParagraph}

Lebih lanjut, ${confirmedSummary.jenisDokumen} ini memuat sejumlah mandat strategis yang wajib dijalankan oleh seluruh kementerian dan lembaga yang tergabung dalam desk koordinasi:
${pesanLines}

Landasan hukum yang memayungi kebijakan ini mencakup ${dasarHukumLines}.

Pemerintah menargetkan implementasi regulasi ini mampu memberikan dampak langsung bagi masyarakat, yakni ${confirmedSummary.dampakManfaat[0]?.dampak || 'terjaminnya arus informasi yang sahih dan terlindunginya publik dari disinformasi'}. Pelaksanaan kebijakan mulai berlaku efektif pada ${dateStr} dengan pemantauan terpusat di Jakarta.`;

  return {
    siaran_pers: {
      id: `prod-siaran-pers-${Date.now()}`,
      type: 'siaran_pers',
      title: confirmedSummary.judul,
      content: siaranPersContent,
      characterCount: siaranPersContent.length,
      platformSpecifics: { subtitle: 'Kemenko Polkam RI' },
      versionHistory: [{ version: 1, content: siaranPersContent, modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
      verificationStatus: 'BELUM_DIVERIFIKASI',
    },
    instagram: {
      id: `prod-instagram-${Date.now()}`,
      type: 'instagram',
      title: `Caption Instagram: ${confirmedSummary.judul}`,
      content: igContent,
      characterCount: igContent.length,
      platformSpecifics: { hashtags: ['#KemenkoPolkam', '#InformasiPublik'] },
      versionHistory: [{ version: 1, content: igContent, modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
      verificationStatus: 'BELUM_DIVERIFIKASI',
    },
    threads: {
      id: `prod-threads-${Date.now()}`,
      type: 'threads',
      title: `Threads: ${confirmedSummary.judul}`,
      content: threadCombined,
      threadsPosts: threadPosts,
      characterCount: threadCombined.length,
      versionHistory: [{ version: 1, content: threadCombined, modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
      verificationStatus: 'BELUM_DIVERIFIKASI',
    },
    tiktok: {
      id: `prod-tiktok-${Date.now()}`,
      type: 'tiktok',
      title: `TikTok: ${confirmedSummary.judul}`,
      content: tiktokContent,
      characterCount: tiktokContent.length,
      platformSpecifics: { hashtags: ['#KemenkoPolkam', '#FaktaKebijakan'] },
      versionHistory: [{ version: 1, content: tiktokContent, modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
      verificationStatus: 'BELUM_DIVERIFIKASI',
    },
    berita: {
      id: `prod-berita-${Date.now()}`,
      type: 'berita',
      title: `Berita: ${confirmedSummary.judul}`,
      content: beritaContent,
      characterCount: beritaContent.length,
      versionHistory: [{ version: 1, content: beritaContent, modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
      verificationStatus: 'BELUM_DIVERIFIKASI',
    },
  };
}

export async function generateFiveProducts(
  confirmedSummary: AnalysisSummary,
  kipItems: KipItem[],
  tone: 'formal' | 'santai' | 'ringkas' = 'formal',
  modelName: string = DEFAULT_MODEL
): Promise<Record<ProductType, CommunicationProduct>> {
  if (hasValidGeminiKey()) {
    const approvedItems = kipItems.filter((i) => i.userDecision !== 'JANGAN_GUNAKAN');
    const prompt = buildGeneratorUserPrompt(
      JSON.stringify(confirmedSummary, null, 2),
      JSON.stringify(approvedItems, null, 2),
      tone
    );

    try {
      const ai = getGeminiClient();
      const response: any = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: GENERATOR_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: productsOutputSchema,
          },
        }),
        7000,
        'Generasi 5 Produk Gemini'
      );

      const text = response.text;
      if (text) {
        const raw = JSON.parse(text);
        const now = new Date().toISOString();
        const threadsArray: string[] = raw.threads?.posts || [];
        const threadsCombined = threadsArray.join('\n\n---\n\n');

        return {
          siaran_pers: {
            id: `prod-siaran-pers-${Date.now()}`,
            type: 'siaran_pers',
            title: raw.siaran_pers?.title || confirmedSummary.judul,
            content: raw.siaran_pers?.content || '',
            characterCount: (raw.siaran_pers?.content || '').length,
            versionHistory: [{ version: 1, content: raw.siaran_pers?.content || '', modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
            verificationStatus: 'BELUM_DIVERIFIKASI',
          },
          instagram: {
            id: `prod-instagram-${Date.now()}`,
            type: 'instagram',
            title: raw.instagram?.title || 'Caption Instagram',
            content: raw.instagram?.content || '',
            characterCount: (raw.instagram?.content || '').length,
            versionHistory: [{ version: 1, content: raw.instagram?.content || '', modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
            verificationStatus: 'BELUM_DIVERIFIKASI',
          },
          threads: {
            id: `prod-threads-${Date.now()}`,
            type: 'threads',
            title: raw.threads?.title || 'Konten Threads',
            content: threadsCombined,
            threadsPosts: threadsArray,
            characterCount: threadsCombined.length,
            versionHistory: [{ version: 1, content: threadsCombined, modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
            verificationStatus: 'BELUM_DIVERIFIKASI',
          },
          tiktok: {
            id: `prod-tiktok-${Date.now()}`,
            type: 'tiktok',
            title: raw.tiktok?.title || 'Caption TikTok',
            content: raw.tiktok?.content || '',
            characterCount: (raw.tiktok?.content || '').length,
            versionHistory: [{ version: 1, content: raw.tiktok?.content || '', modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
            verificationStatus: 'BELUM_DIVERIFIKASI',
          },
          berita: {
            id: `prod-berita-${Date.now()}`,
            type: 'berita',
            title: raw.berita?.title || 'Artikel Berita',
            content: raw.berita?.content || '',
            characterCount: (raw.berita?.content || '').length,
            versionHistory: [{ version: 1, content: raw.berita?.content || '', modifiedAt: now, author: 'AI', note: 'Generasi Awal' }],
            verificationStatus: 'BELUM_DIVERIFIKASI',
          },
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini API Info] Generasi via AI tidak aktif: ${err?.message}. Menggunakan sintesis deterministik berbasis ringkasan terkonfirmasi.`);
    }
  }

  return synthesizeProductsDeterministically(confirmedSummary, kipItems, tone);
}
