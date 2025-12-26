import { users, playlists, analyses, battles, type User, type InsertUser, type Playlist, type Analysis, type Battle } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createPlaylist(playlist: typeof playlists.$inferInsert): Promise<Playlist>;
  getPlaylistBySpotifyId(spotifyId: string): Promise<Playlist | undefined>;
  
  createAnalysis(analysis: typeof analyses.$inferInsert): Promise<Analysis>;
  
  createBattle(battle: typeof battles.$inferInsert): Promise<Battle>;
  getAllBattles(): Promise<(Battle & { playlistA: Playlist, playlistB: Playlist })[]>;
  getAllAnalyses(): Promise<(Analysis & { playlist: Playlist })[]>;
  getAllPlaylists(): Promise<Playlist[]>;
  getStats(): Promise<{ analysesCount: number, battlesCount: number, averageScore: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createPlaylist(insertPlaylist: typeof playlists.$inferInsert): Promise<Playlist> {
    const [playlist] = await db.insert(playlists).values(insertPlaylist).returning();
    return playlist;
  }

  async getPlaylistBySpotifyId(spotifyId: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.spotifyId, spotifyId));
    return playlist;
  }

  async createAnalysis(insertAnalysis: typeof analyses.$inferInsert): Promise<Analysis> {
    const [analysis] = await db.insert(analyses).values(insertAnalysis).returning();
    return analysis;
  }

  async createBattle(insertBattle: typeof battles.$inferInsert): Promise<Battle> {
    const [battle] = await db.insert(battles).values(insertBattle).returning();
    return battle;
  }

  async getAllBattles(): Promise<(Battle & { playlistA: Playlist, playlistB: Playlist })[]> {
    const allBattles = await db.select().from(battles).orderBy(desc(battles.createdAt));
    const result = await Promise.all(allBattles.map(async (b) => {
      const [pA] = await db.select().from(playlists).where(eq(playlists.id, b.playlistAId!));
      const [pB] = await db.select().from(playlists).where(eq(playlists.id, b.playlistBId!));
      return { ...b, playlistA: pA, playlistB: pB };
    }));
    return result as any;
  }

  async getAllAnalyses(): Promise<(Analysis & { playlist: Playlist })[]> {
    // Use a single query with join to avoid N+1 problem
    const result = await db
      .select()
      .from(analyses)
      .innerJoin(playlists, eq(analyses.playlistId, playlists.id))
      .orderBy(desc(analyses.createdAt));

    return result.map(row => ({
      ...row.analyses,
      playlist: row.playlists,
    })) as any;
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return await db.select().from(playlists).orderBy(desc(playlists.createdAt));
  }

  async getStats(): Promise<{ analysesCount: number, battlesCount: number, averageScore: number }> {
    const allAnalyses = await db.select().from(analyses);
    const allBattles = await db.select().from(battles);
    
    const totalScore = allAnalyses.reduce((sum, a) => sum + (a.totalScore || 0), 0);
    const averageScore = allAnalyses.length ? Math.round(totalScore / allAnalyses.length) : 0;

    return {
      analysesCount: allAnalyses.length,
      battlesCount: allBattles.length,
      averageScore
    };
  }
}

export const storage = new DatabaseStorage();