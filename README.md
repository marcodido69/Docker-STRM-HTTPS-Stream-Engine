# Docker STRM HTTPS Stream Engine 🚀

![Docker STRM HTTPS Stream Engine](cover.jpg)

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx Proxy Manager](https://img.shields.io/badge/Nginx_Proxy_Manager-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginxproxymanager.com/)
[![DuckDNS](https://img.shields.io/badge/DuckDNS-FFD700?style=for-the-badge&logo=duckduckgo&logoColor=black)](https://www.duckdns.org/)
[![ZimaOS](https://img.shields.io/badge/ZimaOS-CasaOS-0ea5e9?style=for-the-badge&logo=linux&logoColor=white)](https://www.zimaspace.com/zimaos)
[![Jellyfin](https://img.shields.io/badge/Jellyfin-00A4DC?style=for-the-badge&logo=jellyfin&logoColor=white)](https://jellyfin.org/)
[![Plex](https://img.shields.io/badge/Plex-E5A00D?style=for-the-badge&logo=plex&logoColor=white)](https://www.plex.tv/)
[![Emby](https://img.shields.io/badge/Emby-52B54B?style=for-the-badge&logo=emby&logoColor=white)](https://emby.media/)
[![VLC](https://img.shields.io/badge/VLC_Player-FF8800?style=for-the-badge&logo=vlcmediaplayer&logoColor=white)](https://www.videolan.org/vlc/)

> **Motor y generador de archivos `.strm` portables para la transmisión remota continua y de alta velocidad de películas y series sin consumir espacio de disco en servidores remotos.**
> Diseñado para conectar de forma transparente almacenamiento físico remoto con instancias independientes de **ZimaOS** y **CasaOS** utilizando **Nginx Proxy Manager** y **DuckDNS**, garantizando reproducción instantánea con soporte de *HTTP Range Requests*.

---

## 🌟 Características Principales

- **Archivos `.strm` 100% Portables**: Cada película o capítulo ocupa sólo **~150 bytes**. Un catálogo de 50 TB de video se convierte en menos de 2 MB de archivos `.strm`.
- **Transmisión Remota Continua Sin Cortes**: Configuración optimizada de Nginx Proxy Manager con `proxy_buffering off;` para eliminar pausas por llenado de memoria RAM en archivos MKV/MP4 de 10 GB a 60 GB.
- **Soporte Nativo de Saltos de Línea de Tiempo (HTTP Range / Seeking)**: Pasa cabeceras `$http_range` para saltar a cualquier minuto de la película en menos de 1 segundo en **VLC, Jellyfin, Plex y Emby**.
- **Generador Web Interactivo**: Escanea carpetas locales o montajes NAS directamente en el navegador sin subir ningún archivo de video, o importa listas de rutas de `find` o `ls -R`.
- **Reescritor & Migrador en Lote**: ¿Cambiaste de subdominio DuckDNS, de puerto o de servidor? Arrastra tu ZIP de `.strm` y el sistema reescribe todas las URLs en 1 segundo conservando la jerarquía de carpetas.
- **Lista Universal M3U Portátil**: Exporta `videoteca_portable.m3u` para reproducir tu biblioteca en Smart TV, Apple TV (Infuse), Kodi o móvil sin necesidad de instalar servidores de medios.
- **Auto-Sync Daemon**: Scripts en Python y Bash para `cron` que detectan nuevos archivos descargados y generan los `.strm` automáticamente.
- **Escalabilidad Total**: Agrega nuevos directorios en cualquier momento (4K HDR, Series, Anime, Documentales) con rutas personalizables.

---

## 🏗️ Arquitectura del Sistema

```
  ┌────────────────────────────────────────────────────────┐
  │                 SERVIDOR ORIGEN (NAS)                  │
  │  - Discos Duros con Películas y Series (MKV/MP4)       │
  │  - Contenedor media-streamer (Nginx:alpine, Range OK)   │
  │  - Contenedor DuckDNS Updater                          │
  │  - Nginx Proxy Manager (SSL Let's Encrypt + Buffer OFF)│
  └───────────────────────────┬────────────────────────────┘
                              │
                    HTTPS (Puerto 443)
              https://tudominio.duckdns.org/stream/...
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │         SERVIDOR DESTINO (ZimaOS / CasaOS / Remoto)    │
  │  - Directorio /DATA/Media/STRM/ (Ocupa < 5 MB en disco)│
  │  - Contenedor Jellyfin / Plex / Emby montando .strm    │
  │  - VLC Player en PC, Mac, Android TV, iPhone, etc.     │
  └────────────────────────────────────────────────────────┘
```

---

## 📖 Guía de Uso Paso a Paso (¿Cómo se utiliza?)

### Paso 1: Levantar el Servidor Origen (Donde están tus discos)

Crea una carpeta en tu servidor o NAS y guarda este `docker-compose.yml`:

```yaml
services:
  # 1. Servidor de Medios ligero optimizado para Range Requests
  media-streamer:
    image: nginx:alpine
    container_name: strm-media-streamer
    restart: unless-stopped
    volumes:
      - /DATA/Media/Peliculas:/media/movies:ro
      - /DATA/Media/Series:/media/series:ro
      - ./nginx-media.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8085:80"
    networks:
      - strm-network

  # 2. Actualizador automático de DuckDNS
  duckdns:
    image: lscr.io/linuxserver/duckdns:latest
    container_name: strm-duckdns
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Madrid
      - SUBDOMAINS=tudominio # Tu subdominio de DuckDNS (sin .duckdns.org)
      - TOKEN=TU_TOKEN_DE_DUCKDNS
      - LOG_FILE=false
    networks:
      - strm-network

  # 3. Nginx Proxy Manager con SSL Let's Encrypt
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: strm-npm
    restart: unless-stopped
    ports:
      - "80:80"      # HTTP (Requerido para certificados Let's Encrypt)
      - "443:443"    # HTTPS (Transmisión remota segura)
      - "81:81"      # Panel de administración web de NPM
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
```

Junto al `docker-compose.yml`, crea el archivo `nginx-media.conf`:

```nginx
server {
  listen 80;
  server_name localhost;
  root /media;

  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  max_ranges 512;

  location / {
    autoindex off;
    sendfile_max_chunk 2m;
    
    add_header Accept-Ranges bytes;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
    add_header Access-Control-Allow-Headers "Range, Authorization";

    if ($request_method = OPTIONS) {
      return 204;
    }
  }
}
```

Ejecuta en la terminal:
```bash
docker compose up -d
```

---

### Paso 2: Configurar Nginx Proxy Manager (Reglas Críticas de Streaming)

1. Entra a `http://IP_DE_TU_SERVIDOR:81` (Usuario por defecto: `admin@example.com`, Clave: `changeme`).
2. Ve a **Hosts** → **Proxy Hosts** → **Add Proxy Host**:
   - **Domain Names**: `tudominio.duckdns.org`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `media-streamer` (o la IP local de tu servidor)
   - **Forward Port**: `80`
   - Marca: **Block Common Exploits**, **Websockets Support**.
3. En la pestaña **SSL**:
   - Solicita un certificado SSL con Let's Encrypt.
   - Marca: **Force SSL**, **HTTP/2 Support**.
4. ⚠️ **MUY IMPORTANTE**: Ve a la pestaña **Advanced** y pega este bloque de configuración:

```nginx
# ========================================================
# STRM Bridge: Transmisión sin cortes y soporte de Seeking
# ========================================================
proxy_buffering off;
proxy_request_buffering off;
proxy_http_version 1.1;

proxy_set_header Range $http_range;
proxy_set_header If-Range $http_if_range;
proxy_set_header Connection "";

proxy_connect_timeout 600s;
proxy_send_timeout 1800s;
proxy_read_timeout 1800s;
send_timeout 1800s;

client_max_body_size 0;
proxy_max_temp_file_size 0;

add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
add_header Access-Control-Allow-Headers "Range, Authorization, Content-Type, Accept" always;
add_header Access-Control-Expose-Headers "Content-Range, Content-Length, Accept-Ranges" always;
add_header Accept-Ranges bytes always;

gzip off;
```

5. Haz clic en **Save**. ¡Tu motor de streaming HTTPS ya está listo para emitir a todo el mundo!

---

### Paso 3: Generar los Archivos `.strm`

Usa la interfaz web de **STRM Bridge**:
1. Entra a la aplicación y en **Red & DuckDNS** escribe tu dominio: `tudominio.duckdns.org`.
2. En **Generador STRM**:
   - Haz clic en **Escanear Carpeta Local** y selecciona tu carpeta de películas (se procesa al instante en memoria).
   - O haz clic en **Pegar Rutas (Batch)** si tienes la salida de `find` o `ls -R`.
3. Haz clic en **Descargar ZIP**.
4. Obtendrás un archivo `.zip` con todos los archivos `.strm` ordenados en carpetas exactas (ej. `Inception (2010)/Inception (2010).strm`).

Dentro de cada archivo `.strm` hay una única línea con la URL remota:
```text
https://streamuser:Secr3t2026@tudominio.duckdns.org/movies/Inception%20(2010)/Inception%20(2010).mkv
```

---

### Paso 4: Desplegar en ZimaOS / CasaOS (Servidor Remoto)

1. En tu servidor ZimaOS o CasaOS, descomprime los archivos `.strm` en la ruta:
   ```bash
   /DATA/Media/STRM/Peliculas/
   /DATA/Media/STRM/Series/
   ```
2. En la interfaz web de **CasaOS**:
   - Haz clic en el botón **+** (Instalar aplicación personalizada).
   - En la esquina superior derecha, haz clic en **Import**.
   - Pega este `docker-compose.yml` para **Jellyfin**:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin-strm
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Madrid
    ports:
      - "8096:8096"
    volumes:
      - /DATA/AppData/jellyfin/config:/config
      - /DATA/AppData/jellyfin/cache:/cache
      - /DATA/Media/STRM/Peliculas:/media/movies:ro
      - /DATA/Media/STRM/Series:/media/series:ro
    devices:
      - /dev/dri:/dev/dri # Transcodificación por hardware Intel QuickSync
```

3. Inicia Jellyfin en `http://IP_DE_CASAOS:8096` y añade las bibliotecas apuntando a `/media/movies` y `/media/series`.
4. Jellyfin descargará automáticamente carátulas, sinopsis y actores de TheMovieDB.
5. ¡Al pulsar Play, el video comenzará a reproducirse remotamente por HTTPS de forma instantánea!

*(Nota: También es compatible con **Plex** y **Emby** con los mismos montajes de volumen).*

---

### Paso 5: Reproducción Directa con VLC Player

- **Método 1**: Arrastra cualquier archivo `.strm` a la ventana de VLC en tu PC o Mac.
- **Método 2**: Abre VLC, presiona `Ctrl + N` (Medio → Abrir emisión de red) y pega la URL.
- **Método 3**: Descarga `videoteca_portable.m3u` desde la pestaña **Portabilidad** y ábrelo en VLC para tener toda tu colección como una lista de reproducción lista para ver.
- **Consejo Cero Buffering en VLC**: En `Preferencias → Todo → Entrada / Códecs`, ajusta *Almacenamiento en caché de red (ms)* a `3000 ms`.

---

## 🔄 Automatización con Cron (Auto-Sync)

Para que los `.strm` se generen solos cuando se descargue una nueva película en tu servidor, programa una tarea con `crontab -e`:

```bash
# Ejecutar sincronización cada 2 horas
0 */2 * * * /usr/bin/python3 /DATA/AppData/strm-bridge/strm_sync_daemon.py >> /DATA/AppData/strm-bridge/sync.log 2>&1
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, JSZip.
- **Reverse Proxy**: Nginx Proxy Manager + Let's Encrypt SSL/TLS.
- **DNS Dinámico**: DuckDNS.
- **Media Servers**: Jellyfin, Plex Media Server, Emby, VLC Media Player.
- **OS Destino**: ZimaOS, CasaOS, Unraid, TrueNAS, Debian, Ubuntu Server.

---

## 📄 Licencia

Distribuido bajo la Licencia Apache 2.0. Consulta el archivo `LICENSE` para más detalles.
