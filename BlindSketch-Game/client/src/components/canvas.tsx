import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Eraser, Eye, EyeOff } from 'lucide-react';

interface CanvasProps {
  isDrawing: boolean;
  drawingData?: any;
  onDrawingUpdate?: (data: any) => void;
}

const COLORS = [
  '#000000', // Black
  '#ff0000', // Red
  '#0000ff', // Blue
  '#00ff00', // Green
  '#ffff00', // Yellow
  '#ff00ff', // Purple
  '#00ffff', // Cyan
  '#ffa500', // Orange
];

export function Canvas({ isDrawing, drawingData, onDrawingUpdate }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingState, setIsDrawingState] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;

    // Set default drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (drawingData && !isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas and redraw from data
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (drawingData.strokes && Array.isArray(drawingData.strokes)) {
        drawingData.strokes.forEach((stroke: any) => {
          if (stroke.points && stroke.points.length > 1) {
            ctx.strokeStyle = stroke.color || '#000000';
            ctx.lineWidth = stroke.size || 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
          }
        });
      }
    }
  }, [drawingData, isDrawing]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    setIsDrawingState(true);
    const point = getMousePos(e);
    setLastPoint(point);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    // Start new stroke
    if (onDrawingUpdate) {
      onDrawingUpdate({
        type: 'start_stroke',
        color: currentColor,
        size: brushSize,
        points: [point],
        timestamp: Date.now(),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingState || !lastPoint) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getMousePos(e);
    
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    setLastPoint(currentPoint);

    // Send drawing update with stroke data
    if (onDrawingUpdate) {
      onDrawingUpdate({
        type: 'continue_stroke',
        color: currentColor,
        size: brushSize,
        points: [currentPoint],
        timestamp: Date.now(),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingState && onDrawingUpdate) {
      onDrawingUpdate({
        type: 'end_stroke',
        timestamp: Date.now(),
      });
    }

    setIsDrawingState(false);
    setLastPoint(null);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (onDrawingUpdate) {
      onDrawingUpdate({ type: 'clear' });
    }
  };

  return (
    <div className="w-full">
      {/* Canvas Container */}
      <div className="canvas-container bg-white rounded-xl shadow-lg relative mx-auto" style={{ maxWidth: '800px' }}>
        <canvas
          ref={canvasRef}
          className={`w-full h-auto rounded-xl ${isDrawing ? 'drawing-canvas' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Blind Overlay (only for current drawer) */}
        {isDrawing && (
          <div className="absolute inset-0 bg-black bg-opacity-95 rounded-xl flex items-center justify-center z-10">
            <div className="text-center text-white">
              <EyeOff className="h-12 w-12 mb-4 mx-auto" />
              <p className="text-xl font-semibold">You're drawing blind!</p>
              <p className="text-gray-300">Other players can see your drawing</p>
            </div>
          </div>
        )}
      </div>

      {/* Drawing Tools (only for current drawer) */}
      {isDrawing && (
        <div className="flex justify-center mt-4 space-x-6 flex-wrap">
          {/* Color Palette */}
          <div className="flex space-x-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`color-picker ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>

          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <Label className="text-sm text-gray-400">Size:</Label>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={2}
              max={20}
              step={1}
              className="w-20"
            />
            <span className="text-sm text-gray-400 w-6">{brushSize}</span>
          </div>

          {/* Clear Canvas */}
          <Button
            onClick={handleClearCanvas}
            variant="outline"
            size="sm"
            className="btn-surface border-gray-600"
          >
            <Eraser className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
