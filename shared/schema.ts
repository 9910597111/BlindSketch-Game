import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull(),
  name: text("name").notNull(),
  maxPlayers: integer("max_players").notNull().default(8),
  rounds: integer("rounds").notNull().default(5),
  roundDuration: integer("round_duration").notNull().default(60),
  wordChoices: integer("word_choices").notNull().default(3),
  letterHints: integer("letter_hints").notNull().default(2),
  isPrivate: boolean("is_private").notNull().default(false),
  status: text("status").notNull().default("waiting"), // waiting, playing, finished
  currentRound: integer("current_round").notNull().default(0),
  currentDrawerId: text("current_drawer_id"),
  currentWord: text("current_word"),
  roundStartTime: timestamp("round_start_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  score: integer("score").notNull().default(0),
  isReady: boolean("is_ready").notNull().default(false),
  joinOrder: integer("join_order").notNull(),
  isOnline: boolean("is_online").notNull().default(true),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const gameStates = pgTable("game_states", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  drawingData: jsonb("drawing_data"), // Canvas drawing data
  guessedBy: text("guessed_by").array(), // Array of player IDs who guessed correctly
  hintsRevealed: integer("hints_revealed").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  playerId: text("player_id").references(() => players.id, { onDelete: "set null" }),
  username: text("username").notNull(),
  message: text("message").notNull(),
  isSystemMessage: boolean("is_system_message").notNull().default(false),
  isCorrectGuess: boolean("is_correct_guess").notNull().default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many, one }) => ({
  players: many(players),
  gameStates: many(gameStates),
  chatMessages: many(chatMessages),
}));

export const playersRelations = relations(players, ({ one }) => ({
  room: one(rooms, {
    fields: [players.roomId],
    references: [rooms.id],
  }),
}));

export const gameStatesRelations = relations(gameStates, ({ one }) => ({
  room: one(rooms, {
    fields: [gameStates.roomId],
    references: [rooms.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(rooms, {
    fields: [chatMessages.roomId],
    references: [rooms.id],
  }),
  player: one(players, {
    fields: [chatMessages.playerId],
    references: [players.id],
  }),
}));

// Insert schemas
export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  currentRound: true,
  currentDrawerId: true,
  currentWord: true,
  roundStartTime: true,
  status: true,
  creatorId: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  score: true,
  isReady: true,
  isOnline: true,
  joinedAt: true,
});

export const insertGameStateSchema = createInsertSchema(gameStates).omit({
  id: true,
  updatedAt: true,
  hintsRevealed: true,
  guessedBy: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
  isSystemMessage: true,
  isCorrectGuess: true,
});

// Types
export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type GameState = typeof gameStates.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
