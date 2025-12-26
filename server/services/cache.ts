import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Redis URL from environment, fallback to localhost for development
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      this.client.on('error', (err) => {
        console.warn('Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Disconnected from Redis');
        this.isConnected = false;
      });

      // Only connect if Redis URL is configured (not just localhost fallback)
      if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
        await this.client.connect();
      }
    } catch (error) {
      console.warn('Failed to initialize Redis client:', error);
      this.client = null;
    }
  }

  // Generic cache get/set methods
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Cache key generators for different data types
  static generatePlaylistKey(playlistId: string): string {
    return `playlist:${playlistId}`;
  }

  static generateTracksKey(playlistId: string): string {
    return `tracks:${playlistId}`;
  }

  static generateAudioFeaturesKey(trackIds: string[]): string {
    // Create a deterministic key based on sorted track IDs
    const sortedIds = [...trackIds].sort().join(',');
    return `audio_features:${sortedIds}`;
  }

  static generateArtistsKey(artistIds: string[]): string {
    const sortedIds = [...artistIds].sort().join(',');
    return `artists:${sortedIds}`;
  }

  static generateAnalysisKey(playlistId: string): string {
    return `analysis:${playlistId}`;
  }

  static generateRecommendationsKey(options: any): string {
    // Create a deterministic key from recommendation options
    const sortedOptions = Object.keys(options)
      .sort()
      .map(key => `${key}:${options[key]}`)
      .join('|');
    return `recommendations:${sortedOptions}`;
  }

  // Cached versions of common Spotify operations
  async getCachedPlaylist(playlistId: string) {
    const key = CacheService.generatePlaylistKey(playlistId);
    return this.get(key);
  }

  async setCachedPlaylist(playlistId: string, data: any, ttlSeconds = 3600) {
    const key = CacheService.generatePlaylistKey(playlistId);
    return this.set(key, data, ttlSeconds);
  }

  async getCachedTracks(playlistId: string) {
    const key = CacheService.generateTracksKey(playlistId);
    return this.get(key);
  }

  async setCachedTracks(playlistId: string, data: any, ttlSeconds = 3600) {
    const key = CacheService.generateTracksKey(playlistId);
    return this.set(key, data, ttlSeconds);
  }

  async getCachedAudioFeatures(trackIds: string[]) {
    const key = CacheService.generateAudioFeaturesKey(trackIds);
    return this.get(key);
  }

  async setCachedAudioFeatures(trackIds: string[], data: any, ttlSeconds = 3600) {
    const key = CacheService.generateAudioFeaturesKey(trackIds);
    return this.set(key, data, ttlSeconds);
  }

  async getCachedArtists(artistIds: string[]) {
    const key = CacheService.generateArtistsKey(artistIds);
    return this.get(key);
  }

  async setCachedArtists(artistIds: string[], data: any, ttlSeconds = 3600) {
    const key = CacheService.generateArtistsKey(artistIds);
    return this.set(key, data, ttlSeconds);
  }

  async getCachedAnalysis(playlistId: string) {
    const key = CacheService.generateAnalysisKey(playlistId);
    return this.get(key);
  }

  async setCachedAnalysis(playlistId: string, data: any, ttlSeconds = 1800) {
    const key = CacheService.generateAnalysisKey(playlistId);
    return this.set(key, data, ttlSeconds);
  }

  async getCachedRecommendations(options: any) {
    const key = CacheService.generateRecommendationsKey(options);
    return this.get(key);
  }

  async setCachedRecommendations(options: any, data: any, ttlSeconds = 900) {
    const key = CacheService.generateRecommendationsKey(options);
    return this.set(key, data, ttlSeconds);
  }

  // Utility method to check if cache is available
  isCacheAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await cacheService.disconnect();
});

process.on('SIGINT', async () => {
  await cacheService.disconnect();
});