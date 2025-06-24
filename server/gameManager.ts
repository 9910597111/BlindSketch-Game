import { storage } from "./storage";
import { getRandomWords } from "../client/src/lib/words";
import type { Room, Player, ChatMessage } from "@shared/schema";

export interface GameRoom {
  room: Room;
  players: Map<string, Player>;
  currentDrawer?: Player;
  wordChoices?: string[];
  selectedWord?: string;
  roundTimer?: NodeJS.Timeout;
  hintTimer?: NodeJS.Timeout;
  hintsRevealed: number;
}

export class GameManager {
  private rooms = new Map<string, GameRoom>();
  private playerConnections = new Map<string, any>(); // WebSocket connections

  addPlayerConnection(playerId: string, ws: any) {
    this.playerConnections.set(playerId, ws);
  }

  removePlayerConnection(playerId: string) {
    this.playerConnections.delete(playerId);
  }

  async createRoom(roomData: any, creatorId: string): Promise<Room> {
    const room = await storage.createRoom({
      ...roomData,
      creatorId
    });

    this.rooms.set(room.id, {
      room,
      players: new Map(),
      hintsRevealed: 0,
    });

    return room;
  }

  async joinRoom(roomId: string, playerId: string, username: string): Promise<{ success: boolean; error?: string; player?: Player }> {
    const room = await storage.getRoom(roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }

    const playerCount = await storage.getPlayerCount(roomId);
    if (playerCount >= room.maxPlayers) {
      return { success: false, error: "Room is full" };
    }

    const player = await storage.createPlayer({
      id: playerId,
      roomId,
      username,
      joinOrder: playerCount,
    });

    const gameRoom = this.rooms.get(roomId);
    if (gameRoom) {
      gameRoom.players.set(playerId, player);
    }

    this.broadcastToRoom(roomId, {
      type: "player_joined",
      player,
    });

    this.broadcastToRoom(roomId, {
      type: "system_message",
      message: `${username} joined the room`,
    });

    return { success: true, player };
  }

  async leaveRoom(playerId: string) {
    const player = await storage.getPlayer(playerId);
    if (!player) return;

    const gameRoom = this.rooms.get(player.roomId);
    if (gameRoom) {
      gameRoom.players.delete(playerId);
      
      // If this was the current drawer, skip their turn
      if (gameRoom.currentDrawer?.id === playerId) {
        await this.nextTurn(player.roomId);
      }
    }

    await storage.deletePlayer(playerId);
    this.removePlayerConnection(playerId);

    this.broadcastToRoom(player.roomId, {
      type: "player_left",
      playerId,
    });

    this.broadcastToRoom(player.roomId, {
      type: "system_message",
      message: `${player.username} left the room`,
    });
  }

  async startGame(roomId: string, requestingPlayerId: string): Promise<{ success: boolean; error?: string }> {
    const room = await storage.getRoom(roomId);
    const requestingPlayer = await storage.getPlayer(requestingPlayerId);
    
    if (!room || !requestingPlayer) {
      return { success: false, error: "Room or player not found" };
    }
    
    // Check if the requesting player is the creator by comparing with the stored creator ID
    // or if they're the first player (fallback for legacy rooms)
    const players = await storage.getPlayersByRoom(roomId);
    const isCreator = room.creatorId === requestingPlayer.id || 
                     (players.length > 0 && players[0].id === requestingPlayer.id);
    
    if (!isCreator) {
      return { success: false, error: "Only the room creator can start the game" };
    }
    if (players.length < 2) {
      return { success: false, error: "Need at least 2 players to start" };
    }

    // Initialize game state
    await storage.updateRoom(roomId, {
      status: "playing",
      currentRound: 1,
      currentDrawerId: players[0].id, // Set first player as initial drawer
      roundStartTime: new Date(),
    });

    const gameRoom = this.rooms.get(roomId);
    if (gameRoom) {
      gameRoom.room.status = "playing";
      gameRoom.room.currentRound = 1;
      gameRoom.room.currentDrawerId = players[0].id;
      gameRoom.currentDrawer = players[0];
      gameRoom.hintsRevealed = 0;
    }

    // Generate word choices for the first drawer immediately
    const wordChoices = getRandomWords(room.wordChoices);
    if (gameRoom) {
      gameRoom.wordChoices = wordChoices;
    }

    // Send word choices to the first drawer immediately
    const firstDrawerConnection = this.playerConnections.get(players[0].id);
    if (firstDrawerConnection && firstDrawerConnection.readyState === 1) {
      firstDrawerConnection.send(JSON.stringify({
        type: 'word_choices',
        words: wordChoices,
      }));
    }

    this.broadcastToRoom(roomId, {
      type: "game_started",
      drawerId: players[0].id,
      drawerName: players[0].username,
      currentRound: 1,
      totalRounds: room.rounds,
    });

    return { success: true };
  }

  async startNewTurn(roomId: string) {
    const room = await storage.getRoom(roomId);
    const players = await storage.getPlayersByRoom(roomId);
    
    if (!room || players.length === 0) return;

    // Find next drawer
    const currentDrawerIndex = players.findIndex(p => p.id === room.currentDrawerId);
    const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;
    const nextDrawer = players[nextDrawerIndex];

    // If we've completed a full round, increment round number
    if (nextDrawerIndex === 0 && room.currentDrawerId) {
      const newRoundNumber = room.currentRound + 1;
      
      if (newRoundNumber > room.rounds) {
        await this.endGame(roomId);
        return;
      }
      
      await storage.updateRoom(roomId, {
        currentRound: newRoundNumber,
      });
    }

    await storage.updateRoom(roomId, {
      currentDrawerId: nextDrawer.id,
      roundStartTime: new Date(),
      currentWord: null,
    });

    const gameRoom = this.rooms.get(roomId);
    if (gameRoom) {
      gameRoom.currentDrawer = nextDrawer;
      gameRoom.hintsRevealed = 0;
      gameRoom.selectedWord = undefined;
      gameRoom.room.currentDrawerId = nextDrawer.id;
      
      // Clear previous timers
      if (gameRoom.roundTimer) clearTimeout(gameRoom.roundTimer);
      if (gameRoom.hintTimer) clearTimeout(gameRoom.hintTimer);
    }

    // Clear canvas for new turn
    await storage.createOrUpdateGameState({
      roomId,
      drawingData: { strokes: [] },
    });

    // Generate word choices for the drawer
    const wordChoices = getRandomWords(room.wordChoices);
    
    if (gameRoom) {
      gameRoom.wordChoices = wordChoices;
    }

    // Send word choices only to the drawer
    const drawerConnection = this.playerConnections.get(nextDrawer.id);
    if (drawerConnection) {
      drawerConnection.send(JSON.stringify({
        type: "word_choices",
        words: wordChoices,
      }));
    }

    this.broadcastToRoom(roomId, {
      type: "new_turn",
      drawerId: nextDrawer.id,
      drawerName: nextDrawer.username,
      roundDuration: room.roundDuration,
      currentRound: room.currentRound,
      totalRounds: room.rounds,
    });

    // Start turn timeout timer
    if (gameRoom) {
      gameRoom.roundTimer = setTimeout(() => {
        this.handleTurnTimeout(roomId);
      }, room.roundDuration * 1000);
    }
  }

  async handleTurnTimeout(roomId: string) {
    const room = await storage.getRoom(roomId);
    if (!room || !room.currentWord) {
      // If no word was selected, just move to next turn
      await this.nextTurn(roomId);
      return;
    }

    this.broadcastToRoom(roomId, {
      type: 'turn_timeout',
      word: room.currentWord,
      message: 'Time is up! The word was: ' + room.currentWord,
    });

    // Add system message about timeout
    await storage.createChatMessage({
      roomId,
      playerId: null,
      username: 'System',
      message: `Time's up! The word was: ${room.currentWord}`,
      isSystemMessage: true,
      isCorrectGuess: false,
    });

    // Wait a moment then move to next turn
    setTimeout(() => {
      this.nextTurn(roomId);
    }, 3000);
  }

  async selectWord(playerId: string, word: string) {
    const player = await storage.getPlayer(playerId);
    if (!player) return;

    const room = await storage.getRoom(player.roomId);
    if (!room || room.currentDrawerId !== playerId) return;

    await storage.updateRoom(player.roomId, {
      currentWord: word,
      roundStartTime: new Date(),
    });

    const gameRoom = this.rooms.get(player.roomId);
    if (gameRoom) {
      gameRoom.selectedWord = word;
      gameRoom.room.currentWord = word;
      
      // Start round timer
      gameRoom.roundTimer = setTimeout(() => {
        this.nextTurn(player.roomId);
      }, room.roundDuration * 1000);

      // Start hint timer
      this.scheduleNextHint(player.roomId);
    }

    // Clear canvas
    await storage.createOrUpdateGameState({
      roomId: player.roomId,
      drawingData: null,
    });

    // Create word display with underscores
    const wordDisplay = word.split('').map(() => '_');

    this.broadcastToRoom(player.roomId, {
      type: "word_selected",
      wordLength: word.length,
      wordDisplay,
      category: "General",
      timeRemaining: room.roundDuration,
    });
  }

  scheduleNextHint(roomId: string) {
    const gameRoom = this.rooms.get(roomId);
    const room = gameRoom?.room;
    
    if (!gameRoom || !room || !room.currentWord) return;

    const hintInterval = (room.roundDuration * 1000) / (room.letterHints + 1);
    
    gameRoom.hintTimer = setTimeout(() => {
      if (gameRoom.hintsRevealed < room.letterHints) {
        gameRoom.hintsRevealed++;
        
        const word = room.currentWord!;
        const hintPositions = this.getHintPositions(word, gameRoom.hintsRevealed);
        
        // Update game state with hints
        storage.createOrUpdateGameState({
          roomId,
          hintsRevealed: gameRoom.hintsRevealed,
        });
        
        // Create word display with revealed hints
        const wordDisplay = word.split('').map((letter, index) => {
          return hintPositions.includes(index) ? letter.toUpperCase() : '_';
        });
        
        this.broadcastToRoom(roomId, {
          type: "hint_revealed",
          hintPositions,
          hintsRevealed: gameRoom.hintsRevealed,
          wordDisplay,
          totalHints: room.letterHints,
        });

        // Schedule next hint
        if (gameRoom.hintsRevealed < room.letterHints) {
          this.scheduleNextHint(roomId);
        }
      }
    }, hintInterval);
  }

  getHintPositions(word: string, hintsCount: number): number[] {
    const positions: number[] = [];
    const wordLength = word.length;
    
    if (hintsCount >= wordLength) {
      // If we want more hints than letters, reveal all
      return Array.from({ length: wordLength }, (_, i) => i);
    }
    
    // Distribute hints evenly across the word
    for (let i = 0; i < hintsCount; i++) {
      let pos;
      if (hintsCount === 1) {
        // Single hint: reveal first letter
        pos = 0;
      } else {
        // Multiple hints: distribute evenly
        pos = Math.floor((i * wordLength) / hintsCount);
      }
      
      // Ensure we don't duplicate positions
      while (positions.includes(pos) && pos < wordLength - 1) {
        pos++;
      }
      
      if (pos < wordLength && !positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    return positions.sort((a, b) => a - b);
  }

  async handleGuess(playerId: string, guess: string): Promise<{ isCorrect: boolean; points?: number }> {
    const player = await storage.getPlayer(playerId);
    if (!player) return { isCorrect: false };

    const room = await storage.getRoom(player.roomId);
    if (!room || !room.currentWord || room.currentDrawerId === playerId) {
      return { isCorrect: false };
    }

    const isCorrect = guess.toLowerCase().trim() === room.currentWord.toLowerCase();
    
    if (isCorrect) {
      // Award points
      const guesserPoints = 100;
      const drawerPoints = 50;
      
      await storage.updatePlayer(playerId, {
        score: player.score + guesserPoints,
      });

      if (room.currentDrawerId) {
        const drawer = await storage.getPlayer(room.currentDrawerId);
        if (drawer) {
          await storage.updatePlayer(room.currentDrawerId, {
            score: drawer.score + drawerPoints,
          });
        }
      }

      // Add system message
      await storage.createChatMessage({
        roomId: player.roomId,
        playerId: null,
        username: "System",
        message: `${player.username} guessed the word!`,
        isSystemMessage: true,
        isCorrectGuess: true,
      });

      this.broadcastToRoom(player.roomId, {
        type: "correct_guess",
        playerId,
        playerName: player.username,
        word: room.currentWord,
        points: guesserPoints,
      });

      // Move to next turn after a short delay
      setTimeout(() => {
        this.nextTurn(player.roomId);
      }, 3000);

      return { isCorrect: true, points: guesserPoints };
    }

    return { isCorrect: false };
  }

  async nextTurn(roomId: string) {
    const gameRoom = this.rooms.get(roomId);
    if (gameRoom) {
      if (gameRoom.roundTimer) clearTimeout(gameRoom.roundTimer);
      if (gameRoom.hintTimer) clearTimeout(gameRoom.hintTimer);
    }

    await this.startNewTurn(roomId);
  }

  async endGame(roomId: string) {
    const players = await storage.getPlayersByRoom(roomId);
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

    await storage.updateRoom(roomId, {
      status: "finished",
    });

    this.broadcastToRoom(roomId, {
      type: "game_ended",
      finalScores: sortedPlayers,
      winner: sortedPlayers[0],
    });
  }

  async updateDrawing(playerId: string, drawingData: any) {
    const player = await storage.getPlayer(playerId);
    if (!player) return;

    const room = await storage.getRoom(player.roomId);
    if (!room || room.currentDrawerId !== playerId) return;

    await storage.createOrUpdateGameState({
      roomId: player.roomId,
      drawingData,
    });

    // Broadcast to all players except the drawer
    this.broadcastToRoom(player.roomId, {
      type: "drawing_update",
      drawingData,
    }, [playerId]);
  }

  broadcastToRoom(roomId: string, message: any, excludePlayerIds: string[] = []) {
    const gameRoom = this.rooms.get(roomId);
    if (!gameRoom) return;

    for (const [playerId, player] of gameRoom.players) {
      if (excludePlayerIds.includes(playerId)) continue;
      
      const connection = this.playerConnections.get(playerId);
      if (connection && connection.readyState === 1) { // WebSocket.OPEN
        connection.send(JSON.stringify(message));
      }
    }
  }

  async getRoomData(roomId: string) {
    const room = await storage.getRoom(roomId);
    const players = await storage.getPlayersByRoom(roomId);
    const gameState = await storage.getGameState(roomId);
    const chatMessages = await storage.getChatMessages(roomId, 50);

    return {
      room,
      players,
      gameState,
      chatMessages: chatMessages.reverse(), // Reverse to get chronological order
    };
  }
}

export const gameManager = new GameManager();
