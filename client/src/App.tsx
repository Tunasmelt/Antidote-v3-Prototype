import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Analysis from "@/pages/Analysis";
import Battle from "@/pages/Battle";
import Profile from "@/pages/Profile";
import MusicDecisionAssistant from "@/pages/MusicDecisionAssistant";
import History from "@/pages/History";
import SavedPlaylists from "@/pages/SavedPlaylists";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/battle" component={Battle} />
      <Route path="/profile" component={Profile} />
      <Route path="/music-assistant" component={MusicDecisionAssistant} />
      <Route path="/history" component={History} />
      <Route path="/saved-playlists" component={SavedPlaylists} />
      <Route path="/settings" component={Settings} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
