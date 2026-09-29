import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Globe, 
  FileDown, 
  RotateCcw, 
  ShieldCheck, 
  Tv,
  Check
} from 'lucide-react';
import { PlayerSettings, Playlist } from '../types/iptv';
import { DEFAULT_CORS_PROXIES } from '../utils/corsProxy';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onSaveSettings: (settings: PlayerSettings) => void;
  activePlaylist: Playlist;
  onExportPlaylist: () => void;
  onResetToDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  activePlaylist,
  onExportPlaylist,
  onResetToDefaults,
}) => {
  const [localSettings, setLocalSettings] = useState<PlayerSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Player & Stream Settings</h2>
              <p className="text-xs text-neutral-400">Configure CORS proxies, stream buffering, and exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* CORS Proxy Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">CORS Web Proxy</span>
                <span className="text-neutral-400 text-[11px]">
                  Enables playback of IPTV streams with restrictive browser CORS headers
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.useCorsProxy}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, useCorsProxy: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {localSettings.useCorsProxy && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 mt-2">
                <label className="block text-neutral-300 font-medium">Proxy Service Base URL:</label>
                <div className="space-y-1.5">
                  {DEFAULT_CORS_PROXIES.map(proxy => (
                    <label key={proxy.url} className="flex items-center gap-2 cursor-pointer text-neutral-300">
                      <input
                        type="radio"
                        name="cors_proxy"
                        value={proxy.url}
                        checked={localSettings.corsProxyUrl === proxy.url}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, corsProxyUrl: e.target.value }))}
                        className="accent-rose-500"
                      />
                      <span>{proxy.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-neutral-800" />

          {/* Playback Behaviors */}
          <div className="space-y-3">
            <span className="font-semibold text-white block">Playback Preferences</span>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-neutral-200 block">Autoplay on Select</span>
                <span className="text-neutral-400 text-[11px]">Automatically start stream when switching channels</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoplay}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, autoplay: e.target.checked }))}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-neutral-200 block">Low Latency Live Mode</span>
                <span className="text-neutral-400 text-[11px]">Reduces stream delay to sync closer with real-time broadcast</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.lowLatencyMode}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, lowLatencyMode: e.target.checked }))}
                className="accent-rose-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-neutral-200 block">Default Aspect Ratio</span>
                <span className="text-neutral-400 text-[11px]">Screen fitting mode</span>
              </div>
              <select
                value={localSettings.aspectRatio}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="16:9">16:9 (Standard Widescreen)</option>
                <option value="4:3">4:3 (Classic Television)</option>
                <option value="fill">Fill (Crop to Window)</option>
                <option value="fit">Fit (Letterbox to Window)</option>
              </select>
            </div>
          </div>

          <hr className="border-neutral-800" />

          {/* Export & Backup */}
          <div className="space-y-3">
            <span className="font-semibold text-white block">Playlist Management & Export</span>
            
            <div className="flex items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div>
                <span className="font-medium text-neutral-200 block">
                  Export Active Playlist
                </span>
                <span className="text-neutral-500 text-[11px]">
                  Download {activePlaylist.channels.length} channels as a standard .m3u8 file
                </span>
              </div>
              <button
                onClick={onExportPlaylist}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs whitespace-nowrap transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export .m3u8
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div>
                <span className="font-medium text-neutral-200 block">
                  Reset Starter Channels
                </span>
                <span className="text-neutral-500 text-[11px]">
                  Restore initial curated global 24/7 live feeds
                </span>
              </div>
              <button
                onClick={() => {
                  if (confirm('Reset playlists to initial default channels?')) {
                    onResetToDefaults();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs whitespace-nowrap transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            {savedNotice && (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
