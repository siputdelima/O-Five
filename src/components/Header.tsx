import React from 'react';
import { Menu, FileText, CheckCircle2, Clock } from 'lucide-react';
import { PolicyDocument } from '../types/index.js';

interface HeaderProps {
  onOpenMobile: () => void;
  activeDoc: PolicyDocument | null;
  onOpenSourceModal: () => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobile,
  activeDoc,
  onOpenSourceModal,
  activeTabTitle,
}) => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + breadcrumb title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0B1F3A] tracking-tight">
              {activeTabTitle}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Asisten Komunikasi Kebijakan Terpadu Kemenko Polkam
            </p>
          </div>
        </div>

        {/* Right: Active Document Indicator & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeDoc ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <FileText className="w-4 h-4 text-[#0B1F3A]" />
              <div className="max-w-[120px] sm:max-w-[200px] truncate">
                <span className="font-semibold text-slate-800">{activeDoc.fileName}</span>
              </div>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3" />
                {activeDoc.wordCount} kata
              </span>
              <button
                onClick={onOpenSourceModal}
                className="ml-1 text-xs font-semibold text-[#0B1F3A] hover:text-[#D32F2F] hover:underline cursor-pointer"
                title="Buka Panel Teks Sumber"
              >
                Lihat Teks
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-600 hidden sm:flex items-center gap-1.5 bg-slate-100/70 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem Siap Digunakan</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
