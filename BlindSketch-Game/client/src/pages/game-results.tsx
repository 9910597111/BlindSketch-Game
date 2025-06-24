import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getPlayerColor } from "@/lib/utils";
import { Trophy, RotateCcw, Home, Crown } from "lucide-react";
import type { Player } from "@shared/schema";

export default function GameResults() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/results/:id");
  const [finalScores, setFinalScores] = useState<Player[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const { toast } = useToast();

  const roomId = params?.id;
  const username = localStorage.getItem('blindsketch_username') || '';
  const creatorId = localStorage.getItem('blindsketch_creator_id');

  const { isConnected, sendMessage } = useWebSocket('/ws', (message) => {
    switch (message.type) {
      case 'room_joined':
        setPlayerId(message.playerId);
        break;

      case 'game_ended':
        setFinalScores(message.finalScores);
        setWinner(message.winner);
        break;

      case 'game_started':
        setLocation(`/game/${roomId}`);
        break;

      case 'error':
        toast({
          title: "Error",
          description: message.message,
          variant: "destructive",
        });
        break;
    }
  });

  useEffect(() => {
    if (!roomId || !username) {
      setLocation('/');
      return;
    }

    if (isConnected && !playerId) {
      sendMessage({
        type: 'join_room',
        roomId,
        username,
      });
    }
  }, [isConnected, roomId, username, playerId]);

  const handlePlayAgain = () => {
    sendMessage({
      type: 'start_game',
    });
  };

  const handleBackToMenu = () => {
    setLocation('/');
  };

  const isCreator = creatorId && playerId === creatorId;

  return (
    <div className="min-h-screen bg-dark p-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Winner Announcement */}
        <div className="mb-8">
          <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-2">Game Complete!</h2>
          {winner && (
            <p className="text-xl text-gray-400">
              Winner:{" "}
              <span className="text-accent font-semibold">{winner.username}</span>
            </p>
          )}
        </div>

        {/* Final Scoreboard */}
        <Card className="bg-surface border-surface-light mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-semibold mb-6">Final Scores</h3>
            <div className="space-y-4">
              {finalScores.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-surface-light rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="text-2xl font-bold text-accent mr-4">
                      #{index + 1}
                    </div>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 player-avatar"
                      style={{ backgroundColor: getPlayerColor(index) }}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xl font-medium">{player.username}</span>
                    {index === 0 && (
                      <Crown className="text-accent ml-2 h-6 w-6" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {player.score}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {isCreator && (
            <Button
              onClick={handlePlayAgain}
              className="btn-secondary py-3 px-8 text-base font-semibold"
              size="lg"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Play Again
            </Button>
          )}
          <Button
            onClick={handleBackToMenu}
            variant="outline"
            className="btn-surface py-3 px-8 text-base font-semibold border-gray-600"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
