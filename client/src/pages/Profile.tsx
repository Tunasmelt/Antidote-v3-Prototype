import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, History, Star, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function Profile() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const level = stats ? Math.floor(stats.analysesCount / 5) + 1 : 1;

  return (
    <MobileLayout>
      <div className="min-h-full pb-24">
        
        {/* Profile Header */}
        <motion.div 
          className="bg-gradient-to-b from-primary/10 to-transparent p-6 pt-10 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-xl">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </motion.div>
          <motion.h1 
            className="text-xl font-bold text-white mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Music Explorer
          </motion.h1>
          <motion.p 
            className="text-xs text-primary font-mono bg-primary/10 inline-block px-2 py-1 rounded"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            Audio Explorer Lvl. {level}
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-3 gap-1 px-6 mb-8 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/30 p-3 rounded-l-xl border-y border-l border-white/5"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-lg font-bold text-white">{stats?.analysesCount || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Analyses</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/30 p-3 border-y border-white/5"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-lg font-bold text-white">{stats?.battlesCount || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Battles</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/30 p-3 rounded-r-xl border-y border-r border-white/5"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-lg font-bold text-white">{stats?.averageScore || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Score</div>
          </motion.div>
        </motion.div>

        {/* Menu Items */}
        <motion.div 
          className="px-6 space-y-1"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Link href="/history">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                  <History className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-white">History</span>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">View Recent <span className="text-[10px] text-muted-foreground/50">›</span></span>
            </motion.div>
          </Link>

          <Link href="/saved-playlists">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 group-hover:text-yellow-300">
                  <Star className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-white">Saved Playlists</span>
              </div>
              <span className="text-sm text-muted-foreground flex items-center gap-1">View All <span className="text-[10px] text-muted-foreground/50">›</span></span>
            </motion.div>
          </Link>

          <Separator className="bg-white/5 my-2" />

          <Link href="/settings">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400 group-hover:text-zinc-300">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-white">Settings</span>
              </div>
              <span className="text-sm text-muted-foreground"><span className="text-[10px] text-muted-foreground/50">›</span></span>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
