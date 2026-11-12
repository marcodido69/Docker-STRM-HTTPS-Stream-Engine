import JSZip from 'jszip';
import {
  NetworkConfig,
  LibraryDirectory,
  MediaItem,
  GeneratedStrmFile,
  PortabilityAuditResult,
  MigratedStrmItem,
} from '../types/strm';

/**
 * Encodes path segments according to selected policy
 */
export function encodeMediaRelativePath(path: string, encoding: NetworkConfig['urlEncoding']): string {
  // Normalize forward slashes
  const normalized = path.replace(/\\+/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');

  const encodedSegments = segments.map((seg) => {
    if (encoding === 'raw') return seg;
    if (encoding === 'encode-all') return encodeURIComponent(seg);
    // Standard: encodeURIComponent but keep common safe media characters like () [] . - _
    return encodeURIComponent(seg)
      .replace(/%20/g, '%20')
      .replace(/%28/g, '(')
      .replace(/%29/g, ')')
      .replace(/%5B/g, '[')
      .replace(/%5D/g, ']');
  });

  return encodedSegments.join('/');
}

/**
 * Builds the complete remote streaming URL for an item
 */
export function buildStreamUrl(
  network: NetworkConfig,
  library: LibraryDirectory,
  relativePath: string
): string {
  const protocol = network.protocol;
  const domain = network.duckDnsDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  
  // Format port: omit standard 443 for https and 80 for http unless custom
  let portString = '';
  if (
    (protocol === 'https' && network.port !== 443) ||
    (protocol === 'http' && network.port !== 80)
  ) {
    portString = `:${network.port}`;
  }

  // Format authentication in authority component
  let authString = '';
  if (network.authType === 'basic' && network.basicUser) {
    const user = encodeURIComponent(network.basicUser);
    const pass = network.basicPass ? `:${encodeURIComponent(network.basicPass)}` : '';
    authString = `${user}${pass}@`;
  }

  // Path composition
  const basePathClean = network.basePath ? network.basePath.replace(/\/+$/, '') : '';
  const libraryPathClean = library.remoteHttpPath ? library.remoteHttpPath.replace(/^\/+/, '').replace(/\/+$/, '') : '';
  const encodedRelative = encodeMediaRelativePath(relativePath, network.urlEncoding);

  const pathParts = [basePathClean, libraryPathClean, encodedRelative].filter(Boolean);
  let fullPath = pathParts.join('/');
  if (!fullPath.startsWith('/')) {
    fullPath = `/${fullPath}`;
  }

  // Token query parameter if selected
  let queryString = '';
  if (network.authType === 'token' && network.tokenValue) {
    const paramName = encodeURIComponent(network.tokenParamName || 'token');
    const paramVal = encodeURIComponent(network.tokenValue);
    queryString = `?${paramName}=${paramVal}`;
  }

  return `${protocol}://${authString}${domain}${portString}${fullPath}${queryString}`;
}

/**
 * Computes .strm target filename and relative path
 */
export function getStrmRelativePath(originalRelativePath: string): {
  strmRelativePath: string;
  strmFileName: string;
} {
  const normalized = originalRelativePath.replace(/\\+/g, '/').replace(/^\/+/, '');
  const lastDotIndex = normalized.lastIndexOf('.');
  const baseWithoutExt = lastDotIndex !== -1 ? normalized.substring(0, lastDotIndex) : normalized;
  const strmRelativePath = `${baseWithoutExt}.strm`;

  const fileNameWithExt = normalized.split('/').pop() || '';
  const fileLastDot = fileNameWithExt.lastIndexOf('.');
  const fileNameBase = fileLastDot !== -1 ? fileNameWithExt.substring(0, fileLastDot) : fileNameWithExt;
  const strmFileName = `${fileNameBase}.strm`;

  return { strmRelativePath, strmFileName };
}

/**
 * Generates all .strm representations for given media items
 */
export function generateStrmFiles(
  items: MediaItem[],
  libraries: LibraryDirectory[],
  network: NetworkConfig
): GeneratedStrmFile[] {
  const libMap = new Map<string, LibraryDirectory>();
  libraries.forEach((lib) => libMap.set(lib.id, lib));

  return items.map((item) => {
    const lib = libMap.get(item.libraryId) || {
      id: item.libraryId,
      name: 'General',
      category: 'movies',
      sourceHostPath: '/DATA/Media',
      remoteHttpPath: '/media',
      zimaOsStrmPath: '/DATA/Media/STRM',
      allowedExtensions: ['.mkv', '.mp4'],
    };

    const streamUrl = item.customUrlOverride || buildStreamUrl(network, lib, item.relativePath);
    const { strmRelativePath, strmFileName } = getStrmRelativePath(item.relativePath);

    return {
      id: item.id,
      libraryId: lib.id,
      libraryName: lib.name,
      relativeStrmPath: strmRelativePath,
      strmFileName,
      streamUrl,
      originalFileName: item.fileName,
      sizeBytes: item.sizeBytes,
    };
  });
}

/**
 * Downloads a single .strm file in the browser
 */
export function downloadSingleStrm(strmFile: GeneratedStrmFile): void {
  const blob = new Blob([strmFile.streamUrl + '\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = strmFile.strmFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a ZIP containing all .strm files structured in folders
 */
export async function downloadStrmZip(
  strmFiles: GeneratedStrmFile[],
  libraries: LibraryDirectory[],
  network: NetworkConfig,
  zipName: string = 'strm_library_bundle.zip'
): Promise<void> {
  const zip = new JSZip();

  // Create library folders
  strmFiles.forEach((file) => {
    // Add library folder prefix
    const libFolder = file.libraryName.replace(/[\/\\:*?"<>|]/g, '_');
    const fullZipPath = `${libFolder}/${file.relativeStrmPath}`;
    zip.file(fullZipPath, file.streamUrl + '\n');
  });

  // Add a helpful README and quick deploy instructions inside the ZIP
  const readmeContent = `# STRM Bridge - Paquete de Archivos .strm
Generado para: ${network.duckDnsDomain} (${network.protocol.toUpperCase()})
Total de archivos: ${strmFiles.length}

## Instrucciones para ZimaOS / CasaOS:
1. Copia las carpetas de este archivo ZIP en la ruta de tu servidor ZimaOS/CasaOS, por ejemplo:
   /DATA/Media/STRM/

2. En tu Plex, Jellyfin o Emby (desplegado vía Docker Compose):
   - Monta el volumen de origen:
     - /DATA/Media/STRM/Peliculas:/media/movies:ro
     - /DATA/Media/STRM/Series:/media/series:ro
   - Configura las bibliotecas para escanear estas carpetas.

3. Reproducción:
   - Plex / Jellyfin / Emby leerá automáticamente el archivo .strm y abrirá el stream directo
     mediante tu Nginx Proxy Manager + DuckDNS.
   - En VLC Player: arrastra cualquier archivo .strm directamente a la ventana de VLC o abre la URL.

Generado con STRM Bridge.
`;

  zip.file('LEEME_INSTRUCCIONES_ZIMAOS_CASAOS.txt', readmeContent);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats byte sizes into human readable strings
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generates an universal M3U/M3U8 playlist from all .strm entries
 * Enables opening the entire video library directly in VLC, Infuse, Kodi, or Smart TV apps
 */
export function generateM3uPlaylist(
  strmFiles: GeneratedStrmFile[],
  network: NetworkConfig
): string {
  const lines: string[] = [
    '#EXTM3U',
    `# Playlist Universal STRM Bridge - Servidor: ${network.duckDnsDomain}`,
    `# Generado para reproducción remota portátil en VLC, Kodi, Infuse y Smart TV`,
    '',
  ];

  strmFiles.forEach((file) => {
    const titleClean = file.strmFileName.replace(/\.strm$/i, '');
    const group = file.libraryName || 'General';
    lines.push(`#EXTINF:-1 tvg-name="${titleClean}" group-title="${group}",${titleClean}`);
    lines.push(file.streamUrl);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Downloads universal M3U playlist file
 */
export function downloadM3uPlaylist(
  strmFiles: GeneratedStrmFile[],
  network: NetworkConfig,
  filename: string = 'videoteca_portable.m3u'
): void {
  const content = generateM3uPlaylist(strmFiles, network);
  const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Audits a stream URL for maximum cross-network and cross-device portability
 */
export function auditPortability(streamUrl: string): PortabilityAuditResult {
  const checks = [
    {
      title: 'FQDN / Dominio Público Dinámico (DuckDNS)',
      passed: false,
      recommendation: '',
    },
    {
      title: 'Cifrado Seguro HTTPS',
      passed: false,
      recommendation: '',
    },
    {
      title: 'Puerto Estándar (443 / 80)',
      passed: false,
      recommendation: '',
    },
    {
      title: 'Codificación Compatible de Espacios (%20)',
      passed: false,
      recommendation: '',
    },
    {
      title: 'Autenticación Portátil en Cabecera o URL',
      passed: true,
      recommendation: 'Formato de autenticación compatible con VLC, Jellyfin, Plex y Emby.',
    },
  ];

  try {
    const url = new URL(streamUrl);
    const host = url.hostname.toLowerCase();

    // 1. FQDN check
    const isLocalIp =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local');

    if (!isLocalIp && host.includes('.')) {
      checks[0].passed = true;
      checks[0].recommendation = 'Excelente: Usa un nombre de dominio público accesible desde cualquier red externa.';
    } else {
      checks[0].passed = false;
      checks[0].recommendation = 'Aviso: La URL usa una IP local privada (' + host + '). Los archivos .strm solo funcionarán dentro de tu misma red física, no en un ZimaOS/CasaOS remoto.';
    }

    // 2. HTTPS check
    if (url.protocol === 'https:') {
      checks[1].passed = true;
      checks[1].recommendation = 'Excelente: HTTPS previene bloqueos de operadores móviles (4G/5G) y asegura transmisión sin cortes.';
    } else {
      checks[1].passed = false;
      checks[1].recommendation = 'Recomendado: Cambia a HTTPS con Nginx Proxy Manager + Let\'s Encrypt para evitar alertas de seguridad y bloqueos en redes públicas.';
    }

    // 3. Port check
    const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
    if (port === 443 || port === 80) {
      checks[2].passed = true;
      checks[2].recommendation = 'Puerto estándar 443/80: Máxima compatibilidad con firewalls en hoteles, oficinas y redes móviles.';
    } else {
      checks[2].passed = false;
      checks[2].recommendation = 'Puerto personalizado (:' + port + '). Algunos routers o redes externas podrían restringir puertos no convencionales.';
    }

    // 4. Encoding check
    if (!url.pathname.includes(' ') && (url.pathname.includes('%20') || !url.pathname.includes('%'))) {
      checks[3].passed = true;
      checks[3].recommendation = 'Ruta codificada limpiamente: Los reproductores en Linux/Android la abrirán sin errores.';
    } else {
      checks[3].passed = false;
      checks[3].recommendation = 'Se detectaron espacios sin codificar. Los reproductores en Linux/CasaOS podrían cortar la URL.';
    }

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    let level: PortabilityAuditResult['level'] = 'optimal';
    let summary = 'Tus archivos .strm son 100% portables y funcionarán en cualquier red o dispositivo.';

    if (score < 50) {
      level = 'restricted';
      summary = 'Portabilidad limitada: La URL requiere estar en la misma red local o no usa HTTPS.';
    } else if (score < 80) {
      level = 'good';
      summary = 'Buena portabilidad, pero hay pequeñas mejoras recomendadas para mayor compatibilidad.';
    }

    return { score, level, summary, checks };
  } catch {
    return {
      score: 20,
      level: 'restricted',
      summary: 'La URL no es válida o tiene errores de sintaxis.',
      checks,
    };
  }
}

/**
 * Rewrites an existing .strm URL string to point to a new DuckDNS / Network target
 */
export function rewriteStrmUrl(oldUrl: string, targetNetwork: NetworkConfig): string {
  try {
    const parsed = new URL(oldUrl.trim());
    const path = parsed.pathname; // preserves /movies/Inception.mkv
    const search = parsed.search; // preserves existing queries if any

    const protocol = targetNetwork.protocol;
    const domain = targetNetwork.duckDnsDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');

    let portString = '';
    if (
      (protocol === 'https' && targetNetwork.port !== 443) ||
      (protocol === 'http' && targetNetwork.port !== 80)
    ) {
      portString = `:${targetNetwork.port}`;
    }

    let authString = '';
    if (targetNetwork.authType === 'basic' && targetNetwork.basicUser) {
      const user = encodeURIComponent(targetNetwork.basicUser);
      const pass = targetNetwork.basicPass ? `:${encodeURIComponent(targetNetwork.basicPass)}` : '';
      authString = `${user}${pass}@`;
    }

    // Determine query string
    let finalQuery = search;
    if (targetNetwork.authType === 'token' && targetNetwork.tokenValue) {
      const sp = new URLSearchParams(search);
      sp.set(targetNetwork.tokenParamName || 'token', targetNetwork.tokenValue);
      finalQuery = `?${sp.toString()}`;
    }

    return `${protocol}://${authString}${domain}${portString}${path}${finalQuery}`;
  } catch {
    // If not a full URL, return oldUrl or fallback
    return oldUrl;
  }
}

/**
 * Migrates an entire ZIP of existing .strm files to a new network/domain target
 */
export async function migrateExistingStrmZip(
  zipBlobOrFile: Blob | File,
  targetNetwork: NetworkConfig
): Promise<{
  migratedItems: MigratedStrmItem[];
  newZipBlob: Blob;
}> {
  const loadedZip = await JSZip.loadAsync(zipBlobOrFile);
  const newZip = new JSZip();
  const migratedItems: MigratedStrmItem[] = [];

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, fileEntry) => {
    if (fileEntry.dir) {
      newZip.folder(relativePath);
      return;
    }

    if (relativePath.toLowerCase().endsWith('.strm')) {
      const p = fileEntry.async('string').then((content) => {
        const oldUrl = content.trim();
        const newUrl = rewriteStrmUrl(oldUrl, targetNetwork);
        newZip.file(relativePath, newUrl + '\n');

        migratedItems.push({
          fileName: relativePath.split('/').pop() || relativePath,
          filePath: relativePath,
          oldUrl,
          newUrl,
          hasChanged: oldUrl !== newUrl,
        });
      });
      filePromises.push(p);
    } else {
      // Copy other files (e.g. README) as-is
      const p = fileEntry.async('blob').then((blob) => {
        newZip.file(relativePath, blob);
      });
      filePromises.push(p);
    }
  });

  await Promise.all(filePromises);

  // Generate new updated zip
  const newZipBlob = await newZip.generateAsync({ type: 'blob' });

  return { migratedItems, newZipBlob };
}

