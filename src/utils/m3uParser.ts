import { Channel } from '../types/iptv';

export interface ParseResult {
  channels: Channel[];
  epgUrl?: string;
  playlistName?: string;
}

/**
 * High-performance M3U/M3U8 parser that extracts standard IPTV tags,
 * tvg-* attributes, group categories, and stream URLs.
 */
export function parseM3U(content: string, defaultGroup: string = 'General'): ParseResult {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  let epgUrl: string | undefined;
  let playlistName: string | undefined;

  let currentInfo: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Check for M3U header with EPG URL or Playlist Name
    if (line.startsWith('#EXTM3U')) {
      const tvgUrlMatch = line.match(/(?:url-tvg|x-tvg-url)="([^"]+)"/i);
      if (tvgUrlMatch) {
        epgUrl = tvgUrlMatch[1];
      }
      const nameMatch = line.match(/x-tvg-name="([^"]+)"/i) || line.match(/playlist-name="([^"]+)"/i);
      if (nameMatch) {
        playlistName = nameMatch[1];
      }
      continue;
    }

    // Check for EXTINF line
    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Extract attributes using regex
      // Handles key="value" or key=value
      const tvgId = extractAttribute(line, 'tvg-id');
      const tvgName = extractAttribute(line, 'tvg-name');
      const tvgLogo = extractAttribute(line, 'tvg-logo');
      const groupTitle = extractAttribute(line, 'group-title');
      const tvgCountry = extractAttribute(line, 'tvg-country');
      const tvgLanguage = extractAttribute(line, 'tvg-language');

      // Extract channel name (everything after the last comma)
      const commaIdx = line.lastIndexOf(',');
      let channelName = '';
      if (commaIdx !== -1) {
        channelName = line.substring(commaIdx + 1).trim();
      }

      currentInfo = {
        name: channelName || tvgName || tvgId || `Channel ${channels.length + 1}`,
        tvgId: tvgId || undefined,
        tvgName: tvgName || undefined,
        tvgLogo: tvgLogo || undefined,
        groupTitle: groupTitle ? cleanGroupName(groupTitle) : defaultGroup,
        tvgCountry: tvgCountry || undefined,
        tvgLanguage: tvgLanguage || undefined,
      };
      continue;
    }

    // Check for additional directives (e.g. #EXTVLCOPT, #EXTGRP, User-Agent)
    if (line.startsWith('#EXTGRP:')) {
      const grp = line.replace('#EXTGRP:', '').trim();
      if (currentInfo && grp) {
        currentInfo.groupTitle = cleanGroupName(grp);
      }
      continue;
    }

    if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      if (currentInfo) {
        currentInfo.httpUserAgent = line.replace('#EXTVLCOPT:http-user-agent=', '').trim();
      }
      continue;
    }

    if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
      if (currentInfo) {
        currentInfo.httpReferrer = line.replace('#EXTVLCOPT:http-referrer=', '').trim();
      }
      continue;
    }

    // If it's another comment/directive, ignore
    if (line.startsWith('#')) {
      continue;
    }

    // It's a stream URL
    if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.endsWith('.m3u8')) {
      const channel: Channel = {
        id: `ch_${Date.now()}_${channels.length}_${Math.random().toString(36).substring(2, 7)}`,
        name: currentInfo?.name || `Channel ${channels.length + 1}`,
        url: line,
        tvgId: currentInfo?.tvgId,
        tvgName: currentInfo?.tvgName,
        tvgLogo: currentInfo?.tvgLogo,
        groupTitle: currentInfo?.groupTitle || defaultGroup,
        tvgCountry: currentInfo?.tvgCountry,
        tvgLanguage: currentInfo?.tvgLanguage,
        httpUserAgent: currentInfo?.httpUserAgent,
        httpReferrer: currentInfo?.httpReferrer,
      };

      channels.push(channel);
      currentInfo = null;
    }
  }

  return {
    channels,
    epgUrl,
    playlistName,
  };
}

function extractAttribute(line: string, attr: string): string | null {
  // Matches attr="value" or attr='value'
  const quotedRegex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const quotedMatch = line.match(quotedRegex);
  if (quotedMatch) return quotedMatch[1].trim();

  // Matches attr=value without quotes
  const unquotedRegex = new RegExp(`${attr}=([^\\s,]+)`, 'i');
  const unquotedMatch = line.match(unquotedRegex);
  if (unquotedMatch) return unquotedMatch[1].trim();

  return null;
}

function cleanGroupName(name: string): string {
  // Normalize categories like "NEWS / INFO", "News;Information" to clean Title Case
  let clean = name.replace(/[;/].*$/, '').trim();
  if (!clean) return 'General';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Exports channels back into valid M3U8 string
 */
export function exportToM3U(channels: Channel[], playlistName: string = 'StreamM3U Playlist'): string {
  let output = `#EXTM3U x-tvg-name="${playlistName}"\n\n`;

  for (const ch of channels) {
    const attrs: string[] = [];
    if (ch.tvgId) attrs.push(`tvg-id="${ch.tvgId}"`);
    if (ch.tvgName) attrs.push(`tvg-name="${ch.tvgName}"`);
    if (ch.tvgLogo) attrs.push(`tvg-logo="${ch.tvgLogo}"`);
    if (ch.groupTitle) attrs.push(`group-title="${ch.groupTitle}"`);
    if (ch.tvgCountry) attrs.push(`tvg-country="${ch.tvgCountry}"`);
    if (ch.tvgLanguage) attrs.push(`tvg-language="${ch.tvgLanguage}"`);

    const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
    output += `#EXTINF:-1${attrStr},${ch.name}\n`;
    output += `${ch.url}\n\n`;
  }

  return output;
}
