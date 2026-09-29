export interface Channel {
  id: string;
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  tvgCountry?: string;
  tvgLanguage?: string;
  httpUserAgent?: string;
  httpReferrer?: string;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  source: 'preset' | 'url' | 'file' | 'direct';
  url?: string;
  channelCount: number;
  importedAt: number;
  epgUrl?: string;
  channels: Channel[];
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  start: Date;
  stop: Date;
  category?: string;
  icon?: string;
}

export interface PlayerSettings {
  autoplay: boolean;
  volume: number;
  muted: boolean;
  aspectRatio: '16:9' | '4:3' | 'fill' | 'fit';
  useCorsProxy: boolean;
  corsProxyUrl: string;
  bufferLength: number;
  lowLatencyMode: boolean;
  viewMode: 'list' | 'grid';
}

export interface StreamStats {
  resolution: string;
  bitrate: number;
  bufferLength: number;
  droppedFrames: number;
  levels: { id: number; height: number; width: number; bitrate: number; name?: string }[];
  currentLevel: number;
  audioTracks: { id: number; name: string; lang?: string }[];
  currentAudioTrack: number;
  isLive: boolean;
}

export type CategoryFilter = string;
