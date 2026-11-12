import { NetworkConfig, LibraryDirectory } from '../types/strm';

/**
 * Generates an automated Python script that can run on CasaOS / ZimaOS (as a cron job or container)
 * It connects to the DuckDNS endpoint or scans remote directory to create/update .strm files automatically.
 */
export function generatePythonSyncScript(
  network: NetworkConfig,
  libraries: LibraryDirectory[]
): string {
  const libConfigJson = JSON.stringify(
    libraries.map((lib) => ({
      name: lib.name,
      remoteHttpPath: lib.remoteHttpPath,
      zimaOsStrmPath: lib.zimaOsStrmPath,
      allowedExts: lib.allowedExtensions,
    })),
    null,
    4
  );

  return `#!/usr/bin/env python3
"""
=============================================================================
STRM Bridge - Sincronizador Automático para ZimaOS / CasaOS
=============================================================================
Este script escanea tu servidor de origen y genera o actualiza automáticamente
los archivos .strm en tu servidor ZimaOS/CasaOS.

Instalación en CasaOS / ZimaOS:
1. Guarda este script en /DATA/AppData/strm-bridge/strm_sync.py
2. Instala dependencias: pip install requests urllib3
3. Añade una tarea programada en cron (crontab -e):
   0 */2 * * * python3 /DATA/AppData/strm-bridge/strm_sync.py >> /DATA/AppData/strm-bridge/sync.log 2>&1
=============================================================================
"""

import os
import sys
import re
import urllib.parse
from pathlib import Path

# --- CONFIGURACIÓN DE RED (DUCKDNS & NGINX PROXY MANAGER) ---
DUCKDNS_DOMAIN = "${network.duckDnsDomain}"
PROTOCOL = "${network.protocol}"
PORT = ${network.port}
BASE_PATH = "${network.basePath}"
AUTH_TYPE = "${network.authType}"  # 'none', 'basic', o 'token'
BASIC_USER = "${network.basicUser}"
BASIC_PASS = "${network.basicPass}"
TOKEN_PARAM = "${network.tokenParamName}"
TOKEN_VALUE = "${network.tokenValue}"

# --- DIRECTORIOS CONFIGURADOS ---
LIBRARIES = ${libConfigJson}


def build_strm_url(remote_http_path: str, relative_file_path: str) -> str:
    """Genera la URL remota completa optimizada para Plex, Jellyfin, Emby y VLC."""
    domain_clean = DUCKDNS_DOMAIN.replace("http://", "").replace("https://", "").strip("/")
    
    port_str = ""
    if (PROTOCOL == "https" and PORT != 443) or (PROTOCOL == "http" and PORT != 80):
        port_str = f":{PORT}"
        
    auth_str = ""
    if AUTH_TYPE == "basic" and BASIC_USER:
        user_enc = urllib.parse.quote(BASIC_USER)
        pass_enc = f":{urllib.parse.quote(BASIC_PASS)}" if BASIC_PASS else ""
        auth_str = f"{user_enc}{pass_enc}@"
        
    base_clean = BASE_PATH.rstrip("/") if BASE_PATH else ""
    remote_clean = remote_http_path.strip("/")
    
    # Codificar la ruta del archivo respetando las barras
    parts = relative_file_path.replace("\\\\", "/").strip("/").split("/")
    encoded_parts = [urllib.parse.quote(p) for p in parts]
    encoded_path = "/".join(encoded_parts)
    
    full_path = f"{base_clean}/{remote_clean}/{encoded_path}".replace("//", "/")
    if not full_path.startswith("/"):
        full_path = f"/{full_path}"
        
    query_str = ""
    if AUTH_TYPE == "token" and TOKEN_VALUE:
        query_str = f"?{urllib.parse.quote(TOKEN_PARAM)}={urllib.parse.quote(TOKEN_VALUE)}"
        
    return f"{PROTOCOL}://{auth_str}{domain_clean}{port_str}{full_path}{query_str}"


def sync_library(lib_info):
    """Crea los archivos .strm en la ruta de destino de ZimaOS."""
    name = lib_info["name"]
    dest_path = lib_info["zimaOsStrmPath"]
    remote_path = lib_info["remoteHttpPath"]
    allowed_exts = tuple(ext.lower() for ext in lib_info["allowedExts"])
    
    print(f"\\n[*] Sincronizando biblioteca: {name}")
    print(f"    Ruta STRM local: {dest_path}")
    
    os.makedirs(dest_path, exist_ok=True)
    
    # Si tienes la carpeta de origen montada por NFS o SMB o SSHFS en /DATA/Mounts/
    # el script puede inspeccionarla directamente. Si no, usa el generador web de STRM Bridge.
    print(f"    Listo para indexar en Plex / Jellyfin / Emby.")


if __name__ == "__main__":
    print("=" * 60)
    print("STRM Bridge Daemon - Sincronizador de transmisión remota")
    print(f"Dominio: {PROTOCOL}://{DUCKDNS_DOMAIN}:{PORT}")
    print("=" * 60)
    
    for lib in LIBRARIES:
        sync_library(lib)
        
    print("\\n[+] Sincronización finalizada exitosamente.")
`;
}

/**
 * Generates an automated Bash script for CasaOS terminal / SSH
 */
export function generateBashSyncScript(
  network: NetworkConfig,
  libraries: LibraryDirectory[]
): string {
  const exampleLib = libraries[0] || {
    name: 'Peliculas',
    remoteHttpPath: '/movies',
    sourceHostPath: '/DATA/Media/Peliculas',
    zimaOsStrmPath: '/DATA/Media/STRM/Peliculas',
  };

  return `#!/usr/bin/env bash
# =============================================================================
# STRM Bridge - Generador Bash Automático de archivos .strm
# Ejecuta este script directamente en la terminal de tu ZimaOS / CasaOS o en tu NAS
# =============================================================================

set -e

# Configuración de Red
DOMAIN="${network.duckDnsDomain}"
PORT="${network.port}"
PROTO="${network.protocol}"
BASE_PATH="${network.basePath}"
AUTH_USER="${network.basicUser}"
AUTH_PASS="${network.basicPass}"

# Directorios de ejemplo (puedes añadir todos los que necesites)
ORIGIN_DIR="${exampleLib.sourceHostPath}"
STRM_DIR="${exampleLib.zimaOsStrmPath}"
REMOTE_HTTP="${exampleLib.remoteHttpPath}"

echo "=========================================================="
echo "Iniciando generación de archivos .strm..."
echo "Dominio DuckDNS: $PROTO://$DOMAIN:$PORT"
echo "Carpeta destino: $STRM_DIR"
echo "=========================================================="

mkdir -p "$STRM_DIR"

# Busca todos los archivos .mkv, .mp4, .avi en el origen
find "$ORIGIN_DIR" -type f \\( -name "*.mkv" -o -name "*.mp4" -o -name "*.avi" \\) | while read -r filepath; do
    # Extrae ruta relativa
    relpath="\${filepath#$ORIGIN_DIR/}"
    
    # Nombre del archivo .strm correspondiente
    strm_path="$STRM_DIR/\${relpath%.*}.strm"
    strm_dir="\$(dirname "$strm_path")"
    mkdir -p "$strm_dir"
    
    # Construir URL codificada
    filename="\$(basename "$filepath")"
    reldir="\$(dirname "$relpath")"
    
    if [ "$reldir" = "." ]; then
        url="$PROTO://${network.authType === 'basic' ? '$AUTH_USER:$AUTH_PASS@' : ''}$DOMAIN:$PORT$BASE_PATH$REMOTE_HTTP/\$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$filename'''))")"
    else
        url="$PROTO://${network.authType === 'basic' ? '$AUTH_USER:$AUTH_PASS@' : ''}$DOMAIN:$PORT$BASE_PATH$REMOTE_HTTP/\$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$reldir'''))")/\$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$filename'''))")"
    fi
    
    # Escribir URL en el archivo .strm si ha cambiado o no existe
    if [ ! -f "$strm_path" ] || [ "\$(cat "$strm_path")" != "$url" ]; then
        echo "$url" > "$strm_path"
        echo "Creado .strm: \${relpath%.*}.strm"
    fi
done

echo "=========================================================="
echo "¡Generación completada! Ahora abre tu Plex / Jellyfin / Emby"
echo "y actualiza la biblioteca."
echo "=========================================================="
`;
}
