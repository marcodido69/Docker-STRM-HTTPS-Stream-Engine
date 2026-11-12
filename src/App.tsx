import React, { useState, useEffect } from 'react';
import { NetworkConfig, LibraryDirectory, MediaItem } from './types/strm';
import {
  DEFAULT_NETWORK_CONFIG,
  DEFAULT_LIBRARIES,
  DEFAULT_SAMPLE_ITEMS,
} from './data/defaultData';
import { Header, ActiveTab } from './components/Header';
import { GeneratorTab } from './components/GeneratorTab';
import { PortabilityTab } from './components/PortabilityTab';
import { GitHubGuideTab } from './components/GitHubGuideTab';
import { NetworkConfigTab } from './components/NetworkConfigTab';
import { LibrariesManagerTab } from './components/LibrariesManagerTab';
import { DockerComposeTab } from './components/DockerComposeTab';
import { AutoSyncTab } from './components/AutoSyncTab';
import { StreamTesterTab } from './components/StreamTesterTab';
import { generateStrmFiles, downloadStrmZip } from './utils/strmGenerator';
import { Upload, Download, RotateCcw, Tv, HardDrive, CheckCircle } from 'lucide-react';

const STORAGE_KEYS = {
  NETWORK: 'strm_bridge_network_config',
  LIBRARIES: 'strm_bridge_libraries',
  ITEMS: 'strm_bridge_media_items',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');

  // Network configuration state
  const [network, setNetwork] = useState<NetworkConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NETWORK);
      return saved ? JSON.parse(saved) : DEFAULT_NETWORK_CONFIG;
    } catch {
      return DEFAULT_NETWORK_CONFIG;
    }
  });

  // Libraries state
  const [libraries, setLibraries] = useState<LibraryDirectory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIBRARIES);
      return saved ? JSON.parse(saved) : DEFAULT_LIBRARIES;
    } catch {
      return DEFAULT_LIBRARIES;
    }
  });

  // Media Items state
  const [items, setItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_ITEMS;
    } catch {
      return DEFAULT_SAMPLE_ITEMS;
    }
  });

  // Test URL state for quick transfer between tabs
  const [testUrl, setTestUrl] = useState<string>(() => {
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NETWORK, JSON.stringify(network));
    } catch (e) {
      console.warn('Failed to save network config', e);
    }
  }, [network]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIBRARIES, JSON.stringify(libraries));
    } catch (e) {
      console.warn('Failed to save libraries', e);
    }
  }, [libraries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save items', e);
    }
  }, [items]);

  // Network updater
  const handleUpdateNetwork = (updated: Partial<NetworkConfig>) => {
    setNetwork((prev) => ({ ...prev, ...updated }));
  };

  // Libraries Handlers
  const handleAddLibrary = (newLib: LibraryDirectory) => {
    setLibraries((prev) => [...prev, newLib]);
  };

  const handleUpdateLibrary = (id: string, updated: Partial<LibraryDirectory>) => {
    setLibraries((prev) =>
      prev.map((lib) => (lib.id === id ? { ...lib, ...updated } : lib))
    );
  };

  const handleDeleteLibrary = (id: string) => {
    setLibraries((prev) => prev.filter((lib) => lib.id !== id));
    // Also remove items associated with this library
    setItems((prev) => prev.filter((item) => item.libraryId !== id));
  };

  // Media Items Handlers
  const handleAddItem = (item: MediaItem) => {
    setItems((prev) => [item, ...prev]);
  };

  const handleAddMultipleItems = (newItems: MediaItem[]) => {
    setItems((prev) => [...newItems, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDeleteMultipleItems = (ids: string[]) => {
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
  };

  const handleResetSampleData = () => {
    if (confirm('¿Restablecer el catálogo de muestra con películas y series de prueba?')) {
      setItems(DEFAULT_SAMPLE_ITEMS);
      setLibraries(DEFAULT_LIBRARIES);
      setNetwork(DEFAULT_NETWORK_CONFIG);
    }
  };

  // Quick download all ZIP
  const handleDownloadAllZip = () => {
    const generated = generateStrmFiles(items, libraries, network);
    downloadStrmZip(generated, libraries, network, 'strm_bridge_full_library.zip');
  };

  // Transfer URL to tester tab
  const handleTestUrl = (url: string) => {
    setTestUrl(url);
    setActiveTab('tester');
  };

  // Compute item counts by library
  const itemCountByLibrary = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.libraryId] = (counts[item.libraryId] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Export full JSON config
  const handleExportJson = () => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      network,
      libraries,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strm_bridge_backup_${network.duckDnsDomain.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON config
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.network) setNetwork(data.network);
        if (data.libraries && Array.isArray(data.libraries)) setLibraries(data.libraries);
        if (data.items && Array.isArray(data.items)) setItems(data.items);
        alert('Configuración y bibliotecas importadas correctamente.');
      } catch (err) {
        alert('El archivo JSON no tiene un formato válido de STRM Bridge.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadAllZip={handleDownloadAllZip}
        totalStrmCount={items.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'generator' && (
          <GeneratorTab
            items={items}
            libraries={libraries}
            network={network}
            onAddItem={handleAddItem}
            onAddMultipleItems={handleAddMultipleItems}
            onDeleteItem={handleDeleteItem}
            onDeleteMultipleItems={handleDeleteMultipleItems}
            onResetSampleData={handleResetSampleData}
            onTestUrl={handleTestUrl}
          />
        )}

        {activeTab === 'portability' && (
          <PortabilityTab
            network={network}
            libraries={libraries}
            items={items}
            onUpdateNetwork={handleUpdateNetwork}
            onTestUrl={handleTestUrl}
          />
        )}

        {activeTab === 'github' && (
          <GitHubGuideTab
            coverImagePath="/src/assets/images/cover_strm_engine_1794495903737.jpg"
          />
        )}

        {activeTab === 'network' && (
          <NetworkConfigTab
            network={network}
            onUpdateNetwork={handleUpdateNetwork}
          />
        )}

        {activeTab === 'libraries' && (
          <LibrariesManagerTab
            libraries={libraries}
            onAddLibrary={handleAddLibrary}
            onUpdateLibrary={handleUpdateLibrary}
            onDeleteLibrary={handleDeleteLibrary}
            itemCountByLibrary={itemCountByLibrary}
          />
        )}

        {activeTab === 'docker' && (
          <DockerComposeTab
            network={network}
            libraries={libraries}
          />
        )}

        {activeTab === 'sync' && (
          <AutoSyncTab
            network={network}
            libraries={libraries}
          />
        )}

        {activeTab === 'tester' && (
          <StreamTesterTab
            network={network}
            testUrl={testUrl}
            setTestUrl={setTestUrl}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">STRM Bridge</span>
          <span>·</span>
          <span>Transmisión remota con Nginx Proxy Manager & DuckDNS</span>
          <span>·</span>
          <span>ZimaOS & CasaOS</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Backup JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportJson}
            className="hover:text-slate-300 transition-colors flex items-center gap-1.5"
            title="Exportar configuración, rutas y archivos para migrar a otra máquina"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Backup JSON</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
