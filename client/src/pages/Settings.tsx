import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, User, Bell, Lock, Palette, Smartphone, Globe, LogOut, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
  },
};

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [haptic, setHaptic] = useState(false);

  useEffect(() => {
    const savedNotifications = localStorage.getItem("settings_notifications");
    const savedDarkMode = localStorage.getItem("settings_darkMode");
    const savedHaptic = localStorage.getItem("settings_haptic");

    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
    if (savedHaptic !== null) setHaptic(JSON.parse(savedHaptic));
  }, []);

  const updateSetting = (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    localStorage.setItem(`settings_${key}`, JSON.stringify(value));
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: Globe, label: "Connected Accounts", type: "link", value: "Spotify" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: Bell, 
          label: "Notifications", 
          type: "switch", 
          value: notifications, 
          onChange: (v: boolean) => updateSetting("notifications", v, setNotifications) 
        },
        { 
          icon: Palette, 
          label: "Dark Mode", 
          type: "switch", 
          value: darkMode, 
          onChange: (v: boolean) => updateSetting("darkMode", v, setDarkMode) 
        },
        { 
          icon: Smartphone, 
          label: "Haptic Feedback", 
          type: "switch", 
          value: haptic, 
          onChange: (v: boolean) => updateSetting("haptic", v, setHaptic) 
        },
      ]
    },
  ];

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
            <h1 className="font-pixel text-2xl text-white mb-2">Settings</h1>
            <p className="text-xs text-muted-foreground font-mono">
              Manage your preferences
            </p>
          </motion.div>
        </div>

        <motion.div
          className="px-6 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={itemIndex}
                      variants={itemVariants}
                      className="bg-card/30 border border-white/5 rounded-xl p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-white">{item.label}</span>
                      </div>
                      
                      {item.type === 'switch' ? (
                        <Switch 
                          checked={item.value as boolean} 
                          onCheckedChange={(item as any).onChange}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {item.value && <span className="text-xs text-muted-foreground">{item.value}</span>}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          <motion.div variants={itemVariants} className="pt-4">
             <Button variant="destructive" className="w-full h-12 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20">
               <LogOut className="w-4 h-4 mr-2" /> Log Out
             </Button>
             <p className="text-[10px] text-center text-muted-foreground mt-4 font-mono">
               Antidote v3.0.0 (Build 2025)
             </p>
          </motion.div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
