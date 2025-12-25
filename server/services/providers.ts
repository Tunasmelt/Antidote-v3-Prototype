import crypto from "crypto";

export type NormalizedTrack = { title: string; artist?: string };

export type Provider = "spotify" | "youtube" | "apple" | "soundcloud" | "unknown";

export function detectProvider(url: string): Provider {
  const u = url.toLowerCase();
  if (u.includes("open.spotify.com/playlist")) return "spotify";
  if (u.includes("music.youtube.com/playlist") || u.includes("youtube.com/playlist")) return "youtube";
  if (u.includes("music.apple.com")) return "apple";
  if (u.includes("soundcloud.com")) return "soundcloud";
  return "unknown";
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load URL: ${res.status}`);
  return await res.text();
}

function hashId(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 10);
}

function parseApple(html: string): NormalizedTrack[] {
  const tracks: NormalizedTrack[] = [];
  const ldRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = ldRegex.exec(html))) {
    try {
      const json = JSON.parse(match[1]);
      if (json["@type"] === "MusicPlaylist" && Array.isArray(json.itemListElement)) {
        for (const item of json.itemListElement) {
          const name = item?.item?.name || item?.name;
          const artist = item?.item?.byArtist?.name || item?.byArtist?.name;
          if (name) tracks.push({ title: name, artist });
        }
      }
    } catch {}
  }
  return tracks;
}

function parseSoundCloud(html: string): NormalizedTrack[] {
  const tracks: NormalizedTrack[] = [];
  const regex = /"title":"([^"]+?)","user":\{"username":"([^"]+?)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    tracks.push({ title: m[1], artist: m[2] });
  }
  return tracks;
}

function parseYouTubeMusic(html: string): NormalizedTrack[] {
  const tracks: NormalizedTrack[] = [];
  // Try to locate playlistVideoRenderer entries
  const rendererRegex = /"playlistVideoRenderer":\{[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"\}\]/g;
  let m: RegExpExecArray | null;
  while ((m = rendererRegex.exec(html))) {
    const title = m[1];
    // Attempt to find artist nearby (best-effort)
    const nearby = html.slice(Math.max(0, rendererRegex.lastIndex - 1000), rendererRegex.lastIndex + 1000);
    const artistMatch = nearby.match(/"shortBylineText":\{"runs":\[\{"text":"([^"]+)"\}\]/);
    tracks.push({ title, artist: artistMatch?.[1] });
  }
  return tracks;
}

export async function fetchExternalPlaylist(url: string): Promise<{ id: string; name: string; tracks: NormalizedTrack[] }> {
  const provider = detectProvider(url);
  const id = `ext-${provider}-${hashId(url)}`;
  const html = await fetchText(url);
  let tracks: NormalizedTrack[] = [];
  let name = "Imported Playlist";

  if (provider === "apple") {
    tracks = parseApple(html);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) name = titleMatch[1].replace("Apple Music", "").trim();
  } else if (provider === "soundcloud") {
    tracks = parseSoundCloud(html);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) name = titleMatch[1].trim();
  } else if (provider === "youtube") {
    tracks = parseYouTubeMusic(html);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) name = titleMatch[1].replace(" - YouTube Music", "").trim();
  } else {
    // unknown provider, nothing parsed
  }

  // Deduplicate by title + artist
  const seen = new Set<string>();
  tracks = tracks.filter(t => {
    const key = `${t.title}|${t.artist || ""}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { id, name, tracks };
}
