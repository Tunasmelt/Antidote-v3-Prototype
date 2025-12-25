
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

  // 5. Battle Compatibility
  calculateCompatibility(f1: AudioFeatures[], f2: AudioFeatures[]): number {
    // Cosine Similarity of average vectors
    const avg1 = this.getAverageFeatures(f1);
    const avg2 = this.getAverageFeatures(f2);

    const dotProduct = 
      (avg1.energy * avg2.energy) +
      (avg1.danceability * avg2.danceability) +
      (avg1.valence * avg2.valence) +
      (avg1.acousticness * avg2.acousticness) +
      (avg1.instrumentalness * avg2.instrumentalness);

    const mag1 = Math.sqrt(
      avg1.energy**2 + avg1.danceability**2 + avg1.valence**2 + avg1.acousticness**2 + avg1.instrumentalness**2
    );
    const mag2 = Math.sqrt(
      avg2.energy**2 + avg2.danceability**2 + avg2.valence**2 + avg2.acousticness**2 + avg2.instrumentalness**2
    );

    if (mag1 === 0 || mag2 === 0) return 0;

    const similarity = dotProduct / (mag1 * mag2);
    return Math.round(similarity * 100);
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
