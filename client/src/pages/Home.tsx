import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio, PlayCircle, Zap, ArrowRight, Activity, Search, Wand2, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";

const ShootingStar = ({ delay, color = "purple" }: { delay: number; color?: "purple" | "cyan" | "pink" }) => {
  const randomLeft = Math.random() * 80 + 10;
  const randomTop = Math.random() * 40;

  return (
    <div
      key={delay}
      className={`shooting-star ${color !== "purple" ? color : ""}`}
      style={{
        left: `${randomLeft}%`,
        top: `${randomTop}%`,
        animation: `${Math.random() > 0.5 ? "shootingStar" : "shootingStarReverse"} 3s ease-in forwards`,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const [shootingStars, setShootingStars] = useState<Array<{ id: number; delay: number; color: "purple" | "cyan" | "pink" }>>([]);

  useEffect(() => {
    const generateShootingStars = () => {
      const newStars: Array<{ id: number; delay: number; color: "purple" | "cyan" | "pink" }> = [];
      const colors: ("purple" | "cyan" | "pink")[] = ["purple", "cyan", "pink"];
      
      for (let i = 0; i < 3; i++) {
        newStars.push({
          id: Date.now() + i,
          delay: Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setShootingStars(newStars);
    };

    generateShootingStars();
    const interval = setInterval(generateShootingStars, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = () => {
    if (url) {
      setLocation(`/analysis?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-full flex flex-col relative">
        
        {/* Hero Section with Cosmic Background */}
        <div className="relative h-[420px] w-full overflow-hidden flex flex-col items-center justify-center text-center p-6">
           <div className="absolute inset-0 z-0">
             <motion.img 
               src={"/assets/background.png"} 
               className="w-full h-full object-cover opacity-60 mix-blend-screen" 
               alt="Space"
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
             
             {/* Shooting Stars */}
             <div className="absolute inset-0 overflow-hidden">
               {shootingStars.map((star) => (
                 <ShootingStar key={star.id} delay={star.delay} color={star.color} />
               ))}
             </div>
           </div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="z-10 relative space-y-4"
           >
             <motion.div 
               className="w-24 h-24 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]"
               animate={{ 
                 rotate: [0, 5, -5, 0],
                 y: [0, -10, 0]
               }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             >
               <img src={"/assets/logo.png"} alt="Antidote" className="w-full h-full object-contain filter drop-shadow-lg" />
             </motion.div>
             
             <motion.h1 
               className="font-pixel text-4xl text-white tracking-tighter leading-tight drop-shadow-[0_2px_0_rgba(124,58,237,1)]"
               animate={{ 
                 textShadow: [
                   "0 2px 0px rgba(124, 58, 237, 1)",
                   "0 4px 10px rgba(124, 58, 237, 0.8)",
                   "0 2px 0px rgba(124, 58, 237, 1)"
                 ]
               }}
               transition={{ duration: 3, repeat: Infinity }}
             >
               antidote
             </motion.h1>
             
             <motion.p 
               className="text-sm text-muted-foreground font-mono max-w-[280px] mx-auto"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.3 }}
             >
               Discover the DNA of your music taste.
             </motion.p>
           </motion.div>
        </div>

        {/* Input Section */}
        <div className="px-6 -mt-12 relative z-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <motion.label 
                  className="text-xs font-mono text-cyan-400 uppercase tracking-widest ml-1"
                  animate={{ opacity: [0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Playlist URL
                </motion.label>
                <div className="relative group">
                  <Input 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste Spotify or Apple Music link..." 
                    className="bg-black/40 border-white/10 h-12 pl-10 text-sm font-mono focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all rounded-lg text-white placeholder:text-muted-foreground/50"
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-4" />
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleAnalyze}
                  className="w-full h-12 bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.3)] border-0 rounded-lg group overflow-hidden relative"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    REVEAL MY DESTINY <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="px-6 mt-8 space-y-4 pb-24">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-pixel text-xs text-muted-foreground uppercase">Modules</h3>
            <div className="h-[1px] bg-white/10 flex-1 ml-4" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/analysis">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-card/30 border border-white/5 rounded-xl p-4 hover:bg-card/50 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <Activity className="w-6 h-6 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white mb-1">Health Check</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">Analyze playlist consistency & flow</p>
              </motion.div>
            </Link>

            <Link href="/battle">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-card/30 border border-white/5 rounded-xl p-4 hover:bg-card/50 hover:border-pink-500/30 transition-all cursor-pointer group"
              >
                <Zap className="w-6 h-6 text-pink-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white mb-1">Battle Mode</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">Compare two playlists head-to-head</p>
              </motion.div>
            </Link>

            <Link href="/music-assistant">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-card/30 border border-white/5 rounded-xl p-4 hover:bg-card/50 hover:border-cyan-400/30 transition-all cursor-pointer group"
              >
                <Wand2 className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white mb-1">Decision Assistant</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">AI picks your next perfect track</p>
              </motion.div>
            </Link>

            <Link href="/profile">
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-card/30 border border-white/5 rounded-xl p-4 hover:bg-card/50 hover:border-purple-400/30 transition-all cursor-pointer group"
              >
                <Share2 className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white mb-1">Share & Save</h4>
                <p className="text-[10px] text-muted-foreground leading-tight">Save & share your analysis results</p>
              </motion.div>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/5 rounded-xl p-4 flex items-center gap-4"
          >
             <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
               <img src={"/assets/image_1.png"} alt="star" className="w-5 h-5" />
             </div>
             <div>
               <h4 className="font-bold text-sm text-white">Discover More</h4>
               <p className="text-[10px] text-muted-foreground">Get songs that actually fit the vibe</p>
             </div>
          </motion.div>
        </div>

      </div>
    </MobileLayout>
  );
}
