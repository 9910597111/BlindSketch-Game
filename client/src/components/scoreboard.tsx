import { ScrollArea } from '@/components/ui/scroll-area';
import { getPlayerColor } from '@/lib/utils';
import { Trophy, Pencil } from 'lucide-react';
import type { Player } from '@shared/schema';

interface ScoreboardProps {
  players: Player[];
  currentDrawerId?: string | null;
}

export function Scoreboard({ players, currentDrawerId }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="p-4 border-b border-gray-600">
      <h3 className="font-semibold mb-3 flex items-center">
        <Trophy className="mr-2 text-accent h-5 w-5" />
        Scoreboard
      </h3>
      <ScrollArea className="max-h-32">
        <div className="space-y-2">
          {sortedPlayers.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <Trophy className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No players yet</p>
            </div>
          ) : (
            sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex justify-between items-center text-sm slide-in"
              >
                <div className="flex items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2 player-avatar text-xs"
                    style={{ backgroundColor: getPlayerColor(index) }}
                  >
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-24" title={player.username}>
                    {player.username}
                  </span>
                  {player.id === currentDrawerId && (
                    <Pencil className="ml-1 h-3 w-3 text-primary drawing-indicator" />
                  )}
                </div>
                <span className="font-bold text-accent">{player.score}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
