import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed
  spotifyId: text("spotify_id"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  spotifyId: text("spotify_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner"),
  coverUrl: text("cover_url"),
  trackCount: integer("track_count"),
  url: text("url").notNull(),
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id),
  personalityType: text("personality_type"), // e.g., "The Time Traveler"
  personalityDescription: text("personality_description"),
  totalScore: integer("total_score"), // 0-100
  audioDna: jsonb("audio_dna"), // { energy: 80, dance: 60, ... }
  genreDistribution: jsonb("genre_distribution"), // [{ name: "Pop", value: 40 }, ...]
  subgenreDistribution: jsonb("subgenre_distribution"),
  topTracks: jsonb("top_tracks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const battles = pgTable("battles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  playlistAId: integer("playlist_a_id").references(() => playlists.id),
  playlistBId: integer("playlist_b_id").references(() => playlists.id),
  compatibilityScore: integer("compatibility_score"),
  winnerId: integer("winner_id").references(() => playlists.id),
  winnerReason: text("winner_reason"),
  sharedTracks: jsonb("shared_tracks"),
  sharedArtists: jsonb("shared_artists"),
  sharedGenres: jsonb("shared_genres"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas for API validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({ 
  id: true, 
  createdAt: true, 
  analyzedAt: true 
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({ 
  id: true, 
  createdAt: true 
});

export const insertBattleSchema = createInsertSchema(battles).omit({ 
  id: true, 
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type Battle = typeof battles.$inferSelect;
