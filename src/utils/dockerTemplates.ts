import { NetworkConfig, LibraryDirectory } from '../types/strm';

/**
 * Returns Nginx Proxy Manager Advanced Configuration block
 * Crucial for smooth video seeking, Range requests, and preventing NPM buffer crashes
 */
export function getNpmAdvancedConfig(): string {
  return `# ========================================================
# STRM Bridge - Nginx Proxy Manager Advanced Configuration
# Pega esto en NPM -> Edit Proxy Host -> Pestaña "Advanced"
# Garantiza transmisión continua sin interrupciones y soporte de Range (Seeking)
# ========================================================

# Desactiva el buffering de proxy para evitar que NPM intente guardar
# en memoria o disco archivos de video pesados (MKV/MP4 de 10GB-50GB)
proxy_buffering off;
proxy_request_buffering off;
proxy_http_version 1.1;

# Cabeceras críticas para soporte de Range (avance rápido / retroceso en VLC y Jellyfin)
proxy_set_header Range $http_range;
proxy_set_header If-Range $http_if_range;
proxy_set_header Connection "";

# Aumenta timeouts para películas de larga duración
proxy_connect_timeout 600s;
proxy_send_timeout 1800s;
proxy_read_timeout 1800s;
send_timeout 1800s;

# Permite transferencias sin límite de tamaño
client_max_body_size 0;
proxy_max_temp_file_size 0;

# Cabeceras CORS para permitir reproducción desde clientes Web (Jellyfin Web / Plex Web)
add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
add_header Access-Control-Allow-Headers "Range, Authorization, Content-Type, Accept" always;
add_header Access-Control-Expose-Headers "Content-Range, Content-Length, Accept-Ranges" always;
add_header Accept-Ranges bytes always;

# Previene compresión gzip que rompería los byte-ranges de archivos de video
gzip off;
`;
}

/**
 * Docker Compose for the Host / Origin Server:
 * - Nginx Media File Server (with range requests and directory indexing)
 * - Nginx Proxy Manager (Reverse proxy with Let's Encrypt SSL)
 * - DuckDNS updater daemon
 */
export function getOriginServerDockerCompose(
  network: NetworkConfig,
  libraries: LibraryDirectory[]
): string {
  const volumeMounts = libraries
    .map((lib) => `      - ${lib.sourceHostPath}:/media${lib.remoteHttpPath}:ro`)
    .join('\n');

  return `# =====================================================================
# SERVIDOR ORIGEN (Donde están tus discos y archivos reales)
# Guarda este archivo como docker-compose.yml y ejecuta: docker compose up -d
# =====================================================================
services:
  # 1. Servidor HTTP de Medios optimizado para streaming de video directo
  media-streamer:
    image: nginx:alpine
    container_name: strm-media-streamer
    restart: unless-stopped
    volumes:
${volumeMounts || '      - /DATA/Media:/media:ro'}
      - ./nginx-media.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8085:80"
    networks:
      - strm-network

  # 2. Actualizador automático de DuckDNS (mantiene tu IP siempre vinculada)
  duckdns:
    image: lscr.io/linuxserver/duckdns:latest
    container_name: strm-duckdns
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Madrid
      - SUBDOMAINS=${network.duckDnsDomain.replace('.duckdns.org', '')}
      - TOKEN=PEGA_AQUI_TU_TOKEN_DE_DUCKDNS
      - LOG_FILE=false
    networks:
      - strm-network

  # 3. Nginx Proxy Manager (Gestor SSL y Reverse Proxy)
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: strm-npm
    restart: unless-stopped
    ports:
      - "80:80"      # HTTP (necesario para Let's Encrypt)
      - "443:443"    # HTTPS (puerto seguro para DuckDNS)
      - "81:81"      # Panel de administración de NPM
    environment:
      - DISABLE_IPV6=true
    volumes:
      - ./npm-data:/data
      - ./npm-letsencrypt:/etc/letsencrypt
    networks:
      - strm-network

networks:
  strm-network:
    name: strm-network
    driver: bridge
`;
}

/**
 * Generates the nginx-media.conf required by the media-streamer container
 */
export function getOriginNginxConf(network: NetworkConfig, libraries: LibraryDirectory[]): string {
  const authDirectives =
    network.authType === 'basic'
      ? `    # Autenticación HTTP Basic activada
    auth_basic "Acceso Restringido STRM Bridge";
    auth_basic_user_file /etc/nginx/.htpasswd;`
      : `    # Autenticación desactivada o gestionada por token en NPM
    # auth_basic off;`;

  return `# Archivo: nginx-media.conf (Servidor Origen)
server {
  listen 80;
  server_name localhost;
  root /media;

  # Optimización de kernel para streaming de alta velocidad
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;

  # Soporte vital para peticiones parciales (HTTP Range) para saltar en videos
  max_ranges 512;

  # Configuración para streaming directo
  location / {
${authDirectives}

    autoindex off;
    sendfile_max_chunk 2m;
    
    # Cabeceras CORS y Range
    add_header Accept-Ranges bytes;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    add_header Access-Control-Allow-Headers "Range, Authorization";

    if ($request_method = OPTIONS) {
      return 204;
    }
  }
}
`;
}

/**
 * Docker Compose for Destination Server (ZimaOS / CasaOS):
 * Configured for Jellyfin, Plex or Emby mounting the STRM directories
 */
export function getZimaOsCasaOsCompose(
  targetApp: 'jellyfin' | 'plex' | 'emby',
  libraries: LibraryDirectory[]
): string {
  const strmMounts = libraries
    .map((lib, idx) => `      - ${lib.zimaOsStrmPath}:/media/${lib.category}_${idx}:ro`)
    .join('\n');

  if (targetApp === 'jellyfin') {
    return `# =====================================================================
# DESTINO: ZimaOS / CasaOS - JELLYFIN con soporte nativo de archivos .STRM
# Pega esto en CasaOS -> "Custom App" -> "Import" o guarda como docker-compose.yml
# =====================================================================
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin-strm
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Madrid
      - JELLYFIN_PublishedServerUrl=http://192.168.1.100:8096
    ports:
      - "8096:8096"
    volumes:
      - /DATA/AppData/jellyfin/config:/config
      - /DATA/AppData/jellyfin/cache:/cache
      # Montajes de carpetas STRM en ZimaOS/CasaOS:
${strmMounts || '      - /DATA/Media/STRM/Peliculas:/media/movies:ro\n      - /DATA/Media/STRM/Series:/media/series:ro'}
    # Aceleración por hardware para transcodificar si es necesario (Intel QSV / VAAPI)
    devices:
      - /dev/dri:/dev/dri
    labels:
      - "icon=https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/icon-transparent.svg"
`;
  }

  if (targetApp === 'plex') {
    return `# =====================================================================
# DESTINO: ZimaOS / CasaOS - PLEX MEDIA SERVER con soporte de archivos .STRM
# =====================================================================
services:
  plex:
    image: lscr.io/linuxserver/plex:latest
    container_name: plex-strm
    restart: unless-stopped
    network_mode: host
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Madrid
      - VERSION=docker
      - PLEX_CLAIM= # Opcional: Reclamar servidor con código de plex.tv/claim
    volumes:
      - /DATA/AppData/plex/config:/config
      - /DATA/AppData/plex/transcode:/transcode
      # Montajes de carpetas STRM:
${strmMounts || '      - /DATA/Media/STRM/Peliculas:/media/movies:ro\n      - /DATA/Media/STRM/Series:/media/series:ro'}
    devices:
      - /dev/dri:/dev/dri
`;
  }

  return `# =====================================================================
# DESTINO: ZimaOS / CasaOS - EMBY SERVER con soporte de archivos .STRM
# =====================================================================
services:
  emby:
    image: emby/embyserver:latest
    container_name: emby-strm
    restart: unless-stopped
    environment:
      - UID=1000
      - GID=1000
      - GIDLIST=100
    ports:
      - "8096:8096"
      - "8920:8920"
    volumes:
      - /DATA/AppData/emby/config:/config
      # Montajes de carpetas STRM:
${strmMounts || '      - /DATA/Media/STRM/Peliculas:/media/movies:ro\n      - /DATA/Media/STRM/Series:/media/series:ro'}
    devices:
      - /dev/dri:/dev/dri
`;
}
