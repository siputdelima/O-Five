import { getProductLabel } from './docxExport.js';
import { CommunicationProduct } from '../types/index.js';

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSingleProductToTxt(product: CommunicationProduct, sourceDocumentTitle: string): void {
  const isVerified = product.verificationStatus === 'TERVERIFIKASI';
  const header = `===============================================================
KEMENTERIAN KOORDINATOR BIDANG POLITIK DAN KEAMANAN RI
PRODUK KOMUNIKASI O-FIVE: ${getProductLabel(product.type).toUpperCase()}
STATUS: ${isVerified ? 'RESMI - TELAH DIVERIFIKASI DARI SUMBER' : 'DRAF - BELUM DIVERIFIKASI'}
DOKUMEN SUMBER: ${sourceDocumentTitle}
TANGGAL: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
===============================================================

JUDUL: ${product.title}

${product.content}

---------------------------------------------------------------
${
  product.auditRecord
    ? `Diverifikasi oleh: ${product.auditRecord.verifiedBy} pada ${new Date(
        product.auditRecord.verifiedAt
      ).toLocaleString('id-ID')}\nCatatan: ${product.auditRecord.notes || '-'}`
    : 'Catatan: Konten ini memerlukan verifikasi manusia sebelum publikasi.'
}
===============================================================`;

  const blob = new Blob([header], { type: 'text/plain;charset=utf-8' });
  const safeTitle = (product.title || product.type).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  downloadFile(blob, `O-FIVE_${product.type}_${safeTitle}.txt`);
}
