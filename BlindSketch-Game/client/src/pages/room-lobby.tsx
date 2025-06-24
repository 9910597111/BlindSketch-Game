import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getPlayerColor } from "@/lib/utils";
import { X, Settings, Share, Play, Copy, Users, Trophy } from "lucide-react";
import type { Room, Player } from "@shared/schema";

export default function RoomLobby() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/room/:id");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isJoining, setIsJoining] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const { toast } = useToast();

  const roomId = params?.id;
  const username = localStorage.getItem('blindsketch_username') || '';
  const creatorId = localStorage.getItem('blindsketch_creator_id');
  const isCreator = (creatorId && room?.creatorId === creatorId) || 
                   (players.length > 0 && players[0].id === playerId);

  const { isConnected, sendMessage } = useWebSocket('/ws', (message) => {
    switch (message.type) {
      case 'room_joined':
        setRoom(message.room);
        setPlayers(message.players);
        setPlayerId(message.playerId);
        setIsJoining(false);
        break;

      case 'player_joined':
        setPlayers(prev => [...prev, message.player]);
        break;

      case 'player_left':
        setPlayers(prev => prev.filter(p => p.id !== message.playerId));
        break;

      case 'game_started':
        setLocation(`/game/${roomId}`);
        break;

      case 'system_message':
        toast({
          title: "System",
          description: message.message,
        });
        break;

      case 'error':
        toast({
          title: "Error",
          description: message.message,
          variant: "destructive",
        });
        if (message.message.includes('not found')) {
          setLocation('/');
        }
        break;
    }
  });

  useEffect(() => {
    if (!roomId || !username) {
      setLocation('/');
      return;
    }

    if (isConnected && isJoining) {
      sendMessage({
        type: 'join_room',
        roomId,
        username,
      });
    }
  }, [isConnected, roomId, username, isJoining]);

  const handleStartGame = () => {
    sendMessage({
      type: 'start_game',
    });
  };

  const handleLeaveRoom = () => {
    setLocation('/');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Room link copied to clipboard!",
    });
  };

  if (isJoining) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Joining room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Room not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Room Lobby</h2>
            <p className="text-gray-400">
              Room ID: <span className="text-accent font-mono">{roomId}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveRoom}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="bg-surface border-surface-light">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="mr-2 text-primary" />
                  Players ({players.length}/{room.maxPlayers})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="bg-surface-light rounded-lg p-4 flex items-center"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 player-avatar"
                        style={{ backgroundColor: getPlayerColor(index) }}
                      >
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{player.username}</p>
                        <p className="text-xs text-gray-400">
                          {player.id === playerId ? 'You' : 'Ready'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Room Settings & Controls */}
          <div className="space-y-6">
            {/* Room Settings */}
            <Card className="bg-surface border-surface-light">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Settings className="mr-2 text-primary" />
                  Settings
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rounds:</span>
                    <span>{room.rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span>{room.roundDuration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Word choices:</span>
                    <span>{room.wordChoices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hints:</span>
                    <span>{room.letterHints}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Room */}
            <Card className="bg-surface border-surface-light">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Share className="mr-2 text-primary" />
                  Invite Friends
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/room/${roomId}`}
                    readOnly
                    className="flex-1 bg-surface-light border-gray-600 text-sm font-mono"
                  />
                  <Button
                    onClick={handleCopyLink}
                    size="sm"
                    className="btn-primary"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Start Game (Room Creator Only) */}
            {isCreator && (
              <Button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="w-full btn-secondary py-4 text-base font-semibold"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
