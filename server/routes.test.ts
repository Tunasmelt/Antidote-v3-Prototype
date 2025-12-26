import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from './routes';

// Mock all external services
vi.mock('./storage', () => ({
  storage: {
    getPlaylistBySpotifyId: vi.fn(),
    createPlaylist: vi.fn(),
    createAnalysis: vi.fn(),
    createBattle: vi.fn(),
    getAllPlaylists: vi.fn(),
    getAllAnalyses: vi.fn(),
    getAllBattles: vi.fn(),
    getStats: vi.fn(),
  },
}));

vi.mock('./services/spotify', () => ({
  spotifyService: {
    parseIdFromUrl: vi.fn(),
    getPlaylist: vi.fn(),
    getPlaylistTracks: vi.fn(),
    getAudioFeatures: vi.fn(),
    getArtists: vi.fn(),
    getRecommendations: vi.fn(),
    searchTrackByQuery: vi.fn(),
  },
}));

vi.mock('./services/analysis', () => ({
  analysisService: {
    calculateHealth: vi.fn(),
    determinePersonality: vi.fn(),
    calculateRating: vi.fn(),
    classifySubgenres: vi.fn(),
    calculateCompatibility: vi.fn(),
  },
}));

vi.mock('./services/providers', () => ({
  fetchExternalPlaylist: vi.fn(),
}));

import { storage } from './storage';
import { spotifyService } from './services/spotify';
import { analysisService } from './services/analysis';
import { fetchExternalPlaylist } from './services/providers';

describe('API Routes', () => {
  let app: express.Application;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = createServer(app);
    await registerRoutes(server, app);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/analyze', () => {
    it('should return 400 for missing URL', async () => {
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Playlist URL is required');
    });

    it('should successfully analyze a Spotify playlist', async () => {
      // Mock successful Spotify flow
      const mockPlaylist = {
        id: 'playlist123',
        name: 'Test Playlist',
        description: 'A test playlist',
        owner: { display_name: 'TestUser' },
        images: [{ url: 'https://example.com/image.jpg' }],
        tracks: { total: 20 },
      };

      const mockTracks = [
        { track: { id: 'track1', name: 'Song 1', artists: [{ name: 'Artist 1', id: 'artist1' }], album: { images: [{ url: 'album1.jpg' }] } } },
        { track: { id: 'track2', name: 'Song 2', artists: [{ name: 'Artist 2', id: 'artist2' }], album: { images: [{ url: 'album2.jpg' }] } } },
      ];

      const mockFeatures = [
        { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0, tempo: 120 },
        { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.2, instrumentalness: 0.0, tempo: 125 },
      ];

      const mockArtists = [
        { id: 'artist1', genres: ['pop', 'electronic'] },
        { id: 'artist2', genres: ['pop', 'dance'] },
      ];

      // Setup mocks
      vi.mocked(spotifyService.parseIdFromUrl).mockReturnValue('playlist123');
      vi.mocked(spotifyService.getPlaylist).mockResolvedValue(mockPlaylist);
      vi.mocked(spotifyService.getPlaylistTracks).mockResolvedValue(mockTracks);
      vi.mocked(spotifyService.getAudioFeatures).mockResolvedValue(mockFeatures);
      vi.mocked(spotifyService.getArtists).mockResolvedValue(mockArtists);
      vi.mocked(analysisService.calculateHealth).mockReturnValue({ score: 85, status: 'Great' });
      vi.mocked(analysisService.determinePersonality).mockReturnValue({ type: 'Trend-Aware', description: 'Modern vibes' });
      vi.mocked(analysisService.calculateRating).mockReturnValue({ rating: 4.3, description: 'Well balanced mix.' });
      vi.mocked(analysisService.classifySubgenres).mockReturnValue([]);
      vi.mocked(storage.getPlaylistBySpotifyId).mockResolvedValue(null);
      vi.mocked(storage.createPlaylist).mockResolvedValue({ id: 1, spotifyId: 'playlist123' } as any);
      vi.mocked(storage.createAnalysis).mockResolvedValue({} as any);

      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://open.spotify.com/playlist/playlist123' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.playlistName).toBe('Test Playlist');
      expect(data.owner).toBe('TestUser');
      expect(data.healthScore).toBe(85);
      expect(data.personalityType).toBe('Trend-Aware');
      expect(data.overallRating).toBe(4.3);
    });

    it('should handle Spotify API errors gracefully', async () => {
      vi.mocked(spotifyService.parseIdFromUrl).mockReturnValue('playlist123');
      vi.mocked(spotifyService.getPlaylist).mockRejectedValue(new Error('Spotify API rate limited'));

      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://open.spotify.com/playlist/playlist123' }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toContain('Failed to analyze playlist');
    });

    it('should handle external provider playlists', async () => {
      const mockExternalPlaylist = {
        id: 'external123',
        name: 'External Playlist',
        tracks: [
          { title: 'Song 1', artist: 'Artist 1' },
          { title: 'Song 2', artist: 'Artist 2' },
        ],
      };

      const mockMatched = [
        { id: 'track1', name: 'Song 1', artist: 'Artist 1', artistId: 'artist1', albumArt: 'album1.jpg' },
        { id: 'track2', name: 'Song 2', artist: 'Artist 2', artistId: 'artist2', albumArt: 'album2.jpg' },
      ];

      // Setup mocks for external flow
      vi.mocked(spotifyService.parseIdFromUrl).mockReturnValue(null);
      vi.mocked(fetchExternalPlaylist).mockResolvedValue(mockExternalPlaylist);
      vi.mocked(spotifyService.searchTrackByQuery)
        .mockResolvedValueOnce(mockMatched[0])
        .mockResolvedValueOnce(mockMatched[1]);
      vi.mocked(spotifyService.getAudioFeatures).mockResolvedValue([
        { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.2, instrumentalness: 0.1, tempo: 120 },
      ]);
      vi.mocked(spotifyService.getArtists).mockResolvedValue([
        { id: 'artist1', genres: ['pop'] },
      ]);
      vi.mocked(analysisService.calculateHealth).mockReturnValue({ score: 75, status: 'Good' });
      vi.mocked(analysisService.determinePersonality).mockReturnValue({ type: 'The Eclectic', description: 'Mixed tastes' });
      vi.mocked(analysisService.calculateRating).mockReturnValue({ rating: 3.8, description: 'Good potential.' });
      vi.mocked(analysisService.classifySubgenres).mockReturnValue([]);
      vi.mocked(storage.getPlaylistBySpotifyId).mockResolvedValue(null);
      vi.mocked(storage.createPlaylist).mockResolvedValue({ id: 2, spotifyId: 'external123' } as any);
      vi.mocked(storage.createAnalysis).mockResolvedValue({} as any);

      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://music.apple.com/playlist/external123' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.playlistName).toBe('External Playlist');
      expect(data.owner).toBe('External');
    });
  });

  describe('POST /api/battle', () => {
    it('should return 400 for missing URLs', async () => {
      const response = await fetch('http://localhost:3000/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url1: 'https://spotify.com/playlist/1' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toBe('Both playlist URLs are required');
    });

    it('should successfully compare two playlists', async () => {
      const mockPlaylist1 = {
        id: 'playlist1',
        name: 'Playlist A',
        owner: { display_name: 'UserA' },
        images: [{ url: 'image1.jpg' }],
        tracks: { total: 30 },
      };

      const mockPlaylist2 = {
        id: 'playlist2',
        name: 'Playlist B',
        owner: { display_name: 'UserB' },
        images: [{ url: 'image2.jpg' }],
        tracks: { total: 25 },
      };

      // Setup mocks
      vi.mocked(spotifyService.parseIdFromUrl).mockReturnValue('playlist1');
      vi.mocked(spotifyService.getPlaylist)
        .mockResolvedValueOnce(mockPlaylist1)
        .mockResolvedValueOnce(mockPlaylist2);
      vi.mocked(spotifyService.getPlaylistTracks)
        .mockResolvedValueOnce([
          { track: { id: 't1', artists: [{ name: 'Artist1', id: 'a1' }] } },
          { track: { id: 't2', artists: [{ name: 'Artist2', id: 'a2' }] } },
        ])
        .mockResolvedValueOnce([
          { track: { id: 't3', artists: [{ name: 'Artist3', id: 'a3' }] } },
          { track: { id: 't4', artists: [{ name: 'Artist4', id: 'a4' }] } },
        ]);
      vi.mocked(spotifyService.getAudioFeatures)
        .mockResolvedValueOnce([{ energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0 }])
        .mockResolvedValueOnce([{ energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.2, instrumentalness: 0.1 }]);
      vi.mocked(spotifyService.getArtists).mockResolvedValue([]);
      vi.mocked(analysisService.calculateHealth)
        .mockReturnValueOnce({ score: 85 })
        .mockReturnValueOnce({ score: 80 });
      vi.mocked(analysisService.calculateCompatibility).mockReturnValue(78);
      vi.mocked(storage.getPlaylistBySpotifyId).mockResolvedValue(null);
      vi.mocked(storage.createPlaylist)
        .mockResolvedValueOnce({ id: 1 } as any)
        .mockResolvedValueOnce({ id: 2 } as any);
      vi.mocked(storage.createBattle).mockResolvedValue({} as any);

      const response = await fetch('http://localhost:3000/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url1: 'https://open.spotify.com/playlist/playlist1',
          url2: 'https://open.spotify.com/playlist/playlist2',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.playlist1.name).toBe('Playlist A');
      expect(data.playlist2.name).toBe('Playlist B');
      expect(data.compatibilityScore).toBe(78);
      expect(data.winner).toBe('playlist1');
    });

    it('should handle battle errors gracefully', async () => {
      vi.mocked(spotifyService.parseIdFromUrl).mockReturnValue('playlist1');
      vi.mocked(spotifyService.getPlaylist).mockRejectedValue(new Error('API Error'));

      const response = await fetch('http://localhost:3000/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url1: 'https://open.spotify.com/playlist/playlist1',
          url2: 'https://open.spotify.com/playlist/playlist2',
        }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toContain('Battle failed');
    });
  });

  describe('GET /api/playlists', () => {
    it('should return all playlists', async () => {
      const mockPlaylists = [
        { id: 1, name: 'Playlist 1', spotifyId: 'spotify1' },
        { id: 2, name: 'Playlist 2', spotifyId: 'spotify2' },
      ];

      vi.mocked(storage.getAllPlaylists).mockResolvedValue(mockPlaylists);

      const response = await fetch('http://localhost:3000/api/playlists');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockPlaylists);
    });

    it('should handle storage errors', async () => {
      vi.mocked(storage.getAllPlaylists).mockRejectedValue(new Error('DB Error'));

      const response = await fetch('http://localhost:3000/api/playlists');
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.message).toContain('Failed to fetch playlists');
    });
  });

  describe('GET /api/recommendations', () => {
    it('should return recommendations for mood_safe type', async () => {
      const mockTracks = [
        { id: 'rec1', name: 'Recommended Song 1', artists: [{ name: 'Artist 1' }], album: { images: [{ url: 'album1.jpg' }] }, preview_url: 'preview1.mp3' },
        { id: 'rec2', name: 'Recommended Song 2', artists: [{ name: 'Artist 2' }], album: { images: [{ url: 'album2.jpg' }] }, preview_url: 'preview2.mp3' },
      ];

      vi.mocked(spotifyService.getRecommendations).mockResolvedValue(mockTracks);

      const response = await fetch('http://localhost:3000/api/recommendations?type=mood_safe');
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        id: 'rec1',
        name: 'Recommended Song 1',
        artist: 'Artist 1',
        albumArt: 'album1.jpg',
        previewUrl: 'preview1.mp3',
      });
    });

    it('should apply different options based on recommendation type', async () => {
      const mockTracks = [{ id: 'rec1', name: 'Song', artists: [{ name: 'Artist' }], album: { images: [{ url: 'album.jpg' }] } }];
      vi.mocked(spotifyService.getRecommendations).mockResolvedValue(mockTracks);

      // Test energy_boost type
      await fetch('http://localhost:3000/api/recommendations?type=energy_boost');
      expect(vi.mocked(spotifyService.getRecommendations)).toHaveBeenCalledWith(
        expect.objectContaining({ min_energy: 0.7 })
      );

      vi.clearAllMocks();
      vi.mocked(spotifyService.getRecommendations).mockResolvedValue(mockTracks);

      // Test chill_mode type
      await fetch('http://localhost:3000/api/recommendations?type=chill_mode');
      expect(vi.mocked(spotifyService.getRecommendations)).toHaveBeenCalledWith(
        expect.objectContaining({ max_energy: 0.4, max_tempo: 100 })
      );
    });
  });

  describe('GET /api/history', () => {
    it('should return combined analysis and battle history', async () => {
      const mockAnalyses = [
        { id: 1, playlist: { name: 'Analysis Playlist' }, createdAt: new Date('2025-01-01') },
      ];
      const mockBattles = [
        { id: 1, playlistA: { name: 'Playlist A' }, playlistB: { name: 'Playlist B' }, createdAt: new Date('2025-01-02') },
      ];

      vi.mocked(storage.getAllAnalyses).mockResolvedValue(mockAnalyses);
      vi.mocked(storage.getAllBattles).mockResolvedValue(mockBattles);

      const response = await fetch('http://localhost:3000/api/history');
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].type).toBe('battle'); // Should be sorted by date descending
      expect(data[1].type).toBe('analysis');
    });
  });

  describe('GET /api/stats', () => {
    it('should return user statistics', async () => {
      const mockStats = { totalAnalyses: 10, totalBattles: 5, averageRating: 4.2 };
      vi.mocked(storage.getStats).mockResolvedValue(mockStats);

      const response = await fetch('http://localhost:3000/api/stats');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockStats);
    });
  });
});