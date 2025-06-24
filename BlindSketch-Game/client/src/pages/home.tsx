import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isValidUsername } from "@/lib/utils";
import { Plus, Shuffle } from "lucide-react";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const { toast } = useToast();

  const handleCreatePrivateRoom = () => {
    if (!isValidUsername(username)) {
      toast({
        title: "Invalid Username",
        description: "Username must be 2-20 characters and contain only letters, numbers, underscore, and dash.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('blindsketch_username', username);
    setLocation('/create-room');
  };

  const handleJoinRandomRoom = async () => {
    if (!isValidUsername(username)) {
      toast({
        title: "Invalid Username", 
        description: "Username must be 2-20 characters and contain only letters, numbers, underscore, and dash.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/rooms/random/join');
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('blindsketch_username', username);
        setLocation(`/room/${data.room.id}`);
      } else {
        toast({
          title: "No Available Rooms",
          description: "There are no public rooms available. Try creating your own!",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinWithRoomId = async () => {
    if (!isValidUsername(username)) {
      toast({
        title: "Invalid Username",
        description: "Username must be 2-20 characters and contain only letters, numbers, underscore, and dash.",
        variant: "destructive",
      });
      return;
    }

    if (!roomId.trim()) {
      toast({
        title: "Invalid Room ID",
        description: "Please enter a valid room ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId.trim()}`);
      
      if (response.ok) {
        localStorage.setItem('blindsketch_username', username);
        setLocation(`/room/${roomId.trim()}`);
      } else {
        toast({
          title: "Room Not Found",
          description: "The room ID you entered does not exist or is no longer available.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            BlindSketch
          </h1>
          <p className="text-gray-400 text-lg">Draw blind, guess smart, have fun!</p>
        </div>

        <Card className="bg-surface border-surface-light">
          <CardContent className="p-6 space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Choose your username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-surface-light border-gray-600 text-white placeholder:text-gray-400 focus:ring-primary focus:border-primary"
                maxLength={20}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreatePrivateRoom();
                  }
                }}
              />
            </div>

            {/* Room ID Input */}
            <div className="space-y-2">
              <Label htmlFor="roomId" className="text-sm font-medium">
                Or join with Room ID
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="roomId"
                  type="text"
                  placeholder="Enter room ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 bg-surface-light border-gray-600 text-white placeholder:text-gray-400 focus:ring-primary focus:border-primary"
                  maxLength={8}
                />
                <Button
                  onClick={handleJoinWithRoomId}
                  disabled={!roomId.trim()}
                  className="btn-primary"
                  size="default"
                >
                  Join
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleCreatePrivateRoom}
                className="w-full btn-primary py-3 text-base font-semibold"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Private Room
              </Button>

              <Button
                onClick={handleJoinRandomRoom}
                className="w-full btn-secondary py-3 text-base font-semibold"
                size="lg"
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Join Random Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
