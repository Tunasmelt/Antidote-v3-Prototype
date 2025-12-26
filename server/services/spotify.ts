import SpotifyWebApi from "spotify-web-api-node";
import { cacheService } from "./cache";

// These should be in your .env file
const clientId = process.env.SPOTIFY_CLIENT_ID || "your_client_id";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "your_client_secret";
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:5000/api/auth/spotify/callback";

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri,
});

// Simple token management for Client Credentials Flow (Public data)
let clientToken: string | null = null;
let tokenExpiresAt: number = 0;

// Rate limiting and retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 30000; // 30 seconds

interface SpotifyError extends Error {
  statusCode?: number;
  body?: any;
}

export async function getClientToken() {
  if (clientToken && Date.now() < tokenExpiresAt) {
    return clientToken;
  }

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    clientToken = data.body['access_token'];
    tokenExpiresAt = Date.now() + data.body['expires_in'] * 1000;
    spotifyApi.setAccessToken(clientToken);
    return clientToken;
  } catch (err) {
    console.error('Could not retrieve access token', err);
    throw err;
  }
}

// Helper to ensure we have a token before making requests
async function ensureToken() {
  if (!spotifyApi.getAccessToken()) {
    await getClientToken();
  }
}

// Sleep utility for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponential backoff calculation
function calculateBackoffDelay(attempt: number, retryAfter?: number): number {
  if (retryAfter) {
    // Use Spotify's retry-after header if provided
    return Math.min(retryAfter * 1000, MAX_DELAY);
  }
  // Exponential backoff: baseDelay * 2^(attempt - 1) + jitter
  const delay = BASE_DELAY * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Add up to 1 second jitter
  return Math.min(delay + jitter, MAX_DELAY);
}

// Enhanced error handling with retry logic
async function makeSpotifyRequest<T>(
  requestFn: () => Promise<T>,
  operation: string,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: SpotifyError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await ensureToken();
      const result = await requestFn();
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`Spotify API ${operation} attempt ${attempt}/${retries} failed:`, error.message);

      // Check if error is retryable
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === retries) {
        break;
      }

      // Calculate delay based on error type
      let delay = BASE_DELAY;
      if (error.statusCode === 429) {
        // Rate limited - use retry-after header or exponential backoff
        const retryAfter = error.headers?.['retry-after'];
        delay = calculateBackoffDelay(attempt, retryAfter ? parseInt(retryAfter) : undefined);
        console.log(`Rate limited. Retrying ${operation} in ${delay}ms...`);
      } else {
        delay = calculateBackoffDelay(attempt);
        console.log(`Retrying ${operation} in ${delay}ms...`);
      }

      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  throw new Error(`Spotify API ${operation} failed after ${retries} attempts: ${lastError.message}`);
}

// Determine if an error is retryable
function isRetryableError(error: SpotifyError): boolean {
  const statusCode = error.statusCode;

  // Retry on rate limits (429), server errors (5xx), and network errors
  if (statusCode === 429) return true;
  if (statusCode && statusCode >= 500) return true;
  if (statusCode === 408 || statusCode === 504) return true; // Timeout errors

  // Retry on specific error messages
  const message = error.message?.toLowerCase() || '';
  if (message.includes('timeout') || message.includes('network') || message.includes('econnreset')) {
    return true;
  }

  // Don't retry on client errors (4xx) except 429
  if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return false;
  }

  // Retry on unknown errors to be safe
  return true;
}

export const spotifyService = {
  getPlaylist: async (playlistId: string) => {
    // Try cache first
    const cached = await cacheService.getCachedPlaylist(playlistId);
    if (cached) {
      console.log(`Cache hit for playlist ${playlistId}`);
      return cached;
    }

    // Fetch from API
    const data = await makeSpotifyRequest(
      () => spotifyApi.getPlaylist(playlistId).then(res => res.body),
      `getPlaylist(${playlistId})`
    );

    // Cache the result (1 hour TTL)
    await cacheService.setCachedPlaylist(playlistId, data, 3600);
    return data;
  },

  getPlaylistTracks: async (playlistId: string) => {
    // Try cache first
    const cached = await cacheService.getCachedTracks(playlistId);
    if (cached) {
      console.log(`Cache hit for tracks ${playlistId}`);
      return cached;
    }

    // Fetch from API
    const data = await makeSpotifyRequest(
      () => spotifyApi.getPlaylistTracks(playlistId).then(res => res.body.items),
      `getPlaylistTracks(${playlistId})`
    );

    // Cache the result (1 hour TTL)
    await cacheService.setCachedTracks(playlistId, data, 3600);
    return data;
  },

  getAudioFeatures: async (trackIds: string[]) => {
    // Try cache first
    const cached = await cacheService.getCachedAudioFeatures(trackIds);
    if (cached) {
      console.log(`Cache hit for audio features (${trackIds.length} tracks)`);
      return cached;
    }

    // Spotify allows up to 100 ids per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        makeSpotifyRequest(
          () => spotifyApi.getAudioFeaturesForTracks(chunk).then(res => res.body.audio_features),
          `getAudioFeatures(${chunk.length} tracks)`
        )
      )
    );

    const data = results.flat();

    // Cache the result (1 hour TTL)
    await cacheService.setCachedAudioFeatures(trackIds, data, 3600);
    return data;
  },

  getArtists: async (artistIds: string[]) => {
    // Try cache first
    const cached = await cacheService.getCachedArtists(artistIds);
    if (cached) {
      console.log(`Cache hit for artists (${artistIds.length} artists)`);
      return cached;
    }

    // Fetch from API
    const chunks = [];
    for (let i = 0; i < artistIds.length; i += 50) { // Limit is 50 for getArtists
      chunks.push(artistIds.slice(i, i + 50));
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        makeSpotifyRequest(
          () => spotifyApi.getArtists(chunk).then(res => res.body.artists),
          `getArtists(${chunk.length} artists)`
        )
      )
    );

    const data = results.flat();

    // Cache the result (2 hours TTL for artists - they change less frequently)
    await cacheService.setCachedArtists(artistIds, data, 7200);
    return data;
  },

  // Extract ID from various URL formats
  parseIdFromUrl: (url: string): string | null => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  },

  getRecommendations: async (options: any) => {
    // Try cache first
    const cached = await cacheService.getCachedRecommendations(options);
    if (cached) {
      console.log(`Cache hit for recommendations`);
      return cached;
    }

    // Fetch from API
    const data = await makeSpotifyRequest(
      () => spotifyApi.getRecommendations(options).then(res => res.body.tracks),
      `getRecommendations(${JSON.stringify(options)})`
    );

    // Cache the result (15 minutes TTL for recommendations)
    await cacheService.setCachedRecommendations(options, data, 900);
    return data;
  },

  searchTrackByQuery: async (query: string) => {
    // Note: Search results are not cached as they can be highly variable
    const res = await makeSpotifyRequest(
      () => spotifyApi.searchTracks(query, { limit: 1 }),
      `searchTrackByQuery("${query}")`
    );

    const item = res.body.tracks?.items?.[0];
    if (!item) return null;

    return {
      id: item.id,
      name: item.name,
      artist: item.artists[0]?.name,
      artistId: item.artists[0]?.id,
      albumArt: item.album.images[0]?.url,
      previewUrl: item.preview_url,
    };
  }
};