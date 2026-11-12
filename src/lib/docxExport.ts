import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
} from 'docx';
import { CommunicationProduct, ProductType } from '../types/index.js';

export function checkForPlaceholders(content: string): string[] {
  const matches: string[] = [];
  const regex = /\[(PERLU DILENGKAPI|TIDAK TERSEDIA DALAM SUMBER|PERLU VERIFIKASI)\]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    if (!matches.includes(m[0])) {
      matches.push(m[0]);
    }
  }
  return matches;
}

export function getProductLabel(type: ProductType): string {
  switch (type) {
    case 'siaran_pers':
      return 'Siaran Pers';
    case 'instagram':
      return 'Caption Instagram';
    case 'threads':
      return 'Konten Threads';
    case 'tiktok':
      return 'Caption & Konsep TikTok';
    case 'berita':
      return 'Artikel Berita Kebijakan';
    default:
      return type;
  }
}

export async function exportSingleProductToDocx(
  product: CommunicationProduct,
  sourceDocumentTitle: string
): Promise<Blob> {
  const isVerified = product.verificationStatus === 'TERVERIFIKASI';
  const headerStatusText = isVerified
    ? 'RESMI — TELAH DIVERIFIKASI SUMBER (KEMENKO POLKAM)'
    : 'DRAF — BELUM DIVERIFIKASI (HARAP PERIKSA SUMBER ASLI)';

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN',
          bold: true,
          size: 26,
          font: 'Arial',
          color: '0B1F3A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'REPUBLIK INDONESIA',
          bold: true,
          size: 22,
          font: 'Arial',
          color: '0B1F3A',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '═════════════════════════════════════════════════════════════',
          color: '94A3B8',
          size: 18,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Dokumen Sumber: ', bold: true, size: 20 }),
        new TextRun({ text: sourceDocumentTitle, size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Jenis Produk Komunikasi: ', bold: true, size: 20 }),
        new TextRun({ text: getProductLabel(product.type), size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Status Verifikasi: ', bold: true, size: 20 }),
        new TextRun({
          text: isVerified ? 'TERVERIFIKASI DARI SUMBER' : 'DRAF / BELUM DIVERIFIKASI',
          bold: true,
          color: isVerified ? '15803D' : 'D32F2F',
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Tanggal Ekspor: ', bold: true, size: 20 }),
        new TextRun({ text: new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), size: 20 }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: product.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
  ];

  // Add body paragraphs
  const rawParagraphs = product.content.split(/\n{2,}/);
  for (const p of rawParagraphs) {
    if (!p.trim()) continue;
    // Check if paragraph contains placeholder
    const hasPh = /\[(PERLU DILENGKAPI|TIDAK TERSEDIA DALAM SUMBER|PERLU VERIFIKASI)\]/.test(p);
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: p.trim(),
            size: 22,
            font: 'Arial',
            highlight: hasPh ? 'yellow' : undefined,
          }),
        ],
        spacing: { after: 200, line: 360 },
      })
    );
  }

  // Audit info if available
  if (product.auditRecord) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 400 },
        children: [
          new TextRun({
            text: `Diverifikasi oleh: ${product.auditRecord.verifiedBy} pada ${new Date(
              product.auditRecord.verifiedAt
            ).toLocaleString('id-ID')}`,
            italics: true,
            size: 18,
            color: '64748B',
          }),
        ],
      })
    );
    if (product.auditRecord.notes) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Catatan Pemeriksa: ${product.auditRecord.notes}`,
              italics: true,
              size: 18,
              color: '64748B',
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: headerStatusText,
                    bold: true,
                    size: 16,
                    color: isVerified ? '15803D' : 'D32F2F',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'O-FIVE Kemenko Polkam — Halaman ', size: 16, color: '64748B' }),
                  new TextRun({
                    children: [PageNumber.CURRENT, ' dari ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function exportAllProductsToDocx(
  products: Record<ProductType, CommunicationProduct>,
  sourceDocumentTitle: string
): Promise<Blob> {
  const productTypes: ProductType[] = ['siaran_pers', 'berita', 'instagram', 'threads', 'tiktok'];
  const allVerified = Object.values(products).every((p) => p.verificationStatus === 'TERVERIFIKASI');
  const headerStatusText = allVerified
    ? 'RESMI — 5 PRODUK TERVERIFIKASI SUMBER (KEMENKO POLKAM)'
    : 'DRAF — 5 PRODUK KOMUNIKASI (STATUS VERIFIKASI BERBEDA)';

  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN',
          bold: true,
          size: 26,
          font: 'Arial',
          color: '0B1F3A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'REPUBLIK INDONESIA',
          bold: true,
          size: 22,
          font: 'Arial',
          color: '0B1F3A',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PAKET LENGKAP 5 PRODUK KOMUNIKASI PUBLIK (O-FIVE)',
          bold: true,
          size: 24,
          color: 'D32F2F',
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Dokumen Sumber: ', bold: true, size: 20 }),
        new TextRun({ text: sourceDocumentTitle, size: 20 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Waktu Kompilasi: ', bold: true, size: 20 }),
        new TextRun({ text: new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), size: 20 }),
      ],
      spacing: { after: 400 },
    }),
  ];

  for (const pType of productTypes) {
    const prod = products[pType];
    if (!prod) continue;
    const isV = prod.verificationStatus === 'TERVERIFIKASI';

    paragraphs.push(
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: '0B1F3A' },
        },
        spacing: { before: 400, after: 150 },
        children: [
          new TextRun({
            text: `PRODUK: ${getProductLabel(prod.type).toUpperCase()}`,
            bold: true,
            size: 24,
            color: '0B1F3A',
          }),
          new TextRun({
            text: `  [${isV ? 'TERVERIFIKASI' : 'BELUM DIVERIFIKASI'}]`,
            bold: true,
            size: 18,
            color: isV ? '15803D' : 'D32F2F',
          }),
        ],
      }),
      new Paragraph({
        text: prod.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 250 },
      })
    );

    const blocks = prod.content.split(/\n{2,}/);
    for (const b of blocks) {
      if (!b.trim()) continue;
      const hasPh = /\[(PERLU DILENGKAPI|TIDAK TERSEDIA DALAM SUMBER|PERLU VERIFIKASI)\]/.test(b);
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: b.trim(),
              size: 20,
              font: 'Arial',
              highlight: hasPh ? 'yellow' : undefined,
            }),
          ],
          spacing: { after: 180, line: 340 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: headerStatusText,
                    bold: true,
                    size: 16,
                    color: allVerified ? '15803D' : 'D32F2F',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'O-FIVE Kemenko Polkam — Halaman ', size: 16, color: '64748B' }),
                  new TextRun({
                    children: [PageNumber.CURRENT, ' dari ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
