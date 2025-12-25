import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { motion } from "framer-motion";
import { Share2, Download, Heart, Music, Disc, ArrowLeft, Star, Clock, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  playlistName: string;
  owner: string;
  coverUrl: string;
  trackCount: number;
  audioDna: {
    energy: number;
    danceability: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    tempo: number;
  };
  personalityType: string;
  personalityDescription: string;
  genreDistribution: { name: string; value: number }[];
  subgenres: string[];
  healthScore: number;
  healthStatus: string;
  overallRating: number;
  ratingDescription: string;
  topTracks: { name: string; artist: string; albumArt: string }[];
}

export default function Analysis() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const url = searchParams.get("url");
  const { toast } = useToast();

  const [analysisComplete, setAnalysisComplete] = useState(false);

  const { data: analysis, isLoading, error } = useQuery<AnalysisResult>({
    queryKey: ["analysis", url],
    queryFn: async () => {
      if (!url) throw new Error("No URL provided");
      const res = await apiRequest("POST", "/api/analyze", { url });
      return res.json();
    },
    enabled: !!url,
    retry: false
  });

  useEffect(() => {
    if (analysis) {
      const completeTimer = setTimeout(() => setAnalysisComplete(true), 800);
      return () => clearTimeout(completeTimer);
    }
  }, [analysis]);

  if (!url) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <p className="text-muted-foreground mb-4">No playlist URL provided.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <h2 className="text-xl font-bold text-white">Analyzing Playlist...</h2>
          <p className="text-sm text-muted-foreground">Extracting audio DNA and musical patterns</p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <div className="text-red-500 text-5xl mb-2">!</div>
          <h2 className="text-xl font-bold text-white">Analysis Failed</h2>
          <p className="text-sm text-muted-foreground">{(error as Error).message || "Could not analyze this playlist. Make sure it's public."}</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">Try Another</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  if (!analysis) return null;

  // Transform API data for Radar Chart
  const audioData = [
    { subject: 'Energy', A: analysis.audioDna.energy, fullMark: 100 },
    { subject: 'Dance', A: analysis.audioDna.danceability, fullMark: 100 },
    { subject: 'Valence', A: analysis.audioDna.valence, fullMark: 100 },
    { subject: 'Acoustic', A: analysis.audioDna.acousticness, fullMark: 100 },
    { subject: 'Instr.', A: analysis.audioDna.instrumentalness, fullMark: 100 },
  ];

  return (
    <MobileLayout>
      <div className="min-h-full pb-24">
        
        {/* Success Animation on Complete */}
        {analysisComplete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none"
            >
              {/* Confetti-like particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, y: -20, x: 0 }}
                  animate={{ opacity: 0, y: 200, x: (Math.random() - 0.5) * 200 }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                  className="absolute left-1/2 top-20 w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </motion.div>
          </>
        )}

        {/* Header */}
        <div className="p-6 pt-8 pb-0">
          <Link href="/">
             <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-white mb-4 -ml-2">
               <ArrowLeft className="w-4 h-4 mr-1" /> Back
             </Button>
          </Link>

          <div className="flex items-start gap-4 mb-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 12 }}
              className="w-24 h-24 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden shadow-2xl relative group"
            >
               {analysis.coverUrl ? (
                 <img src={analysis.coverUrl} className="w-full h-full object-cover" alt="Playlist Cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                   <Music className="w-10 h-10 text-muted-foreground" />
                 </div>
               )}
               <motion.div 
                 className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"
                 animate={analysisComplete ? { opacity: [0.2, 0.05, 0.2] } : {}}
                 transition={{ duration: 0.6, repeat: Infinity }}
               />
            </motion.div>
            <motion.div 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="flex-1 pt-1"
            >
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#1DB954]/20 text-[#1DB954] mb-2 border border-[#1DB954]/30">SPOTIFY</span>
              <h1 className="font-bold text-xl text-white leading-tight mb-1 line-clamp-2">{analysis.playlistName}</h1>
              <p className="text-xs text-muted-foreground font-mono">by {analysis.owner} • {analysis.trackCount} tracks</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Avg Tempo: {analysis.audioDna.tempo} BPM</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Health Score */}
        <div className="px-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/40 border border-white/5 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Heart className="w-24 h-24 text-pink-500" />
            </div>
            
            <div className="flex justify-between items-end mb-2 relative z-10">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Playlist Health</p>
                <div className="flex items-baseline gap-1">
                   <h2 className="text-3xl font-bold text-white font-mono">{analysis.healthScore}</h2>
                   <span className="text-lg text-muted-foreground font-mono">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${analysis.healthScore >= 90 ? 'text-green-400' : analysis.healthScore >= 75 ? 'text-cyan-400' : analysis.healthScore >= 60 ? 'text-yellow-400' : 'text-red-400'} drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]`}>{analysis.healthStatus}</span>
              </div>
            </div>
            <Progress value={analysis.healthScore} className="h-2 bg-black/40" />
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed relative z-10">
              {analysis.healthScore >= 80 ? "Your playlist has a consistent energy flow with minimal genre clutter." : "Your playlist might feel a bit disjointed. Consider narrowing the genre focus."}
            </p>
          </motion.div>
        </div>

        {/* Radar Chart */}
        <div className="px-2 mb-8 h-[300px] w-full relative">
          <h3 className="px-4 font-pixel text-xs text-muted-foreground uppercase mb-4 text-center">Audio DNA</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={audioData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Space Mono' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Playlist"
                dataKey="A"
                stroke="#7c3aed"
                strokeWidth={3}
                fill="#7c3aed"
                fillOpacity={0.4}
                isAnimationActive={true}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tracks (Replaced Top Artists) */}
        <div className="px-6 mb-8">
           <h3 className="font-pixel text-xs text-muted-foreground uppercase mb-4 flex items-center gap-2">
             <Disc className="w-3 h-3" /> Top Tracks
           </h3>
           <div className="space-y-3">
             {analysis.topTracks.map((track, i) => (
               <motion.div 
                 key={i} 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.3 + (i * 0.1) }}
                 className="flex items-center gap-3 bg-card/20 p-2 rounded-lg border border-white/5"
               >
                 <div className="w-10 h-10 rounded border border-white/10 overflow-hidden relative shadow-lg flex-shrink-0">
                   {track.albumArt ? (
                     <img src={track.albumArt} className="w-full h-full object-cover" alt={track.name} />
                   ) : (
                     <div className="w-full h-full bg-zinc-800" />
                   )}
                 </div>
                 <div className="min-w-0 flex-1">
                   <p className="text-xs font-bold text-white truncate">{track.name}</p>
                   <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                 </div>
               </motion.div>
             ))}
           </div>
        </div>

        {/* Personality Decoded Section */}
        <div className="px-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/30 border border-white/5 rounded-xl p-4"
          >
            <h3 className="font-pixel text-xs text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Heart className="w-3 h-3" /> Personality Decoded
            </h3>
            <div className="space-y-3">
               <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border-l-2 border-primary/50 pl-3"
                >
                  <h4 className="font-bold text-sm text-white mb-0.5">{analysis.personalityType}</h4>
                  <p className="text-[10px] text-muted-foreground leading-snug">{analysis.personalityDescription}</p>
                </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Genre Distribution */}
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/30 border border-white/5 rounded-xl p-4"
          >
            <h3 className="font-pixel text-xs text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Music className="w-3 h-3" /> Genre Distribution
            </h3>
            <div className="space-y-2 mb-6">
              {analysis.genreDistribution.map((genre, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (i * 0.05) }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-white">{genre.name}</span>
                    <span className="text-[10px] font-mono text-primary">{genre.value}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${genre.value}%` }}
                      transition={{ delay: 0.7 + (i * 0.05), duration: 0.8 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Subgenres Tag Cloud */}
            {analysis.subgenres && analysis.subgenres.length > 0 && (
              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.8 }}
              >
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Detected Subgenres</p>
                 <div className="flex flex-wrap gap-1.5">
                   {analysis.subgenres.map((sub, i) => (
                     <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-zinc-300 border border-white/10">
                       {sub}
                     </span>
                   ))}
                 </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Overall Rating */}
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/20 rounded-xl p-4 text-center"
          >
            <h3 className="font-pixel text-xs text-muted-foreground uppercase mb-3">Overall Rating</h3>
            <div className="flex justify-center items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + (i * 0.1) }}
                >
                  <Star
                    className={`w-5 h-5 ${i < Math.floor(analysis.overallRating) ? 'fill-yellow-400 text-yellow-400' : i < analysis.overallRating ? 'fill-yellow-400 text-yellow-400 opacity-50' : 'text-white/20'}`}
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-xl font-bold text-white font-mono mb-2">{analysis.overallRating.toFixed(1)}/5.0</p>
            <p className="text-[10px] text-muted-foreground">{analysis.ratingDescription}</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 flex gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button className="w-full border-white/10 hover:bg-white/5 text-xs h-10 hover:text-white hover:border-white/20 bg-white/5">
              <Share2 className="w-3 h-3 mr-2" /> Share Analysis
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button className="w-full border-white/10 hover:bg-white/5 text-xs h-10 hover:text-white hover:border-white/20 bg-white/5">
              <Download className="w-3 h-3 mr-2" /> Save Report
            </Button>
          </motion.div>
        </div>

      </div>
    </MobileLayout>
  );
}
