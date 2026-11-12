import React, { useState, useRef } from 'react';
import {
  NetworkConfig,
  LibraryDirectory,
  MediaItem,
  GeneratedStrmFile,
  PortabilityAuditResult,
  MigratedStrmItem,
} from '../types/strm';
import {
  auditPortability,
  generateStrmFiles,
  downloadM3uPlaylist,
  migrateExistingStrmZip,
  formatBytes,
} from '../utils/strmGenerator';
import {
  ShieldCheck,
  Globe,
  Wifi,
  Lock,
  Upload,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  Smartphone,
  Tv,
  Check,
  Copy,
} from 'lucide-react';

interface PortabilityTabProps {
  network: NetworkConfig;
  libraries: LibraryDirectory[];
  items: MediaItem[];
  onUpdateNetwork: (updated: Partial<NetworkConfig>) => void;
  onTestUrl: (url: string) => void;
}

export const PortabilityTab: React.FC<PortabilityTabProps> = ({
  network,
  libraries,
  items,
  onUpdateNetwork,
  onTestUrl,
}) => {
  const [activeProfile, setActiveProfile] = useState<'remote' | 'local' | 'tailscale'>('remote');
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [migratedItems, setMigratedItems] = useState<MigratedStrmItem[]>([]);
  const [migratedZipBlob, setMigratedZipBlob] = useState<Blob | null>(null);
  const [isCopiedM3u, setIsCopiedM3u] = useState(false);

  const zipInputRef = useRef<HTMLInputElement | null>(null);

  // Compute generated strm files
  const strmFiles = React.useMemo(() => {
    return generateStrmFiles(items, libraries, network);
  }, [items, libraries, network]);

  // Run portability audit on sample URL
  const sampleUrl = strmFiles[0]?.streamUrl || `https://${network.duckDnsDomain}/movies/sample.mkv`;
  const audit: PortabilityAuditResult = React.useMemo(() => {
    return auditPortability(sampleUrl);
  }, [sampleUrl]);

  // Profile presets
  const applyProfile = (profile: 'remote' | 'local' | 'tailscale') => {
    setActiveProfile(profile);
    if (profile === 'remote') {
      onUpdateNetwork({
        protocol: 'https',
        port: 443,
        sslVerify: true,
      });
    } else if (profile === 'local') {
      onUpdateNetwork({
        protocol: 'http',
        port: 8085,
        duckDnsDomain: 'zimaos.local',
        sslVerify: false,
      });
    } else if (profile === 'tailscale') {
      onUpdateNetwork({
        protocol: 'http',
        port: 8085,
        duckDnsDomain: '100.100.100.100',
        sslVerify: false,
      });
    }
  };

  // Handle existing ZIP migration
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMigrationStatus('processing');
    try {
      const result = await migrateExistingStrmZip(file, network);
      setMigratedItems(result.migratedItems);
      setMigratedZipBlob(result.newZipBlob);
      setMigrationStatus('done');
    } catch (err) {
      alert('Error al leer el archivo ZIP. Asegúrate de que contenga archivos .strm válidos.');
      setMigrationStatus('idle');
    }

    if (zipInputRef.current) {
      zipInputRef.current.value = '';
    }
  };

  const downloadMigratedZip = () => {
    if (!migratedZipBlob) return;
    const url = URL.createObjectURL(migratedZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strm_migrado_portable_${network.duckDnsDomain.replace(/[^a-z0-9]/gi, '_')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Portability Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                Portabilidad Universal de Medios
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Archivos .STRM 100% Portables e Independientes del Hardware
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Los archivos <code className="text-indigo-300 font-mono">.strm</code> pesan sólo ~150 bytes y actúan como punteros agnósticos. Puedes moverlos a cualquier ZimaOS, CasaOS, Unraid, TrueNAS, PC con Windows o VLC en tu teléfono móvil sin transferir terabytes de video.
            </p>
          </div>

          {/* Audit Score Capsule */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shrink-0">
            <div>
              <div className="text-xs text-slate-400">Score de Portabilidad</div>
              <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                <span className={audit.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  {audit.score}%
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  {audit.level === 'optimal' ? 'Óptimo' : 'Revisar'}
                </span>
              </div>
            </div>
            <ShieldCheck className={`w-8 h-8 ${audit.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
        </div>

        {/* Audit Details */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {audit.checks.slice(0, 4).map((check, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg space-y-1"
            >
              <div className="flex items-center gap-1.5 font-medium">
                {check.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className={check.passed ? 'text-slate-200' : 'text-amber-300'}>
                  {check.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {check.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Portability Profiles */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Perfiles de Portabilidad y Entorno
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Selecciona el entorno donde se utilizarán tus archivos .strm para adaptar el generador con 1 solo clic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Profile 1 */}
          <div
            onClick={() => applyProfile('remote')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              activeProfile === 'remote'
                ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Globe className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                100% Remoto
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-3">
              Global FQDN (DuckDNS + HTTPS)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Máxima portabilidad. Funciona en cualquier parte del mundo desde cualquier conexión (WiFi, 4G, ZimaOS en otra ubicación geográfica).
            </p>
            <div className="mt-3 text-[11px] font-mono text-indigo-300 truncate">
              https://{network.duckDnsDomain}:443/...
            </div>
          </div>

          {/* Profile 2 */}
          <div
            onClick={() => applyProfile('local')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              activeProfile === 'local'
                ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Wifi className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Red Local (LAN)
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-3">
              LAN Directa / mDNS (zimaos.local)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Para cuando tu cliente y tu servidor están en la misma casa y prefieres evitar el tráfico por internet externo.
            </p>
            <div className="mt-3 text-[11px] font-mono text-emerald-300 truncate">
              http://zimaos.local:8085/...
            </div>
          </div>

          {/* Profile 3 */}
          <div
            onClick={() => applyProfile('tailscale')}
            className={`cursor-pointer rounded-xl p-4 border transition-all ${
              activeProfile === 'tailscale'
                ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <Lock className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] uppercase font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800">
                VPN Malla
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-3">
              Red Privada / Tailscale VPN
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Transmisión cifrada punto a punto entre servidores sin necesidad de abrir ningún puerto en el router de tu operadora.
            </p>
            <div className="mt-3 text-[11px] font-mono text-amber-300 truncate">
              http://100.x.y.z:8085/...
            </div>
          </div>
        </div>
      </div>

      {/* Batch Migration / URL Rewriter Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Migrador & Reescribidor en Lote de Archivos .STRM</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ¿Cambiaste de subdominio DuckDNS, de puerto o de servidor? Sube tu archivo ZIP existente y STRM Bridge actualizará todas las URLs en 1 segundo.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={zipInputRef}
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
            />
            <button
              onClick={() => zipInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir ZIP de .STRM Existentes</span>
            </button>
          </div>
        </div>

        {migrationStatus === 'processing' && (
          <div className="py-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
            <p>Procesando y reescribiendo URLs al nuevo dominio: {network.duckDnsDomain}...</p>
          </div>
        )}

        {migrationStatus === 'done' && (
          <div className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">
                    ¡Migración completada con éxito!
                  </div>
                  <div className="text-xs text-emerald-300">
                    Se actualizaron {migratedItems.length} archivos .strm con la nueva configuración de red ({network.duckDnsDomain}).
                  </div>
                </div>
              </div>

              <button
                onClick={downloadMigratedZip}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar ZIP Migrado</span>
              </button>
            </div>

            {/* Preview of first 5 migrated items */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 space-y-2 text-xs font-mono">
              <div className="text-slate-400 font-sans font-medium text-[11px] uppercase tracking-wider">
                Muestra de URLs transformadas:
              </div>
              {migratedItems.slice(0, 4).map((item, idx) => (
                <div key={idx} className="border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                  <div className="text-slate-300 font-semibold">{item.fileName}</div>
                  <div className="text-slate-500 line-through truncate text-[11px]">{item.oldUrl}</div>
                  <div className="text-emerald-300 truncate text-[11px]">→ {item.newUrl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {migrationStatus === 'idle' && (
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-200">
              ¿Por qué es importante el reescritor de URLs para la portabilidad?
            </div>
            <p>
              Tradicionalmente, si tenías 2,000 películas con un dominio y cambiabas de proveedor o servidor, debías reescribir manualmente cada archivo o usar comandos complejos de sed/regex en Linux.
              Con esta herramienta, simplemente arrastras tu ZIP y el sistema ajusta el protocolo, puerto, usuario, contraseña y dominio respetando intacta la estructura de carpetas de Plex y Jellyfin.
            </p>
          </div>
        )}
      </div>

      {/* Universal M3U Playlist Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Lista Universal M3U Portátil (Para Cualquier Dispositivo)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Un único archivo de lista de reproducción que puedes abrir directamente en VLC (PC/Mac/Android/iOS), Infuse en Apple TV, Kodi o Smart TV sin necesidad de instalar o mantener un servidor Jellyfin/Plex.
            </p>
          </div>

          <button
            onClick={() => downloadM3uPlaylist(strmFiles, network)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shrink-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar videoteca_portable.m3u</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>VLC Móvil & Tablet</span>
            </div>
            <p className="text-slate-400">
              Envía el archivo .m3u a tu teléfono y reproduce al instante cualquier película por 4G o WiFi.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>Apple TV & Smart TV</span>
            </div>
            <p className="text-slate-400">
              Compatible con Infuse, TiviMate, IPTV Smarters o Kodi con saltos de tiempo y selección de audio.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero-Config Client</span>
            </div>
            <p className="text-slate-400">
              No requiere iniciar sesión en servidores; la URL encriptada HTTPS se encarga de todo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
