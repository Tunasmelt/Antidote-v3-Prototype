CREATE TABLE "analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"playlist_id" integer,
	"personality_type" text,
	"personality_description" text,
	"total_score" integer,
	"audio_dna" jsonb,
	"genre_distribution" jsonb,
	"subgenre_distribution" jsonb,
	"top_tracks" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"playlist_a_id" integer,
	"playlist_b_id" integer,
	"compatibility_score" integer,
	"winner_id" integer NULL,
	"winner_reason" text,
	"shared_tracks" jsonb,
	"shared_artists" jsonb,
	"shared_genres" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"spotify_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner" text,
	"cover_url" text,
	"track_count" integer,
	"url" text NOT NULL,
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"spotify_id" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_playlist_a_id_playlists_id_fk" FOREIGN KEY ("playlist_a_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_playlist_b_id_playlists_id_fk" FOREIGN KEY ("playlist_b_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_winner_id_playlists_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;