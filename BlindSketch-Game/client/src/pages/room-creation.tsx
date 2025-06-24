import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";

export default function RoomCreation() {
  const [location, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 5,
    roundDuration: 60,
    wordChoices: 3,
    letterHints: 2,
  });

  const handleCreateRoom = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${localStorage.getItem('blindsketch_username')}'s Room`,
          isPrivate: true,
          ...settings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('blindsketch_creator_id', data.creatorId);
        setLocation(`/room/${data.room.id}`);
      } else {
        throw new Error('Failed to create room');
      }
    } catch (error) {
      toast({
        title: "Failed to Create Room",
        description: "There was an error creating your room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateSetting = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-dark p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="text-gray-400 hover:text-white mr-4 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-bold text-white">Create Private Room</h2>
        </div>

        <Card className="bg-surface border-surface-light">
          <CardContent className="p-6 space-y-6">
            {/* Room Size */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Maximum Players</Label>
              <Select
                value={settings.maxPlayers.toString()}
                onValueChange={(value) => updateSetting('maxPlayers', parseInt(value))}
              >
                <SelectTrigger className="bg-surface-light border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface border-surface-light">
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="6">6 Players</SelectItem>
                  <SelectItem value="8">8 Players</SelectItem>
                  <SelectItem value="10">10 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Rounds */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Rounds</Label>
              <div className="grid grid-cols-3 gap-3">
                {[3, 5, 7].map((rounds) => (
                  <Button
                    key={rounds}
                    variant={settings.rounds === rounds ? "default" : "outline"}
                    onClick={() => updateSetting('rounds', rounds)}
                    className={
                      settings.rounds === rounds
                        ? "btn-primary"
                        : "bg-surface-light hover:bg-primary border-gray-600 hover:border-primary"
                    }
                  >
                    {rounds} Rounds
                  </Button>
                ))}
              </div>
            </div>

            {/* Round Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Round Duration</Label>
              <Slider
                value={[settings.roundDuration]}
                onValueChange={(value) => updateSetting('roundDuration', value[0])}
                min={40}
                max={90}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>40s</span>
                <span className="text-white font-medium">{settings.roundDuration}s</span>
                <span>90s</span>
              </div>
            </div>

            {/* Word Choices */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Word Choices per Turn</Label>
              <div className="grid grid-cols-4 gap-3">
                {[2, 3, 4, 5].map((choices) => (
                  <Button
                    key={choices}
                    variant={settings.wordChoices === choices ? "default" : "outline"}
                    onClick={() => updateSetting('wordChoices', choices)}
                    className={
                      settings.wordChoices === choices
                        ? "btn-primary"
                        : "bg-surface-light hover:bg-primary border-gray-600 hover:border-primary"
                    }
                  >
                    {choices}
                  </Button>
                ))}
              </div>
            </div>

            {/* Letter Hints */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Letter Hints</Label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((hints) => (
                  <Button
                    key={hints}
                    variant={settings.letterHints === hints ? "default" : "outline"}
                    onClick={() => updateSetting('letterHints', hints)}
                    className={
                      settings.letterHints === hints
                        ? "btn-primary"
                        : "bg-surface-light hover:bg-primary border-gray-600 hover:border-primary"
                    }
                  >
                    {hints} Hint{hints > 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
            </div>

            {/* Create Room Button */}
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full btn-primary py-4 text-base font-semibold mt-8"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              {isCreating ? "Creating Room..." : "Create Room"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
