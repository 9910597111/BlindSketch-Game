CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"player_id" text,
	"username" text NOT NULL,
	"message" text NOT NULL,
	"is_system_message" boolean DEFAULT false NOT NULL,
	"is_correct_guess" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"drawing_data" jsonb,
	"guessed_by" text[],
	"hints_revealed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"username" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"join_order" integer NOT NULL,
	"is_online" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"name" text NOT NULL,
	"max_players" integer DEFAULT 8 NOT NULL,
	"rounds" integer DEFAULT 5 NOT NULL,
	"round_duration" integer DEFAULT 60 NOT NULL,
	"word_choices" integer DEFAULT 3 NOT NULL,
	"letter_hints" integer DEFAULT 2 NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"current_drawer_id" text,
	"current_word" text,
	"round_start_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_states" ADD CONSTRAINT "game_states_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;