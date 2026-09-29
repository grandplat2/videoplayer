/**
 * CORS proxy helpers and URL transformers for web-based live IPTV streaming.
 */

export const DEFAULT_CORS_PROXIES = [
  { label: 'CorsProxy.io (Fast & Reliable)', url: 'https://corsproxy.io/?' },
  { label: 'AllOrigins (Fallback)', url: 'https://api.allorigins.win/raw?url=' },
];

export function proxifyUrl(targetUrl: string, useProxy: boolean, proxyPrefix: string = 'https://corsproxy.io/?'): string {
  if (!useProxy || !targetUrl) return targetUrl;
  
  // If already proxified, don't double-wrap
  if (targetUrl.startsWith('https://corsproxy.io/?') || targetUrl.startsWith('https://api.allorigins.win/raw?url=')) {
    return targetUrl;
  }

  // Handle data URIs or blob URIs
  if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
    return targetUrl;
  }

  // Handle relative URLs if any
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return targetUrl;
  }

  if (proxyPrefix.includes('allorigins')) {
    return `${proxyPrefix}${encodeURIComponent(targetUrl)}`;
  }

  // corsproxy.io supports `https://corsproxy.io/?url`
  return `${proxyPrefix}${encodeURIComponent(targetUrl)}`;
}

/**
 * Fetches playlist text content with intelligent CORS fallback
 */
export async function fetchPlaylistContent(url: string, useProxy: boolean = false, customProxy?: string): Promise<{ text: string; usedProxy: boolean }> {
  // If proxy requested upfront
  if (useProxy) {
    const proxy = customProxy || DEFAULT_CORS_PROXIES[0].url;
    const proxied = proxifyUrl(url, true, proxy);
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    const text = await res.text();
    return { text, usedProxy: true };
  }

  // Otherwise try direct fetch first
  try {
    const directRes = await fetch(url, { mode: 'cors' });
    if (directRes.ok) {
      const text = await directRes.text();
      return { text, usedProxy: false };
    }
  } catch (err) {
    // Direct fetch failed (likely CORS or network), try proxy fallback
    console.warn('Direct fetch failed, falling back to CORS proxy:', err);
  }

  // Try proxy fallback
  const proxy = customProxy || DEFAULT_CORS_PROXIES[0].url;
  const proxied = proxifyUrl(url, true, proxy);
  const proxyRes = await fetch(proxied);
  if (!proxyRes.ok) {
    throw new Error(`Failed to load playlist (${proxyRes.status} ${proxyRes.statusText})`);
  }
  const text = await proxyRes.text();
  return { text, usedProxy: true };
}
