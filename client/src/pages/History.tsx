import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Music, Swords, Loader2 } from "lucide-react";
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

export default function History() {
  const { data: historyItems, isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <h2 className="text-xl font-bold text-white">Loading History...</h2>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
           <p className="text-red-500">Failed to load history</p>
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
            <h1 className="font-pixel text-2xl text-white mb-2">History</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Your recent analyses and battles
            </p>
          </motion.div>
        </div>

        <motion.div
          className="px-6 space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {historyItems?.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">No history yet.</div>
          ) : (
            historyItems?.map((item: any) => {
              const isBattle = item.type === 'battle';
              const Icon = isBattle ? Swords : Music;
              const bgColor = isBattle ? "bg-pink-500/10" : "bg-cyan-500/10";
              const color = isBattle ? "text-pink-400" : "text-cyan-400";
              
              return (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  variants={itemVariants}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="bg-card/30 border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-card/50 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${isBattle ? 'bg-pink-500/20 text-pink-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                          {item.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </MobileLayout>
  );
}
