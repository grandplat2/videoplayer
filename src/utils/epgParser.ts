import { Channel, EPGProgram } from '../types/iptv';

/**
 * Parses XMLTV format XML string and returns an array of EPGProgram items
 */
export function parseXMLTV(xmlString: string): EPGProgram[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const programmeElements = xmlDoc.getElementsByTagName('programme');
    const programs: EPGProgram[] = [];

    for (let i = 0; i < programmeElements.length; i++) {
      const el = programmeElements[i];
      const channelId = el.getAttribute('channel') || '';
      const startStr = el.getAttribute('start') || '';
      const stopStr = el.getAttribute('stop') || '';

      const titleEl = el.getElementsByTagName('title')[0];
      const descEl = el.getElementsByTagName('desc')[0];
      const catEl = el.getElementsByTagName('category')[0];
      const iconEl = el.getElementsByTagName('icon')[0];

      const title = titleEl ? titleEl.textContent || 'Broadcast Program' : 'Broadcast Program';
      const description = descEl ? descEl.textContent || undefined : undefined;
      const category = catEl ? catEl.textContent || undefined : undefined;
      const icon = iconEl ? iconEl.getAttribute('src') || undefined : undefined;

      const start = parseXMLTVDate(startStr);
      const stop = parseXMLTVDate(stopStr);

      if (start && stop && channelId) {
        programs.push({
          id: `epg_${channelId}_${start.getTime()}`,
          channelId,
          title,
          description,
          start,
          stop,
          category,
          icon,
        });
      }
    }

    return programs;
  } catch (err) {
    console.error('Failed to parse XMLTV:', err);
    return [];
  }
}

/**
 * Parses XMLTV timestamp format: YYYYMMDDHHmmss [+-]HHMM
 */
function parseXMLTVDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length < 14) return null;
  try {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    const hour = parseInt(dateStr.substring(8, 10), 10);
    const min = parseInt(dateStr.substring(10, 12), 10);
    const sec = parseInt(dateStr.substring(12, 14), 10);

    const date = new Date(Date.UTC(year, month, day, hour, min, sec));

    // Handle timezone offset if present (e.g., " +0200" or " -0500")
    if (dateStr.length >= 19 && (dateStr[15] === '+' || dateStr[15] === '-')) {
      const sign = dateStr[15] === '+' ? -1 : 1;
      const tzHours = parseInt(dateStr.substring(16, 18), 10);
      const tzMins = parseInt(dateStr.substring(18, 20), 10);
      const totalOffsetMs = (tzHours * 60 + tzMins) * 60 * 1000 * sign;
      return new Date(date.getTime() + totalOffsetMs);
    }

    return date;
  } catch {
    return null;
  }
}

// Category-based curated TV templates for realistic TV guide schedules
const SCHEDULE_TEMPLATES: Record<string, { title: string; desc: string; durationMins: number }[]> = {
  News: [
    { title: 'Global Morning Briefing', desc: 'Live morning international headlines, market updates, and political breakdown.', durationMins: 60 },
    { title: 'Live Newsroom Desk', desc: 'Continuous breaking news, field reports, and press conferences from global bureaus.', durationMins: 60 },
    { title: 'World Markets & Economy', desc: 'Financial analysis, global trade indices, and corporate developments.', durationMins: 30 },
    { title: 'The Midday Report', desc: 'In-depth coverage of developing stories across the world.', durationMins: 60 },
    { title: 'Special Report: Investigative', desc: 'Deep-dive investigative journalism addressing urgent global challenges.', durationMins: 60 },
    { title: 'Global Evening Edition', desc: 'The day’s most consequential stories summarized by seasoned correspondents.', durationMins: 60 },
    { title: 'Prime Time Debate', desc: 'Panelists debate international diplomacy, climate politics, and tech disruption.', durationMins: 60 },
    { title: 'Nightline Global Broadcast', desc: 'Late night recap of developments, cultural stories, and overnight forecasts.', durationMins: 60 },
  ],
  Sports: [
    { title: 'SportsCenter Morning', desc: 'Game highlights, player interviews, and upcoming match preview.', durationMins: 60 },
    { title: 'Matchday Live: Pre-Game', desc: 'Pitch-side tactics, team lineups, and head-to-head statistics.', durationMins: 60 },
    { title: 'Championship Live Coverage', desc: 'Live multi-camera broadcast with expert play-by-play commentary.', durationMins: 120 },
    { title: 'Post-Match Analysis', desc: 'Manager reactions, referee review, and tournament standings.', durationMins: 45 },
    { title: 'Extreme Sports & Adrenaline', desc: 'Action sports documentary: downhill biking, freeride, and surf championships.', durationMins: 45 },
    { title: 'Prime Time Football Replay', desc: 'Condensed full replay of the game of the week.', durationMins: 90 },
    { title: 'Sports Highlights & Top 10', desc: 'The most spectacular goals, saves, and plays from stadiums worldwide.', durationMins: 30 },
  ],
  Movies: [
    { title: 'Classic Cinema Matinee', desc: 'Award-winning restored cinema masterwork.', durationMins: 120 },
    { title: 'Action & Thriller Premiere', desc: 'High-octane feature film packed with espionage and thrilling sequences.', durationMins: 110 },
    { title: 'Behind the Scenes & Director Cut', desc: 'Cinematography breakdown and cast discussions from Hollywood studios.', durationMins: 40 },
    { title: 'Prime Time Blockbuster', desc: 'Top-rated critically acclaimed feature film in high definition.', durationMins: 130 },
    { title: 'Late Night Sci-Fi Horizon', desc: 'Futuristic interstellar exploration and cybernetic mysteries.', durationMins: 100 },
  ],
  Music: [
    { title: 'Morning Acoustic & Chill', desc: 'Smooth melodies and stripped-down studio sessions to start the day.', durationMins: 60 },
    { title: 'Top 40 Video Countdown', desc: 'The hottest global charting music videos right now.', durationMins: 60 },
    { title: 'Live in Concert: Festival Sessions', desc: 'Electrifying mainstage festival performance and crowd anthems.', durationMins: 90 },
    { title: 'Indie & Underground Spotlight', desc: 'Emerging artists, vinyl selections, and innovative soundscapes.', durationMins: 60 },
    { title: 'Electronic Beats Club Live', desc: 'Deep house, techno, and ambient club mixes from renowned DJs.', durationMins: 120 },
  ],
  Documentary: [
    { title: 'Planet Earth Wonders', desc: 'Breathtaking 4K expeditions across oceans, rainforests, and arctic tundras.', durationMins: 60 },
    { title: 'Cosmic Journey: The Universe', desc: 'Astrophysicists explore black holes, neutron stars, and exoplanets.', durationMins: 60 },
    { title: 'Ancient Civilizations Unearthed', desc: 'Archaeological discoveries unveiling lost empires and forgotten secrets.', durationMins: 60 },
    { title: 'Engineering Titans', desc: 'How the world’s mega-structures and extreme machines were engineered.', durationMins: 60 },
    { title: 'Wildlife Chronicles', desc: 'Intimate survival stories of predator and prey in natural habitats.', durationMins: 60 },
  ],
  General: [
    { title: 'Breakfast Television Live', desc: 'Morning news, lifestyle trends, weather, and celebrity interviews.', durationMins: 90 },
    { title: 'Daily Living & Culinary Art', desc: 'Master chefs craft signature regional dishes with simple recipes.', durationMins: 45 },
    { title: 'Afternoon Discovery Hour', desc: 'Culture, science, and curiosity stories from across the globe.', durationMins: 60 },
    { title: 'The Daily Variety Show', desc: 'Entertainment, comedy, musical performances, and games.', durationMins: 75 },
    { title: 'Prime Evening Special', desc: 'Flagship broadcast featuring headline reports and cultural discussions.', durationMins: 90 },
    { title: 'Late Night Talk & Music', desc: 'Conversations with artists, creators, and comedic monologue.', durationMins: 60 },
  ],
};

/**
 * Returns dynamic, time-aligned schedule for a channel.
 * Guarantees a realistic 24-hour schedule grid anchored around current time.
 */
export function getChannelSchedule(channel: Channel, epgCache?: Map<string, EPGProgram[]>): {
  nowPlaying: EPGProgram;
  upNext: EPGProgram;
  schedule: EPGProgram[];
  progressPercent: number;
} {
  const now = new Date();
  const channelKey = channel.tvgId || channel.name;

  // Check if we have real XMLTV programs cached for this channel
  const cached = epgCache?.get(channelKey) || (channel.tvgId ? epgCache?.get(channel.tvgId) : undefined);
  if (cached && cached.length > 0) {
    const current = cached.find(p => p.start <= now && p.stop >= now);
    const future = cached.filter(p => p.start > now).sort((a, b) => a.start.getTime() - b.start.getTime());

    if (current) {
      const totalMs = current.stop.getTime() - current.start.getTime();
      const elapsedMs = Math.max(0, now.getTime() - current.start.getTime());
      const progressPercent = totalMs > 0 ? Math.min(100, Math.round((elapsedMs / totalMs) * 100)) : 50;

      return {
        nowPlaying: current,
        upNext: future[0] || {
          id: `synthetic_next_${channel.id}`,
          channelId: channel.id,
          title: 'Upcoming Broadcast',
          start: current.stop,
          stop: new Date(current.stop.getTime() + 60 * 60 * 1000),
          category: channel.groupTitle || 'General',
        },
        schedule: cached,
        progressPercent,
      };
    }
  }

  // Synthesize realistic schedule aligned to current day
  const categoryKey = Object.keys(SCHEDULE_TEMPLATES).find(k => 
    (channel.groupTitle || '').toLowerCase().includes(k.toLowerCase())
  ) || 'General';

  const templates = SCHEDULE_TEMPLATES[categoryKey] || SCHEDULE_TEMPLATES.General;

  // Seed deterministic schedule based on channel name hash
  const hash = Math.abs(channel.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  
  // Create schedule starting from 6 hours ago up to 18 hours in the future
  const startAnchor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 4, 0, 0);
  let cursor = new Date(startAnchor);
  const syntheticPrograms: EPGProgram[] = [];

  let idx = hash % templates.length;
  for (let i = 0; i < 16; i++) {
    const template = templates[idx % templates.length];
    const durationMs = template.durationMins * 60 * 1000;
    const pStart = new Date(cursor);
    const pStop = new Date(cursor.getTime() + durationMs);

    syntheticPrograms.push({
      id: `syn_${channel.id}_${i}_${pStart.getTime()}`,
      channelId: channel.id,
      title: `${channel.name}: ${template.title}`,
      description: template.desc,
      start: pStart,
      stop: pStop,
      category: channel.groupTitle || categoryKey,
    });

    cursor = pStop;
    idx++;
  }

  const current = syntheticPrograms.find(p => p.start <= now && p.stop > now) || syntheticPrograms[0];
  const next = syntheticPrograms.find(p => p.start > now) || syntheticPrograms[1];

  const totalMs = current.stop.getTime() - current.start.getTime();
  const elapsedMs = Math.max(0, now.getTime() - current.start.getTime());
  const progressPercent = totalMs > 0 ? Math.min(100, Math.round((elapsedMs / totalMs) * 100)) : 35;

  return {
    nowPlaying: current,
    upNext: next,
    schedule: syntheticPrograms,
    progressPercent,
  };
}

export function formatTimeRange(start: Date, stop: Date): string {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${formatTime(start)} - ${formatTime(stop)}`;
}
