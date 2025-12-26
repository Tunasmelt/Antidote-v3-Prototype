-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  spotify_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id),
  spotify_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  cover_url TEXT,
  track_count INTEGER,
  url TEXT NOT NULL,
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analyses
CREATE TABLE IF NOT EXISTS public.analyses (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES public.playlists(id),
  personality_type TEXT,
  personality_description TEXT,
  total_score INTEGER,
  audio_dna JSONB,
  genre_distribution JSONB,
  subgenre_distribution JSONB,
  top_tracks JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Battles
CREATE TABLE IF NOT EXISTS public.battles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id),
  playlist_a_id INTEGER REFERENCES public.playlists(id),
  playlist_b_id INTEGER REFERENCES public.playlists(id),
  compatibility_score INTEGER,
  winner_id INTEGER REFERENCES public.playlists(id),
  winner_reason TEXT,
  shared_tracks JSONB,
  shared_artists JSONB,
  shared_genres JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_playlists_spotify_id ON public.playlists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_playlist_id ON public.analyses(playlist_id);
CREATE INDEX IF NOT EXISTS idx_battles_user_id ON public.battles(user_id);
CREATE INDEX IF NOT EXISTS idx_battles_playlist_a_id ON public.battles(playlist_a_id);
CREATE INDEX IF NOT EXISTS idx_battles_playlist_b_id ON public.battles(playlist_b_id);
