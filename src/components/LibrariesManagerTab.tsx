import React, { useState } from 'react';
import { LibraryDirectory, MediaCategory } from '../types/strm';
import { FolderPlus, Folder, Film, Clapperboard, Tv, Sparkles, Trash2, Edit2, Check, X, Info } from 'lucide-react';

interface LibrariesManagerTabProps {
  libraries: LibraryDirectory[];
  onAddLibrary: (lib: LibraryDirectory) => void;
  onUpdateLibrary: (id: string, updated: Partial<LibraryDirectory>) => void;
  onDeleteLibrary: (id: string) => void;
  itemCountByLibrary: Record<string, number>;
}

export const LibrariesManagerTab: React.FC<LibrariesManagerTabProps> = ({
  libraries,
  onAddLibrary,
  onUpdateLibrary,
  onDeleteLibrary,
  itemCountByLibrary,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New library form state
  const [newLib, setNewLib] = useState<Omit<LibraryDirectory, 'id'>>({
    name: '',
    category: 'movies',
    sourceHostPath: '/DATA/Media/NuevasPeliculas',
    remoteHttpPath: '/nuevas-peliculas',
    zimaOsStrmPath: '/DATA/Media/STRM/NuevasPeliculas',
    allowedExtensions: ['.mkv', '.mp4', '.avi'],
    description: '',
  });

  const [extInput, setExtInput] = useState('.mkv, .mp4, .avi');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLib.name.trim()) return;

    const parsedExts = extInput
      .split(',')
      .map((ext) => ext.trim().toLowerCase())
      .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
      .filter(Boolean);

    const created: LibraryDirectory = {
      ...newLib,
      id: `lib-${Date.now()}`,
      allowedExtensions: parsedExts.length > 0 ? parsedExts : ['.mkv', '.mp4'],
      remoteHttpPath: newLib.remoteHttpPath.startsWith('/')
        ? newLib.remoteHttpPath
        : `/${newLib.remoteHttpPath}`,
    };

    onAddLibrary(created);
    setIsAdding(false);
    setNewLib({
      name: '',
      category: 'movies',
      sourceHostPath: '/DATA/Media/',
      remoteHttpPath: '/',
      zimaOsStrmPath: '/DATA/Media/STRM/',
      allowedExtensions: ['.mkv', '.mp4'],
      description: '',
    });
  };

  const getCategoryIcon = (cat: MediaCategory) => {
    switch (cat) {
      case 'movies':
        return <Film className="w-4 h-4 text-indigo-400" />;
      case 'series':
        return <Tv className="w-4 h-4 text-emerald-400" />;
      case 'anime':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      default:
        return <Clapperboard className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gestor de Directorios y Bibliotecas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Añade o modifica directorios de películas, series, documentales o colecciones 4K. Puedes expandir tus carpetas en cualquier momento para mantener la transmisión remota sin interrupciones.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shrink-0"
        >
          {isAdding ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
          <span>{isAdding ? 'Cancelar' : 'Añadir Directorio'}</span>
        </button>
      </div>

      {/* Add New Library Form Modal/Card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 space-y-4 shadow-lg shadow-indigo-950/20"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>Nuevo Directorio Multimedia</span>
            </h3>
            <span className="text-xs text-slate-400">Modificación futura de rutas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre de la Biblioteca
              </label>
              <input
                type="text"
                required
                value={newLib.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const slug = val
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                  setNewLib({
                    ...newLib,
                    name: val,
                    remoteHttpPath: `/${slug}`,
                    sourceHostPath: `/DATA/Media/${val.replace(/\s+/g, '')}`,
                    zimaOsStrmPath: `/DATA/Media/STRM/${val.replace(/\s+/g, '')}`,
                  });
                }}
                placeholder="ej: Documentales 1080p, Anime 4K, Películas Familiares"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo / Categoría de Contenido
              </label>
              <select
                value={newLib.category}
                onChange={(e) =>
                  setNewLib({ ...newLib, category: e.target.value as MediaCategory })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="movies">Películas (Estructura: Película / Película.mkv)</option>
                <option value="series">Series de TV (Estructura: Serie / Season 01 / S01E01.mkv)</option>
                <option value="anime">Anime y Animación</option>
                <option value="documentaries">Documentales</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ruta Origen (Host con Discos)
              </label>
              <input
                type="text"
                required
                value={newLib.sourceHostPath}
                onChange={(e) => setNewLib({ ...newLib, sourceHostPath: e.target.value })}
                placeholder="/DATA/Media/Documentales"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ruta absoluta en el servidor donde residen los archivos MKV/MP4 pesados.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ruta HTTP Remota (NPM / URL)
              </label>
              <input
                type="text"
                required
                value={newLib.remoteHttpPath}
                onChange={(e) => setNewLib({ ...newLib, remoteHttpPath: e.target.value })}
                placeholder="/documentales"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Segmento de URL en Nginx Proxy Manager (ej: <code className="text-slate-400">/documentales</code>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ruta Destino en ZimaOS / CasaOS
              </label>
              <input
                type="text"
                required
                value={newLib.zimaOsStrmPath}
                onChange={(e) => setNewLib({ ...newLib, zimaOsStrmPath: e.target.value })}
                placeholder="/DATA/Media/STRM/Documentales"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Donde Plex/Jellyfin en CasaOS leerá los archivos .strm ligeros.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Extensiones de Video Permitidas
              </label>
              <input
                type="text"
                value={extInput}
                onChange={(e) => setExtInput(e.target.value)}
                placeholder=".mkv, .mp4, .avi, .ts, .m2ts"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Separadas por coma. Cualquier archivo con estas extensiones se convertirá en .strm
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Guardar Directorio
            </button>
          </div>
        </form>
      )}

      {/* Libraries List */}
      <div className="space-y-4">
        {libraries.map((lib) => {
          const itemCount = itemCountByLibrary[lib.id] || 0;
          const isEditing = editingId === lib.id;

          return (
            <div
              key={lib.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all text-slate-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {getCategoryIcon(lib.category)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-semibold text-white">{lib.name}</h4>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        {itemCount} {itemCount === 1 ? 'archivo' : 'archivos'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      {lib.description || `Biblioteca de ${lib.category} para streaming remoto.`}
                    </p>

                    {/* Path mapping tags */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
                      <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-slate-300">
                        <span className="text-slate-500">Origen:</span> {lib.sourceHostPath}
                      </div>
                      <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-indigo-300">
                        <span className="text-slate-500">URL HTTP:</span> {lib.remoteHttpPath}
                      </div>
                      <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-emerald-300">
                        <span className="text-slate-500">ZimaOS STRM:</span> {lib.zimaOsStrmPath}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar la biblioteca "${lib.name}"? Los archivos asociados se retirarán de la lista.`)) {
                        onDeleteLibrary(lib.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Eliminar directorio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Future Modifications Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            Escalabilidad y Modificaciones Futuras
          </p>
          <p>
            Al añadir un nuevo directorio aquí, tanto el generador web de archivos <code className="text-slate-300">.strm</code> como los scripts automáticos de sincronización y las plantillas Docker Compose se actualizan al instante para incluir los nuevos montajes y rutas sin reiniciar todo el servidor.
          </p>
        </div>
      </div>
    </div>
  );
};
