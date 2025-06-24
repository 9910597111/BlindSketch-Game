import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { gameManager } from "./gameManager";
import { storage } from "./storage";
import { insertRoomSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    let playerId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'join_room':
            const { roomId, username } = message;
            playerId = nanoid();
            
            const joinResult = await gameManager.joinRoom(roomId, playerId, username);
            
            if (joinResult.success) {
              gameManager.addPlayerConnection(playerId, ws);
              
              // Send room data to the new player
              const roomData = await gameManager.getRoomData(roomId);
              ws.send(JSON.stringify({
                type: 'room_joined',
                playerId,
                ...roomData,
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                message: joinResult.error,
              }));
            }
            break;

          case 'start_game':
            if (playerId) {
              const player = await storage.getPlayer(playerId);
              if (player) {
                const result = await gameManager.startGame(player.roomId, playerId);
                if (!result.success) {
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: result.error,
                  }));
                }
              }
            }
            break;

          case 'select_word':
            if (playerId) {
              await gameManager.selectWord(playerId, message.word);
            }
            break;

          case 'drawing_update':
            if (playerId && message.drawingData) {
              await gameManager.updateDrawing(playerId, message.drawingData);
            }
            break;

          case 'chat_message':
            if (playerId) {
              const player = await storage.getPlayer(playerId);
              if (player) {
                // Check if it's a guess
                const guessResult = await gameManager.handleGuess(playerId, message.message);
                
                if (!guessResult.isCorrect) {
                  // Save regular chat message
                  const chatMessage = await storage.createChatMessage({
                    roomId: player.roomId,
                    playerId,
                    username: player.username,
                    message: message.message,
                  });

                  gameManager.broadcastToRoom(player.roomId, {
                    type: 'chat_message',
                    message: chatMessage,
                  });
                }
              }
            }
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed', playerId);
      if (playerId) {
        gameManager.leaveRoom(playerId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established'
    }));
  });

  // REST API routes
  app.post('/api/rooms', async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const roomId = nanoid(8);
      const creatorId = nanoid();

      const room = await gameManager.createRoom({
        ...roomData,
        id: roomId,
      }, creatorId);

      res.json({ room, creatorId });
    } catch (error) {
      console.error('Create room error:', error);
      res.status(400).json({ error: 'Invalid room data' });
    }
  });

  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const roomId = req.params.id;
      const roomData = await gameManager.getRoomData(roomId);

      if (!roomData.room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json(roomData);
    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({ error: 'Failed to get room data' });
    }
  });

  app.get('/api/rooms/random/join', async (req, res) => {
    try {
      const room = await storage.getRandomRoom();
      
      if (!room) {
        return res.status(404).json({ error: 'No available rooms' });
      }

      const roomData = await gameManager.getRoomData(room.id);
      res.json(roomData);
    } catch (error) {
      console.error('Get random room error:', error);
      res.status(500).json({ error: 'Failed to find random room' });
    }
  });

  return httpServer;
}
