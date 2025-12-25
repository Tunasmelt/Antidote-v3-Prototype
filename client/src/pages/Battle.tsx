import React, { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, Trophy, AlertTriangle, CheckCircle2, Zap, Users, Music, Disc3, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Battle() {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [battleStarted, setBattleStarted] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const { toast } = useToast();

  const battleMutation = useMutation({
    mutationFn: async (data: { url1: string; url2: string }) => {
      const res = await apiRequest("POST", "/api/battle", data);
      return res.json();
    },
    onSuccess: (data) => {
      setBattleStarted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Battle Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStartBattle = () => {
    if (!url1 || !url2) {
      toast({
        title: "Missing URLs",
        description: "Please enter both playlist URLs",
        variant: "destructive"
      });
      return;
    }
    battleMutation.mutate({ url1, url2 });
  };

  const toggleTrackSelection = (index: number) => {
    setSelectedTracks((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const result = battleMutation.data;
  
  const compatibilityScore = result?.compatibilityScore || 0;
  const isWinner = result?.winner === "playlist1"; // Assuming playlist1 is "us" or just logic
  const isTie = result?.winner === "tie";
  const [displayCompatibility, setDisplayCompatibility] = useState(0);
  const [resultsReady, setResultsReady] = useState(false);

  React.useEffect(() => {
    if (battleStarted && result) {
      const timer = setTimeout(() => setResultsReady(true), 800);
      const compatTimer = setInterval(() => {
        setDisplayCompatibility((prev) => {
          if (prev < compatibilityScore) return prev + 2;
          return compatibilityScore;
        });
      }, 30);
      return () => {
        clearTimeout(timer);
        clearInterval(compatTimer);
      };
    }
  }, [battleStarted, result, compatibilityScore]);

  if (battleMutation.isPending) {
    return (
      <MobileLayout>
         <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
           <Loader2 className="w-12 h-12 animate-spin text-primary" />
           <h2 className="text-xl font-bold text-white">Battle in Progress...</h2>
           <p className="text-sm text-muted-foreground">Analyzing audio fingerprints</p>
         </div>
      </MobileLayout>
    );
  }

  if (!battleStarted || !result) {
    return (
      <MobileLayout>
        <div className="min-h-full pb-24 px-6 pt-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 mb-4 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Swords className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
            <motion.h1
              className="font-pixel text-xl text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Playlist Battle
            </motion.h1>
            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Compare taste compatibility head-to-head
            </motion.p>
          </div>

          {/* Inputs */}
          <div className="space-y-6 relative mb-10">
            <motion.div
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Contender 1</label>
              <Input
                value={url1}
                onChange={(e) => setUrl1(e.target.value)}
                placeholder="Paste first playlist URL..."
                className="bg-zinc-900/50 border-zinc-800 text-xs font-mono h-12 rounded-xl focus:border-cyan-500/50 text-white"
              />
            </motion.div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div
                className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center font-black text-[10px] text-pink-500 shadow-xl"
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
              >
                VS
              </motion.div>
            </div>

            <motion.div
              className="space-y-2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="text-[10px] font-mono text-pink-400 uppercase tracking-widest">Contender 2</label>
              <Input
                value={url2}
                onChange={(e) => setUrl2(e.target.value)}
                placeholder="Paste second playlist URL..."
                className="bg-zinc-900/50 border-zinc-800 text-xs font-mono h-12 rounded-xl focus:border-pink-500/50 text-white"
              />
            </motion.div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleStartBattle}
              className="w-full h-12 bg-white text-black font-bold hover:bg-gray-200 mb-8 rounded-xl"
            >
              START BATTLE
            </Button>
          </motion.div>

          {/* Empty State / Preview */}
          <motion.div
            className="border border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/[0.02]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
          >
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3 opacity-50" />
            </motion.div>
            <h3 className="text-sm font-bold text-white mb-1">Winner Takes All</h3>
            <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto">
              Our AI analyzes energy curves, genre overlap, and taste compatibility to declare a winner.
            </p>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-full pb-24">
        {/* Victory Animation */}
        {resultsReady && (result.winner === "playlist1" || result.winner === "playlist2") && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 pointer-events-none"
            >
              {/* Celebration particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, y: 0, x: 0 }}
                  animate={{ opacity: 0, y: 300, x: (Math.random() - 0.5) * 300, rotate: 360 }}
                  transition={{ duration: 2, delay: i * 0.08, ease: "easeOut" }}
                  className={`absolute left-1/2 top-1/4 w-3 h-3 rounded-full ${
                    i % 3 === 0 ? "bg-yellow-400" : i % 3 === 1 ? "bg-primary" : "bg-pink-500"
                  }`}
                />
              ))}
            </motion.div>
          </>
        )}

        {/* Header */}
        <div className="p-6 pt-8 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-white mb-4 -ml-2"
            onClick={() => {
              setBattleStarted(false);
              setDisplayCompatibility(0);
              setResultsReady(false);
              battleMutation.reset();
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <motion.h1
            className="font-pixel text-2xl text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Battle Results
          </motion.h1>
        </div>

        {/* Compatibility Analysis */}
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-4 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"
              animate={resultsReady ? { x: ["0%", "100%"] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: "200%" }}
            />
            <h3 className="font-pixel text-xs text-muted-foreground uppercase mb-3 flex items-center gap-2 relative z-10">
              <Zap className="w-3 h-3" /> Compatibility Analysis
            </h3>
            <div className="text-center relative z-10">
              <p className="text-4xl font-bold text-white font-mono mb-1">{displayCompatibility}%</p>
              <p className="text-[10px] text-muted-foreground">Taste compatibility match</p>
              <motion.p 
                className="text-xs text-purple-300 mt-2 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                These playlists share similar energy patterns with complementary genre distributions.
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* Winner Declaration */}
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 120 }}
            className={`rounded-xl p-4 border text-center relative overflow-hidden ${
              isTie
                ? "bg-cyan-900/20 border-cyan-500/30"
                : result.winner === "playlist1"
                  ? "bg-yellow-900/20 border-yellow-500/30"
                  : "bg-blue-900/20 border-blue-500/30"
            }`}
          >
            {!isTie && resultsReady && (
              <motion.div
                className={`absolute inset-0 ${
                  !isTie
                    ? "bg-gradient-to-r from-yellow-500/20 to-transparent"
                    : ""
                }`}
                animate={{ opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
              <motion.div
                animate={resultsReady && !isTie ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              >
                <Trophy
                  className={`w-5 h-5 ${
                    isTie ? "text-cyan-400" : result.winner === "playlist1" ? "text-yellow-400" : "text-blue-400"
                  }`}
                />
              </motion.div>
              <motion.h3 
                className="font-pixel text-sm text-white"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {isTie ? "Perfect Balance" : result.winner === "playlist1" ? "Contender 1 Wins" : "Contender 2 Wins"}
              </motion.h3>
            </div>
            <p className="text-[10px] text-muted-foreground relative z-10">
              {isTie
                ? "Both playlists are perfectly balanced with equal energy and appeal"
                : `${result.winner === "playlist1" ? result.playlist1.name : result.playlist2.name} dominates with higher overall score and better genre cohesion`}
            </p>
          </motion.div>
        </div>

        {/* Playlist Scores */}
        <div className="px-6 mb-6">
          <motion.h3 
            className="font-pixel text-xs text-muted-foreground uppercase mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Playlist Scores
          </motion.h3>
          <div className="grid grid-cols-2 gap-3">
            {[result.playlist1, result.playlist2].map((playlist: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx === 0 ? -15 : 15, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-card/30 border border-white/5 rounded-xl p-3 text-center hover:border-white/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden mx-auto mb-2 border border-white/10">
                  {playlist.image ? (
                     <img src={playlist.image} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full bg-zinc-800" />
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{playlist.owner}</p>
                <motion.p 
                  className="text-lg font-mono font-bold text-cyan-400 mt-2"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                >
                  {playlist.score}
                </motion.p>
                <p className="text-[9px] text-muted-foreground">{playlist.tracks} tracks</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Shared Artists & Genres */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Shared Artists */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card/30 border border-white/5 rounded-xl p-3"
            >
              <h4 className="font-pixel text-[10px] text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Shared Artists
              </h4>
              <p className="text-xl font-bold text-cyan-400 font-mono mb-2">{result.sharedArtists.length}</p>
              <div className="space-y-1">
                {result.sharedArtists.slice(0, 3).map((artist: string, i: number) => (
                  <p key={i} className="text-[9px] text-muted-foreground truncate">
                    • {artist}
                  </p>
                ))}
              </div>
            </motion.div>

            {/* Shared Genres */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card/30 border border-white/5 rounded-xl p-3"
            >
              <h4 className="font-pixel text-[10px] text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Music className="w-3 h-3" /> Shared Genres
              </h4>
              <p className="text-xl font-bold text-pink-400 font-mono mb-2">{result.sharedGenres.length}</p>
              <div className="space-y-1">
                {result.sharedGenres.map((genre: string, i: number) => (
                  <p key={i} className="text-[9px] text-muted-foreground truncate">
                    • {genre}
                  </p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Shared Tracks */}
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card/30 border border-white/5 rounded-xl p-4"
          >
            <h4 className="font-pixel text-xs text-muted-foreground uppercase mb-3 flex items-center gap-2">
              <Disc3 className="w-3 h-3" /> Shared Tracks ({result.sharedTracks.length})
            </h4>
            <div className="space-y-2">
              {result.sharedTracks.map((track: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className="flex items-center gap-3 bg-white/5 rounded p-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{track.artist}</p>
                  </div>
                </motion.div>
              ))}
              {result.sharedTracks.length === 0 && (
                <p className="text-[10px] text-muted-foreground">No shared tracks found.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Combined Audio DNA */}
        <div className="px-2 mb-8 h-[300px] w-full relative">
          <h3 className="px-4 font-pixel text-xs text-muted-foreground uppercase mb-4 text-center">Audio DNA Comparison</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.audioData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Space Mono' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Contender 1"
                dataKey="A"
                stroke="#7c3aed"
                strokeWidth={3}
                fill="#7c3aed"
                fillOpacity={0.3}
              />
              <Radar
                name="Contender 2"
                dataKey="B"
                stroke="#ec4899"
                strokeWidth={3}
                fill="#ec4899"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </MobileLayout>
  );
}
