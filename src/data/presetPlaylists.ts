export interface PresetPlaylist {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  epgUrl?: string;
  badge?: string;
}

export const PRESET_PLAYLISTS: PresetPlaylist[] = [
  {
    id: 'iptv_news',
    name: 'IPTV-Org: 24/7 World News',
    description: 'International news channels from global broadcast networks',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    epgUrl: 'https://iptv-org.github.io/epg/guides/us.xml',
    badge: 'Popular',
  },
  {
    id: 'iptv_documentary',
    name: 'IPTV-Org: Documentaries & Nature',
    description: 'Science, wildlife, historical, and investigative documentaries',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
  },
  {
    id: 'iptv_movies',
    name: 'IPTV-Org: Cinema & Feature Films',
    description: 'Independent films, classics, and movie channels',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
  },
  {
    id: 'iptv_sports',
    name: 'IPTV-Org: Live Sports & Motorsport',
    description: 'Championships, action sports, motorsports, and athletic events',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
  },
  {
    id: 'iptv_music',
    name: 'IPTV-Org: Music & Concerts',
    description: 'Live concerts, music video streams, and DJ sets',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
  },
  {
    id: 'iptv_animation',
    name: 'IPTV-Org: Animation & Family',
    description: 'Cartoons, anime, and family-friendly entertainment',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
  },
  {
    id: 'iptv_education',
    name: 'IPTV-Org: Science & Education',
    description: 'Lectures, tech seminars, space research, and education',
    category: 'Category',
    url: 'https://iptv-org.github.io/iptv/categories/education.m3u',
  },
  {
    id: 'iptv_us',
    name: 'IPTV-Org: United States',
    description: 'Curated public television feeds across the United States',
    category: 'Country',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    epgUrl: 'https://iptv-org.github.io/epg/guides/us.xml',
  },
  {
    id: 'iptv_uk',
    name: 'IPTV-Org: United Kingdom',
    description: 'British public broadcasters and regional streaming channels',
    category: 'Country',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    epgUrl: 'https://iptv-org.github.io/epg/guides/uk.xml',
  },
  {
    id: 'iptv_ca',
    name: 'IPTV-Org: Canada',
    description: 'Canadian public television feeds in English & French',
    category: 'Country',
    url: 'https://iptv-org.github.io/iptv/countries/ca.m3u',
  },
  {
    id: 'iptv_fr',
    name: 'IPTV-Org: France',
    description: 'French news, culture, and entertainment channels',
    category: 'Country',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
  },
  {
    id: 'iptv_de',
    name: 'IPTV-Org: Germany',
    description: 'German national and regional public channels',
    category: 'Country',
    url: 'https://iptv-org.github.io/iptv/countries/de.m3u',
  },
  {
    id: 'iptv_es',
    name: 'IPTV-Org: Spain & Latin America',
    description: 'Spanish language broadcast channels',
    category: 'Country',
    url: 'https://iptv-org.github.io/iptv/countries/es.m3u',
  },
  {
    id: 'iptv_all',
    name: 'IPTV-Org: Full Index Playlist',
    description: 'Complete directory of 8,000+ public international channels',
    category: 'Global',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
  },
];
