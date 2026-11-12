import React from 'react';
import { Tv, Download, RefreshCw, FileText } from 'lucide-react';

export type ActiveTab = 'generator' | 'portability' | 'network' | 'libraries' | 'docker' | 'sync' | 'tester';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onDownloadAllZip: () => void;
  totalStrmCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadAllZip,
  totalStrmCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-4 bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
          <Tv className="w-4 h-4" />
        </div>
        <a
          href="#generator"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('generator');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-indigo-300 transition-colors"
        >
          STRM Bridge
        </a>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs xl:text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('generator')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'generator'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Generador STRM
        </button>

        <button
          onClick={() => setActiveTab('portability')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'portability'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Portabilidad & Migración
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'network'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Red & DuckDNS
        </button>

        <button
          onClick={() => setActiveTab('libraries')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'libraries'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Bibliotecas
        </button>

        <button
          onClick={() => setActiveTab('docker')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'docker'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Docker Compose & NPM
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'sync'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Auto-Sync Daemon
        </button>

        <button
          onClick={() => setActiveTab('tester')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeTab === 'tester'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-slate-400'
          }`}
        >
          Probador de Stream
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadAllZip}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          title="Descargar todos los archivos .strm organizados en carpetas ZIP"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Descargar ZIP ({totalStrmCount})</span>
        </button>
      </div>
    </header>
  );
};
