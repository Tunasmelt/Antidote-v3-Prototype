import React from "react";
import { Link, useLocation } from "wouter";
import { Home, BarChart2, Swords, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  const tabs = [
    { icon: Home, label: "Home", href: "/" },
    { icon: BarChart2, label: "Analysis", href: "/analysis" },
    { icon: Swords, label: "Battle", href: "/battle" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
      {/* Phone Frame */}
      <div className="w-full max-w-[400px] h-[850px] bg-background rounded-[40px] overflow-hidden relative shadow-2xl border-[8px] border-zinc-900 flex flex-col">
        
        {/* Status Bar Mockup */}
        <div className="h-12 w-full bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-6 absolute top-0 left-0 right-0">
          <span className="text-xs font-mono text-muted-foreground">9:41</span>
          <div className="w-20 h-6 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex gap-1">
             <div className="w-4 h-4 rounded-full bg-primary/20" />
             <div className="w-4 h-4 rounded-full bg-primary/20" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-12 pb-20 custom-scrollbar relative">
          {children}
        </div>

        {/* Bottom Tab Bar */}
        <nav className="h-20 bg-background/80 backdrop-blur-xl border-t border-white/10 absolute bottom-0 left-0 right-0 flex items-center justify-around pb-4 px-2 z-50">
          {tabs.map((tab) => {
            const isActive = location === tab.href;
            const Icon = tab.icon;
            return (
              <Link key={tab.label} href={tab.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(isActive && "drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]")} 
                  />
                  <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50" />
      </div>
    </div>
  );
}
