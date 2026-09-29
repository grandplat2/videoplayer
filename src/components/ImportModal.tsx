import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Link2, 
  Sparkles, 
  FileText, 
  PlayCircle, 
  Check, 
  AlertCircle, 
  Loader2,
  Globe
} from 'lucide-react';
import { Channel, Playlist } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { fetchPlaylistContent } from '../utils/corsProxy';
import { PRESET_PLAYLISTS, PresetPlaylist } from '../data/presetPlaylists';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlaylist: (playlist: Playlist) => void;
  onPlayDirectStream: (channel: Channel) => void;
  useCorsProxy: boolean;
  corsProxyUrl: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportPlaylist,
  onPlayDirectStream,
  useCorsProxy,
  corsProxyUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'url' | 'file' | 'direct' | 'text'>('presets');
  
  // URL Import State
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlName, setUrlName] = useState<string>('');
  const [urlEpg, setUrlEpg] = useState<string>('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Direct Stream State
  const [directUrl, setDirectUrl] = useState<string>('');
  const [directName, setDirectName] = useState<string>('');

  // Text Paste State
  const [rawText, setRawText] = useState<string>('');
  const [rawTextName, setRawTextName] = useState<string>('');

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  // Handle Preset selection
  const handleSelectPreset = async (preset: PresetPlaylist) => {
    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage(`Fetching ${preset.name}...`);

    try {
      const { text, usedProxy } = await fetchPlaylistContent(preset.url, useCorsProxy, corsProxyUrl);
      setStatusMessage('Parsing channels and TV tags...');
      const { channels, epgUrl, playlistName } = parseM3U(text);

      if (channels.length === 0) {
        throw new Error('No valid stream channels found in playlist.');
      }

      const newPlaylist: Playlist = {
        id: `pl_${Date.now()}`,
        name: playlistName || preset.name,
        source: 'preset',
        url: preset.url,
        channelCount: channels.length,
        importedAt: Date.now(),
        epgUrl: epgUrl || preset.epgUrl,
        channels,
      };

      onImportPlaylist(newPlaylist);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Failed to fetch preset playlist. Check internet connection or enable CORS Web Proxy in Settings.'
      );
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Handle URL import
  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Downloading playlist manifest...');

    try {
      const { text } = await fetchPlaylistContent(urlInput.trim(), useCorsProxy, corsProxyUrl);
      setStatusMessage('Parsing M3U tags & stream URLs...');
      const { channels, epgUrl, playlistName } = parseM3U(text);

      if (channels.length === 0) {
        throw new Error('No stream channels found in this M3U file.');
      }

      const newPlaylist: Playlist = {
        id: `pl_${Date.now()}`,
        name: urlName.trim() || playlistName || 'Imported Playlist',
        source: 'url',
        url: urlInput.trim(),
        channelCount: channels.length,
        importedAt: Date.now(),
        epgUrl: urlEpg.trim() || epgUrl,
        channels,
      };

      onImportPlaylist(newPlaylist);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to load playlist from URL. Verify URL or try enabling CORS proxy.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage('');
    setStatusMessage('Reading local file...');

    try {
      const text = await selectedFile.text();
      setStatusMessage('Parsing channels...');
      const { channels, epgUrl, playlistName } = parseM3U(text);

      if (channels.length === 0) {
        throw new Error('The selected file contains no playable channels.');
      }

      const fileNameWithoutExt = selectedFile.name.replace(/\.(m3u8?|txt)$/i, '');
      const newPlaylist: Playlist = {
        id: `pl_${Date.now()}`,
        name: playlistName || fileNameWithoutExt || 'Local File Playlist',
        source: 'file',
        channelCount: channels.length,
        importedAt: Date.now(),
        epgUrl,
        channels,
      };

      onImportPlaylist(newPlaylist);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to parse file.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Handle Direct Stream URL
  const handleDirectStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    const streamChannel: Channel = {
      id: `ch_direct_${Date.now()}`,
      name: directName.trim() || 'Direct Live Stream',
      url: directUrl.trim(),
      groupTitle: 'Live Stream',
    };

    onPlayDirectStream(streamChannel);
    onClose();
  };

  // Handle Raw Text Paste
  const handleProcessRawText = () => {
    if (!rawText.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { channels, epgUrl, playlistName } = parseM3U(rawText);
      if (channels.length === 0) {
        throw new Error('No channels detected in pasted text.');
      }

      const newPlaylist: Playlist = {
        id: `pl_${Date.now()}`,
        name: rawTextName.trim() || playlistName || 'Pasted Playlist',
        source: 'file',
        channelCount: channels.length,
        importedAt: Date.now(),
        epgUrl,
        channels,
      };

      onImportPlaylist(newPlaylist);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse pasted text.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Import Playlist / Streams</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Import .m3u or .m3u8 playlists from IPTV-org, URLs, or local files
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            IPTV-Org Presets
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Playlist URL (.m3u)
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'direct'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Single Stream Link
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste M3U Text
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
              <div className="font-semibold text-sm text-white">{statusMessage || 'Loading streams...'}</div>
              <p className="text-xs text-neutral-400 mt-1">This may take a moment for large playlists.</p>
            </div>
          )}

          {/* 1. IPTV-Org Presets */}
          {!isLoading && activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="text-xs text-neutral-400 flex items-center justify-between">
                <span>Select a verified public feed from GitHub iptv-org directory:</span>
                <span className="font-mono tabular-nums text-neutral-500">{PRESET_PLAYLISTS.length} curated presets</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {PRESET_PLAYLISTS.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="group p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs text-white group-hover:text-rose-400 transition-colors">
                          {preset.name}
                        </span>
                        {preset.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/50 border border-rose-800/40 px-1.5 py-0.5 rounded">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>{preset.category}</span>
                      <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform font-sans font-medium">
                        Click to Load →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. URL Import */}
          {!isLoading && activeTab === 'url' && (
            <form onSubmit={handleImportUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  M3U / M3U8 Playlist URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/playlist.m3u8"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Playlist Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Premium IPTV"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  EPG / XMLTV URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://iptv-org.github.io/epg/guides/us.xml"
                  value={urlEpg}
                  onChange={(e) => setUrlEpg(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Fetch & Load Playlist
                </button>
              </div>
            </form>
          )}

          {/* 3. Upload File */}
          {!isLoading && activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-2xl p-8 text-center transition-colors">
                <Upload className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
                <div className="font-semibold text-sm text-neutral-200 mb-1">
                  Upload .m3u or .m3u8 file
                </div>
                <p className="text-xs text-neutral-400 mb-4">
                  Drag and drop your local playlist file here, or browse from your device
                </p>
                <input
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  id="m3u-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="m3u-file-input"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select File
                </label>

                {selectedFile && (
                  <div className="mt-4 p-2.5 bg-neutral-950 rounded-lg text-xs text-neutral-300 font-mono flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleProcessFile}
                  className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Parse & Load Channels
                </button>
              )}
            </div>
          )}

          {/* 4. Direct Stream URL */}
          {!isLoading && activeTab === 'direct' && (
            <form onSubmit={handleDirectStream} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Direct Live Stream URL (.m3u8 / HLS) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/live/stream/master.m3u8"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Stream Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Custom Stream"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Stream Directly Now
                </button>
              </div>
            </form>
          )}

          {/* 5. Paste M3U Text */}
          {!isLoading && activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Playlist Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pasted Channels"
                  value={rawTextName}
                  onChange={(e) => setRawTextName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 mb-3"
                />

                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  M3U / M3U8 Content Text *
                </label>
                <textarea
                  rows={8}
                  placeholder={`#EXTM3U\n#EXTINF:-1 tvg-id="CNN.us" group-title="News",CNN Live\nhttps://example.com/cnn.m3u8`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={handleProcessRawText}
                disabled={!rawText.trim()}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Load From Text
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
