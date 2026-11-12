export type ProtocolType = 'https' | 'http';
export type AuthType = 'none' | 'basic' | 'token';
export type UrlEncodingType = 'standard' | 'encode-all' | 'raw';

export interface NetworkConfig {
  duckDnsDomain: string; // e.g. "mymedia.duckdns.org"
  protocol: ProtocolType;
  port: number; // e.g. 443 or 8443
  basePath: string; // e.g. "/media" or "/stream"
  authType: AuthType;
  basicUser: string;
  basicPass: string;
  tokenParamName: string; // e.g. "token" or "key"
  tokenValue: string;
  urlEncoding: UrlEncodingType;
  enableRangeSupport: boolean;
  sslVerify: boolean;
}

export type MediaCategory = 'movies' | 'series' | 'anime' | 'documentaries' | 'custom';

export interface LibraryDirectory {
  id: string;
  name: string;
  category: MediaCategory;
  sourceHostPath: string; // Path on origin server (e.g. "/DATA/Media/Peliculas")
  remoteHttpPath: string; // Path exposed via NPM/Web server (e.g. "/movies")
  zimaOsStrmPath: string; // Destination path on ZimaOS/CasaOS (e.g. "/DATA/Media/STRM/Peliculas")
  allowedExtensions: string[]; // ['.mkv', '.mp4', '.avi', '.mov', '.ts']
  description?: string;
}

export interface MediaItem {
  id: string;
  libraryId: string;
  title: string;
  relativePath: string; // e.g. "Inception (2010)/Inception (2010).mkv"
  fileName: string;
  fileExtension: string;
  sizeBytes?: number;
  season?: number;
  episode?: number;
  year?: number;
  customUrlOverride?: string;
}

export interface GeneratedStrmFile {
  id: string;
  libraryId: string;
  libraryName: string;
  relativeStrmPath: string; // e.g. "Inception (2010)/Inception (2010).strm"
  strmFileName: string;
  streamUrl: string;
  originalFileName: string;
  sizeBytes?: number;
}

export type PortabilityProfileType = 'remote-duckdns' | 'local-lan' | 'vpn-tailscale' | 'custom';

export interface PortabilityProfile {
  id: PortabilityProfileType;
  name: string;
  description: string;
  hostDomain: string;
  protocol: ProtocolType;
  port: number;
  isFullyRemote: boolean;
  notes: string;
}

export interface PortabilityAuditResult {
  score: number; // 0 - 100
  level: 'optimal' | 'good' | 'warning' | 'restricted';
  summary: string;
  checks: {
    title: string;
    passed: boolean;
    recommendation: string;
  }[];
}

export interface MigratedStrmItem {
  fileName: string;
  filePath: string;
  oldUrl: string;
  newUrl: string;
  hasChanged: boolean;
}

