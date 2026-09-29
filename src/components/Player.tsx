import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Tv, 
  RotateCcw, 
  Globe, 
  Sliders, 
  Radio, 
  Layers, 
  Headphones, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Channel, PlayerSettings, StreamStats } from '../types/iptv';
import { proxifyUrl } from '../utils/corsProxy';
import { getChannelSchedule, formatTimeRange } from '../utils/epgParser';

interface PlayerProps {
  channel: Channel | null;
  settings: PlayerSettings;
  onUpdateSettings: (settings: Partial<PlayerSettings>) => void;
  onOpenDiagnostics: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onOpenEpgGuide: () => void;
}

export const Player: React.FC<PlayerProps> = ({
  channel,
  settings,
  onUpdateSettings,
  onOpenDiagnostics,
  onNextChannel,
  onOpenEpgGuide,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [volume, setVolume] = useState<number>(settings.volume);
  const [isMuted, setIsMuted] = useState<boolean>(settings.muted);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);
  const [isLiveSync, setIsLiveSync] = useState<boolean>(true);

  const [streamStats, setStreamStats] = useState<StreamStats>({
    resolution: 'Unknown',
    bitrate: 0,
    bufferLength: 0,
    droppedFrames: 0,
    levels: [],
    currentLevel: -1,
    audioTracks: [],
    currentAudioTrack: 0,
    isLive: true,
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // Calculate EPG schedule for currently active channel
  const scheduleData = channel ? getChannelSchedule(channel) : null;

  // Cleanup existing HLS instance
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Initialize playback for channel
  const initStream = useCallback((streamUrl: string, useProxy: boolean) => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    destroyHls();
    setHasError(false);
    setErrorMessage('');
    setIsBuffering(true);

    const effectiveUrl = proxifyUrl(streamUrl, useProxy, settings.corsProxyUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: settings.lowLatencyMode,
        maxBufferLength: settings.bufferLength,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        // Custom loader to proxify sub-manifests and segments if proxy is active
        xhrSetup: (xhr, url) => {
          if (useProxy && !url.startsWith('https://corsproxy.io/?') && !url.startsWith('https://api.allorigins.win')) {
            const proxied = proxifyUrl(url, true, settings.corsProxyUrl);
            xhr.open('GET', proxied, true);
          }
        },
      });

      hlsRef.current = hls;

      hls.loadSource(effectiveUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsBuffering(false);
        const levels = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height,
          width: lvl.width,
          bitrate: lvl.bitrate,
          name: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
        }));

        const audioTracks = (hls.audioTracks || []).map((tr, index) => ({
          id: index,
          name: tr.name || `Audio Track ${index + 1}`,
          lang: tr.lang,
        }));

        setStreamStats(prev => ({
          ...prev,
          levels,
          currentLevel: hls.currentLevel,
          audioTracks,
          currentAudioTrack: hls.audioTrack,
        }));

        if (settings.autoplay) {
          video.play().catch(err => {
            console.warn('Autoplay prevented by browser:', err);
            setIsPlaying(false);
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          setStreamStats(prev => ({
            ...prev,
            currentLevel: data.level,
            resolution: lvl.height ? `${lvl.width}x${lvl.height}` : prev.resolution,
            bitrate: lvl.bitrate,
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('HLS Event Error:', data.type, data.details, data.fatal);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCountRef.current < 2) {
                retryCountRef.current++;
                console.log(`Retrying HLS network load (attempt ${retryCountRef.current})...`);
                hls.startLoad();
              } else if (!useProxy) {
                // Automatically try switching to CORS proxy if direct network fails
                console.log('Direct playback network failed, attempting CORS proxy recovery...');
                onUpdateSettings({ useCorsProxy: true });
              } else {
                setHasError(true);
                setErrorMessage('Stream network error. The broadcast server may be offline or blocking requests.');
                setIsBuffering(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Recovering media error...');
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage(`Playback fatal error: ${data.details}`);
              destroyHls();
              setIsBuffering(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari iOS/macOS HLS support
      video.src = effectiveUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        if (settings.autoplay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setErrorMessage('Video failed to load in native player.');
        setIsBuffering(false);
      });
    } else {
      setHasError(true);
      setErrorMessage('HLS live streaming is not supported by your browser.');
      setIsBuffering(false);
    }
  }, [destroyHls, settings.autoplay, settings.bufferLength, settings.corsProxyUrl, settings.lowLatencyMode, onUpdateSettings]);

  // Trigger stream load when channel or proxy setting changes
  useEffect(() => {
    if (!channel) return;
    retryCountRef.current = 0;
    initStream(channel.url, settings.useCorsProxy);

    return () => {
      destroyHls();
    };
  }, [channel?.id, channel?.url, settings.useCorsProxy, initStream, destroyHls]);

  // Video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleTimeUpdate = () => {
      // Check live sync status
      if (video.duration && isFinite(video.duration)) {
        const diff = video.duration - video.currentTime;
        setIsLiveSync(diff < 6);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Update volume & mute states
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyP':
          e.preventDefault();
          togglePictureInPicture();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, Math.round((v + 0.05) * 100) / 100));
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, Math.round((v - 0.05) * 100) / 100));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  // Auto-hide controls timeout
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu && !showAudioMenu) {
        setShowControls(false);
      }
    }, 3500);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    onUpdateSettings({ muted: nextMuted });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    onUpdateSettings({ volume: val, muted: val === 0 });
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
      } catch (err) {
        console.error('Fullscreen request failed:', err);
      }
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
  };

  const syncToLiveEdge = () => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.liveSyncPosition && (video.currentTime = hlsRef.current.liveSyncPosition);
    } else if (isFinite(video.duration)) {
      video.currentTime = video.duration - 1;
    }
    video.play().catch(console.error);
    setIsLiveSync(true);
  };

  const cycleAspectRatio = () => {
    const ratios: PlayerSettings['aspectRatio'][] = ['16:9', '4:3', 'fill', 'fit'];
    const currentIdx = ratios.indexOf(settings.aspectRatio);
    const next = ratios[(currentIdx + 1) % ratios.length];
    onUpdateSettings({ aspectRatio: next });
  };

  const handleSelectQuality = (levelId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setStreamStats(prev => ({ ...prev, currentLevel: levelId }));
    }
    setShowQualityMenu(false);
  };

  const handleSelectAudioTrack = (trackId: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
      setStreamStats(prev => ({ ...prev, currentAudioTrack: trackId }));
    }
    setShowAudioMenu(false);
  };

  // Video object styling based on aspect ratio
  const getAspectRatioClass = () => {
    switch (settings.aspectRatio) {
      case '4:3':
        return 'aspect-[4/3] object-contain';
      case 'fill':
        return 'w-full h-full object-cover';
      case 'fit':
        return 'w-full h-full object-contain';
      case '16:9':
      default:
        return 'aspect-video object-contain';
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-4 shadow-xl">
          <Tv className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Channel Selected</h2>
        <p className="text-neutral-400 text-sm max-w-md mb-6">
          Select a live TV channel from the sidebar or import an IPTV playlist (.m3u/.m3u8) to start streaming.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group select-none min-h-[280px]"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        className={`max-h-full max-w-full transition-all duration-200 ${getAspectRatioClass()}`}
        onClick={togglePlayPause}
      />

      {/* Buffering Indicator */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-3 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <span className="text-xs font-medium tracking-wide text-neutral-200">Connecting Live Stream...</span>
          </div>
        </div>
      )}

      {/* Error Overlay with Actions */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-6 z-20">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Stream Unavailable</h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              {errorMessage || 'This broadcast could not be established. Web browsers enforce CORS restrictions on some live IPTV servers.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={() => {
                  onUpdateSettings({ useCorsProxy: !settings.useCorsProxy });
                  initStream(channel.url, !settings.useCorsProxy);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {settings.useCorsProxy ? 'Disable CORS Proxy' : 'Enable CORS Web Proxy'}
              </button>

              <button
                onClick={() => initStream(channel.url, settings.useCorsProxy)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Stream
              </button>

              {onNextChannel && (
                <button
                  onClick={onNextChannel}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                >
                  Next Channel
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Overlay: Current Channel & EPG Information */}
      <div 
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 z-10 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-start justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-3 min-w-0">
            {channel.tvgLogo ? (
              <img
                src={channel.tvgLogo}
                alt={channel.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-10 h-10 object-contain rounded bg-neutral-900/80 p-1 border border-neutral-700/50 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-700/50 flex items-center justify-center text-neutral-400 shrink-0">
                <Tv className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white truncate drop-shadow">
                  {channel.name}
                </h1>
                {/* Live Pill Indicator */}
                <button
                  onClick={syncToLiveEdge}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isLiveSync 
                      ? 'bg-rose-600/90 text-white animate-pulse' 
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                  title="Click to jump to live edge"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {isLiveSync ? 'LIVE' : 'SYNC LIVE'}
                </button>
              </div>

              {/* Zero-Pill Unboxed Channel Metadata */}
              <div className="flex items-center gap-2 text-xs text-neutral-300/90 drop-shadow mt-0.5">
                <span>{channel.groupTitle || 'General'}</span>
                {channel.tvgCountry && (
                  <>
                    <span aria-hidden="true" className="text-neutral-500">·</span>
                    <span>{channel.tvgCountry}</span>
                  </>
                )}
                {channel.tvgLanguage && (
                  <>
                    <span aria-hidden="true" className="text-neutral-500">·</span>
                    <span>{channel.tvgLanguage}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick TV Guide button on top overlay */}
          <button
            onClick={onOpenEpgGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/50 text-xs font-medium text-neutral-200 transition-colors shadow"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>Guide</span>
          </button>
        </div>

        {/* EPG "Now Playing" Banner */}
        {scheduleData && (
          <div className="mt-3 max-w-lg bg-neutral-900/60 backdrop-blur-sm border border-neutral-800/80 rounded-lg p-2.5 text-xs text-neutral-200 pointer-events-auto">
            <div className="flex items-center justify-between mb-1 text-[11px] text-neutral-400">
              <span className="font-medium text-rose-400 truncate max-w-[200px]">NOW PLAYING</span>
              <span className="font-mono tabular-nums">
                {formatTimeRange(scheduleData.nowPlaying.start, scheduleData.nowPlaying.stop)}
              </span>
            </div>
            <div className="font-semibold text-white truncate mb-1">
              {scheduleData.nowPlaying.title}
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden mb-1">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${scheduleData.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span className="truncate">Up Next: {scheduleData.upNext.title}</span>
              <span className="shrink-0">{scheduleData.progressPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Center Play/Pause Click Overlay */}
      <button
        onClick={togglePlayPause}
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          !isPlaying && !isBuffering && !hasError ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform backdrop-blur-sm">
          <Play className="w-7 h-7 translate-x-0.5" />
        </div>
      </button>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 md:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3 text-white">
          {/* Left Controls: Play, Mute, Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-lg hover:bg-neutral-800/80 transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-neutral-800/80 transition-colors"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 group/volume w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-neutral-700 accent-rose-500 rounded-lg cursor-pointer"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>

            {/* Live Indicator */}
            <button
              onClick={syncToLiveEdge}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-neutral-300 hover:text-white"
            >
              <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-rose-500' : 'bg-neutral-500'}`} />
              <span className="hidden md:inline font-mono tabular-nums text-[11px]">
                {isLiveSync ? 'LIVE STREAM' : 'BEHIND LIVE'}
              </span>
            </button>
          </div>

          {/* Right Controls: Quality, Audio, Aspect, PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Stream Quality Selector */}
            {streamStats.levels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowAudioMenu(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    showQualityMenu ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/80 text-neutral-300'
                  }`}
                  title="Stream Quality"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden md:inline">
                    {streamStats.currentLevel === -1 
                      ? 'Auto' 
                      : (streamStats.levels[streamStats.currentLevel]?.name || 'Auto')}
                  </span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-44 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 shadow-xl text-xs z-30">
                    <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Video Quality
                    </div>
                    <button
                      onClick={() => handleSelectQuality(-1)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                        streamStats.currentLevel === -1 ? 'bg-rose-600/20 text-rose-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <span>Auto Adaptive</span>
                      {streamStats.currentLevel === -1 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                    </button>
                    {streamStats.levels.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => handleSelectQuality(lvl.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                          streamStats.currentLevel === lvl.id ? 'bg-rose-600/20 text-rose-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{lvl.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                          {Math.round(lvl.bitrate / 1000)}k
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audio Track Selector */}
            {streamStats.audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAudioMenu(!showAudioMenu);
                    setShowQualityMenu(false);
                  }}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    showAudioMenu ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/80 text-neutral-300'
                  }`}
                  title="Audio Tracks"
                >
                  <Headphones className="w-4 h-4" />
                </button>

                {showAudioMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 shadow-xl text-xs z-30">
                    <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Audio Tracks
                    </div>
                    {streamStats.audioTracks.map((tr) => (
                      <button
                        key={tr.id}
                        onClick={() => handleSelectAudioTrack(tr.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                          streamStats.currentAudioTrack === tr.id ? 'bg-rose-600/20 text-rose-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span className="truncate">{tr.name}</span>
                        {tr.lang && <span className="uppercase text-[10px] text-neutral-500">{tr.lang}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aspect Ratio Toggle */}
            <button
              onClick={cycleAspectRatio}
              className="px-2 py-1.5 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white text-xs font-mono uppercase transition-colors"
              title={`Aspect Ratio: ${settings.aspectRatio}`}
            >
              {settings.aspectRatio}
            </button>

            {/* Diagnostics Stats */}
            <button
              onClick={onOpenDiagnostics}
              className="p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition-colors"
              title="Stream Diagnostics"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Picture-in-Picture */}
            <button
              onClick={togglePictureInPicture}
              className="p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition-colors"
              title="Picture-in-Picture (P)"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
