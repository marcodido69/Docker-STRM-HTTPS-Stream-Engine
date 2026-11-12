import React from 'react';
import { NetworkConfig } from '../types/strm';
import { Globe, Lock, ShieldCheck, Server, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface NetworkConfigTabProps {
  network: NetworkConfig;
  onUpdateNetwork: (updated: Partial<NetworkConfig>) => void;
}

export const NetworkConfigTab: React.FC<NetworkConfigTabProps> = ({
  network,
  onUpdateNetwork,
}) => {
  // Generate a live sample URL preview
  const sampleRelative = 'Inception (2010)/Inception (2010).mkv';
  const protocol = network.protocol;
  const domain = network.duckDnsDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '') || 'tudominio.duckdns.org';
  const portStr =
    (protocol === 'https' && network.port !== 443) || (protocol === 'http' && network.port !== 80)
      ? `:${network.port}`
      : '';
  const authStr =
    network.authType === 'basic' && network.basicUser
      ? `${encodeURIComponent(network.basicUser)}:${encodeURIComponent(network.basicPass || '')}@`
      : '';
  const basePath = network.basePath ? network.basePath.replace(/\/+$/, '') : '';
  const tokenStr =
    network.authType === 'token' && network.tokenValue
      ? `?${encodeURIComponent(network.tokenParamName || 'token')}=${encodeURIComponent(network.tokenValue)}`
      : '';
  const sampleUrl = `${protocol}://${authStr}${domain}${portStr}${basePath}/movies/Inception%20(2010)/Inception%20(2010).mkv${tokenStr}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Configuración de Red: DuckDNS & Nginx Proxy Manager
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Define los parámetros con los que se construirán las URLs dentro de cada archivo <code className="text-indigo-400 font-mono">.strm</code> para permitir el acceso remoto seguro desde tu ZimaOS / CasaOS.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Soporte HTTPS con Let's Encrypt</span>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="mt-5 pt-5 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Vista Previa en Vivo de URL .strm:
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-indigo-300 break-all select-all flex items-center justify-between gap-3">
            <span>{sampleUrl}</span>
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: DuckDNS & Conectividad */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3>Dominio DuckDNS y Enlace</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Dominio DuckDNS (o Subdominio FQDN)
            </label>
            <input
              type="text"
              value={network.duckDnsDomain}
              onChange={(e) => onUpdateNetwork({ duckDnsDomain: e.target.value.trim() })}
              placeholder="ejemplo: casamedia.duckdns.org"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">
              Tu subdominio gratuito configurado en <span className="text-slate-300">duckdns.org</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Protocolo
              </label>
              <select
                value={network.protocol}
                onChange={(e) => onUpdateNetwork({ protocol: e.target.value as 'https' | 'http' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="https">HTTPS (Recomendado / Seguro)</option>
                <option value="http">HTTP (Sin cifrado / Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Puerto Externo
              </label>
              <input
                type="number"
                value={network.port}
                onChange={(e) => onUpdateNetwork({ port: parseInt(e.target.value) || 443 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                443 estándar para HTTPS
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Prefijo Base de Ruta (Opcional)
            </label>
            <input
              type="text"
              value={network.basePath}
              onChange={(e) => onUpdateNetwork({ basePath: e.target.value })}
              placeholder="ejemplo: /stream o dejar vacío"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">
              Ruta en Nginx Proxy Manager asignada al servidor de streaming (ej. <code className="text-slate-300">/stream</code> o <code className="text-slate-300">/media</code>).
            </p>
          </div>
        </div>

        {/* Card 2: Seguridad y Autenticación */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h3>Seguridad & Autenticación de Acceso</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Método de Protección
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateNetwork({ authType: 'basic' })}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  network.authType === 'basic'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                HTTP Basic Auth
              </button>

              <button
                type="button"
                onClick={() => onUpdateNetwork({ authType: 'token' })}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  network.authType === 'token'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Token Secreto
              </button>

              <button
                type="button"
                onClick={() => onUpdateNetwork({ authType: 'none' })}
                className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  network.authType === 'none'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sin Autenticación
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {network.authType === 'basic' &&
                'Incrustado directamente en la URL (.strm): https://user:pass@dominio. Totalmente compatible con VLC, Jellyfin, Plex y Emby.'}
              {network.authType === 'token' &&
                'Añade un parámetro de consulta ?token=clave que Nginx valida mediante el módulo de acceso.'}
              {network.authType === 'none' &&
                'Acceso directo sin credenciales en la URL. Útil si proteges por filtrado de IP o red interna Tailscale.'}
            </p>
          </div>

          {network.authType === 'basic' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  value={network.basicUser}
                  onChange={(e) => onUpdateNetwork({ basicUser: e.target.value.trim() })}
                  placeholder="streamuser"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="text"
                  value={network.basicPass}
                  onChange={(e) => onUpdateNetwork({ basicPass: e.target.value.trim() })}
                  placeholder="contraseña_segura"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {network.authType === 'token' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre del Parámetro
                </label>
                <input
                  type="text"
                  value={network.tokenParamName}
                  onChange={(e) => onUpdateNetwork({ tokenParamName: e.target.value.trim() })}
                  placeholder="token o key"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valor Secreto
                </label>
                <input
                  type="text"
                  value={network.tokenValue}
                  onChange={(e) => onUpdateNetwork({ tokenValue: e.target.value.trim() })}
                  placeholder="clave_secreta_123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Codificación de Nombres de Archivo
            </label>
            <select
              value={network.urlEncoding}
              onChange={(e) =>
                onUpdateNetwork({ urlEncoding: e.target.value as 'standard' | 'encode-all' | 'raw' })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="standard">Estándar (%20 para espacios, preserva paréntesis y corchetes)</option>
              <option value="encode-all">Codificación Estricta (encodeURIComponent total)</option>
              <option value="raw">Raw (Sin codificar caracteres)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Network Architecture Map / Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-white mb-4">
          Flujo de Transmisión Remota de Contenido sin Interrupciones
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="text-indigo-400 font-semibold flex items-center gap-1.5">
              <span>1. Servidor Origen</span>
            </div>
            <p className="text-slate-300">
              Discos con películas y series reales. Contenedor <code className="text-slate-400">media-streamer</code> sirviendo archivos con Range requests activados.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="text-indigo-400 font-semibold flex items-center gap-1.5">
              <span>2. NPM + DuckDNS</span>
            </div>
            <p className="text-slate-300">
              DuckDNS mantiene tu IP actualizada. Nginx Proxy Manager añade SSL/TLS y desactiva el buffer de proxy para evitar micro-cortes.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="text-indigo-400 font-semibold flex items-center gap-1.5">
              <span>3. Archivos .strm</span>
            </div>
            <p className="text-slate-300">
              Archivos ligeros (100 bytes) copiados en tu servidor ZimaOS/CasaOS con la URL remota apuntando a tu DuckDNS.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="text-indigo-400 font-semibold flex items-center gap-1.5">
              <span>4. Reproductores</span>
            </div>
            <p className="text-slate-300">
              Plex, Jellyfin, Emby o VLC leen el .strm y abren el stream por HTTPS como si fuera un archivo local, con reproducción instantánea.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
