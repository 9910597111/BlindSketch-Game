import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import RoomCreation from "@/pages/room-creation";
import RoomLobby from "@/pages/room-lobby";
import Game from "@/pages/game";
import GameResults from "@/pages/game-results";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-room" component={RoomCreation} />
      <Route path="/room/:id" component={RoomLobby} />
      <Route path="/game/:id" component={Game} />
      <Route path="/results/:id" component={GameResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-dark text-gray-100">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
