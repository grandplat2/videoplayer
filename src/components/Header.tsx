import React from 'react';
import { 
  Tv, 
  Plus, 
  CalendarDays, 
  Settings, 
  Globe, 
  Maximize2, 
  Minimize2,
  ListFilter,
  Radio,
  FileDown
} from 'lucide-react';
import { Playlist } from '../types/iptv';

interface HeaderProps {
  activePlaylist: Playlist;
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenImport: () => void;
  onOpenEpgGuide: () => void;
  onOpenSettings: () => void;
  onExportPlaylist: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isCinemaMode: boolean;
  onToggleCinemaMode: () => void;
  corsProxyEnabled: boolean;
  onToggleCorsProxy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePlaylist,
  playlists,
  onSelectPlaylist,
  onOpenImport,
  onOpenEpgGuide,
  onOpenSettings,
  onExportPlaylist,
  sidebarOpen,
  onToggleSidebar,
  isCinemaMode,
  onToggleCinemaMode,
  corsProxyEnabled,
  onToggleCorsProxy,
}) => {
  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-3 md:px-5 flex items-center justify-between shrink-0 select-none z-20">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Toggle Channels Sidebar"
          aria-label="Toggle Channels Sidebar"
        >
          <ListFilter className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-900/40">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            StreamM3U
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.5 rounded">
              Live IPTV
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Active Playlist Selector / Quick Nav */}
      <div className="hidden lg:flex items-center gap-3 max-w-md">
        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-950/70 border border-neutral-800 rounded-lg text-xs">
          <Tv className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-400">Playlist:</span>
          <select
            value={activePlaylist.id}
            onChange={(e) => {
              const selected = playlists.find(p => p.id === e.target.value);
              if (selected) onSelectPlaylist(selected);
            }}
            className="bg-transparent text-neutral-200 font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            {playlists.map(pl => (
              <option key={pl.id} value={pl.id} className="bg-neutral-900 text-neutral-100">
                {pl.name} ({pl.channelCount} ch)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* CORS Proxy Indicator & Quick Toggle */}
        <button
          onClick={onToggleCorsProxy}
          title={corsProxyEnabled ? "CORS Proxy: ENABLED (Routing streams through web proxy)" : "CORS Proxy: DISABLED (Direct connection)"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            corsProxyEnabled 
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20' 
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CORS Proxy:</span>
          <span className="font-semibold">{corsProxyEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* EPG Guide Button */}
        <button
          onClick={onOpenEpgGuide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Open Electronic Program Guide (EPG)"
        >
          <CalendarDays className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">TV Guide</span>
        </button>

        {/* Import Playlist CTA */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-900/30 transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Import Playlist</span>
        </button>

        {/* Export M3U */}
        <button
          onClick={onExportPlaylist}
          className="hidden md:flex p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Export Active Playlist as .m3u8"
          aria-label="Export Playlist"
        >
          <FileDown className="w-4 h-4" />
        </button>

        {/* Theater / Cinema Mode */}
        <button
          onClick={onToggleCinemaMode}
          className="hidden md:flex p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title={isCinemaMode ? "Exit Cinema Mode" : "Cinema Mode (Hide Sidebar)"}
          aria-label="Toggle Cinema Mode"
        >
          {isCinemaMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Settings & Stream Configuration"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
