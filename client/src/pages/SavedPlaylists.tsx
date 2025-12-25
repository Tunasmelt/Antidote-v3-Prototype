import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, MoreVertical, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export default function SavedPlaylists() {
  const { data: playlists, isLoading, error } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const res = await fetch("/api/playlists");
      if (!res.ok) throw new Error("Failed to fetch playlists");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <h2 className="text-xl font-bold text-white">Loading Playlists...</h2>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
           <p className="text-red-500">Failed to load playlists</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-full pb-24">
        <div className="p-6 pt-8 pb-4">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-white mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Profile
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-pixel text-2xl text-white mb-2">Saved Playlists</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Your collection of curated vibes
            </p>
          </motion.div>
        </div>

        <motion.div
          className="px-6 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {playlists?.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">No playlists found.</div>
          ) : (
            playlists?.map((playlist: any) => (
              <motion.div
                key={playlist.id}
                variants={itemVariants}
                whileHover={{ y: -2, scale: 1.01 }}
                className="bg-card/30 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-card/50 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-lg bg-zinc-800 flex items-center justify-center`}>
                    {playlist.coverUrl ? (
                      <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-current opacity-80" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate">{playlist.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {playlist.trackCount} tracks • {playlist.createdAt ? formatDistanceToNow(new Date(playlist.createdAt), { addSuffix: true }) : 'Unknown date'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </MobileLayout>
  );
}
