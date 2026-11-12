import React, { useState } from 'react';
import { NetworkConfig, LibraryDirectory } from '../types/strm';
import {
  getNpmAdvancedConfig,
  getOriginServerDockerCompose,
  getOriginNginxConf,
  getZimaOsCasaOsCompose,
} from '../utils/dockerTemplates';
import {
  Copy,
  Check,
  Download,
  Server,
  Layers,
  ShieldCheck,
  Tv,
  Film,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';

interface DockerComposeTabProps {
  network: NetworkConfig;
  libraries: LibraryDirectory[];
}

export const DockerComposeTab: React.FC<DockerComposeTabProps> = ({
  network,
  libraries,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'npm' | 'origin' | 'destination' | 'vlc'>('npm');
  const [targetMediaApp, setTargetMediaApp] = useState<'jellyfin' | 'plex' | 'emby'>('jellyfin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const npmConfig = getNpmAdvancedConfig();
  const originCompose = getOriginServerDockerCompose(network, libraries);
  const originNginxConf = getOriginNginxConf(network, libraries);
  const destinationCompose = getZimaOsCasaOsCompose(targetMediaApp, libraries);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Overview & Subtabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Despliegue Docker Compose & Nginx Proxy Manager
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Plantillas YAML listas para desplegar en tu Servidor Origen (donde están los discos) y en tu Servidor Destino (ZimaOS / CasaOS) con Jellyfin, Plex, Emby y VLC.
          </p>
        </div>

        {/* Subtabs navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab('npm')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'npm'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>NPM: Streaming sin Cortes (Avanzado)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('origin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'origin'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-300" />
            <span>Servidor Origen (Discos + DuckDNS + NPM)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('destination')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'destination'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-300" />
            <span>ZimaOS / CasaOS (Jellyfin / Plex / Emby)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vlc')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'vlc'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-300" />
            <span>Reproductor VLC & Clientes Directos</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: NPM ADVANCED CONFIG */}
      {activeSubTab === 'npm' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Reglas de Nginx Proxy Manager para Transmisión Continua
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pega este bloque en Nginx Proxy Manager: <code className="text-indigo-300 font-mono">Edit Proxy Host → Pestaña "Advanced"</code>
                </p>
              </div>

              <button
                onClick={() => handleCopy('npm-adv', npmConfig)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shrink-0"
              >
                {copiedKey === 'npm-adv' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'npm-adv' ? '¡Copiado!' : 'Copiar Configuración'}</span>
              </button>
            </div>

            {/* Code Box */}
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto select-all leading-relaxed">
              {npmConfig}
            </pre>

            {/* Directive Explanation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-indigo-400">1. proxy_buffering off;</div>
                <p className="text-slate-400">
                  Impide que NPM intente guardar en RAM archivos MKV de 30GB. El stream fluye de inmediato directo al reproductor.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-emerald-400">2. proxy_set_header Range;</div>
                <p className="text-slate-400">
                  Permite saltar a cualquier minuto de la película (seeking) sin descargar el video desde el inicio.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-400">3. timeouts 1800s;</div>
                <p className="text-slate-400">
                  Evita que la conexión se corte si pausas la película o en escenas largas con bajo ancho de banda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ORIGIN SERVER */}
      {activeSubTab === 'origin' && (
        <div className="space-y-6">
          {/* docker-compose.yml */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  docker-compose.yml (Servidor Origen)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Levanta Nginx Proxy Manager, el contenedor DuckDNS y el servidor de medios local.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('origin-compose', originCompose)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copiedKey === 'origin-compose' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar</span>
                </button>
                <button
                  onClick={() => downloadFile('docker-compose-origen.yml', originCompose)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .yml</span>
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto select-all leading-relaxed">
              {originCompose}
            </pre>
          </div>

          {/* nginx-media.conf */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  nginx-media.conf (Configuración del servidor de medios)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Coloca este archivo en la misma carpeta que el <code className="text-slate-300 font-mono">docker-compose.yml</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('nginx-media-conf', originNginxConf)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copiedKey === 'nginx-media-conf' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar</span>
                </button>
                <button
                  onClick={() => downloadFile('nginx-media.conf', originNginxConf)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .conf</span>
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto select-all leading-relaxed">
              {originNginxConf}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DESTINATION SERVER (ZIMAOS / CASAOS) */}
      {activeSubTab === 'destination' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            {/* App Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Servidor Destino ZimaOS / CasaOS: Docker Compose
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona la aplicación de medios que deseas desplegar en tu instancia remota.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTargetMediaApp('jellyfin')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    targetMediaApp === 'jellyfin'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Jellyfin
                </button>
                <button
                  onClick={() => setTargetMediaApp('plex')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    targetMediaApp === 'plex'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Plex
                </button>
                <button
                  onClick={() => setTargetMediaApp('emby')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    targetMediaApp === 'emby'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Emby
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleCopy('dest-compose', destinationCompose)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {copiedKey === 'dest-compose' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar YAML</span>
              </button>
              <button
                onClick={() => downloadFile(`docker-compose-${targetMediaApp}-strm.yml`, destinationCompose)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Compose</span>
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto select-all leading-relaxed">
              {destinationCompose}
            </pre>

            {/* CasaOS / ZimaOS installation instructions */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Cómo importar en ZimaOS / CasaOS:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 ml-1">
                <li>Abre el panel de control de tu CasaOS o ZimaOS.</li>
                <li>Haz clic en el icono <strong className="text-slate-200">+</strong> (Instalar aplicación personalizada / Custom App).</li>
                <li>En la esquina superior derecha de la ventana modal, haz clic en <strong className="text-indigo-400">Import</strong>.</li>
                <li>Pega el código YAML de arriba y haz clic en <strong className="text-slate-200">Submit / Instalar</strong>.</li>
                <li>
                  ¡Listo! Tus carpetas <code className="text-slate-200">/DATA/Media/STRM/</code> ya estarán montadas para que {targetMediaApp.toUpperCase()} las indexe de inmediato.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: VLC & DIRECT CLIENTS */}
      {activeSubTab === 'vlc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 text-slate-200">
          <div>
            <h3 className="text-base font-semibold text-white">
              Reproducción Directa con VLC Media Player
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              VLC es el reproductor más versátil y eficiente para archivos <code className="text-indigo-300 font-mono">.strm</code> y streaming HTTP/HTTPS directo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="text-sm font-semibold text-indigo-400">Método 1: Abrir archivo .strm</div>
              <p className="text-xs text-slate-400">
                Simplemente arrastra cualquier archivo <code className="text-slate-300">.strm</code> generado por STRM Bridge a la ventana de VLC. VLC leerá la URL en 5 milisegundos y empezará a reproducir el video por HTTPS.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="text-sm font-semibold text-indigo-400">Método 2: Volcado de Red (Ctrl + N)</div>
              <p className="text-xs text-slate-400">
                En VLC: Menú <strong className="text-slate-200">Medio → Abrir emisión de red...</strong> (Ctrl + N) y pega la URL generada. Admite avance rápido y selección de pistas de audio y subtítulos.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Consejo de Optimización para VLC (Cero buffering):
            </div>
            <p className="text-xs text-slate-300">
              Si tu conexión a internet remota tiene cierta inestabilidad, ve a <code className="text-slate-400">VLC → Herramientas → Preferencias → Todo (abajo) → Entrada / Códecs</code> y busca <strong className="text-slate-200">Almacenamiento en caché de red (ms)</strong>. Cámbialo de 1000 ms a <strong className="text-indigo-400">3000 ms</strong>. Esto pre-almacena 3 segundos de buffer eliminando cualquier micro-corte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
