import React, { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Music, ArrowRight } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/profile");
    }, 1500);
  };

  return (
    <MobileLayout>
      <div className="min-h-full flex flex-col justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] rounded-full bg-purple-600/20 blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full bg-cyan-600/20 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-pixel text-3xl text-white mb-2 tracking-wide">ANTIDOTE</h1>
          <p className="text-sm text-muted-foreground">Cure your music fatigue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 border border-white/10">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="hello@example.com" 
                    className="bg-white/5 border-white/10 focus:border-cyan-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-white/5 border-white/10 focus:border-cyan-500/50"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log In"}
                </Button>
                
                <div className="text-center mt-4">
                   <Link href="#" className="text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
                     Forgot your password?
                   </Link>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="hello@example.com" 
                    className="bg-white/5 border-white/10 focus:border-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="Create a password" 
                    className="bg-white/5 border-white/10 focus:border-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm your password" 
                    className="bg-white/5 border-white/10 focus:border-purple-500/50"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold rounded-lg mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
             <div className="relative">
               <div className="absolute inset-0 flex items-center">
                 <span className="w-full border-t border-white/10" />
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-[#0a0a0a] px-2 text-muted-foreground">Or continue with</span>
               </div>
             </div>

             <Button variant="outline" className="w-full mt-6 border-white/10 hover:bg-white/5 h-12">
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.512 17.272c-.22.355-.67.47-1.025.253-2.81-1.716-6.348-2.103-10.513-1.15-.395.09-.79-.16-.88-.556-.09-.395.16-.79.556-.88 4.568-1.045 8.527-.585 11.604 1.298.354.217.47.67.252 1.025zm1.36-3.023c-.276.45-.86.59-1.31.314-3.3-2.03-8.327-2.617-12.23-1.417-.495.152-1.016-.13-1.168-.625-.152-.495.13-1.016.625-1.168 4.473-1.375 10.096-.723 13.91 1.62.45.276.59.86.315 1.31zm.126-3.195c-3.96-2.35-10.493-2.567-14.275-1.418-.602.183-1.235-.157-1.418-.758-.183-.602.157-1.235.758-1.418 4.38-1.328 11.65-1.08 16.2 1.62.535.318.708 1.008.39 1.542-.318.535-1.008.708-1.543.39z"/>
               </svg>
               Continue with Spotify
             </Button>
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
