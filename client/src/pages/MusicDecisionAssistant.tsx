import React, { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, Heart, Compass, RotateCw, Zap, Music, Play, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const suggestions = [
  {
    id: 1,
    type: "decision",
    title: "Best Next Track",
    description: "AI picks the perfect next song based on current momentum",
    icon: Lightbulb,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: 2,
    type: "mood_safe",
    title: "Mood-Safe Pick",
    description: "Maintains your current vibe without jarring changes",
    icon: Heart,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    id: 3,
    type: "experimental",
    title: "Rare Match For You",
    description: "Hidden gems that align with your unique taste",
    icon: Compass,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: 4,
    type: "chill_mode",
    title: "Chill Mode",
    description: "Relaxing tracks to wind down",
    icon: RotateCw,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    id: 5,
    type: "short_session",
    title: "Short Session",
    description: "Perfect tracks for quick 5-10 minute breaks",
    icon: Music,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    id: 6,
    type: "energy_boost",
    title: "Energy Adjustment",
    description: "Gradually shift the energy up",
    icon: Zap,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
];

const GENRES = ["pop", "hip-hop", "rock", "indie", "electronic", "r-n-b", "jazz", "classical", "metal", "country"];

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

export default function MusicDecisionAssistant() {
  const { toast } = useToast();
  const [selectedGenre, setSelectedGenre] = useState("pop");
  const [showResults, setShowResults] = useState(false);
  const [activeTitle, setActiveTitle] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const mutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("GET", `/api/recommendations?type=${type}&seed_genres=${selectedGenre}`);
      return res.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
      setShowResults(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive"
      });
    }
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/playlists", {
        name: `${activeTitle} Mix`,
        description: `Generated from Music Decision Assistant based on ${selectedGenre}`,
        tracks: recommendations,
        coverUrl: recommendations[0]?.albumArt // Use first track's art as cover
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Playlist Created",
        description: "Your new mix has been saved to your library.",
        variant: "default", // Success
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create playlist.",
        variant: "destructive"
      });
    }
  });

  const handleSuggestionClick = (suggestion: any) => {
    setActiveTitle(suggestion.title);
    mutation.mutate(suggestion.type);
  };

  const handleReset = () => {
    setShowResults(false);
    setRecommendations([]);
  };

  return (
    <MobileLayout>
      <div className="min-h-full pb-24">
        {/* Header */}
        <div className="p-6 pt-8 pb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-white mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-pixel text-2xl text-white mb-2">Music Decision Assistant</h1>
            <p className="text-xs text-muted-foreground font-mono">
              AI-powered suggestions tailored to your taste
            </p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Genre Selector */}
              <div className="px-6 mb-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Select Vibe Base</p>
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                        selectedGenre === genre
                          ? "bg-primary text-black border-primary"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                      }`}
                    >
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions Grid */}
              <motion.div
                className="px-6 space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {suggestions.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.div
                      key={suggestion.id}
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="bg-card/30 border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-card/50 hover:border-white/10 transition-all group relative overflow-hidden"
                    >
                      {mutation.isPending && activeTitle === suggestion.title && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                           <Loader2 className="w-6 h-6 animate-spin text-primary" />
                         </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${suggestion.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 ${suggestion.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{suggestion.title}</h3>
                          <p className="text-[10px] text-muted-foreground leading-snug mt-1">{suggestion.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="px-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white">
                  Results: <span className="text-primary">{activeTitle}</span>
                </h2>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-white">
                  <RefreshCw className="w-4 h-4 mr-1" /> Reset
                </Button>
              </div>

              <div className="space-y-3">
                {recommendations.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 bg-card/20 p-3 rounded-xl border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden relative shadow-lg flex-shrink-0 group">
                      {track.albumArt ? (
                        <img src={track.albumArt} className="w-full h-full object-cover" alt={track.name} />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                           <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      {track.previewUrl && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                 <p className="text-[10px] text-muted-foreground mb-4">Like these results? Add them to a new playlist.</p>
                 <Button 
                   onClick={() => createPlaylistMutation.mutate()}
                   disabled={createPlaylistMutation.isPending}
                   className="w-full bg-primary text-black font-bold hover:bg-primary/90"
                 >
                   {createPlaylistMutation.isPending ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                     </>
                   ) : (
                     "Create Playlist"
                   )}
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
