import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  FileClock,
  Sparkles,
  BookOpenText,
  Settings,
  X,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Logo } from './Logo.js';

export type NavTab = 'dashboard' | 'new' | 'results' | 'history' | 'guide' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  hasActiveResults: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  hasActiveResults,
}) => {
  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new' as NavTab, label: 'Buat Konten Baru', icon: FilePlus2, highlight: true },
    {
      id: 'results' as NavTab,
      label: 'Hasil Generasi',
      icon: Sparkles,
      badge: hasActiveResults ? 'Aktif' : undefined,
    },
    { id: 'history' as NavTab, label: 'Riwayat Dokumen', icon: FileClock },
    { id: 'guide' as NavTab, label: 'Panduan Penggunaan', icon: BookOpenText },
    { id: 'settings' as NavTab, label: 'Pengaturan', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-[#0B1F3A] text-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
        <Logo size="md" light showTagline={false} />
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Institution Info */}
      <div className="px-5 py-3.5 bg-slate-900/40 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Building2 className="w-4 h-4 text-[#D32F2F] flex-shrink-0" />
          <span className="truncate">Asdep Koordinasi Media & Kominfo</span>
        </div>
        <div className="text-[11px] text-slate-400 pl-6">Kemenko Polkam RI</div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#0B1F3A] shadow-md font-semibold'
                  : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#D32F2F]' : item.highlight ? 'text-amber-300' : 'text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#D32F2F] text-white' : 'bg-[#D32F2F]/80 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security & Confidentiality Notice */}
      <div className="p-4 m-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privasi & Keamanan Dokumen</span>
        </div>
        <p className="leading-relaxed">
          Server O-FIVE beroperasi tanpa menyimpan dokumen ke disk. Seluruh riwayat tersimpan lokal di browser Anda.
        </p>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>O-FIVE v1.0.0</span>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Gov Policy</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-20">
        {content}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile drawer content */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};
