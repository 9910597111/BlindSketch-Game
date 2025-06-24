import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getPlayerColor(index: number): string {
  const colors = [
    'hsl(219, 78%, 62%)', // primary
    'hsl(158, 64%, 52%)', // secondary  
    'hsl(34, 100%, 62%)', // accent
    'hsl(280, 50%, 60%)', // purple
    'hsl(9, 70%, 60%)',   // red
    'hsl(200, 70%, 60%)', // cyan
    'hsl(120, 50%, 50%)', // green
    'hsl(30, 80%, 60%)',  // orange
  ];
  return colors[index % colors.length];
}

export function sanitizeMessage(message: string): string {
  return message.trim().slice(0, 200); // Limit message length
}

export function isValidUsername(username: string): boolean {
  return username.trim().length >= 2 && username.trim().length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username.trim());
}

export function getDifficultyLabel(wordLength: number): string {
  if (wordLength <= 4) return 'Easy';
  if (wordLength <= 7) return 'Medium';
  return 'Hard';
}

export function getScoreMultiplier(difficulty: string, timeRemaining: number, totalTime: number): number {
  const baseMultiplier = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 1.5 : 2;
  const timeMultiplier = timeRemaining / totalTime;
  return Math.max(0.5, baseMultiplier * timeMultiplier);
}

export function createWordDisplay(word: string, revealedPositions: number[] = []): string[] {
  return word.split('').map((letter, index) => {
    return revealedPositions.includes(index) ? letter.toUpperCase() : '_';
  });
}

export function calculatePoints(isCorrectGuess: boolean, timeRemaining: number, totalTime: number, difficulty: string): number {
  if (!isCorrectGuess) return 0;
  
  const basePoints = 100;
  const multiplier = getScoreMultiplier(difficulty, timeRemaining, totalTime);
  return Math.round(basePoints * multiplier);
}
