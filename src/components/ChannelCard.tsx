import React from 'react';
import { Star, Tv, Volume2 } from 'lucide-react';
import { Channel } from '../types/iptv';
import { getChannelSchedule } from '../utils/epgParser';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  viewMode?: 'list' | 'grid';
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
  viewMode = 'list',
}) => {
  // Grab EPG now playing preview
  const schedule = getChannelSchedule(channel);

  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onSelect(channel)}
        className={`group relative flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
          isActive
            ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/30'
            : 'bg-neutral-900/60 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Channel Logo */}
          <div className="w-12 h-12 rounded-lg bg-neutral-950 border border-neutral-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            {channel.tvgLogo ? (
              <img
                src={channel.tvgLogo}
                alt={channel.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Tv className="w-5 h-5 text-neutral-500" />
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-neutral-500 hover:text-neutral-300 opacity-60 group-hover:opacity-100'
            }`}
            title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            aria-label="Toggle Favorite"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <div className="font-semibold text-sm text-neutral-100 truncate mb-1">
          {channel.name}
        </div>

        {/* Zero-Pill Unboxed Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mb-2">
          <span>{channel.groupTitle || 'General'}</span>
          {channel.tvgCountry && (
            <>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>{channel.tvgCountry}</span>
            </>
          )}
        </div>

        {/* Now Playing Snippet */}
        <div className="mt-auto pt-2 border-t border-neutral-800/60">
          <div className="text-[11px] text-neutral-400 truncate">
            {schedule.nowPlaying.title}
          </div>
        </div>

        {/* Playing Soundwave Badge */}
        {isActive && (
          <div className="absolute top-2 right-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-semibold">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>PLAYING</span>
          </div>
        )}
      </div>
    );
  }

  // List view (compact high-density)
  return (
    <div
      onClick={() => onSelect(channel)}
      className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-rose-950/30 border-rose-500/50 shadow-sm shadow-rose-950/20'
          : 'bg-neutral-900/40 hover:bg-neutral-850/80 border-neutral-800/80 hover:border-neutral-700'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Logo */}
        <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
          {channel.tvgLogo ? (
            <img
              src={channel.tvgLogo}
              alt={channel.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Tv className="w-4 h-4 text-neutral-500" />
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs md:text-sm text-neutral-100 truncate">
              {channel.name}
            </span>
            {isActive && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.2 rounded">
                <Volume2 className="w-3 h-3 animate-pulse" />
              </span>
            )}
          </div>

          {/* Zero-Pill Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate mt-0.5">
            <span>{channel.groupTitle || 'General'}</span>
            {channel.tvgCountry && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{channel.tvgCountry}</span>
              </>
            )}
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="truncate text-neutral-400">{schedule.nowPlaying.title}</span>
          </div>
        </div>
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(channel.id);
        }}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          isFavorite
            ? 'text-amber-400 hover:text-amber-300'
            : 'text-neutral-500 hover:text-neutral-300 opacity-40 group-hover:opacity-100'
        }`}
        title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        aria-label="Toggle Favorite"
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
      </button>
    </div>
  );
};
