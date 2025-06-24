import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getDifficultyLabel } from '@/lib/utils';

interface WordSelectionModalProps {
  isOpen: boolean;
  words: string[];
  onSelectWord: (word: string) => void;
}

export function WordSelectionModal({ isOpen, words, onSelectWord }: WordSelectionModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-surface border-surface-light max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Choose a word to draw
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {words.map((word) => {
            const difficulty = getDifficultyLabel(word.length);
            return (
              <Button
                key={word}
                onClick={() => onSelectWord(word)}
                variant="outline"
                className="w-full p-4 bg-surface-light hover:bg-primary border-gray-600 hover:border-primary text-left h-auto"
              >
                <div className="flex flex-col items-start">
                  <div className="font-semibold text-white">{word}</div>
                  <div className="text-sm text-gray-400">
                    {difficulty} - {word.length} letters
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            Choose wisely! You won't be able to see your drawing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
