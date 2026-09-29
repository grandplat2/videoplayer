import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Play, 
  Tv, 
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';
import { Channel, EPGProgram } from '../types/iptv';
import { getChannelSchedule, formatTimeRange } from '../utils/epgParser';

interface EpgGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

export const EpgGuideModal: React.FC<EpgGuideModalProps> = ({
  isOpen,
  onClose,
  channels,
  activeChannel,
  onSelectChannel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProgram, setSelectedProgram] = useState<{ program: EPGProgram; channel: Channel } | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach(ch => {
      if (ch.groupTitle) set.add(ch.groupTitle);
    });
    return Array.from(set);
  }, [channels]);

  const filteredChannels = useMemo(() => {
    if (selectedCategory === 'all') return channels.slice(0, 30);
    return channels.filter(ch => ch.groupTitle === selectedCategory).slice(0, 30);
  }, [channels, selectedCategory]);

  const now = new Date();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Electronic Program Guide (EPG)
                <span className="text-xs font-mono font-normal text-neutral-400">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Live
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Browse broadcast schedules and click to tune directly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <span className="text-neutral-500 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            All Channels
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Guide Content Grid */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80">
          {filteredChannels.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-sm">
              No channels available for this category in the guide.
            </div>
          ) : (
            filteredChannels.map(channel => {
              const schedule = getChannelSchedule(channel);
              const isCurrentActive = activeChannel?.id === channel.id;

              return (
                <div key={channel.id} className="p-3 md:p-4 hover:bg-neutral-850/40 transition-colors">
                  {/* Channel Header Row */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {channel.tvgLogo ? (
                          <img
                            src={channel.tvgLogo}
                            alt={channel.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Tv className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-xs md:text-sm text-white truncate block">
                          {channel.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <span>{channel.groupTitle || 'General'}</span>
                          {channel.tvgCountry && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{channel.tvgCountry}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectChannel(channel);
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrentActive
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrentActive ? 'Watching' : 'Watch Live'}</span>
                    </button>
                  </div>

                  {/* Horizontal Timeline Track of Programs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {/* Now Playing Block */}
                    <div
                      onClick={() => setSelectedProgram({ program: schedule.nowPlaying, channel })}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-rose-500/40 hover:border-rose-400 cursor-pointer transition-colors relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-rose-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            NOW AIRING
                          </span>
                          <span className="font-mono text-neutral-400 tabular-nums text-[10px]">
                            {formatTimeRange(schedule.nowPlaying.start, schedule.nowPlaying.stop)}
                          </span>
                        </div>
                        <div className="font-semibold text-xs text-white line-clamp-1 mb-1">
                          {schedule.nowPlaying.title}
                        </div>
                        {schedule.nowPlaying.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2">
                            {schedule.nowPlaying.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${schedule.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Up Next & Upcoming Blocks */}
                    {schedule.schedule.filter(p => p.start > now).slice(0, 3).map((prog, idx) => (
                      <div
                        key={prog.id}
                        onClick={() => setSelectedProgram({ program: prog, channel })}
                        className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-[10px] font-semibold text-neutral-400">
                              {idx === 0 ? 'UP NEXT' : 'LATER'}
                            </span>
                            <span className="font-mono text-neutral-400 tabular-nums text-[10px]">
                              {formatTimeRange(prog.start, prog.stop)}
                            </span>
                          </div>
                          <div className="font-medium text-xs text-neutral-200 line-clamp-1 mb-1">
                            {prog.title}
                          </div>
                          {prog.description && (
                            <p className="text-[11px] text-neutral-400 line-clamp-2">
                              {prog.description}
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-2">
                          {prog.category || 'General'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Program Detail Drawer / Modal */}
        {selectedProgram && (
          <div className="absolute inset-x-0 bottom-0 bg-neutral-900 border-t border-neutral-700 p-5 shadow-2xl z-30 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold mb-1">
                  <span>{selectedProgram.channel.name}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">
                    {formatTimeRange(selectedProgram.program.start, selectedProgram.program.stop)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedProgram.program.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 mb-4 max-w-3xl leading-relaxed">
              {selectedProgram.program.description || 'Live broadcast event on television network.'}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onSelectChannel(selectedProgram.channel);
                  setSelectedProgram(null);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Tune to Channel
              </button>
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
