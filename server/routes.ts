import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { spotifyService } from "./services/spotify";
import { analysisService } from "./services/analysis";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "Playlist URL is required" });
      }

      const playlistId = spotifyService.parseIdFromUrl(url);
      if (!playlistId) {
        return res.status(400).json({ message: "Invalid Spotify Playlist URL" });
      }

      // 1. Fetch Playlist Metadata
      const playlist = await spotifyService.getPlaylist(playlistId);
      
      // 2. Fetch Tracks
      const tracksItems = await spotifyService.getPlaylistTracks(playlistId);
      const trackIds = tracksItems
        .map((item: any) => item.track?.id)
        .filter((id: string) => !!id);

      // 3. Fetch Audio Features
      const features = await spotifyService.getAudioFeatures(trackIds);
      const validFeatures = features.filter(f => f);

      // 4. Fetch Artists & Genres
      const artistIds = new Set<string>();
      tracksItems.forEach((item: any) => {
        item.track?.artists?.forEach((artist: any) => {
          if (artist.id) artistIds.add(artist.id);
        });
      });

      const artists = await spotifyService.getArtists(Array.from(artistIds));
      const genreCounts: Record<string, number> = {};
      
      artists.forEach((artist: any) => {
        artist.genres?.forEach((genre: string) => {
          // Capitalize first letter
          const formattedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
          genreCounts[formattedGenre] = (genreCounts[formattedGenre] || 0) + 1;
        });
      });

      const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
      
      const genreDistribution = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          value: totalGenreCount ? Math.round((count / totalGenreCount) * 100) : 0
        }));

      // 5. Calculate Audio DNA (Averages)
      const audioDna = {
        energy: Math.round(validFeatures.reduce((sum, f) => sum + f.energy, 0) / validFeatures.length * 100) || 0,
        danceability: Math.round(validFeatures.reduce((sum, f) => sum + f.danceability, 0) / validFeatures.length * 100) || 0,
        valence: Math.round(validFeatures.reduce((sum, f) => sum + f.valence, 0) / validFeatures.length * 100) || 0,
        acousticness: Math.round(validFeatures.reduce((sum, f) => sum + f.acousticness, 0) / validFeatures.length * 100) || 0,
        instrumentalness: Math.round(validFeatures.reduce((sum, f) => sum + f.instrumentalness, 0) / validFeatures.length * 100) || 0,
        tempo: Math.round(validFeatures.reduce((sum, f) => sum + f.tempo, 0) / validFeatures.length) || 0,
      };

      // 6. Advanced Analysis (Health, Personality, Rating, Subgenres)
      const health = analysisService.calculateHealth(validFeatures, tracksItems.length, Object.keys(genreCounts).length);
      const personality = analysisService.determinePersonality(validFeatures, Object.keys(genreCounts));
      const rating = analysisService.calculateRating(health.score, tracksItems.length);
      const subgenres = analysisService.classifySubgenres(genreCounts);

      // Save to Database
      let dbPlaylist = await storage.getPlaylistBySpotifyId(playlistId);
      if (!dbPlaylist) {
        dbPlaylist = await storage.createPlaylist({
          spotifyId: playlistId,
          name: playlist.name,
          description: playlist.description || "",
          owner: playlist.owner.display_name,
          coverUrl: playlist.images?.[0]?.url,
          trackCount: playlist.tracks.total,
          url: url,
        });
      }

      await storage.createAnalysis({
        playlistId: dbPlaylist.id,
        personalityType: personality.type,
        personalityDescription: personality.description,
        totalScore: health.score,
        audioDna,
        genreDistribution,
        subgenreDistribution: subgenres,
        topTracks: tracksItems.slice(0, 5).map((item: any) => ({
          name: item.track.name,
          artist: item.track.artists[0].name,
          albumArt: item.track.album.images?.[2]?.url
        })),
      });

      const result = {
        playlistName: playlist.name,
        owner: playlist.owner.display_name,
        coverUrl: playlist.images?.[0]?.url,
        trackCount: playlist.tracks.total,
        audioDna,
        personalityType: personality.type,
        personalityDescription: personality.description,
        genreDistribution,
        subgenres,
        healthScore: health.score,
        healthStatus: health.status,
        overallRating: rating.rating,
        ratingDescription: rating.description,
        topTracks: tracksItems.slice(0, 5).map((item: any) => ({
          name: item.track.name,
          artist: item.track.artists[0].name,
          albumArt: item.track.album.images?.[2]?.url // Small image
        }))
      };

      res.json(result);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({ message: "Failed to analyze playlist", error: error.message });
    }
  });

  app.post("/api/battle", async (req, res) => {
    try {
      const { url1, url2 } = req.body;
      if (!url1 || !url2) {
        return res.status(400).json({ message: "Both playlist URLs are required" });
      }

      const id1 = spotifyService.parseIdFromUrl(url1);
      const id2 = spotifyService.parseIdFromUrl(url2);

      if (!id1 || !id2) {
        return res.status(400).json({ message: "Invalid Spotify Playlist URLs" });
      }

      const [p1, p2] = await Promise.all([
        spotifyService.getPlaylist(id1),
        spotifyService.getPlaylist(id2)
      ]);

      const [t1Items, t2Items] = await Promise.all([
        spotifyService.getPlaylistTracks(id1),
        spotifyService.getPlaylistTracks(id2)
      ]);

      const t1Ids = t1Items.map((i: any) => i.track?.id).filter((id: string) => !!id);
      const t2Ids = t2Items.map((i: any) => i.track?.id).filter((id: string) => !!id);

      const [f1, f2] = await Promise.all([
        spotifyService.getAudioFeatures(t1Ids),
        spotifyService.getAudioFeatures(t2Ids)
      ]);

      const validF1 = f1.filter(f => f);
      const validF2 = f2.filter(f => f);

      // Fetch Artists & Genres for both
      const getGenres = async (items: any[]) => {
        const aIds = new Set<string>();
        items.forEach((item: any) => item.track?.artists?.forEach((a: any) => a.id && aIds.add(a.id)));
        const artists = await spotifyService.getArtists(Array.from(aIds));
        const genres = new Set<string>();
        artists.forEach((a: any) => a.genres?.forEach((g: string) => genres.add(g)));
        return Array.from(genres);
      };

      const [genres1, genres2] = await Promise.all([
        getGenres(t1Items),
        getGenres(t2Items)
      ]);

      // Calculate Scores using Analysis Service
      const health1 = analysisService.calculateHealth(validF1, t1Items.length, genres1.length);
      const health2 = analysisService.calculateHealth(validF2, t2Items.length, genres2.length);

      const score1 = health1.score;
      const score2 = health2.score;

      // Compatibility
      const compatibilityScore = analysisService.calculateCompatibility(validF1, validF2);

      const getAvg = (features: any[], key: string) => {
        const valid = features.filter(f => f);
        return valid.length ? Math.round(valid.reduce((sum, f) => sum + f[key], 0) / valid.length * 100) : 0;
      };

      const audioData = [
        { subject: 'Energy', A: getAvg(f1, 'energy'), B: getAvg(f2, 'energy'), fullMark: 100 },
        { subject: 'Dance', A: getAvg(f1, 'danceability'), B: getAvg(f2, 'danceability'), fullMark: 100 },
        { subject: 'Valence', A: getAvg(f1, 'valence'), B: getAvg(f2, 'valence'), fullMark: 100 },
        { subject: 'Acoustic', A: getAvg(f1, 'acousticness'), B: getAvg(f2, 'acousticness'), fullMark: 100 },
        { subject: 'Instr.', A: getAvg(f1, 'instrumentalness'), B: getAvg(f2, 'instrumentalness'), fullMark: 100 },
      ];

      // Shared Artists
      const artists1 = new Set(t1Items.map((i: any) => i.track.artists[0].name));
      const artists2 = new Set(t2Items.map((i: any) => i.track.artists[0].name));
      const sharedArtists = Array.from(artists1).filter(x => artists2.has(x));

      // Shared Tracks
      const tracks1 = new Set(t1Items.map((i: any) => i.track.name));
      const tracks2 = new Set(t2Items.map((i: any) => i.track.name));
      const sharedTrackNames = Array.from(tracks1).filter(x => tracks2.has(x));
      const sharedTracks = sharedTrackNames.map(name => {
        const item = t1Items.find((i: any) => i.track.name === name);
        return { title: name, artist: item.track.artists[0].name };
      });

      // Shared Genres (Real)
      const sharedGenres = genres1.filter(g => genres2.includes(g)).map(g => g.charAt(0).toUpperCase() + g.slice(1));

      const result = {
        playlist1: {
          name: p1.name,
          owner: p1.owner.display_name,
          image: p1.images?.[0]?.url,
          tracks: p1.tracks.total,
          score: score1
        },
        playlist2: {
          name: p2.name,
          owner: p2.owner.display_name,
          image: p2.images?.[0]?.url,
          tracks: p2.tracks.total,
          score: score2
        },
        compatibilityScore,
        winner: score1 === score2 ? "tie" : score1 > score2 ? "playlist1" : "playlist2",
        sharedArtists,
        sharedGenres: sharedGenres.slice(0, 10), // Limit to top 10 shared
        sharedTracks,
        audioData
      };

      // Save to DB
      const getOrCreatePlaylist = async (p: any, url: string) => {
        let dbP = await storage.getPlaylistBySpotifyId(p.id);
        if (!dbP) {
          dbP = await storage.createPlaylist({
            spotifyId: p.id,
            name: p.name,
            description: p.description || "",
            owner: p.owner.display_name,
            coverUrl: p.images?.[0]?.url,
            trackCount: p.tracks.total,
            url: url,
          });
        }
        return dbP;
      };

      const dbP1 = await getOrCreatePlaylist(p1, url1);
      const dbP2 = await getOrCreatePlaylist(p2, url2);

      await storage.createBattle({
        playlistAId: dbP1.id,
        playlistBId: dbP2.id,
        compatibilityScore,
        winnerId: result.winner === "tie" ? null : result.winner === "playlist1" ? dbP1.id : dbP2.id,
        winnerReason: result.winner === "tie" ? "Perfect Balance" : "Higher Overall Score",
        sharedTracks: sharedTracks,
        sharedArtists: sharedArtists,
        sharedGenres: sharedGenres,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Battle Error:", error);
      res.status(500).json({ message: "Battle failed", error: error.message });
    }
  });

  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getAllPlaylists();
      res.json(playlists);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const { name, description, tracks, coverUrl } = req.body;
      
      if (!name || !tracks) {
        return res.status(400).json({ message: "Name and tracks are required" });
      }

      // Create a "Generated" playlist
      // Since we don't have a real Spotify ID, we generate one
      const generatedId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const playlist = await storage.createPlaylist({
        spotifyId: generatedId,
        name,
        description: description || "Created via Music Decision Assistant",
        owner: "You",
        coverUrl: coverUrl || null,
        trackCount: tracks.length,
        url: `generated://${generatedId}`,
      });

      res.json(playlist);
    } catch (error: any) {
      console.error("Create Playlist Error:", error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  app.get("/api/recommendations", async (req, res) => {
    try {
      const { type, seed_tracks, seed_genres, seed_artists } = req.query;
      
      const options: any = { limit: 10 };
      if (seed_tracks) options.seed_tracks = seed_tracks;
      if (seed_genres) options.seed_genres = seed_genres;
      if (seed_artists) options.seed_artists = seed_artists;

      // Logic for different recommendation types (Decision Assistant)
      switch (type) {
        case "mood_safe": // Maintain current vibe (use audio features if we had them, or just seed)
          options.min_valence = 0.4;
          options.max_valence = 0.8;
          break;
        case "energy_boost":
          options.min_energy = 0.7;
          break;
        case "chill_mode":
          options.max_energy = 0.4;
          options.max_tempo = 100;
          break;
        case "experimental":
          options.min_instrumentalness = 0.3;
          break;
      }

      const tracks = await spotifyService.getRecommendations(options);
      
      res.json(tracks.map((t: any) => ({
        id: t.id,
        name: t.name,
        artist: t.artists[0].name,
        albumArt: t.album.images[0]?.url,
        previewUrl: t.preview_url
      })));
    } catch (error: any) {
      console.error("Recommendation Error:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      const [analyses, battles] = await Promise.all([
        storage.getAllAnalyses(),
        storage.getAllBattles()
      ]);

      const history = [
        ...analyses.map(a => ({
          type: 'analysis',
          id: a.id,
          title: a.playlist.name,
          date: a.createdAt,
          data: a
        })),
        ...battles.map(b => ({
          type: 'battle',
          id: b.id,
          title: `${b.playlistA.name} vs ${b.playlistB.name}`,
          date: b.createdAt,
          data: b
        }))
      ].sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());

      res.json(history);
    } catch (error: any) {
      console.error("History Error:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Stats Error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
