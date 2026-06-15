import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';
import { sounds } from './AudioEngine';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Position>({ x: 5, y: 5 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);

  const gridSize = 20;

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unblocked_games_snake_best');
      if (saved) {
        setBestScore(Number(saved));
      }
    } catch {}
  }, []);

  const generateFood = useCallback((snake: Position[]): Position => {
    const tileCount = 20; // 400x400 canvas with grid size 20 = 20 cells
    let newFood: Position;
    let attempts = 0;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
      };
      attempts++;
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) && 
      attempts < 100
    );

    return newFood;
  }, []);

  const resetGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    const newFood = generateFood(snakeRef.current);
    foodRef.current = newFood;
    setGameStarted(true);
    sounds.playScore();
  };

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.fillStyle = '#0f172a'; // Deep Navy
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid mesh lines (subtle dark blue)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw Food (neon particle)
    const food = foodRef.current;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e'; // Pink/Rose neon
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake (neon cyan)
    const snake = snakeRef.current;
    ctx.shadowColor = '#06b6d4'; // Cyan neon
    snake.forEach((segment, idx) => {
      ctx.shadowBlur = idx === 0 ? 12 : 6;
      ctx.fillStyle = idx === 0 ? '#22d3ee' : '#0891b2';
      
      // Draw smooth rounded corners or custom heads
      ctx.fillRect(
        segment.x * gridSize + 1, 
        segment.y * gridSize + 1, 
        gridSize - 2, 
        gridSize - 2
      );
    });

    // Reset shadow state
    ctx.shadowBlur = 0;
  }, []);

  const updateGame = useCallback(() => {
    if (gameOver || !gameStarted) return;

    const snake = [...snakeRef.current];
    directionRef.current = nextDirectionRef.current;
    const dir = directionRef.current;
    
    // Calculate new head
    const head = { ...snake[0] };
    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    const tileCount = 20;

    // Colission check (walls)
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      handleGameOver();
      return;
    }

    // Collision check (self)
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      handleGameOver();
      return;
    }

    // Add head
    snake.unshift(head);

    // Food check
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      setScore(prev => {
        const next = prev + 10;
        if (next > bestScore) {
          setBestScore(next);
          try {
            localStorage.setItem('unblocked_games_snake_best', String(next));
          } catch {}
        }
        return next;
      });
      sounds.playScore();
      foodRef.current = generateFood(snake);
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
  }, [gameOver, gameStarted, bestScore, generateFood]);

  const handleGameOver = () => {
    setGameOver(true);
    setGameStarted(false);
    sounds.playExplosion();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      
      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;

      if ((key === 'arrowup' || key === 'w') && currentDir !== 'DOWN') {
        nextDirectionRef.current = 'UP';
      } else if ((key === 'arrowdown' || key === 's') && currentDir !== 'UP') {
        nextDirectionRef.current = 'DOWN';
      } else if ((key === 'arrowleft' || key === 'a') && currentDir !== 'RIGHT') {
        nextDirectionRef.current = 'LEFT';
      } else if ((key === 'arrowright' || key === 'd') && currentDir !== 'LEFT') {
        nextDirectionRef.current = 'RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted]);

  // Main game loop (intervals based on speed)
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const delay = difficulty === 'easy' ? 140 : difficulty === 'medium' ? 95 : 60;
    const interval = setInterval(() => {
      updateGame();
      drawGame();
    }, delay);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, difficulty, updateGame, drawGame]);

  // Initial render when game loads or restarts
  useEffect(() => {
    drawGame();
  }, [drawGame]);

  return (
    <div className="w-full max-w-4xl bg-slate-900 text-gray-100 rounded-xl p-6 shadow-2xl border border-slate-850 flex flex-col items-center">
      
      <div className="w-full flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-[10px] tracking-widest text-cyan-400 font-mono uppercase">Neon cyber-grid</span>
          <h2 className="text-xl font-bold text-white font-sans">Retro Snake</h2>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Current Points</div>
            <div className="text-xl font-bold font-mono text-cyan-300">{score}</div>
          </div>
          <div className="text-right border-l border-slate-800 pl-4">
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Top Record
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">{bestScore}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full">
        {/* Game Area */}
        <div className="relative border-4 border-cyan-500/30 rounded-lg overflow-hidden bg-[#0f172a] shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center">
          <canvas
            id="retro-snake-canvas"
            ref={canvasRef}
            width={400}
            height={400}
            className="block w-full max-w-[400px] aspect-square"
          />

          {!gameStarted && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col justify-center items-center p-6 text-center">
              {gameOver ? (
                <>
                  <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
                  <h3 className="text-xl font-extrabold text-rose-400 mt-2">Grid Collapsed!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">You crashed into a sector boundary or self-indexed.</p>
                  <p className="text-sm font-bold font-mono text-white mt-3">Final Score: {score}</p>
                  
                  <button
                    id="snake-reboot-btn"
                    onClick={resetGame}
                    className="mt-6 font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition shadow-lg outline-none cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Reboot Core
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center animate-pulse">
                    <Play className="w-6 h-6 fill-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">Ready to Play</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">Navigate the cyber neon snake, eat data blocks, grow in length.</p>
                  
                  <div className="flex gap-2.5 mt-4">
                    <button 
                      id="speed-easy" 
                      onClick={() => { sounds.playClick(); setDifficulty('easy'); }} 
                      className={`px-3 py-1.5 rounded text-xs transition ${difficulty === 'easy' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      Safe
                    </button>
                    <button 
                      id="speed-medium" 
                      onClick={() => { sounds.playClick(); setDifficulty('medium'); }} 
                      className={`px-3 py-1.5 rounded text-xs transition ${difficulty === 'medium' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      Medium
                    </button>
                    <button 
                      id="speed-hard" 
                      onClick={() => { sounds.playClick(); setDifficulty('hard'); }} 
                      className={`px-3 py-1.5 rounded text-xs transition ${difficulty === 'hard' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      Overdrive
                    </button>
                  </div>

                  <button
                    id="snake-launch-btn"
                    onClick={resetGame}
                    className="mt-6 font-semibold bg-gradient-to-r from-cyan-400 to-teal-500 text-slate-950 px-8 py-2.5 rounded-lg flex items-center gap-2 transition hover:from-cyan-300 hover:to-teal-400 shadow-lg cursor-pointer"
                  >
                    Launch Grid
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info & Responsive Directions keys */}
        <div className="flex flex-col gap-4 max-w-sm w-full">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <span className="text-xs font-bold text-cyan-400 block mb-2 font-mono">Controls Checklist</span>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex justify-between"><span>Keyboard Bindings:</span> <span className="font-mono text-white font-semibold">WASD / Arrow Keys</span></li>
              <li className="flex justify-between"><span>Action:</span> <span>Collect glowing pink node</span></li>
              <li className="flex justify-between"><span>Tip:</span> <span>Grid borders are solid blockages!</span></li>
            </ul>
          </div>

          {/* D-Pad overlay for tablet/phone/iframe players */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono mb-2">On-Screen Controller (Click or Touch)</span>
            
            <div className="grid grid-cols-3 gap-2 w-36 aspect-square max-w-[150px]">
              <div></div>
              <button
                id="snake-ctr-up"
                onClick={() => { sounds.playClick(); if (directionRef.current !== 'DOWN') nextDirectionRef.current = 'UP'; }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded p-2 text-center text-xs border border-slate-700 cursor-pointer"
              >
                ▲
              </button>
              <div></div>

              <button
                id="snake-ctr-left"
                onClick={() => { sounds.playClick(); if (directionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT'; }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded p-2 text-center text-xs border border-slate-700 cursor-pointer"
              >
                ◀
              </button>
              <div className="flex items-center justify-center text-[10px] text-slate-600 font-mono">PD</div>
              <button
                id="snake-ctr-right"
                onClick={() => { sounds.playClick(); if (directionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT'; }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded p-2 text-center text-xs border border-slate-700 cursor-pointer"
              >
                ▶
              </button>

              <div></div>
              <button
                id="snake-ctr-down"
                onClick={() => { sounds.playClick(); if (directionRef.current !== 'UP') nextDirectionRef.current = 'DOWN'; }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-cyan-500 active:text-slate-950 text-white rounded p-2 text-center text-xs border border-slate-700 cursor-pointer"
              >
                ▼
              </button>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
