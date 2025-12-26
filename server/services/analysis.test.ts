import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analysisService } from './analysis';

// Mock the spotify service to avoid external dependencies in unit tests
vi.mock('./spotify', () => ({
  spotifyService: {
    // Mock methods if needed
  },
}));

describe('AnalysisService', () => {
  describe('calculateHealth', () => {
    it('should return 0 score for empty features', () => {
      const result = analysisService.calculateHealth([], 10, 5);
      expect(result.score).toBe(0);
      expect(result.status).toBe('Unknown');
    });

    it('should calculate high score for consistent, varied playlist', () => {
      const features = [
        { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0, tempo: 120, liveness: 0.1, speechiness: 0.05 },
        { energy: 0.75, danceability: 0.85, valence: 0.8, acousticness: 0.15, instrumentalness: 0.0, tempo: 125, liveness: 0.2, speechiness: 0.03 },
        { energy: 0.82, danceability: 0.92, valence: 0.6, acousticness: 0.05, instrumentalness: 0.0, tempo: 118, liveness: 0.1, speechiness: 0.04 },
      ];

      const result = analysisService.calculateHealth(features, 50, 8);
      expect(result.score).toBeGreaterThan(70);
      expect(['Exceptional', 'Great', 'Good', 'Average']).toContain(result.status);
    });

    it('should penalize very inconsistent energy levels', () => {
      const features = [
        { energy: 0.1, danceability: 0.5, valence: 0.3, acousticness: 0.8, instrumentalness: 0.0, tempo: 80, liveness: 0.1, speechiness: 0.1 },
        { energy: 0.9, danceability: 0.5, valence: 0.3, acousticness: 0.1, instrumentalness: 0.0, tempo: 180, liveness: 0.1, speechiness: 0.1 },
      ];

      const result = analysisService.calculateHealth(features, 20, 3);
      expect(result.score).toBeLessThan(60);
    });

    it('should reward good genre variety', () => {
      const features = [
        { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.2, instrumentalness: 0.0, tempo: 120, liveness: 0.1, speechiness: 0.05 },
      ];

      const result = analysisService.calculateHealth(features, 25, 10);
      expect(result.score).toBeGreaterThan(50);
    });
  });

  describe('determinePersonality', () => {
    it('should identify experimental personality for high instrumental content', () => {
      const features = [
        { energy: 0.9, danceability: 0.2, valence: 0.3, acousticness: 0.1, instrumentalness: 0.8, tempo: 140, liveness: 0.1, speechiness: 0.05 },
      ];
      const genres = ['electronic', 'ambient'];

      const result = analysisService.determinePersonality(features, genres);
      expect(result.type).toBe('The Experimentalist');
    });

    it('should identify mood-driven personality for acoustic content', () => {
      const features = [
        { energy: 0.3, danceability: 0.4, valence: 0.2, acousticness: 0.9, instrumentalness: 0.1, tempo: 90, liveness: 0.1, speechiness: 0.1 },
      ];
      const genres = ['folk', 'indie'];

      const result = analysisService.determinePersonality(features, genres);
      expect(result.type).toBe('Mood-Driven');
    });

    it('should identify eclectic personality for mixed features', () => {
      const features = [
        { energy: 0.6, danceability: 0.7, valence: 0.5, acousticness: 0.4, instrumentalness: 0.2, tempo: 120, liveness: 0.1, speechiness: 0.05 },
      ];
      const genres = ['pop', 'rock', 'electronic', 'folk'];

      const result = analysisService.determinePersonality(features, genres);
      expect(result.type).toBe('The Eclectic');
    });

    it('should default to trend-aware personality', () => {
      const features = [
        { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0, tempo: 130, liveness: 0.1, speechiness: 0.05 },
      ];
      const genres = ['pop', 'hip-hop'];

      const result = analysisService.determinePersonality(features, genres);
      expect(result.type).toBe('Trend-Aware');
    });
  });

  describe('classifySubgenres', () => {
    it('should return subgenres excluding top main genres', () => {
      const genres = {
        'pop': 20,
        'rock': 15,
        'electronic': 12,
        'indie rock': 8,
        'synthwave': 6,
        'dream pop': 5,
        'alternative rock': 4,
        'indie pop': 3,
      };

      const result = analysisService.classifySubgenres(genres);
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ name: 'indie rock', value: 8 });
      expect(result[1]).toEqual({ name: 'synthwave', value: 6 });
    });

    it('should handle empty genres object', () => {
      const result = analysisService.classifySubgenres({});
      expect(result).toHaveLength(0);
    });

    it('should handle fewer than 9 genres', () => {
      const genres = {
        'pop': 10,
        'rock': 8,
        'electronic': 5,
      };

      const result = analysisService.classifySubgenres(genres);
      expect(result).toHaveLength(0); // Since we skip first 3 and there are only 3
    });
  });

  describe('calculateRating', () => {
    it('should give high rating for excellent health score', () => {
      const result = analysisService.calculateRating(95, 50);
      expect(result.rating).toBe(5.0);
      expect(result.description).toBe('Masterpiece curation.');
    });

    it('should give moderate rating for average health score', () => {
      const result = analysisService.calculateRating(65, 30);
      expect(result.rating).toBeGreaterThanOrEqual(3.0);
      expect(result.rating).toBeLessThan(4.0);
    });

    it('should penalize very short playlists', () => {
      const result = analysisService.calculateRating(80, 5);
      expect(result.rating).toBeLessThan(4.0);
    });

    it('should slightly penalize very long playlists', () => {
      const result = analysisService.calculateRating(85, 600);
      expect(result.rating).toBeLessThan(4.3);
    });

    it('should handle edge case health scores', () => {
      const result = analysisService.calculateRating(10, 20);
      expect(result.rating).toBe(1.0);
      expect(result.description).toBe('Solid collection.');
    });
  });

  describe('calculateCompatibility', () => {
    it('should return high compatibility for similar playlists', () => {
      const features1 = [
        { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0, tempo: 120, liveness: 0.1, speechiness: 0.05 },
        { energy: 0.75, danceability: 0.85, valence: 0.8, acousticness: 0.15, instrumentalness: 0.0, tempo: 125, liveness: 0.2, speechiness: 0.03 },
      ];

      const features2 = [
        { energy: 0.82, danceability: 0.88, valence: 0.65, acousticness: 0.12, instrumentalness: 0.0, tempo: 122, liveness: 0.15, speechiness: 0.04 },
        { energy: 0.78, danceability: 0.92, valence: 0.75, acousticness: 0.08, instrumentalness: 0.0, tempo: 118, liveness: 0.1, speechiness: 0.06 },
      ];

      const compatibility = analysisService.calculateCompatibility(features1, features2);
      expect(compatibility).toBeGreaterThan(90);
    });

    it('should return low compatibility for very different playlists', () => {
      const features1 = [
        { energy: 0.9, danceability: 0.9, valence: 0.8, acousticness: 0.1, instrumentalness: 0.0, tempo: 140, liveness: 0.1, speechiness: 0.05 },
      ];

      const features2 = [
        { energy: 0.2, danceability: 0.3, valence: 0.2, acousticness: 0.8, instrumentalness: 0.1, tempo: 80, liveness: 0.1, speechiness: 0.1 },
      ];

      const compatibility = analysisService.calculateCompatibility(features1, features2);
      expect(compatibility).toBeLessThan(50);
    });

    it('should handle empty feature arrays', () => {
      const compatibility = analysisService.calculateCompatibility([], []);
      expect(compatibility).toBe(0);
    });

    it('should return perfect compatibility for identical playlists', () => {
      const features1 = [
        { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.2, instrumentalness: 0.1, tempo: 120, liveness: 0.1, speechiness: 0.05 },
      ];

      const features2 = [
        { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.2, instrumentalness: 0.1, tempo: 120, liveness: 0.1, speechiness: 0.05 },
      ];

      const compatibility = analysisService.calculateCompatibility(features1, features2);
      expect(compatibility).toBe(100);
    });
  });

  describe('getAverageFeatures', () => {
    it('should calculate correct averages', () => {
      const features = [
        { energy: 0.6, danceability: 0.7, valence: 0.5, acousticness: 0.3, instrumentalness: 0.1, tempo: 100, liveness: 0.2, speechiness: 0.1 },
        { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0, tempo: 140, liveness: 0.1, speechiness: 0.05 },
      ];

      const averages = analysisService.getAverageFeatures(features);
      expect(averages.energy).toBe(0.7);
      expect(averages.danceability).toBe(0.8);
      expect(averages.valence).toBe(0.6);
      expect(averages.acousticness).toBe(0.2);
      expect(averages.instrumentalness).toBe(0.05);
    });

    it('should handle empty array', () => {
      const averages = analysisService.getAverageFeatures([]);
      expect(averages.energy).toBe(0);
      expect(averages.danceability).toBe(0);
      expect(averages.valence).toBe(0);
      expect(averages.acousticness).toBe(0);
      expect(averages.instrumentalness).toBe(0);
    });

    it('should filter out invalid features', () => {
      const features = [
        null,
        { energy: 0.6, danceability: 0.7, valence: 0.5, acousticness: 0.3, instrumentalness: 0.1, tempo: 100, liveness: 0.2, speechiness: 0.1 },
        undefined,
        { energy: 0.8, danceability: 0.9, valence: 0.7, acousticness: 0.1, instrumentalness: 0.0, tempo: 140, liveness: 0.1, speechiness: 0.05 },
      ];

      const averages = analysisService.getAverageFeatures(features as any);
      expect(averages.energy).toBe(0.7);
      expect(averages.danceability).toBe(0.8);
    });
  });
});