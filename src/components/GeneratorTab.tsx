import React, { useState, useRef } from 'react';
import {
  MediaItem,
  LibraryDirectory,
  NetworkConfig,
  GeneratedStrmFile,
} from '../types/strm';
import {
  generateStrmFiles,
  downloadSingleStrm,
  downloadStrmZip,
  downloadM3uPlaylist,
  formatBytes,
} from '../utils/strmGenerator';
import {
  Download,
  Copy,
  Play,
  Trash2,
  Search,
  FolderOpen,
  FilePlus,
  RotateCcw,
  Check,
  ExternalLink,
  HardDrive,
  Tv,
  Film,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface GeneratorTabProps {
  items: MediaItem[];
  libraries: LibraryDirectory[];
  network: NetworkConfig;
  onAddItem: (item: MediaItem) => void;
  onAddMultipleItems: (items: MediaItem[]) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultipleItems: (ids: string[]) => void;
  onResetSampleData: () => void;
  onTestUrl: (url: string) => void;
}

export const GeneratorTab: React.FC<GeneratorTabProps> = ({
  items,
  libraries,
  network,
  onAddItem,
  onAddMultipleItems,
  onDeleteItem,
  onDeleteMultipleItems,
  onResetSampleData,
  onTestUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<GeneratedStrmFile | null>(null);
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [textImportContent, setTextImportContent] = useState('');
  const [textImportLibId, setTextImportLibId] = useState(libraries[0]?.id || '');
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualRelPath, setManualRelPath] = useState('');
  const [manualLibId, setManualLibId] = useState(libraries[0]?.id || '');

  // File input ref for folder browser
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Compute all generated STRM representations
  const generatedStrmFiles = React.useMemo(() => {
    return generateStrmFiles(items, libraries, network);
  }, [items, libraries, network]);

  // Map generated strm files by id
  const strmById = React.useMemo(() => {
    const map = new Map<string, GeneratedStrmFile>();
    generatedStrmFiles.forEach((file) => map.set(file.id, file));
    return map;
  }, [generatedStrmFiles]);

  // Filtering
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesLib = selectedLibraryId === 'all' || item.libraryId === selectedLibraryId;
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.relativePath.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLib && matchesSearch;
    });
  }, [items, selectedLibraryId, searchQuery]);

  // Metrics
  const totalOriginalSize = React.useMemo(() => {
    return items.reduce((acc, item) => acc + (item.sizeBytes || 4000000000), 0);
  }, [items]);

  const totalStrmSizeEstimate = items.length * 150; // Each .strm is ~150 bytes

  // Copy URL handler
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  // Handle HTML5 folder upload (browser reads folder structure without uploading video files!)
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItem[] = [];
    const targetLib = libraries.find((l) => l.id === selectedLibraryId) || libraries[0];
    const allowedExts = targetLib?.allowedExtensions || ['.mkv', '.mp4', '.avi', '.ts'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;
      const ext = '.' + relPath.split('.').pop()?.toLowerCase();

      if (allowedExts.includes(ext)) {
        const fileName = relPath.split('/').pop() || relPath;
        const title = fileName.replace(/\.[^/.]+$/, '');

        newItems.push({
          id: `item-${Date.now()}-${i}`,
          libraryId: targetLib.id,
          title,
          relativePath: relPath,
          fileName,
          fileExtension: ext,
          sizeBytes: file.size > 0 ? file.size : 5000000000,
        });
      }
    }

    if (newItems.length > 0) {
      onAddMultipleItems(newItems);
    }
    // Reset file input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  // Handle text path import (e.g. from find or ls)
  const handleTextImportSubmit = () => {
    if (!textImportContent.trim()) return;

    const lines = textImportContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const targetLib = libraries.find((l) => l.id === textImportLibId) || libraries[0];
    const allowedExts = targetLib?.allowedExtensions || ['.mkv', '.mp4', '.avi'];

    const newItems: MediaItem[] = [];
    lines.forEach((line, idx) => {
      // Clean leading ./ or paths
      const cleanPath = line.replace(/^\.\//, '').replace(/^\\+/, '');
      const ext = '.' + cleanPath.split('.').pop()?.toLowerCase();

      if (allowedExts.includes(ext) || ext.length <= 5) {
        const fileName = cleanPath.split('/').pop() || cleanPath;
        const title = fileName.replace(/\.[^/.]+$/, '');

        newItems.push({
          id: `item-import-${Date.now()}-${idx}`,
          libraryId: targetLib.id,
          title,
          relativePath: cleanPath,
          fileName,
          fileExtension: ext,
          sizeBytes: 6000000000,
        });
      }
    });

    if (newItems.length > 0) {
      onAddMultipleItems(newItems);
      setTextImportContent('');
      setIsTextImportOpen(false);
    }
  };

  // Handle manual single add
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRelPath.trim()) return;

    const targetLib = libraries.find((l) => l.id === manualLibId) || libraries[0];
    const fileName = manualRelPath.split('/').pop() || manualRelPath;
    const ext = '.' + (fileName.split('.').pop() || 'mkv').toLowerCase();
    const title = manualTitle.trim() || fileName.replace(/\.[^/.]+$/, '');

    const newItem: MediaItem = {
      id: `item-manual-${Date.now()}`,
      libraryId: targetLib.id,
      title,
      relativePath: manualRelPath.trim(),
      fileName,
      fileExtension: ext,
      sizeBytes: 8000000000,
    };

    onAddItem(newItem);
    setManualTitle('');
    setManualRelPath('');
    setIsManualAddOpen(false);
  };

  // Bulk ZIP download
  const handleDownloadFilteredZip = () => {
    const filesToZip =
      selectedItemIds.size > 0
        ? generatedStrmFiles.filter((f) => selectedItemIds.has(f.id))
        : generatedStrmFiles;
    downloadStrmZip(filesToZip, libraries, network, 'strm_bridge_export.zip');
  };

  // Bulk delete
  const handleDeleteSelected = () => {
    if (selectedItemIds.size === 0) return;
    if (confirm(`¿Eliminar ${selectedItemIds.size} elementos de la lista?`)) {
      onDeleteMultipleItems(Array.from(selectedItemIds));
      setSelectedItemIds(new Set());
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Archivos Multimedia</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {items.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {libraries.length} bibliotecas configuradas
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Almacenamiento Virtualizado</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {formatBytes(totalOriginalSize)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Espacio físico ahorrado en ZimaOS
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Peso Total Archivos .STRM</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tabular-nums mt-1">
            {formatBytes(totalStrmSizeEstimate)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Transferencia casi instantánea
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Host de Streaming Remoto</div>
          <div className="text-sm font-semibold text-white font-mono truncate mt-2" title={network.duckDnsDomain}>
            {network.duckDnsDomain}
          </div>
          <div className="text-xs text-indigo-400 mt-1 font-mono">
            {network.protocol.toUpperCase()} :{network.port} · Range OK
          </div>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, película o episodio..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Import / Add Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden file input for folder select */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderSelect}
              // @ts-expect-error webkitdirectory is standard in Chromium/modern browsers
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />

            <button
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Escanea una carpeta local o montaje NAS sin subir los archivos de video"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escanear Carpeta Local</span>
            </button>

            <button
              onClick={() => setIsTextImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Pegar lista de rutas de find, tree o texto"
            >
              <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pegar Rutas (Batch)</span>
            </button>

            <button
              onClick={() => setIsManualAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Añadir Manual</span>
            </button>

            <button
              onClick={onResetSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
              title="Cargar catálogo de prueba con películas y series reales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Demos</span>
            </button>
          </div>
        </div>

        {/* Library Filter Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedLibraryId('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedLibraryId === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({items.length})
            </button>

            {libraries.map((lib) => {
              const count = items.filter((i) => i.libraryId === lib.id).length;
              const isSelected = selectedLibraryId === lib.id;

              return (
                <button
                  key={lib.id}
                  onClick={() => setSelectedLibraryId(lib.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lib.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            {selectedItemIds.size > 0 && (
              <>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedItemIds.size} seleccionados
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-950/40 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                const filesToExport =
                  selectedItemIds.size > 0
                    ? generatedStrmFiles.filter((f) => selectedItemIds.has(f.id))
                    : generatedStrmFiles;
                downloadM3uPlaylist(filesToExport, network, 'videoteca_portable.m3u');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
              title="Descarga una lista de reproducción universal M3U portátil compatible con VLC, Infuse, Kodi y Smart TV"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>M3U Portable</span>
            </button>

            <button
              onClick={handleDownloadFilteredZip}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
              title="Descarga los archivos .strm organizados en carpetas idénticas al origen"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {selectedItemIds.size > 0
                  ? `Descargar ZIP (${selectedItemIds.size})`
                  : `Descargar Todos (${filteredItems.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Media & STRM Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-white"
                    title="Seleccionar todos"
                  >
                    {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Título / Archivo Origen</th>
                <th className="py-3 px-4 hidden lg:table-cell">Biblioteca</th>
                <th className="py-3 px-4 hidden sm:table-cell">Archivo .STRM Generado</th>
                <th className="py-3 px-4">URL de Streaming (DuckDNS / NPM)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Film className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-400">
                      No se encontraron elementos multimedia
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Usa el botón "Escanear Carpeta Local", "Pegar Rutas" o "Restablecer Demos".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const strm = strmById.get(item.id);
                  const isSelected = selectedItemIds.has(item.id);
                  const isCopied = copiedUrlId === item.id;

                  if (!strm) return null;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleSelectItem(item.id)}
                          className="text-slate-500 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{item.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs sm:max-w-md">
                          {item.relativePath}
                        </div>
                      </td>

                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-slate-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {strm.libraryName}
                        </span>
                      </td>

                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-indigo-300 font-mono text-[11px]">
                          {strm.strmFileName}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 max-w-xs sm:max-w-md">
                          <code className="text-slate-300 font-mono text-[11px] truncate select-all bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                            {strm.streamUrl}
                          </code>
                          <button
                            onClick={() => handleCopyUrl(item.id, strm.streamUrl)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 shrink-0"
                            title="Copiar URL"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 shrink-0">
                          <button
                            onClick={() => downloadSingleStrm(strm)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                            title="Descargar archivo .strm individual"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onTestUrl(strm.streamUrl)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                            title="Probar en el reproductor de streaming y verificar HTTP Range"
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setInspectItem(strm)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Inspeccionar archivo y sintaxis VLC / Plex"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando {filteredItems.length} de {items.length} elementos
          </div>
          <div className="text-slate-400">
            Formato: 1 URL por archivo .strm · Compatible con Plex, Jellyfin, Emby y VLC
          </div>
        </div>
      </div>

      {/* Text Batch Import Modal */}
      {isTextImportOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-400" />
                <span>Importación Masiva de Rutas (Batch)</span>
              </h3>
              <button
                onClick={() => setIsTextImportOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asignar a Biblioteca
              </label>
              <select
                value={textImportLibId}
                onChange={(e) => setTextImportLibId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name} ({lib.remoteHttpPath})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pega la lista de archivos (uno por línea o salida de <code className="text-indigo-300">find</code> / <code className="text-indigo-300">ls -R</code>)
              </label>
              <textarea
                rows={8}
                value={textImportContent}
                onChange={(e) => setTextImportContent(e.target.value)}
                placeholder={`Avatar (2009)/Avatar (2009).mkv\nGladiator (2000)/Gladiator (2000).mp4\nBreaking Bad/Season 01/S01E01.mkv\nBreaking Bad/Season 01/S01E02.mkv`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Se limpiarán las rutas automáticamente y se generará un archivo .strm para cada video.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTextImportOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTextImportSubmit}
                disabled={!textImportContent.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:opacity-50 transition-colors"
              >
                Procesar y Generar .STRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Single Add Modal */}
      {isManualAddOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleManualAddSubmit}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-400" />
                <span>Añadir Archivo Multimedia Manual</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManualAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Biblioteca
              </label>
              <select
                value={manualLibId}
                onChange={(e) => setManualLibId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Título Descriptivo (Opcional)
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="The Matrix (1999)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ruta Relativa del Archivo
              </label>
              <input
                type="text"
                required
                value={manualRelPath}
                onChange={(e) => setManualRelPath(e.target.value)}
                placeholder="The Matrix (1999)/The Matrix.mkv"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Respeta las subcarpetas de temporada o película para que Plex/Jellyfin lo identifique de forma óptima.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsManualAddOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Añadir a la Lista
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">
                  Inspección de Archivo: {inspectItem.strmFileName}
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">
                  Contenido exacto del archivo .strm (1 sola línea de URL):
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                  {inspectItem.streamUrl}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Ruta relativa destino:</span>
                  <div className="font-mono text-slate-300 break-all mt-0.5">
                    {inspectItem.relativeStrmPath}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Comando para VLC:</span>
                  <div className="font-mono text-indigo-300 break-all mt-0.5 select-all">
                    vlc "{inspectItem.streamUrl}"
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">
                  ¿Cómo procesa este archivo tu servidor ZimaOS / CasaOS?
                </p>
                <p>
                  Cuando Jellyfin, Plex o Emby en CasaOS detecta este archivo <code className="text-slate-300">.strm</code>, extrae la URL y abre la conexión remota HTTPS con tu servidor DuckDNS. Al tener activada la cabecera Range y desactivado el buffer en Nginx Proxy Manager, la reproducción comienza en menos de 2 segundos sin pausas por buffer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onTestUrl(inspectItem.streamUrl);
                  setInspectItem(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg hover:bg-emerald-900/50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Probar Reproductor</span>
              </button>

              <button
                type="button"
                onClick={() => downloadSingleStrm(inspectItem)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .strm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
