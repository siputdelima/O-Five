import { ProductType, VerificationFinding } from '../src/types/index.js';

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Normalizes number formats (Indonesian uses '.' as thousand separator and ',' as decimal)
 */
export function normalizeNumberString(numStr: string): string {
  const clean = numStr.replace(/[^0-9.,]/g, '');
  if (!clean) return numStr;

  // Indonesian format: 1.250.000,50 -> 1250000.5
  if (clean.includes('.') && clean.includes(',')) {
    return clean.replace(/\./g, '').replace(',', '.');
  }
  // Thousand dot only: 1.250.000 -> 1250000
  if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    return clean.replace(/\./g, '');
  }
  // Decimal comma only: 12,5 -> 12.5
  if (/^\d+,\d+$/.test(clean)) {
    return clean.replace(',', '.');
  }
  return clean;
}

/**
 * Finds the section/page marker for a position in the source text
 */
export function getSectionMarkerAtPosition(sourceText: string, matchIndex: number): string {
  const prefix = sourceText.slice(0, Math.max(0, matchIndex));
  const pageMatches = [...prefix.matchAll(/\[(Halaman|Slide|Bagian|Dokumen)[^\]]*\]/gi)];
  if (pageMatches.length > 0) {
    return pageMatches[pageMatches.length - 1][0];
  }
  return '[Teks Dokumen]';
}

/**
 * Extracts a surrounding excerpt from source text
 */
export function getSurroundingExcerpt(sourceText: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(sourceText.length, matchIndex + matchLength + 40);
  let snippet = sourceText.substring(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < sourceText.length) snippet = snippet + '...';
  return snippet;
}

export interface MatchResult {
  found: boolean;
  reference: string;
  excerpt: string;
  matchIndex: number;
}

export function searchInSource(sourceText: string, query: string): MatchResult {
  const normalizedSource = normalizeText(sourceText);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { found: false, reference: '', excerpt: '', matchIndex: -1 };
  }

  const idx = normalizedSource.indexOf(normalizedQuery);
  if (idx !== -1) {
    // Map approximate location back into raw source
    const rawIdx = Math.min(idx, sourceText.length - 1);
    const ref = getSectionMarkerAtPosition(sourceText, rawIdx);
    const excerpt = getSurroundingExcerpt(sourceText, rawIdx, query.length);
    return { found: true, reference: ref, excerpt, matchIndex: idx };
  }

  return { found: false, reference: '', excerpt: '', matchIndex: -1 };
}

/**
 * Deterministic rule-based extraction & cross-check against raw document source
 */
export function runDeterministicVerification(
  productContent: string,
  productType: ProductType,
  rawSourceText: string
): VerificationFinding[] {
  const findings: VerificationFinding[] = [];
  let findingCounter = 1;

  // 1. Quoted text checking ("..." or “...”)
  const quoteRegex = /["“]([^"”]{6,150})["”]/g;
  let quoteMatch: RegExpExecArray | null;
  while ((quoteMatch = quoteRegex.exec(productContent)) !== null) {
    const quoteText = quoteMatch[1].trim();
    const result = searchInSource(rawSourceText, quoteText);
    findings.push({
      id: `det-${productType}-quote-${findingCounter++}`,
      productType,
      category: 'kutipan',
      claimText: `"${quoteText}"`,
      status: result.found ? 'TERVERIFIKASI' : 'TIDAK_DITEMUKAN',
      sourceExcerpt: result.found ? result.excerpt : '[TIDAK DITEMUKAN DI TEKS SUMBER]',
      reference: result.found ? result.reference : '-',
      reason: result.found
        ? 'Kutipan cocok secara tekstual dengan dokumen sumber.'
        : 'Kutipan resmi ini tidak ditemukan dalam teks sumber asli. Periksa apakah kutipan diubah atau diimprovisasi.',
      deterministicMatch: result.found,
    });
  }

  // 2. Numbers, amounts, and percentages
  // Matches e.g. "Rp 150 miliar", "85,4%", "12.500 orang", "45 triliun"
  const numberRegex = /\b(?:Rp\s*)?\d+(?:[\.,]\d+)*(?:\s*(?:persen|%|ribu|juta|miliar|triliun|orang|kasus|dokumen|satuan|hektare|ton|km|meter))?\b/gi;
  const rawNumbers = productContent.match(numberRegex) || [];
  const uniqueNumbers = Array.from(new Set(rawNumbers)).filter((n) => {
    // Filter out common years like 2024, 2025, 2026 or single digits unless with unit
    const numOnly = n.replace(/[^0-9]/g, '');
    if (numOnly.length === 4 && (numOnly.startsWith('19') || numOnly.startsWith('20'))) {
      return false; // Skip standalone years in number matcher (handled in dates)
    }
    return n.length >= 2;
  });

  for (const num of uniqueNumbers.slice(0, 10)) {
    const result = searchInSource(rawSourceText, num);
    if (!result.found) {
      // Try searching for the bare digits
      const digits = num.replace(/[^0-9]/g, '');
      const digitSearch = digits.length >= 3 ? searchInSource(rawSourceText, digits) : { found: false, reference: '', excerpt: '', matchIndex: -1 };
      
      findings.push({
        id: `det-${productType}-num-${findingCounter++}`,
        productType,
        category: 'angka_data',
        claimText: num,
        status: digitSearch.found ? 'PERLU_PEMERIKSAAN' : 'TIDAK_DITEMUKAN',
        sourceExcerpt: digitSearch.found ? digitSearch.excerpt : '[TIDAK DITEMUKAN DALAM SUMBER]',
        reference: digitSearch.found ? digitSearch.reference : '-',
        reason: digitSearch.found
          ? `Angka dasar (${digits}) ditemukan di sumber, namun unit atau format penulisan ("${num}") perlu dicocokkan.`
          : `Angka/data "${num}" tidak ditemukan dalam dokumen sumber asli. Waspada halusinasi data!`,
        deterministicMatch: digitSearch.found,
      });
    } else {
      findings.push({
        id: `det-${productType}-num-${findingCounter++}`,
        productType,
        category: 'angka_data',
        claimText: num,
        status: 'TERVERIFIKASI',
        sourceExcerpt: result.excerpt,
        reference: result.reference,
        reason: `Angka/data "${num}" terverifikasi ada dalam dokumen sumber.`,
        deterministicMatch: true,
      });
    }
  }

  // 3. Official titles and names
  // e.g. Menko Polkam, Menko Polhukam, Menteri, Deputi, Asisten Deputi, Dirjen, Kepala
  const officialRegex = /\b(?:Menko\s+[A-Za-z]+|Menteri\s+[A-Za-z\s]+|Wakil\s+Menteri|Deputi\s+[A-Za-z\s]+|Asisten\s+Deputi\s+[A-Za-z\s]+|Direktur\s+Jenderal|Dirjen\s+[A-Za-z]+)\b/g;
  const officialMatches = productContent.match(officialRegex) || [];
  const uniqueOfficials = Array.from(new Set(officialMatches));

  for (const official of uniqueOfficials.slice(0, 5)) {
    const result = searchInSource(rawSourceText, official.trim());
    findings.push({
      id: `det-${productType}-off-${findingCounter++}`,
      productType,
      category: 'nama_jabatan',
      claimText: official.trim(),
      status: result.found ? 'TERVERIFIKASI' : 'PERLU_PEMERIKSAAN',
      sourceExcerpt: result.found ? result.excerpt : '[TIDAK DITEMUKAN SECARA PERSIS]',
      reference: result.found ? result.reference : '-',
      reason: result.found
        ? `Jabatan/pejabat "${official}" tertera dalam teks sumber.`
        : `Penyebutan jabatan/pejabat "${official}" tidak ditemukan persis sama di teks sumber. Periksa penamaan resmi.`,
      deterministicMatch: result.found,
    });
  }

  // 4. Placeholders detection ([PERLU DILENGKAPI], [TIDAK TERSEDIA DALAM SUMBER], [PERLU VERIFIKASI])
  const placeholderRegex = /\[(PERLU DILENGKAPI|TIDAK TERSEDIA DALAM SUMBER|PERLU VERIFIKASI)\]/g;
  let phMatch: RegExpExecArray | null;
  while ((phMatch = placeholderRegex.exec(productContent)) !== null) {
    const phText = phMatch[0];
    findings.push({
      id: `det-${productType}-ph-${findingCounter++}`,
      productType,
      category: 'substansi',
      claimText: phText,
      status: 'PERLU_PEMERIKSAAN',
      sourceExcerpt: 'Penanda kekosongan informasi terdeteksi pada produk.',
      reference: '-',
      reason: `Terdapat penanda "${phText}". Dokumen sumber tidak memiliki informasi ini, dan analis perlu melengkapi sebelum publikasi.`,
      deterministicMatch: true,
    });
  }

  return findings;
}
