import { rooms, players, gameStates, chatMessages, type Room, type Player, type GameState, type ChatMessage, type InsertRoom, type InsertPlayer, type InsertGameState, type InsertChatMessage } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom & { id: string; creatorId: string }): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<void>;
  getRandomRoom(): Promise<Room | undefined>;

  // Player operations
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayersByRoom(roomId: string): Promise<Player[]>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<void>;
  getPlayerCount(roomId: string): Promise<number>;

  // Game state operations
  createOrUpdateGameState(gameState: InsertGameState): Promise<GameState>;
  getGameState(roomId: string): Promise<GameState | undefined>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
}

export class DatabaseStorage implements IStorage {
  async createRoom(insertRoom: InsertRoom & { id: string; creatorId: string }): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set(updates)
      .where(eq(rooms.id, id))
      .returning();
    return room || undefined;
  }

  async deleteRoom(id: string): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  async getRandomRoom(): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.isPrivate, false), eq(rooms.status, "waiting")))
      .limit(1);
    return room || undefined;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    return player;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayersByRoom(roomId: string): Promise<Player[]> {
    return await db
      .select()
      .from(players)
      .where(eq(players.roomId, roomId))
      .orderBy(players.joinOrder);
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async deletePlayer(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  async getPlayerCount(roomId: string): Promise<number> {
    const result = await db
      .select({ count: players.id })
      .from(players)
      .where(eq(players.roomId, roomId));
    return result.length;
  }

  async createOrUpdateGameState(insertGameState: InsertGameState): Promise<GameState> {
    const existing = await this.getGameState(insertGameState.roomId);
    
    if (existing) {
      const [gameState] = await db
        .update(gameStates)
        .set({ ...insertGameState, updatedAt: new Date() })
        .where(eq(gameStates.roomId, insertGameState.roomId))
        .returning();
      return gameState;
    } else {
      const [gameState] = await db
        .insert(gameStates)
        .values(insertGameState)
        .returning();
      return gameState;
    }
  }

  async getGameState(roomId: string): Promise<GameState | undefined> {
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.roomId, roomId));
    return gameState || undefined;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
