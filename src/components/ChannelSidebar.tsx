import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Star, 
  Clock, 
  LayoutGrid, 
  List, 
  Globe, 
  Film, 
  Radio, 
  Tv2
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { ChannelCard } from './ChannelCard';

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannel: Channel | null;
  favorites: string[];
  recents: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  viewMode: 'list' | 'grid';
  onToggleViewMode: (mode: 'list' | 'grid') => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  activeChannel,
  favorites,
  recents,
  onSelectChannel,
  onToggleFavorite,
  viewMode,
  onToggleViewMode,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  // Extract unique categories and sort by channel frequency
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of channels) {
      const cat = ch.groupTitle || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return sorted;
  }, [channels]);

  // Extract unique countries
  const countries = useMemo(() => {
    const list = new Set<string>();
    for (const ch of channels) {
      if (ch.tvgCountry) list.add(ch.tvgCountry.toUpperCase());
    }
    return Array.from(list).sort();
  }, [channels]);

  // Filter channels based on tab, category, country, and search
  const filteredChannels = useMemo(() => {
    let list: Channel[] = [];

    if (selectedCategory === 'favorites') {
      const favSet = new Set(favorites);
      list = channels.filter(ch => favSet.has(ch.id));
    } else if (selectedCategory === 'recents') {
      list = recents;
    } else if (selectedCategory === 'all') {
      list = channels;
    } else {
      list = channels.filter(ch => (ch.groupTitle || 'General') === selectedCategory);
    }

    if (selectedCountry !== 'all') {
      list = list.filter(ch => ch.tvgCountry?.toUpperCase() === selectedCountry);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(ch => 
        ch.name.toLowerCase().includes(q) ||
        (ch.groupTitle && ch.groupTitle.toLowerCase().includes(q)) ||
        (ch.tvgId && ch.tvgId.toLowerCase().includes(q))
      );
    }

    return list;
  }, [channels, favorites, recents, selectedCategory, selectedCountry, searchQuery]);

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-30 w-80 md:w-96 bg-neutral-900/95 md:bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Mobile Drawer Close Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <span className="font-bold text-sm text-white">Channels Guide</span>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          aria-label="Close Channel Guide"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="p-3 border-b border-neutral-800 space-y-2.5">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search channels, genres, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & Country Selector */}
        <div className="flex items-center justify-between gap-2">
          {/* Country filter */}
          {countries.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all">All Countries</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 font-mono tabular-nums">
              {filteredChannels.length} channels
            </div>
          )}

          {/* List / Grid View Switcher */}
          <div className="flex items-center p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg shrink-0">
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Horizontal Scrolling Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar text-xs">
          {/* All */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            All ({channels.length})
          </button>

          {/* Favorites */}
          <button
            onClick={() => setSelectedCategory('favorites')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'favorites'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Favorites ({favorites.length})</span>
          </button>

          {/* Recents */}
          <button
            onClick={() => setSelectedCategory('recents')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'recents'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Recent ({recents.length})</span>
          </button>

          {/* Dynamic parsed categories */}
          {categories.slice(0, 15).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Channel List Viewport */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredChannels.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Tv2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <div className="font-semibold text-sm text-neutral-300 mb-1">
              No Channels Found
            </div>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              {searchQuery
                ? `No channels match "${searchQuery}". Try a different keyword.`
                : selectedCategory === 'favorites'
                ? 'You haven\'t added any channels to your favorites yet. Click the star icon on any channel to save it here.'
                : 'This category is empty.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredChannels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isActive={activeChannel?.id === channel.id || activeChannel?.url === channel.url}
                isFavorite={favorites.includes(channel.id)}
                onSelect={(ch) => {
                  onSelectChannel(ch);
                  onCloseMobile();
                }}
                onToggleFavorite={onToggleFavorite}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          filteredChannels.map(channel => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isActive={activeChannel?.id === channel.id || activeChannel?.url === channel.url}
              isFavorite={favorites.includes(channel.id)}
              onSelect={(ch) => {
                onSelectChannel(ch);
                onCloseMobile();
              }}
              onToggleFavorite={onToggleFavorite}
              viewMode="list"
            />
          ))
        )}
      </div>

      {/* Footer Status Bar with Tabular Count */}
      <div className="h-9 px-3 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 shrink-0 font-mono tabular-nums">
        <span>
          Showing {filteredChannels.length} of {channels.length}
        </span>
        <span className="text-neutral-500">
          StreamM3U Core
        </span>
      </div>
    </aside>
  );
};
