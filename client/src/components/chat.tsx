import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sanitizeMessage } from '@/lib/utils';
import { MessageCircle, Send } from 'lucide-react';
import type { ChatMessage } from '@shared/schema';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function Chat({ messages, onSendMessage, disabled = false }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    const message = sanitizeMessage(inputMessage);
    if (message && !disabled) {
      onSendMessage(message);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-600">
        <h3 className="font-semibold flex items-center">
          <MessageCircle className="mr-2 text-primary h-5 w-5" />
          Chat
        </h3>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-3 chat-messages">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`text-sm ${
                  message.isSystemMessage
                    ? message.isCorrectGuess
                      ? 'system-message correct-guess'
                      : 'system-message'
                    : ''
                } fade-in`}
              >
                {message.isSystemMessage ? (
                  <div className="flex items-center">
                    {message.isCorrectGuess && (
                      <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                    )}
                    <span className="text-secondary font-medium">
                      {message.message}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-primary font-medium">
                      {message.username}:
                    </span>
                    <span className="ml-1">{message.message}</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-600">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder={disabled ? "Drawing..." : "Type your guess..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className="flex-1 bg-surface-light border-gray-600 text-white placeholder:text-gray-400 focus:ring-primary focus:border-primary text-sm"
            maxLength={200}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || disabled}
            size="sm"
            className="btn-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {disabled && (
          <p className="text-xs text-gray-500 mt-1">
            You cannot chat while drawing
          </p>
        )}
      </div>
    </div>
  );
}
