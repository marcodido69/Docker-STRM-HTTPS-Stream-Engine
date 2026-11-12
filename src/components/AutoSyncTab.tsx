import React, { useState } from 'react';
import { NetworkConfig, LibraryDirectory } from '../types/strm';
import { generatePythonSyncScript, generateBashSyncScript } from '../utils/syncScripts';
import { Copy, Check, Download, Terminal, RefreshCw, Cpu, Clock, CheckCircle2 } from 'lucide-react';

interface AutoSyncTabProps {
  network: NetworkConfig;
  libraries: LibraryDirectory[];
}

export const AutoSyncTab: React.FC<AutoSyncTabProps> = ({ network, libraries }) => {
  const [activeLang, setActiveLang] = useState<'python' | 'bash'>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pythonScript = generatePythonSyncScript(network, libraries);
  const bashScript = generateBashSyncScript(network, libraries);

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Auto-Sincronizador (Daemon & Scripts de Automatización)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Ejecuta estos scripts directamente en tu ZimaOS / CasaOS o en tu servidor de origen para detectar nuevas películas y series automáticamente sin intervención manual.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeLang === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Script Python 3
            </button>
            <button
              onClick={() => setActiveLang('bash')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeLang === 'bash' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Script Bash (.sh)
            </button>
          </div>
        </div>

        {/* Script Content Viewer */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              {activeLang === 'python' ? 'strm_sync_daemon.py' : 'strm_sync_generator.sh'} (Auto-generado con tus rutas y DuckDNS)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleCopy(
                    activeLang,
                    activeLang === 'python' ? pythonScript : bashScript
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {copiedKey === activeLang ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copiar Script</span>
              </button>

              <button
                onClick={() =>
                  handleDownload(
                    activeLang === 'python' ? 'strm_sync_daemon.py' : 'strm_sync_generator.sh',
                    activeLang === 'python' ? pythonScript : bashScript
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto select-all leading-relaxed max-h-[480px]">
            {activeLang === 'python' ? pythonScript : bashScript}
          </pre>
        </div>
      </div>

      {/* Cron / Automation Setup Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-slate-200">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Programar Ejecución Automática (Cada 2 horas en CasaOS / ZimaOS)</span>
        </h3>

        <p className="text-xs text-slate-400">
          Para que los archivos <code className="text-indigo-300 font-mono">.strm</code> se generen solos cuando descargas un nuevo episodio o película, programa una tarea con cron en la terminal de CasaOS:
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-300 select-all">
          # 1. Abre el editor de cron en tu servidor:{'\n'}
          crontab -e{'\n\n'}
          # 2. Pega esta línea al final para ejecutar cada 2 horas:{'\n'}
          0 */2 * * * /usr/bin/python3 /DATA/AppData/strm-bridge/strm_sync_daemon.py &gt;&gt; /DATA/AppData/strm-bridge/sync.log 2&gt;&amp;1
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-indigo-400">Detección de Nuevos Archivos</span>
            <p className="text-slate-400">
              Comprueba si el archivo .strm ya existe para no reescribirlo innecesariamente.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-emerald-400">Actualización en Plex / Jellyfin</span>
            <p className="text-slate-400">
              Plex y Jellyfin detectan la aparición del .strm y descargan portadas y metadatos al instante.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-amber-400">Cero Consumo de Disco</span>
            <p className="text-slate-400">
              Cada nuevo archivo .strm ocupa únicamente 150 bytes en tu ZimaOS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
