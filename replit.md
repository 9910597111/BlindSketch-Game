# replit.md

## Overview

This is a real-time multiplayer drawing and guessing game called "BlindSketch". Players take turns drawing words while others guess what's being drawn. The unique twist is that drawers cannot see their own drawings, making the game more challenging and entertaining.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: React hooks with TanStack Query for server state
- **Real-time Communication**: WebSocket connection for live game updates
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **WebSocket**: ws library for real-time bidirectional communication
- **Session Management**: In-memory game state management with WebSocket connections

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Game Management System
- **GameManager**: Central coordinator for game rooms and player state
- **Storage Layer**: Database abstraction with operations for rooms, players, game states, and chat
- **Real-time Engine**: WebSocket-based communication for live drawing, chat, and game events

### Drawing Canvas
- **HTML5 Canvas**: Custom drawing implementation with brush tools and color selection
- **Real-time Sync**: Drawing data transmitted via WebSocket to all players
- **Blind Drawing**: Drawer cannot see their own canvas while drawing

### Game Flow
1. **Room Creation/Joining**: Players create private rooms or join random public rooms
2. **Lobby Phase**: Players wait for game start, configurable game settings
3. **Drawing Rounds**: Sequential turns where one player draws while others guess
4. **Scoring System**: Points awarded based on correct guesses and drawing difficulty
5. **Game Results**: Final scores and winner announcement

### Database Schema
- **Rooms**: Game room configuration and state
- **Players**: User information and scores within rooms
- **Game States**: Canvas drawing data and game progress
- **Chat Messages**: In-game communication history

## Data Flow

### Real-time Game Updates
1. Client actions (drawing, chat, game controls) sent via WebSocket
2. Server validates and updates game state
3. Server broadcasts updates to all connected players in the room
4. Clients update UI based on received messages

### Drawing Synchronization
1. Drawer creates strokes on canvas
2. Drawing data sent to server in real-time
3. Server stores drawing state and broadcasts to other players
4. Non-drawing players see live drawing updates
5. Drawer's canvas remains hidden during their turn

### Game State Management
- Server maintains authoritative game state
- Player connections tracked via WebSocket sessions
- Automatic cleanup when players disconnect
- Round progression managed server-side with timers

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Radix UI primitives for accessible components
- Wouter for lightweight routing
- Tailwind CSS for styling

### Backend Dependencies
- Express.js for HTTP server
- WebSocket (ws) library for real-time communication
- Drizzle ORM for database operations
- Neon serverless PostgreSQL driver

### Development Tools
- Vite for build tooling and development server
- TypeScript for type safety
- ESBuild for server bundling
- TSX for TypeScript execution

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to static files
- Backend: ESBuild bundles server code with external dependencies
- Single deployment artifact with both client and server

### Environment Configuration
- Database URL configured via environment variables
- WebSocket connections support both local and production environments
- Replit-specific configuration for hosting and development

### Scaling Considerations
- Stateful WebSocket connections limit horizontal scaling
- Game state stored in memory requires sticky sessions
- Database operations optimized for real-time performance

## Recent Changes

**June 24, 2025 - Enhancement Updates:**
- Added room ID input field to main menu for direct room joining
- Fixed authorization bug preventing room creators from starting games
- Updated text color styling to ensure white text throughout the application
- Improved creator validation logic with fallback for first player in room
- Enhanced home page with three joining options: create room, random join, or direct room ID

## User Preferences

Preferred communication style: Simple, everyday language.