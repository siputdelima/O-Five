import React, { useState } from 'react';
import { X, Search, Copy, Check, FileText, Sparkles } from 'lucide-react';
import { PolicyDocument } from '../types/index.js';

interface SourceTextModalProps {
  document: PolicyDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceTextModal: React.FC<SourceTextModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(document.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Highlight matches
  const renderHighlightedText = () => {
    const text = document.extractedText;
    if (!searchQuery.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-slate-900 rounded-xs px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0B1F3A] text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0B1F3A] truncate max-w-md">
                  {document.fileName}
                </h3>
                {document.isOcr && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    OCR AI
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Teks Sumber Ekstraksi ({document.wordCount.toLocaleString('id-ID')} kata, {document.charCount.toLocaleString('id-ID')} karakter)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci di dalam teks sumber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
            >
              Bersihkan
            </button>
          )}
        </div>

        {/* Text View */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
          {renderHighlightedText()}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Dokumen ini adalah satu-satunya sumber utama (Single Source of Truth).</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#0B1F3A] hover:bg-[#16365C] text-white rounded font-medium text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
