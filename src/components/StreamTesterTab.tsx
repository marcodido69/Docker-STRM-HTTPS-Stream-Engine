import React, { useState, useRef } from 'react';
import { NetworkConfig } from '../types/strm';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

interface StreamTesterTabProps {
  network: NetworkConfig;
  testUrl: string;
  setTestUrl: (url: string) => void;
}

export const StreamTesterTab: React.FC<StreamTesterTabProps> = ({
  network,
  testUrl,
  setTestUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    details: string[];
  }>({ status: 'idle', message: '', details: [] });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sample public direct-stream URLs for in-browser testing
  const sampleStreams = [
    {
      name: 'Big Buck Bunny (1080p MP4 Direct Stream)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      name: 'Tears of Steel (4K Sci-Fi Direct Stream)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    },
    {
      name: 'Sintel (Animation Direct Stream)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  ];

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const runUrlDiagnostic = () => {
    setIsDiagnosticRunning(true);
    const details: string[] = [];

    // Analyze URL structure
    try {
      const parsed = new URL(testUrl);
      details.push(`Protocolo: ${parsed.protocol}`);
      details.push(`Host: ${parsed.hostname}`);
      details.push(`Puerto: ${parsed.port || (parsed.protocol === 'https:' ? '443 (default)' : '80 (default)')}`);
      details.push(`Ruta: ${parsed.pathname}`);

      if (parsed.username) {
        details.push(`Autenticación Basic Auth detectada (Usuario: ${parsed.username})`);
      }

      if (parsed.searchParams.toString()) {
        details.push(`Parámetros de consulta: ${parsed.searchParams.toString()}`);
      }

      const hasVideoExt = /\.(mkv|mp4|avi|mov|m2ts|ts)$/i.test(parsed.pathname);
      if (hasVideoExt) {
        details.push(`Extensión de video válida detectada (${parsed.pathname.split('.').pop()})`);
      } else {
        details.push(`Aviso: La ruta no termina con una extensión de video clásica (.mkv, .mp4)`);
      }

      setDiagnosticResult({
        status: 'success',
        message: 'Sintaxis de URL válida para archivos .strm en Plex, Jellyfin, Emby y VLC.',
        details,
      });
    } catch {
      setDiagnosticResult({
        status: 'error',
        message: 'La URL no tiene un formato web válido. Asegúrate de incluir http:// o https://.',
        details: ['Error de sintaxis URI'],
      });
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const copyVlcCommand = () => {
    const cmd = `vlc "${testUrl}"`;
    navigator.clipboard.writeText(cmd);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      {/* Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Probador de Stream & Verificador de HTTP Range
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Verifica que la URL generada para tu archivo <code className="text-indigo-300 font-mono">.strm</code> sea accesible, acepte avance rápido (Range Requests) y reproduzca sin interrupciones.
        </p>

        {/* Input URL Box */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://casamedia.duckdns.org/movies/Inception.mkv"
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={runUrlDiagnostic}
              disabled={!testUrl || isDiagnosticRunning}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
              Verificar URL
            </button>
            <button
              onClick={copyVlcCommand}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
              title="Copiar comando para VLC terminal"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Comando VLC</span>
            </button>
          </div>
        </div>

        {/* Sample presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">Streams públicos de prueba para verificar reproductor:</span>
          {sampleStreams.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTestUrl(sample.url);
                if (videoRef.current) {
                  videoRef.current.src = sample.url;
                  videoRef.current.load();
                }
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              {sample.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics Result Card */}
      {diagnosticResult.status !== 'idle' && (
        <div
          className={`border rounded-xl p-5 ${
            diagnosticResult.status === 'success'
              ? 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
              : 'bg-red-950/20 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {diagnosticResult.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{diagnosticResult.message}</h4>
              <ul className="list-disc list-inside space-y-0.5 text-xs font-mono opacity-90">
                {diagnosticResult.details.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* HTML5 Video Player Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo-400" />
            <span>Reproductor de Streaming Directo (HTML5 Range Inspector)</span>
          </span>
          <span className="font-mono text-slate-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="relative bg-black flex items-center justify-center min-h-[340px]">
          <video
            ref={videoRef}
            src={testUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full max-h-[460px] object-contain"
            controls={false}
          />

          {!isPlaying && duration === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <Play className="w-12 h-12 text-indigo-400 mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-200">
                Haz clic en Reproducir para probar el flujo de red
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Si tu servidor de DuckDNS y Nginx Proxy Manager están en línea, el video cargará directamente.
              </p>
            </div>
          )}
        </div>

        {/* Custom Video Controls */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
          {/* Progress / Seek bar */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="p-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="text-xs font-mono text-slate-400 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Pantalla Completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Matrix for Uninterrupted Streaming */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Guía de Solución de Problemas: Transmisión sin Cortes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">¿El video se corta a los 10 o 30 segundos?</div>
            <p className="text-slate-400">
              Causa: Nginx Proxy Manager tiene activado el buffer de proxy por defecto e intenta meter todo el archivo en la memoria del host.
            </p>
            <p className="text-emerald-400 font-mono">
              Solución: Asegúrate de incluir <span className="underline">proxy_buffering off;</span> en la pestaña "Advanced" de tu host en NPM.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">¿No se puede avanzar rápido (Seeking) en VLC o Jellyfin?</div>
            <p className="text-slate-400">
              Causa: El servidor web no está pasando la cabecera HTTP Range o gzip está comprimiendo la respuesta binaria.
            </p>
            <p className="text-emerald-400 font-mono">
              Solución: Añade <span className="underline">proxy_set_header Range $http_range;</span> y desactiva gzip.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">¿Error 401 Unauthorized?</div>
            <p className="text-slate-400">
              Causa: Usuario o contraseña con caracteres especiales no codificados o credenciales incorrectas.
            </p>
            <p className="text-emerald-400 font-mono">
              Solución: STRM Bridge codifica automáticamente los dos puntos y arrobas para que la URL sea segura.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">¿Error SSL / DNS al conectar desde otra red?</div>
            <p className="text-slate-400">
              Causa: El puerto 443 del router de origen no está abierto hacia la IP local de tu servidor, o DuckDNS no ha refrescado la IP pública.
            </p>
            <p className="text-emerald-400 font-mono">
              Solución: Revisa Port Forwarding en tu router (Puerto externo 443 -&gt; IP del NAS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
