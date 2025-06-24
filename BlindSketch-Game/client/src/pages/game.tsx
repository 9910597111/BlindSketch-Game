import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Canvas } from "@/components/canvas";
import { Chat } from "@/components/chat";
import { Scoreboard } from "@/components/scoreboard";
import { WordSelectionModal } from "@/components/word-selection-modal";
import { Button } from "@/components/ui/button";
import { createWordDisplay } from "@/lib/utils";
import { Clock, X, Users } from "lucide-react";
import type { Room, Player, ChatMessage } from "@shared/schema";

export default function Game() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/game/:id");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [wordDisplay, setWordDisplay] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [hintsRevealed, setHintsRevealed] = useState<number[]>([]);
  const [drawingData, setDrawingData] = useState<any>({ strokes: [] });
  const [currentStroke, setCurrentStroke] = useState<any[]>([]);
  const { toast } = useToast();

  const roomId = params?.id;
  const username = localStorage.getItem('blindsketch_username') || '';
  const currentPlayer = players.find(p => p.id === playerId);
  const currentDrawer = players.find(p => p.id === room?.currentDrawerId);
  const isCurrentDrawer = playerId === room?.currentDrawerId;

  const { isConnected, sendMessage } = useWebSocket('/ws', (message) => {
    switch (message.type) {
      case 'room_joined':
        setRoom(message.room);
        setPlayers(message.players);
        setPlayerId(message.playerId);
        setChatMessages(message.chatMessages || []);
        if (message.gameState?.drawingData) {
          setDrawingData(message.gameState.drawingData);
        }
        break;

      case 'game_started':
        setCurrentWord("");
        setWordDisplay([]);
        setHintsRevealed([]);
        setDrawingData({ strokes: [] });
        setTimeRemaining(room?.roundDuration || 60);
        // Update room data with game state
        if (room) {
          setRoom({
            ...room,
            status: 'playing',
            currentRound: message.currentRound,
            currentDrawerId: message.drawerId,
          });
        }
        toast({
          title: "Game Started!",
          description: `${message.drawerName} starts drawing! Round ${message.currentRound}/${message.totalRounds}`,
        });
        break;

      case 'word_choices':
        setWordChoices(message.words);
        setShowWordSelection(true);
        break;

      case 'new_turn':
        setCurrentWord("");
        setWordDisplay([]);
        setHintsRevealed([]);
        setDrawingData({ strokes: [] });
        setTimeRemaining(message.roundDuration || room?.roundDuration || 60);
        // Update room data to reflect current round
        if (room) {
          setRoom({
            ...room,
            currentRound: message.currentRound,
            currentDrawerId: message.drawerId,
          });
        }
        toast({
          title: "New Turn",
          description: `${message.drawerName} is now drawing! Round ${message.currentRound}/${message.totalRounds}`,
        });
        break;

      case 'turn_timeout':
        toast({
          title: "Time's Up!",
          description: message.message,
          variant: "destructive",
        });
        setCurrentWord(message.word);
        setWordDisplay(createWordDisplay(message.word, Array.from({length: message.word.length}, (_, i) => i)));
        break;

      case 'round_complete':
        // Update room data to reflect the new round
        if (room) {
          setRoom({
            ...room,
            currentRound: message.currentRound,
          });
        }
        toast({
          title: "Round Complete!",
          description: `Round ${message.currentRound - 1} finished. Starting round ${message.currentRound}/${message.totalRounds}`,
        });
        break;

      case 'word_selected':
        setCurrentWord("*".repeat(message.wordLength));
        setWordDisplay(message.wordDisplay || createWordDisplay("*".repeat(message.wordLength)));
        setTimeRemaining(message.timeRemaining || room?.roundDuration || 60);
        setHintsRevealed([]);
        setDrawingData({ strokes: [] });
        break;

      case 'hint_revealed':
        setHintsRevealed(message.hintPositions);
        setWordDisplay(message.wordDisplay || wordDisplay);
        toast({
          title: "Hint Revealed!",
          description: `Hint ${message.hintsRevealed}/${message.totalHints} revealed`,
        });
        break;

      case 'drawing_update':
        if (message.drawingData) {
          setDrawingData(message.drawingData);
        }
        break;

      case 'chat_message':
        setChatMessages(prev => [...prev, message.message]);
        break;

      case 'correct_guess':
        toast({
          title: "Correct Guess!",
          description: `${message.playerName} guessed the word: ${message.word}`,
        });
        setCurrentWord(message.word);
        setWordDisplay(createWordDisplay(message.word, Array.from({length: message.word.length}, (_, i) => i)));
        break;

      case 'game_ended':
        setLocation(`/results/${roomId}`);
        break;

      case 'system_message':
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          roomId: roomId!,
          playerId: null,
          username: "System",
          message: message.message,
          isSystemMessage: true,
          isCorrectGuess: false,
          timestamp: new Date(),
        }]);
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

  useEffect(() => {
    if (timeRemaining > 0 && room?.status === 'playing' && currentWord) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, room?.status, currentWord]);

  const handleWordSelect = (word: string) => {
    sendMessage({
      type: 'select_word',
      word,
    });
    setShowWordSelection(false);
  };

  const handleDrawingUpdate = (strokeData: any) => {
    if (strokeData.type === 'start_stroke') {
      // Start new stroke
      setCurrentStroke([{
        color: strokeData.color,
        size: strokeData.size,
        points: strokeData.points,
        id: Date.now(),
      }]);
    } else if (strokeData.type === 'continue_stroke') {
      // Continue current stroke
      setCurrentStroke(prev => {
        if (prev.length > 0) {
          const updated = [...prev];
          updated[0].points.push(...strokeData.points);
          return updated;
        }
        return prev;
      });
    } else if (strokeData.type === 'end_stroke') {
      // Finish stroke and add to drawing data
      if (currentStroke.length > 0) {
        const newStrokes = [...(drawingData.strokes || []), ...currentStroke];
        const updatedDrawingData = { strokes: newStrokes };
        
        setDrawingData(updatedDrawingData);
        setCurrentStroke([]);
        
        sendMessage({
          type: 'drawing_update',
          drawingData: updatedDrawingData,
        });
      }
    } else if (strokeData.type === 'clear') {
      const clearedData = { strokes: [] };
      setDrawingData(clearedData);
      setCurrentStroke([]);
      sendMessage({
        type: 'drawing_update',
        drawingData: clearedData,
      });
    }
  };

  const handleChatMessage = (message: string) => {
    sendMessage({
      type: 'chat_message',
      message,
    });
  };

  const handleLeaveGame = () => {
    setLocation('/');
  };

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Game Header */}
      <div className="bg-surface border-b border-gray-600 px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold">BlindSketch</h2>
            <div className="text-sm text-gray-400">
              Round <span className="text-white">{room?.currentRound || 1}</span> of{" "}
              <span className="text-white">{room?.rounds || 5}</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className={`text-accent ${timeRemaining <= 10 ? 'timer-urgent' : ''}`} />
              <span className={`text-xl font-bold text-accent ${timeRemaining <= 10 ? 'timer-urgent' : ''}`}>
                {timeRemaining}
              </span>
            </div>

            {/* Current Turn */}
            <div className="text-sm">
              <span className="text-gray-400">Drawing:</span>
              <span className="text-primary font-medium ml-1">
                {currentDrawer?.username || 'None'}
              </span>
            </div>

            {/* Leave Game */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveGame}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Main Game Area */}
        <div className="flex-1 p-8">
          {/* Word Display Area */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center space-x-2 text-3xl font-bold tracking-wider">
              {wordDisplay.map((letter, index) => (
                <span
                  key={index}
                  className={`word-letter ${letter !== '_' ? 'revealed' : ''}`}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-gray-400 mt-2">Category: General</p>
          </div>

          {/* Drawing Canvas */}
          <Canvas
            isDrawing={isCurrentDrawer}
            drawingData={drawingData}
            onDrawingUpdate={handleDrawingUpdate}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-surface border-l border-gray-600 flex flex-col">
          {/* Scoreboard */}
          <Scoreboard players={players} currentDrawerId={room.currentDrawerId} />

          {/* Chat */}
          <Chat
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            disabled={isCurrentDrawer}
          />
        </div>
      </div>

      {/* Word Selection Modal */}
      <WordSelectionModal
        isOpen={showWordSelection}
        words={wordChoices}
        onSelectWord={handleWordSelect}
      />
    </div>
  );
}
