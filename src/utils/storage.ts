import { Channel, Playlist, PlayerSettings } from '../types/iptv';
import { DEFAULT_CHANNELS } from '../data/defaultChannels';

const PLAYLISTS_KEY = 'stream_m3u_playlists_v1';
const ACTIVE_PLAYLIST_KEY = 'stream_m3u_active_playlist_v1';
const FAVORITES_KEY = 'stream_m3u_favorites_v1';
const RECENTS_KEY = 'stream_m3u_recents_v1';
const SETTINGS_KEY = 'stream_m3u_settings_v1';
const LAST_PLAYED_KEY = 'stream_m3u_last_channel_v1';

export const DEFAULT_SETTINGS: PlayerSettings = {
  autoplay: true,
  volume: 0.8,
  muted: false,
  aspectRatio: '16:9',
  useCorsProxy: false,
  corsProxyUrl: 'https://corsproxy.io/?',
  bufferLength: 30,
  lowLatencyMode: true,
  viewMode: 'list',
};

export const DEFAULT_PLAYLIST: Playlist = {
  id: 'pl_default_curated',
  name: 'Curated Global Feeds (24/7 Live)',
  source: 'preset',
  channelCount: DEFAULT_CHANNELS.length,
  importedAt: Date.now(),
  channels: DEFAULT_CHANNELS,
};

export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (!raw) return [DEFAULT_PLAYLIST];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_PLAYLIST];
    return parsed;
  } catch {
    return [DEFAULT_PLAYLIST];
  }
}

export function savePlaylists(playlists: Playlist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (err) {
    console.error('Failed to save playlists to localStorage:', err);
  }
}

export function loadActivePlaylistId(): string {
  try {
    return localStorage.getItem(ACTIVE_PLAYLIST_KEY) || DEFAULT_PLAYLIST.id;
  } catch {
    return DEFAULT_PLAYLIST.id;
  }
}

export function saveActivePlaylistId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PLAYLIST_KEY, id);
  } catch {}
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favs: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch {}
}

export function loadRecents(): Channel[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentChannel(channel: Channel): void {
  try {
    const current = loadRecents();
    const filtered = current.filter(c => c.url !== channel.url && c.id !== channel.id);
    const updated = [channel, ...filtered].slice(0, 25);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch {}
}

export function loadSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PlayerSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function loadLastPlayedChannel(): Channel | null {
  try {
    const raw = localStorage.getItem(LAST_PLAYED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastPlayedChannel(channel: Channel): void {
  try {
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(channel));
  } catch {}
}
