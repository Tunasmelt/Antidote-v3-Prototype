
import { spotifyService } from "./spotify";

// Helper types
interface AudioFeatures {
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
  liveness: number;
  speechiness: number;
}

interface PlaylistAnalysis {
  healthScore: number;
  healthStatus: string;
  personalityType: string;
  personalityDescription: string;
  subgenres: { name: string; value: number }[];
  overallRating: number;
  ratingDescription: string;
}

export const analysisService = {
  // 1. Calculate Playlist Health Score
  calculateHealth(features: AudioFeatures[], totalTracks: number, uniqueGenres: number): { score: number; status: string } {
    if (!features.length) return { score: 0, status: "Unknown" };

    // Metric 1: Consistency (Standard Deviation of Energy)
    const energyMean = features.reduce((sum, f) => sum + f.energy, 0) / features.length;
    const energyVariance = features.reduce((sum, f) => sum + Math.pow(f.energy - energyMean, 2), 0) / features.length;
    const energyStdDev = Math.sqrt(energyVariance);
    
    // Lower deviation is better for flow, but too low is boring. Ideal is around 0.1-0.2
    const flowScore = energyStdDev < 0.2 ? 100 : Math.max(0, 100 - (energyStdDev - 0.2) * 200);

    // Metric 2: Variety (Genre/Track Ratio)
    const varietyScore = Math.min(100, (uniqueGenres / totalTracks) * 500); // 1 genre per 5 tracks is good variety

    // Metric 3: Quality (Popularity - implied, but we use feature balance here)
    const valenceMean = features.reduce((sum, f) => sum + f.valence, 0) / features.length;
    const moodScore = valenceMean > 0.5 ? 90 : 80; // Slight bias for happier playlists? No, just dummy logic for now. 
    // Actually let's use "Danceability" as a proxy for engagement potential
    const engagementScore = features.reduce((sum, f) => sum + f.danceability, 0) / features.length * 100;

    const totalScore = Math.round((flowScore * 0.4) + (varietyScore * 0.3) + (engagementScore * 0.3));

    let status = "Needs Work";
    if (totalScore >= 90) status = "Exceptional";
    else if (totalScore >= 75) status = "Great";
    else if (totalScore >= 60) status = "Good";
    else if (totalScore >= 40) status = "Average";

    return { score: totalScore, status };
  },

  // 2. Determine Personality
  determinePersonality(features: AudioFeatures[], genres: string[]): { type: string; description: string } {
    const avg = (key: keyof AudioFeatures) => features.reduce((sum, f) => sum + f[key], 0) / features.length;
    
    const energy = avg('energy');
    const valence = avg('valence');
    const dance = avg('danceability');
    const acoustic = avg('acousticness');
    const instrumental = avg('instrumentalness');

    // 4 Main Traits: Experimental, Mood-Driven, Eclectic, Trend-Aware
    
    // Check for "Experimental" (High Instrumental, Low Valence/Dance)
    if (instrumental > 0.3 || (energy > 0.8 && dance < 0.4)) {
      return {
        type: "The Experimentalist",
        description: "You explore the outer edges of sound. Conventions don't bind you; you seek textures and atmospheres over catchy hooks."
      };
    }

    // Check for "Mood-Driven" (High Acoustic, Extreme Valence)
    if (acoustic > 0.5 || valence < 0.3 || valence > 0.8) {
      return {
        type: "Mood-Driven",
        description: "Music is an emotional amplifier for you. You curate soundscapes that perfectly match or alter your internal state."
      };
    }

    // Check for "Eclectic" (High Genre Count - passed as argument, but here we use feature variance)
    // For now, let's use a proxy: if energy and acoustic are both moderate-high (implies mix)
    if (energy > 0.4 && acoustic > 0.3) {
      return {
        type: "The Eclectic",
        description: "Why choose one lane? You cruise through genres with ease, finding the common thread between folk, pop, and rock."
      };
    }

    // Default: "Trend-Aware" (High Popularity - usually implies High Dance/Energy)
    return {
      type: "Trend-Aware",
      description: "You have your finger on the pulse. Your playlist keeps the energy high and the vibes current."
    };
  },

  // 3. Subgenre Classification (Simple heuristic based on Spotify genres)
  classifySubgenres(genres: Record<string, number>): { name: string; value: number }[] {
    // Spotify genres are already quite specific (subgenres). 
    // We just take the ones that aren't in the top 5 "Main Genres" (handled in routes)
    // Actually, routes.ts calculates all genres. We can just take the next batch or filter.
    // For V3, let's just return the top 6-12 range as "Subgenres" or specific niche ones.
    
    const sorted = Object.entries(genres).sort(([, a], [, b]) => b - a);
    // Skip top 3 (likely broad genres like 'pop') and take next 6
    return sorted.slice(3, 9).map(([name, count]) => ({ name, value: count }));
  },

  // 4. Overall Rating
  calculateRating(healthScore: number, trackCount: number): { rating: number; description: string } {
    // Rating out of 5.0
    let baseRating = (healthScore / 20); // 0-5 scale
    
    // Penalize very short or very long playlists slightly (optimal 20-100 tracks)
    if (trackCount < 10) baseRating *= 0.9;
    if (trackCount > 500) baseRating *= 0.95;

    const rating = Math.round(Math.min(5, Math.max(1, baseRating)) * 10) / 10;
    
    let description = "Solid collection.";
    if (rating >= 4.8) description = "Masterpiece curation.";
    else if (rating >= 4.5) description = "Highly curated selection.";
    else if (rating >= 4.0) description = "Well balanced mix.";
    else if (rating >= 3.0) description = "Good potential.";

    return { rating, description };
  },

  // 5. Enhanced Battle Compatibility with Weighted Similarity
  calculateCompatibility(f1: AudioFeatures[], f2: AudioFeatures[]): number {
    const avg1 = this.getAverageFeatures(f1);
    const avg2 = this.getAverageFeatures(f2);

    // Weighted cosine similarity with different importance for each feature
    const weights = {
      energy: 0.25,        // High energy compatibility is important
      danceability: 0.20,  // Dance rhythm compatibility
      valence: 0.20,       // Mood compatibility
      acousticness: 0.15,  // Production style compatibility
      instrumentalness: 0.20, // Vocal vs instrumental preference
    };

    let weightedDotProduct = 0;
    let weightSum1 = 0;
    let weightSum2 = 0;

    // Calculate weighted dot product and magnitudes
    Object.entries(weights).forEach(([feature, weight]) => {
      const val1 = avg1[feature as keyof typeof avg1] || 0;
      const val2 = avg2[feature as keyof typeof avg2] || 0;

      weightedDotProduct += (val1 * val2) * weight;
      weightSum1 += (val1 * val1) * weight;
      weightSum2 += (val2 * val2) * weight;
    });

    const mag1 = Math.sqrt(weightSum1);
    const mag2 = Math.sqrt(weightSum2);

    if (mag1 === 0 || mag2 === 0) return 0;

    const similarity = weightedDotProduct / (mag1 * mag2);

    // Apply sigmoid transformation for better distribution
    const sigmoidSimilarity = 1 / (1 + Math.exp(-5 * (similarity - 0.5)));

    return Math.round(sigmoidSimilarity * 100);
  },

  // 6. Enhanced Recommendation Strategy Engine
  generateRecommendationStrategy(
    playlistFeatures: AudioFeatures[],
    playlistGenres: string[],
    strategy: string,
    targetTrackCount: number = 10
  ) {
    const avgFeatures = this.getAverageFeatures(playlistFeatures);

    const baseOptions: any = {
      limit: targetTrackCount,
      seed_genres: this.extractTopGenres(playlistGenres).slice(0, 2),
    };

    switch (strategy) {
      case 'best_next_track':
        // AI picks perfect continuation - balance similarity with slight progression
        return {
          ...baseOptions,
          target_energy: this.adjustFeature(avgFeatures.energy, 0.05), // Slight energy progression
          target_danceability: this.adjustFeature(avgFeatures.danceability, 0.03),
          target_valence: avgFeatures.valence,
          min_popularity: 30, // Avoid too obscure tracks
          max_popularity: 80, // Avoid overplayed tracks
        };

      case 'mood_safe_pick':
        // Maintains current vibe with minimal variance
        return {
          ...baseOptions,
          target_energy: this.clampFeature(avgFeatures.energy, 0.1), // ±0.1 range
          target_danceability: this.clampFeature(avgFeatures.danceability, 0.1),
          target_valence: this.clampFeature(avgFeatures.valence, 0.1),
          target_acousticness: this.clampFeature(avgFeatures.acousticness, 0.15),
          min_popularity: 20,
          max_popularity: 85,
        };

      case 'rare_match':
        // Hidden gems that match taste but are less popular
        return {
          ...baseOptions,
          target_energy: avgFeatures.energy,
          target_danceability: avgFeatures.danceability,
          target_valence: avgFeatures.valence,
          target_acousticness: avgFeatures.acousticness,
          max_popularity: 40, // Only less popular tracks
          min_instrumentalness: Math.max(0, avgFeatures.instrumentalness - 0.1),
          max_instrumentalness: Math.min(1, avgFeatures.instrumentalness + 0.1),
        };

      case 'return_to_familiar':
        // Deep cuts from loved artists - higher instrumental tolerance
        return {
          ...baseOptions,
          target_energy: this.adjustFeature(avgFeatures.energy, -0.1), // Slightly calmer
          target_danceability: avgFeatures.danceability,
          target_valence: this.adjustFeature(avgFeatures.valence, 0.1), // Slightly happier
          min_instrumentalness: Math.max(0, avgFeatures.instrumentalness - 0.2),
          max_instrumentalness: Math.min(1, avgFeatures.instrumentalness + 0.2),
          min_popularity: 15,
          max_popularity: 70,
        };

      case 'short_session':
        // Perfect for quick breaks - upbeat but not overwhelming
        return {
          ...baseOptions,
          target_energy: this.clampFeature(Math.max(avgFeatures.energy, 0.4), 0.2),
          target_danceability: this.clampFeature(Math.max(avgFeatures.danceability, 0.5), 0.2),
          target_valence: this.clampFeature(Math.max(avgFeatures.valence, 0.5), 0.2),
          max_duration_ms: 300000, // 5 minutes max
          min_popularity: 25,
          max_popularity: 75,
        };

      case 'energy_adjustment':
        // Gradual energy shift based on current playlist
        const currentEnergy = avgFeatures.energy;
        let energyTarget: number;

        if (currentEnergy < 0.4) {
          // Low energy - boost up
          energyTarget = Math.min(0.8, currentEnergy + 0.3);
        } else if (currentEnergy > 0.7) {
          // High energy - bring down
          energyTarget = Math.max(0.3, currentEnergy - 0.3);
        } else {
          // Medium energy - moderate adjustment
          energyTarget = currentEnergy > 0.55 ? currentEnergy - 0.2 : currentEnergy + 0.2;
        }

        return {
          ...baseOptions,
          target_energy: energyTarget,
          target_danceability: this.adjustFeature(avgFeatures.danceability, 0.1),
          target_valence: currentEnergy < 0.4 ? Math.min(0.8, avgFeatures.valence + 0.2) : avgFeatures.valence,
          min_popularity: 30,
          max_popularity: 80,
        };

      default:
        // Fallback to mood-safe strategy
        return this.generateRecommendationStrategy(playlistFeatures, playlistGenres, 'mood_safe_pick', targetTrackCount);
    }
  },

  // Helper methods for recommendation strategies
  extractTopGenres(genres: string[]): string[] {
    // Extract most common genres, preferring specific ones
    const genreCount: Record<string, number> = {};
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    return Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  },

  adjustFeature(value: number, adjustment: number): number {
    return Math.max(0, Math.min(1, value + adjustment));
  },

  clampFeature(value: number, range: number): number {
    return Math.max(0, Math.min(1, value));
  },

  // 7. Advanced Playlist Similarity Scoring
  calculatePlaylistSimilarity(
    playlistA: { features: AudioFeatures[]; genres: string[] },
    playlistB: { features: AudioFeatures[]; genres: string[] }
  ) {
    const audioSimilarity = this.calculateCompatibility(playlistA.features, playlistB.features);

    // Genre overlap calculation
    const genresA = new Set(playlistA.genres);
    const genresB = new Set(playlistB.genres);
    const genreIntersection = new Set([...genresA].filter(x => genresB.has(x)));
    const genreUnion = new Set([...genresA, ...genresB]);
    const genreSimilarity = genreUnion.size > 0 ? (genreIntersection.size / genreUnion.size) * 100 : 0;

    // Weighted overall similarity
    const overallSimilarity = (audioSimilarity * 0.7) + (genreSimilarity * 0.3);

    return {
      audioSimilarity: Math.round(audioSimilarity),
      genreSimilarity: Math.round(genreSimilarity),
      overallSimilarity: Math.round(overallSimilarity),
      genreOverlap: Array.from(genreIntersection),
      uniqueGenresA: Array.from(genresA).filter(g => !genresB.has(g)),
      uniqueGenresB: Array.from(genresB).filter(g => !genresA.has(g)),
    };
  },

  // 8. Playlist Evolution Analysis
  analyzePlaylistEvolution(features: AudioFeatures[]): {
    energyProgression: 'increasing' | 'decreasing' | 'stable';
    moodProgression: 'brightening' | 'darkening' | 'stable';
    complexityProgression: 'simplifying' | 'complexifying' | 'stable';
    recommendedAdjustments: string[];
  } {
    if (features.length < 3) {
      return {
        energyProgression: 'stable',
        moodProgression: 'stable',
        complexityProgression: 'stable',
        recommendedAdjustments: ['Add more tracks for evolution analysis'],
      };
    }

    // Split into first and second half
    const midpoint = Math.floor(features.length / 2);
    const firstHalf = features.slice(0, midpoint);
    const secondHalf = features.slice(midpoint);

    const avgFirst = this.getAverageFeatures(firstHalf);
    const avgSecond = this.getAverageFeatures(secondHalf);

    // Analyze progressions
    const energyDiff = avgSecond.energy - avgFirst.energy;
    const valenceDiff = avgSecond.valence - avgFirst.valence;
    const instrumentalDiff = avgSecond.instrumentalness - avgFirst.instrumentalness;

    const energyProgression = Math.abs(energyDiff) < 0.1 ? 'stable' :
                             energyDiff > 0 ? 'increasing' : 'decreasing';

    const moodProgression = Math.abs(valenceDiff) < 0.1 ? 'stable' :
                           valenceDiff > 0 ? 'brightening' : 'darkening';

    const complexityProgression = Math.abs(instrumentalDiff) < 0.1 ? 'stable' :
                                 instrumentalDiff > 0 ? 'complexifying' : 'simplifying';

    // Generate recommendations
    const recommendations: string[] = [];

    if (energyProgression === 'stable') {
      recommendations.push('Consider adding tracks with varying energy levels for better flow');
    }

    if (moodProgression === 'stable' && valenceDiff < 0.2) {
      recommendations.push('Your playlist maintains a consistent mood - consider adding contrast');
    }

    if (complexityProgression === 'stable') {
      recommendations.push('Try mixing instrumental and vocal tracks for more variety');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your playlist has good natural progression!');
    }

    return {
      energyProgression,
      moodProgression,
      complexityProgression,
      recommendedAdjustments: recommendations,
    };
  },

  getAverageFeatures(features: AudioFeatures[]) {
    const valid = features.filter(f => f);
    if (!valid.length) return { energy: 0, danceability: 0, valence: 0, acousticness: 0, instrumentalness: 0 };
    
    return {
      energy: valid.reduce((sum, f) => sum + f.energy, 0) / valid.length,
      danceability: valid.reduce((sum, f) => sum + f.danceability, 0) / valid.length,
      valence: valid.reduce((sum, f) => sum + f.valence, 0) / valid.length,
      acousticness: valid.reduce((sum, f) => sum + f.acousticness, 0) / valid.length,
      instrumentalness: valid.reduce((sum, f) => sum + f.instrumentalness, 0) / valid.length
    };
  }
};