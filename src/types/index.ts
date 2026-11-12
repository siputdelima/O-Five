export type ProductType = 'siaran_pers' | 'instagram' | 'threads' | 'tiktok' | 'berita';

export interface PolicyDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx' | 'pptx' | 'txt';
  extractedText: string;
  supportingText?: string;
  pageCount?: number;
  slideCount?: number;
  wordCount: number;
  charCount: number;
  isOcr?: boolean;
  uploadedAt: string;
  status: 'uploaded' | 'analyzed' | 'classified' | 'generated' | 'verified' | 'error';
  errorMessage?: string;
}

export interface AnalysisSummary {
  judul: string;
  jenisDokumen: string;
  latarBelakang: { content: string; reference: string; excerpt: string };
  tujuanSubstansi: { content: string; reference: string; excerpt: string };
  dasarHukum: Array<{ aturan: string; nomorTahun: string; reference: string }>;
  faktaDataPenting: Array<{ fakta: string; angkaData: string; reference: string; excerpt: string }>;
  pejabatTerkait: Array<{ nama: string; jabatan: string; reference: string }>;
  pernyataanResmi: Array<{ penutur: string; jabatan: string; kutipan: string; reference: string }>;
  waktuLokasi: { waktu: string; lokasi: string; reference: string };
  pesanUtama: Array<{ poin: string; reference: string; excerpt: string }>;
  dampakManfaat: Array<{ kelompokSasaran: string; dampak: string; reference: string }>;
  confirmedAt?: string;
}

export type KipClassification = 'PUBLIK' | 'PERLU_VERIFIKASI' | 'SENSITIF';
export type KipUserDecision = 'GUNAKAN' | 'JANGAN_GUNAKAN' | 'PENDING';

export interface KipItem {
  id: string;
  category: 'Dasar Hukum' | 'Fakta & Data' | 'Pernyataan Pejabat' | 'Pesan Kebijakan' | 'Informasi Sensitif' | 'Lainnya';
  content: string;
  reference: string;
  excerpt: string;
  classification: KipClassification;
  reason: string;
  userDecision: KipUserDecision;
}

export interface ProductVersion {
  version: number;
  content: string;
  modifiedAt: string;
  author: 'AI' | 'User';
  note?: string;
}

export interface AuditRecord {
  verifiedBy: string;
  verifiedAt: string;
  notes: string;
  reviewedUnverifiedFindings: boolean;
}

export interface CommunicationProduct {
  id: string;
  type: ProductType;
  title: string;
  content: string;
  threadsPosts?: string[];
  characterCount: number;
  platformSpecifics?: {
    hashtags?: string[];
    hook?: string;
    callToAction?: string;
    subtitle?: string;
    leadParagraph?: string;
  };
  versionHistory: ProductVersion[];
  verificationStatus: 'BELUM_DIVERIFIKASI' | 'TERVERIFIKASI' | 'PERLU_PEMERIKSAAN' | 'TIDAK_DITEMUKAN' | 'INKONSISTEN';
  auditRecord?: AuditRecord;
}

export type FindingStatus = 'TERVERIFIKASI' | 'PERLU_PEMERIKSAAN' | 'TIDAK_DITEMUKAN' | 'INKONSISTEN';

export interface VerificationFinding {
  id: string;
  productType: ProductType;
  category: 'angka_data' | 'nama_jabatan' | 'tanggal_lokasi' | 'kutipan' | 'substansi' | 'tanpa_dasar';
  claimText: string;
  status: FindingStatus;
  sourceExcerpt: string;
  reference: string;
  reason: string;
  deterministicMatch: boolean;
}

export interface ConsistencyComparisonRow {
  keyTopic: string;
  category: 'Pesan Utama' | 'Angka & Data' | 'Pejabat & Kutipan' | 'Waktu & Tempat';
  products: {
    [key in ProductType]?: {
      status: 'TERCAKUP' | 'TIDAK_TERCAKUP' | 'BERBEDA';
      excerpt: string;
      flagDifference?: string;
    };
  };
}

export interface AppSettings {
  geminiModel: string;
  verificationModel: string;
  defaultTone: 'formal' | 'santai' | 'ringkas';
}

export interface FullGenerationResult {
  documentId: string;
  summary: AnalysisSummary;
  kipItems: KipItem[];
  products: Record<ProductType, CommunicationProduct>;
  verificationFindings: VerificationFinding[];
  consistencyRows: ConsistencyComparisonRow[];
  timestamp: string;
}
