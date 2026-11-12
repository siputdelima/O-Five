import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  normalizeNumberString,
  getSectionMarkerAtPosition,
  searchInSource,
  runDeterministicVerification,
} from './deterministicMatcher.js';

test('normalizeText handles unicode quotes and spaces', () => {
  const input = ' “Kebijakan Strategis”   dan   ‘Langkah Konkret’ ';
  const expected = '"kebijakan strategis" dan \'langkah konkret\'';
  assert.equal(normalizeText(input), expected);
});

test('normalizeNumberString formats Indonesian thousands and decimals', () => {
  assert.equal(normalizeNumberString('1.500.000,50'), '1500000.50');
  assert.equal(normalizeNumberString('250.000'), '250000');
  assert.equal(normalizeNumberString('15,5'), '15.5');
});

test('getSectionMarkerAtPosition correctly tracks the active page marker', () => {
  const source = `[Halaman 1]
Pembukaan naskah dinas Kemenko Polkam.
[Halaman 2]
Rapat Koordinasi Tingkat Menteri mencatat capaian anggaran 98,5%.`;

  const idx = source.indexOf('98,5%');
  const marker = getSectionMarkerAtPosition(source, idx);
  assert.equal(marker, '[Halaman 2]');
});

test('searchInSource accurately locates queries and returns excerpt', () => {
  const source = `[Halaman 1]
Berdasarkan Instruksi Presiden Nomor 7 Tahun 2024 tentang Transformasi Digital.`;

  const result = searchInSource(source, 'Nomor 7 Tahun 2024');
  assert.equal(result.found, true);
  assert.equal(result.reference, '[Halaman 1]');
  assert.ok(result.excerpt.includes('Instruksi Presiden'));
});

test('runDeterministicVerification detects verified data and ungrounded data', () => {
  const source = `[Halaman 1]
Kemenko Polkam mengalokasikan anggaran Rp 150 miliar untuk penguatan infrastruktur siber pada 12 November 2024.
Menko Polkam menyatakan: "Kedaulatan siber adalah fondasi ketahanan nasional."`;

  // Product containing: 1 true number, 1 fake number, 1 true quote, 1 fake quote, 1 placeholder
  const productText = `Siaran Pers:
Kemenko Polkam menganggarkan Rp 150 miliar dan tambahan Rp 999 triliun.
Menko Polkam menyatakan "Kedaulatan siber adalah fondasi ketahanan nasional."
Pejabat lain berujar: "Semua sistem akan diganti besok pagi."
Catatan anggaran: [PERLU DILENGKAPI].`;

  const findings = runDeterministicVerification(productText, 'siaran_pers', source);

  // 1. Check Rp 150 miliar is TERVERIFIKASI
  const num150 = findings.find((f) => f.claimText.includes('150 miliar'));
  assert.ok(num150);
  assert.equal(num150.status, 'TERVERIFIKASI');

  // 2. Check Rp 999 triliun is TIDAK_DITEMUKAN
  const num999 = findings.find((f) => f.claimText.includes('999 triliun'));
  assert.ok(num999);
  assert.equal(num999.status, 'TIDAK_DITEMUKAN');

  // 3. Check real quote is TERVERIFIKASI
  const realQuote = findings.find((f) => f.claimText.includes('Kedaulatan siber'));
  assert.ok(realQuote);
  assert.equal(realQuote.status, 'TERVERIFIKASI');

  // 4. Check fabricated quote is TIDAK_DITEMUKAN
  const fakeQuote = findings.find((f) => f.claimText.includes('Semua sistem akan diganti'));
  assert.ok(fakeQuote);
  assert.equal(fakeQuote.status, 'TIDAK_DITEMUKAN');

  // 5. Check placeholder detection
  const placeholder = findings.find((f) => f.claimText.includes('[PERLU DILENGKAPI]'));
  assert.ok(placeholder);
  assert.equal(placeholder.status, 'PERLU_PEMERIKSAAN');
});
