/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Channel, Playlist, PlayerSettings } from './types/iptv';
import { 
  loadPlaylists, 
  savePlaylists, 
  loadActivePlaylistId, 
  saveActivePlaylistId, 
  loadFavorites, 
  saveFavorites, 
  loadRecents, 
  saveRecentChannel, 
  loadSettings, 
  saveSettings, 
  DEFAULT_PLAYLIST 
} from './utils/storage';
import { exportToM3U } from './utils/m3uParser';
import { Header } from './components/Header';
import { ChannelSidebar } from './components/ChannelSidebar';
import { Player } from './components/Player';
import { ImportModal } from './components/ImportModal';
import { EpgGuideModal } from './components/EpgGuideModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists());
  const [activePlaylistId, setActivePlaylistId] = useState<string>(() => loadActivePlaylistId());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [recents, setRecents] = useState<Channel[]>(() => loadRecents());
  const [settings, setSettings] = useState<PlayerSettings>(() => loadSettings());

  // Active channel
  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0] || DEFAULT_PLAYLIST;
  const [activeChannel, setActiveChannel] = useState<Channel | null>(() => {
    return activePlaylist.channels[0] || null;
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showEpgModal, setShowEpgModal] = useState<boolean>(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Sync playlists to localStorage
  useEffect(() => {
    savePlaylists(playlists);
  }, [playlists]);

  // Sync active playlist ID
  useEffect(() => {
    saveActivePlaylistId(activePlaylistId);
  }, [activePlaylistId]);

  // Sync favorites
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // Sync settings
  const handleUpdateSettings = useCallback((newSettings: Partial<PlayerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Handle channel select
  const handleSelectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel);
    saveRecentChannel(channel);
    setRecents(loadRecents());
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      } else {
        return [...prev, channelId];
      }
    });
  }, []);

  // Next / Previous channel in active playlist
  const handleNextChannel = useCallback(() => {
    if (!activeChannel || activePlaylist.channels.length === 0) return;
    const currentIdx = activePlaylist.channels.findIndex(c => c.id === activeChannel.id || c.url === activeChannel.url);
    const nextIdx = (currentIdx + 1) % activePlaylist.channels.length;
    handleSelectChannel(activePlaylist.channels[nextIdx]);
  }, [activeChannel, activePlaylist.channels, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    if (!activeChannel || activePlaylist.channels.length === 0) return;
    const currentIdx = activePlaylist.channels.findIndex(c => c.id === activeChannel.id || c.url === activeChannel.url);
    const prevIdx = (currentIdx - 1 + activePlaylist.channels.length) % activePlaylist.channels.length;
    handleSelectChannel(activePlaylist.channels[prevIdx]);
  }, [activeChannel, activePlaylist.channels, handleSelectChannel]);

  // Import new playlist
  const handleImportPlaylist = useCallback((newPlaylist: Playlist) => {
    setPlaylists(prev => {
      const filtered = prev.filter(p => p.id !== newPlaylist.id);
      return [newPlaylist, ...filtered];
    });
    setActivePlaylistId(newPlaylist.id);
    if (newPlaylist.channels.length > 0) {
      handleSelectChannel(newPlaylist.channels[0]);
    }
  }, [handleSelectChannel]);

  // Play direct stream without full playlist
  const handlePlayDirectStream = useCallback((streamChannel: Channel) => {
    handleSelectChannel(streamChannel);
  }, [handleSelectChannel]);

  // Export current playlist as .m3u8 file
  const handleExportPlaylist = useCallback(() => {
    const m3uContent = exportToM3U(activePlaylist.channels, activePlaylist.name);
    const blob = new Blob([m3uContent], { type: 'application/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activePlaylist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u8`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activePlaylist]);

  // Reset to default starter channels
  const handleResetToDefaults = useCallback(() => {
    setPlaylists([DEFAULT_PLAYLIST]);
    setActivePlaylistId(DEFAULT_PLAYLIST.id);
    setActiveChannel(DEFAULT_PLAYLIST.channels[0]);
  }, []);

  // Global key bindings ('g' for guide, 'c' for cinema mode)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        setShowEpgModal(prev => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCinemaMode(prev => !prev);
      } else if (e.key === '?') {
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Top Bar Contract (3-Zone) */}
      <Header
        activePlaylist={activePlaylist}
        playlists={playlists}
        onSelectPlaylist={(pl) => {
          setActivePlaylistId(pl.id);
          if (pl.channels.length > 0) {
            handleSelectChannel(pl.channels[0]);
          }
        }}
        onOpenImport={() => setShowImportModal(true)}
        onOpenEpgGuide={() => setShowEpgModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onExportPlaylist={handleExportPlaylist}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        isCinemaMode={isCinemaMode}
        onToggleCinemaMode={() => setIsCinemaMode(prev => !prev)}
        corsProxyEnabled={settings.useCorsProxy}
        onToggleCorsProxy={() => handleUpdateSettings({ useCorsProxy: !settings.useCorsProxy })}
      />

      {/* Main Streaming Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Channel Sidebar */}
        {!isCinemaMode && (
          <ChannelSidebar
            channels={activePlaylist.channels}
            activeChannel={activeChannel}
            favorites={favorites}
            recents={recents}
            onSelectChannel={handleSelectChannel}
            onToggleFavorite={handleToggleFavorite}
            viewMode={settings.viewMode}
            onToggleViewMode={(mode) => handleUpdateSettings({ viewMode: mode })}
            isOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        )}

        {/* Video Player Main Viewport */}
        <main className="flex-1 flex flex-col bg-black overflow-hidden relative">
          <Player
            channel={activeChannel}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenDiagnostics={() => setShowDiagnosticsModal(true)}
            onNextChannel={handleNextChannel}
            onPrevChannel={handlePrevChannel}
            onOpenEpgGuide={() => setShowEpgModal(true)}
          />
        </main>
      </div>

      {/* Modals */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportPlaylist={handleImportPlaylist}
        onPlayDirectStream={handlePlayDirectStream}
        useCorsProxy={settings.useCorsProxy}
        corsProxyUrl={settings.corsProxyUrl}
      />

      <EpgGuideModal
        isOpen={showEpgModal}
        onClose={() => setShowEpgModal(false)}
        channels={activePlaylist.channels}
        activeChannel={activeChannel}
        onSelectChannel={handleSelectChannel}
      />

      <DiagnosticsModal
        isOpen={showDiagnosticsModal}
        onClose={() => setShowDiagnosticsModal(false)}
        channel={activeChannel}
        settings={settings}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSaveSettings={(newSet) => handleUpdateSettings(newSet)}
        activePlaylist={activePlaylist}
        onExportPlaylist={handleExportPlaylist}
        onResetToDefaults={handleResetToDefaults}
      />

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
