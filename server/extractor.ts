import { createRequire } from 'module';
import JSZip from 'jszip';
import { getGeminiClient, DEFAULT_MODEL } from './config.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  slideCount?: number;
  wordCount: number;
  charCount: number;
  isOcr?: boolean;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<ExtractionResult> {
  const ext = fileType.toLowerCase();
  let extractedText = '';
  let pageCount: number | undefined;
  let slideCount: number | undefined;

  if (ext === 'pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    let currentPage = 0;
    const options = {
      pagerender: (pageData: any) => {
        currentPage += 1;
        return pageData.getTextContent().then((textContent: any) => {
          let lastY: number | null = null;
          let text = '';
          for (const item of textContent.items) {
            if (lastY === null || Math.abs(lastY - item.transform[5]) < 5) {
              text += item.str + ' ';
            } else {
              text += '\n' + item.str + ' ';
            }
            lastY = item.transform[5];
          }
          return `\n\n[Halaman ${currentPage}]\n${text.trim()}\n`;
        });
      },
    };

    try {
      const data = await pdfParse(buffer, options);
      extractedText = data.text.trim();
      pageCount = data.numpages || currentPage;
    } catch {
      // Fallback without custom pagerender if anything fails
      const data = await pdfParse(buffer);
      extractedText = data.text.trim();
      pageCount = data.numpages;
      if (!extractedText.includes('[Halaman')) {
        extractedText = `[Halaman 1]\n${extractedText}`;
      }
    }
  } else if (ext === 'docx' || fileName.toLowerCase().endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    const raw = result.value.trim();
    // Maintain sections if headings or paragraphs exist
    const paragraphs = raw.split(/\n{2,}/);
    extractedText = paragraphs
      .map((p: string, idx: number) => (idx === 0 ? `[Bagian Pembuka]\n${p}` : `[Bagian ${idx + 1}]\n${p}`))
      .join('\n\n');
  } else if (ext === 'pptx' || fileName.toLowerCase().endsWith('.pptx')) {
    const zip = await JSZip.loadAsync(buffer);
    const slideEntries: { index: number; name: string }[] = [];

    zip.forEach((relativePath) => {
      const match = relativePath.match(/^ppt\/slides\/slide([0-9]+)\.xml$/i);
      if (match) {
        slideEntries.push({ index: parseInt(match[1], 10), name: relativePath });
      }
    });

    slideEntries.sort((a, b) => a.index - b.index);
    slideCount = slideEntries.length;

    const slideTexts: string[] = [];
    for (const entry of slideEntries) {
      const xml = await zip.file(entry.name)?.async('string');
      if (xml) {
        // Extract text nodes <a:t>...</a:t>
        const matches = xml.match(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/g) || [];
        const texts = matches
          .map((m) => m.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim())
          .filter((t) => t.length > 0);
        slideTexts.push(`[Slide ${entry.index}]\n${texts.join(' ')}`);
      }
    }
    extractedText = slideTexts.join('\n\n');
  } else if (ext === 'txt' || fileName.toLowerCase().endsWith('.txt')) {
    extractedText = buffer.toString('utf-8').trim();
    if (!extractedText.includes('[Bagian')) {
      extractedText = `[Dokumen Utama]\n${extractedText}`;
    }
  } else {
    throw new Error(`Format file "${ext}" tidak didukung. Harap unggah PDF, DOCX, PPTX, atau TXT.`);
  }

  // Clean excessive blank lines
  extractedText = extractedText.replace(/\n{3,}/g, '\n\n').trim();

  const charCount = extractedText.length;
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  if (charCount < 200) {
    throw new Error(
      `Gagal dibaca: Teks yang berhasil diekstrak hanya ${charCount} karakter (kurang dari syarat minimum 200 karakter). File kemungkinan merupakan hasil pindai (scan image), proteksi kata sandi, atau dokumen kosong. Silakan gunakan opsi OCR atau masukkan teks secara langsung.`
    );
  }

  return {
    text: extractedText,
    pageCount,
    slideCount,
    wordCount,
    charCount,
    isOcr: false,
  };
}

export async function performOcrWithGemini(
  buffer: Buffer,
  mimeType: string,
  modelName: string = DEFAULT_MODEL
): Promise<ExtractionResult> {
  const ai = getGeminiClient();
  const base64Data = buffer.toString('base64');

  const prompt = `Lakukan Optical Character Recognition (OCR) menyeluruh pada dokumen ini.
Ekstrak seluruh teks, tabel, angka, dan penanda halaman dengan persis sesuai isi aslinya.
Beri penanda [Halaman N] untuk setiap halaman yang dibaca.
Jangan tambahkan interpretasi atau karangan teks baru.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'application/pdf',
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  const rawText = response.text || '';
  const text = `[TEKS HASIL OCR VIA AI - PERLU DIPERIKSA SECARA MANUAL]\n\n${rawText.trim()}`;
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (charCount < 100) {
    throw new Error('Hasil OCR AI tidak menghasilkan teks yang memadai.');
  }

  return {
    text,
    wordCount,
    charCount,
    isOcr: true,
  };
}
