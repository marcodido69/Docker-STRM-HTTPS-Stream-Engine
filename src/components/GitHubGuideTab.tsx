import React, { useState } from 'react';
import {
  Github,
  Check,
  Copy,
  ExternalLink,
  Download,
  Terminal,
  Key,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface GitHubGuideTabProps {
  coverImagePath: string;
}

export const GitHubGuideTab: React.FC<GitHubGuideTabProps> = ({ coverImagePath }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [patToken, setPatToken] = useState('');
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState('');

  const repoUrl = 'https://github.com/marcodido69/Docker-STRM-HTTPS-Stream-Engine';

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const manualCommands = `# 1. Clona o inicializa en tu terminal local:
git clone https://github.com/marcodido69/Docker-STRM-HTTPS-Stream-Engine.git
# O si ya tienes los archivos descargados:
git init
git branch -M main
git remote add origin https://github.com/marcodido69/Docker-STRM-HTTPS-Stream-Engine.git
git add .
git commit -m "feat: Docker STRM HTTPS Stream Engine con portada y guía"
git push -u origin main`;

  const pushWithTokenCommand = `git remote set-url origin https://${patToken || 'TU_GITHUB_TOKEN'}@github.com/marcodido69/Docker-STRM-HTTPS-Stream-Engine.git\ngit push -u origin main`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Header and repo link */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-white" />
              <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                Repositorio Oficial GitHub
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Docker-STRM-HTTPS-Stream-Engine
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Motor y generador de archivos .strm portables para transmisión remota de alta velocidad con Nginx Proxy Manager, DuckDNS, ZimaOS y CasaOS.
            </p>
          </div>

          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shrink-0 shadow-sm"
          >
            <Github className="w-4 h-4" />
            <span>Ver en GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Generated Cover Image (Portada) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-white">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Portada Oficial del Repositorio (cover.jpg)</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Aspect Ratio 16:9 · 8K Master Render
          </span>
        </div>

        <div className="relative bg-black flex items-center justify-center">
          <img
            src={coverImagePath}
            alt="Docker STRM HTTPS Stream Engine Cover"
            className="w-full max-h-[500px] object-cover"
          />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Esta imagen ya está guardada en la raíz del proyecto como <code className="text-indigo-300 font-mono">cover.jpg</code> y vinculada al inicio de tu <code className="text-slate-300 font-mono">README.md</code>.
          </span>
          <a
            href={coverImagePath}
            download="cover_docker_strm_engine.jpg"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Portada</span>
          </a>
        </div>
      </div>

      {/* Instructions on how to push / upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Instrucciones para Subir los Cambios a GitHub</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            El repositorio local ya está inicializado, la rama <code className="text-indigo-300">main</code> creada, el archivo <code className="text-slate-300">README.md</code> redactado y la portada <code className="text-slate-300">cover.jpg</code> agregada al commit inicial.
          </p>
        </div>

        {/* Method 1: Push with GitHub Token */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Método Rápido: Con tu Personal Access Token (PAT)</span>
          </div>

          <p className="text-xs text-slate-400">
            GitHub requiere un token de acceso personal (con permiso <code className="text-slate-300">repo</code>) para autenticar las subidas por HTTPS:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="password"
              value={patToken}
              onChange={(e) => setPatToken(e.target.value.trim())}
              placeholder="Pega aquí tu GitHub Personal Access Token (ghp_...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=Docker-STRM-Engine"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap underline shrink-0 px-2 py-1"
            >
              Crear Token en GitHub →
            </a>
          </div>

          {patToken && (
            <div className="space-y-2 pt-2">
              <div className="text-xs text-slate-400">
                Comando listo para ejecutar en la terminal:
              </div>
              <div className="flex items-center gap-2">
                <pre className="flex-1 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto select-all">
                  {pushWithTokenCommand}
                </pre>
                <button
                  onClick={() => handleCopy('token-cmd', pushWithTokenCommand)}
                  className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shrink-0"
                >
                  {copiedKey === 'token-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Method 2: Standard Git Commands */}
        <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              Método Tradicional: Comandos Git de Terminal
            </span>
            <button
              onClick={() => handleCopy('manual-cmd', manualCommands)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copiedKey === 'manual-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar Comandos</span>
            </button>
          </div>

          <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto select-all leading-relaxed">
            {manualCommands}
          </pre>
        </div>
      </div>

      {/* Summary of what has been prepared */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Resumen de Archivos y Documentación Preparados</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-indigo-400">1. README.md Completo</div>
            <p className="text-slate-400">
              Incluye badges oficiales, arquitectura en ASCII, guía paso a paso de 5 fases, docker-compose para origen y destino, y solución de problemas.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-emerald-400">2. Portada en Alta Definición</div>
            <p className="text-slate-400">
              Generada específicamente con el logo y branding de Docker STRM HTTPS Stream Engine en <code className="text-slate-300">cover.jpg</code>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-semibold text-amber-400">3. Repositorio Listo</div>
            <p className="text-slate-400">
              Commit inicial preparado en rama <code className="text-slate-300">main</code> listo para sincronizar con tu cuenta GitHub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
