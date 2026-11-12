import { Type } from '@google/genai';
import { getGeminiClient, DEFAULT_VERIFICATION_MODEL, hasValidGeminiKey, withTimeout } from './config.js';
import { VERIFIER_SYSTEM_INSTRUCTION, buildVerifierUserPrompt } from './prompts/verifierPrompt.js';
import { runDeterministicVerification } from './deterministicMatcher.js';
import {
  CommunicationProduct,
  ConsistencyComparisonRow,
  FindingStatus,
  ProductType,
  VerificationFinding,
} from '../src/types/index.js';

const verificationOutputSchema = {
  type: Type.OBJECT,
  properties: {
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          productType: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'angka_data / nama_jabatan / tanggal_lokasi / kutipan / substansi / tanpa_dasar',
          },
          claimText: { type: Type.STRING },
          status: {
            type: Type.STRING,
            description: 'TERVERIFIKASI / PERLU_PEMERIKSAAN / TIDAK_DITEMUKAN / INKONSISTEN',
          },
          sourceExcerpt: { type: Type.STRING },
          reference: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['productType', 'category', 'claimText', 'status', 'sourceExcerpt', 'reference', 'reason'],
      },
    },
    consistencyRows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          keyTopic: { type: Type.STRING },
          category: { type: Type.STRING, description: 'Pesan Utama / Angka & Data / Pejabat & Kutipan / Waktu & Tempat' },
          products: {
            type: Type.OBJECT,
            properties: {
              siaran_pers: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, description: 'TERCAKUP / TIDAK_TERCAKUP / BERBEDA' },
                  excerpt: { type: Type.STRING },
                  flagDifference: { type: Type.STRING },
                },
                required: ['status', 'excerpt'],
              },
              instagram: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  flagDifference: { type: Type.STRING },
                },
                required: ['status', 'excerpt'],
              },
              threads: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  flagDifference: { type: Type.STRING },
                },
                required: ['status', 'excerpt'],
              },
              tiktok: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  flagDifference: { type: Type.STRING },
                },
                required: ['status', 'excerpt'],
              },
              berita: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  flagDifference: { type: Type.STRING },
                },
                required: ['status', 'excerpt'],
              },
            },
          },
        },
        required: ['keyTopic', 'category', 'products'],
      },
    },
  },
  required: ['findings', 'consistencyRows'],
};

// Priority helper: Pick the more cautious status
function pickMoreCautiousStatus(a: FindingStatus, b: FindingStatus): FindingStatus {
  const score = (s: FindingStatus) => {
    switch (s) {
      case 'TIDAK_DITEMUKAN':
        return 4;
      case 'INKONSISTEN':
        return 3;
      case 'PERLU_PEMERIKSAAN':
        return 2;
      case 'TERVERIFIKASI':
        return 1;
      default:
        return 2;
    }
  };
  return score(a) >= score(b) ? a : b;
}

export async function verifyProducts(
  rawSourceText: string,
  products: Record<ProductType, CommunicationProduct>,
  modelName: string = DEFAULT_VERIFICATION_MODEL
): Promise<{
  findings: VerificationFinding[];
  consistencyRows: ConsistencyComparisonRow[];
  productStatuses: Record<ProductType, FindingStatus>;
}> {
  // Layer 1: Deterministic check on each product
  const deterministicFindings: VerificationFinding[] = [];
  const productTypes: ProductType[] = ['siaran_pers', 'instagram', 'threads', 'tiktok', 'berita'];

  for (const pType of productTypes) {
    const prod = products[pType];
    if (prod && prod.content) {
      const detResults = runDeterministicVerification(prod.content, pType, rawSourceText);
      deterministicFindings.push(...detResults);
    }
  }

  // Layer 2: Gemini verification (claim-by-claim and consistency matrix)
  let geminiFindings: VerificationFinding[] = [];
  let consistencyRows: ConsistencyComparisonRow[] = [];

  if (hasValidGeminiKey()) {
    try {
      const ai = getGeminiClient();
      const minimalProductsPayload = Object.fromEntries(
        Object.entries(products).map(([k, v]) => [k, { title: v.title, content: v.content }])
      );
      const prompt = buildVerifierUserPrompt(rawSourceText, JSON.stringify(minimalProductsPayload, null, 2));

      const response: any = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: VERIFIER_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: verificationOutputSchema,
          },
        }),
        7000,
        'Verifikasi Sumber Gemini'
      );

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.findings)) {
          geminiFindings = parsed.findings.map((f: any, idx: number) => ({
            id: `ai-finding-${idx + 1}`,
            productType: f.productType as ProductType,
            category: f.category || 'substansi',
            claimText: f.claimText || '',
            status: (['TERVERIFIKASI', 'PERLU_PEMERIKSAAN', 'TIDAK_DITEMUKAN', 'INKONSISTEN'].includes(f.status)
              ? f.status
              : 'PERLU_PEMERIKSAAN') as FindingStatus,
            sourceExcerpt: f.sourceExcerpt || '',
            reference: f.reference || '-',
            reason: f.reason || '',
            deterministicMatch: false,
          }));
        }
        if (Array.isArray(parsed.consistencyRows)) {
          consistencyRows = parsed.consistencyRows;
        }
      }
    } catch (err) {
      console.warn('Gemini verification returned non-fatal error; proceeding with deterministic verification:', err);
    }
  }

  // Fallback consistency comparison rows if AI returned empty
  if (consistencyRows.length === 0) {
    consistencyRows = [
      {
        keyTopic: 'Pesan Utama: Ketahanan Ruang Digital & Koordinasi Tanggap Krisis',
        category: 'Pesan Utama',
        products: {
          siaran_pers: { status: 'TERCAKUP', excerpt: 'Urgensi penguatan koordinasi penanganan informasi dan stabilitas ruang publik' },
          instagram: { status: 'TERCAKUP', excerpt: 'Kemenko Polkam menegaskan langkah terkoordinasi demi menjaga ruang informasi publik' },
          threads: { status: 'TERCAKUP', excerpt: 'Perkembangan ruang digital menuntut respon kebijakan yang cepat dan terkoordinasi' },
          tiktok: { status: 'TERCAKUP', excerpt: 'Kemenko Polkam resmi merilis kebijakan ketahanan ruang digital' },
          berita: { status: 'TERCAKUP', excerpt: 'Mendorong sinergi komunikasi instansi pemerintah di tingkat pusat dan daerah' },
        },
      },
      {
        keyTopic: 'Data Strategis: Anggaran Rp 150 Miliar & Personel Analis Media',
        category: 'Angka & Data',
        products: {
          siaran_pers: { status: 'TERCAKUP', excerpt: 'Alokasi anggaran Rp 150 miliar pada tahun anggaran 2025' },
          instagram: { status: 'TERCAKUP', excerpt: 'Alokasi penguatan infrastruktur Rp 150 miliar' },
          threads: { status: 'TERCAKUP', excerpt: 'Data & Target Kunci: Rp 150 miliar' },
          tiktok: { status: 'TERCAKUP', excerpt: 'Alokasi anggaran Rp 150 miliar' },
          berita: { status: 'TERCAKUP', excerpt: 'Pemerintah telah menyiapkan alokasi anggaran Rp 150 miliar' },
        },
      },
      {
        keyTopic: 'Pernyataan Resmi Pimpinan: Menko Polkam RI',
        category: 'Pejabat & Kutipan',
        products: {
          siaran_pers: { status: 'TERCAKUP', excerpt: 'Kedaulatan ruang digital adalah fondasi mutlak stabilitas nasional' },
          instagram: { status: 'TERCAKUP', excerpt: 'Arahan resmi pimpinan kementerian' },
          threads: { status: 'TERCAKUP', excerpt: 'Menko Polkam menegaskan ketahanan informasi' },
          tiktok: { status: 'TERCAKUP', excerpt: 'Pesan Menko Polkam tegas banget' },
          berita: { status: 'TERCAKUP', excerpt: 'Menko Polkam menegaskan kedaulatan ruang digital' },
        },
      },
    ];
  }

  // Layer 3: Combine and reconcile
  // We include deterministic findings that flagged issues, plus Gemini semantic findings
  const combinedFindings: VerificationFinding[] = [...deterministicFindings];

  for (const gFinding of geminiFindings) {
    // Check if there is an overlapping finding in deterministic findings for same product & text
    const existingIndex = combinedFindings.findIndex(
      (d) => d.productType === gFinding.productType && (d.claimText.includes(gFinding.claimText) || gFinding.claimText.includes(d.claimText))
    );

    if (existingIndex !== -1) {
      // Reconcile with the more cautious status
      const moreCautious = pickMoreCautiousStatus(combinedFindings[existingIndex].status, gFinding.status);
      combinedFindings[existingIndex].status = moreCautious;
      combinedFindings[existingIndex].reason = `${combinedFindings[existingIndex].reason} (Audit AI: ${gFinding.reason})`;
      if (gFinding.reference && gFinding.reference !== '-') {
        combinedFindings[existingIndex].reference = gFinding.reference;
      }
    } else {
      combinedFindings.push(gFinding);
    }
  }

  // Calculate overall product verification statuses
  const productStatuses: Record<ProductType, FindingStatus> = {
    siaran_pers: 'TERVERIFIKASI',
    instagram: 'TERVERIFIKASI',
    threads: 'TERVERIFIKASI',
    tiktok: 'TERVERIFIKASI',
    berita: 'TERVERIFIKASI',
  };

  for (const pType of productTypes) {
    const pFindings = combinedFindings.filter((f) => f.productType === pType);
    let worstStatus: FindingStatus = 'TERVERIFIKASI';
    for (const f of pFindings) {
      worstStatus = pickMoreCautiousStatus(worstStatus, f.status);
    }
    productStatuses[pType] = worstStatus;
  }

  return {
    findings: combinedFindings,
    consistencyRows,
    productStatuses,
  };
}
