import SpotifyWebApi from "spotify-web-api-node";

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

export const spotifyService = {
  getPlaylist: async (playlistId: string) => {
    await ensureToken();
    const response = await spotifyApi.getPlaylist(playlistId);
    return response.body;
  },

  getPlaylistTracks: async (playlistId: string) => {
    await ensureToken();
    // Pagination might be needed for large playlists
    const response = await spotifyApi.getPlaylistTracks(playlistId);
    return response.body.items;
  },

  getAudioFeatures: async (trackIds: string[]) => {
    await ensureToken();
    // Spotify allows up to 100 ids per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }

    let allFeatures: any[] = [];
    for (const chunk of chunks) {
      const response = await spotifyApi.getAudioFeaturesForTracks(chunk);
      allFeatures = allFeatures.concat(response.body.audio_features);
    }
    return allFeatures;
  },

  getArtists: async (artistIds: string[]) => {
    await ensureToken();
    const chunks = [];
    for (let i = 0; i < artistIds.length; i += 50) { // Limit is 50 for getArtists
      chunks.push(artistIds.slice(i, i + 50));
    }

    let allArtists: any[] = [];
    for (const chunk of chunks) {
      const response = await spotifyApi.getArtists(chunk);
      allArtists = allArtists.concat(response.body.artists);
    }
    return allArtists;
  },

  // Extract ID from various URL formats
  parseIdFromUrl: (url: string): string | null => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  },

  getRecommendations: async (options: any) => {
    await ensureToken();
    const response = await spotifyApi.getRecommendations(options);
    return response.body.tracks;
  }
};
