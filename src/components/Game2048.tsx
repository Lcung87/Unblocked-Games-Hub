import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, ArrowLeft, Award, HelpCircle } from 'lucide-react';
import { sounds } from './AudioEngine';

type Board = number[][];

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [previousBoards, setPreviousBoards] = useState<{ board: Board; score: number }[]>([]);

  // Load best score on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unblocked_games_2048_best');
      if (saved) setBestScore(Number(saved));
    } catch {}
  }, []);

  const addRandomTile = useCallback((currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const initGame = useCallback(() => {
    let freshBoard: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    freshBoard = addRandomTile(freshBoard);
    freshBoard = addRandomTile(freshBoard);
    setBoard(freshBoard);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    setPreviousBoards([]);
  }, [addRandomTile]);

  // Check game conditions on board change
  const checkGameStates = useCallback((currentBoard: Board) => {
    // Check if player has 2048
    let won = false;
    currentBoard.forEach(row => {
      row.forEach(cell => {
        if (cell === 2048) won = true;
      });
    });
    if (won && !hasWon) {
      setHasWon(true);
      sounds.playScore();
    }

    // Check if game over (no empty spaces AND no possible adjacent merges)
    let openSpace = false;
    currentBoard.forEach(row => {
      row.forEach(cell => {
        if (cell === 0) openSpace = true;
      });
    });

    if (openSpace) return;

    let mergesAvailable = false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = currentBoard[r][c];
        if (
          (r < 3 && val === currentBoard[r + 1][c]) ||
          (c < 3 && val === currentBoard[r][c + 1])
        ) {
          mergesAvailable = true;
          break;
        }
      }
      if (mergesAvailable) break;
    }

    if (!mergesAvailable) {
      setGameOver(true);
      sounds.playExplosion();
    }
  }, [hasWon]);

  // Sliding row logic helper (slide left)
  const slideRowLeft = (row: number[]): { slid: number[]; points: number } => {
    // Filter non-zeros
    const filtered = row.filter(val => val !== 0);
    const slid: number[] = [];
    let points = 0;

    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        const combined = filtered[i] * 2;
        slid.push(combined);
        points += combined;
        i++; // skip next since merged
      } else {
        slid.push(filtered[i]);
      }
    }

    while (slid.length < 4) {
      slid.push(0);
    }

    return { slid, points };
  };

  const handleMove = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;

    // Deep copy current board for validation & saving previous state
    let nextBoard: Board = board.map(row => [...row]);
    let pointsEarned = 0;
    
    // Save state for undo
    const stateSnapshot = {
      board: board.map(row => [...row]),
      score: score
    };

    if (direction === 'LEFT') {
      nextBoard = nextBoard.map(row => {
        const { slid, points } = slideRowLeft(row);
        pointsEarned += points;
        return slid;
      });
    } else if (direction === 'RIGHT') {
      nextBoard = nextBoard.map(row => {
        const reversed = [...row].reverse();
        const { slid, points } = slideRowLeft(reversed);
        pointsEarned += points;
        return slid.reverse();
      });
    } else if (direction === 'UP') {
      // Transpose columns to rows
      for (let c = 0; c < 4; c++) {
        const row = [nextBoard[0][c], nextBoard[1][c], nextBoard[2][c], nextBoard[3][c]];
        const { slid, points } = slideRowLeft(row);
        pointsEarned += points;
        for (let r = 0; r < 4; r++) {
          nextBoard[r][c] = slid[r];
        }
      }
    } else if (direction === 'DOWN') {
      // Transpose columns to rows, reverse, slide, reverse back
      for (let c = 0; c < 4; c++) {
        const row = [nextBoard[3][c], nextBoard[2][c], nextBoard[1][c], nextBoard[0][c]];
        const { slid, points } = slideRowLeft(row);
        pointsEarned += points;
        for (let r = 0; r < 4; r++) {
          nextBoard[3 - r][c] = slid[r];
        }
      }
    }

    // Check if the board actually changed
    let changed = false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (nextBoard[r][c] !== board[r][c]) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      setPreviousBoards(prev => [stateSnapshot, ...prev].slice(0, 5)); // Keep last 5 undos
      const boardWithNewTile = addRandomTile(nextBoard);
      setBoard(boardWithNewTile);
      sounds.playClick();
      
      const newScore = score + pointsEarned;
      setScore(newScore);

      if (newScore > bestScore) {
        setBestScore(newScore);
        try {
          localStorage.setItem('unblocked_games_2048_best', String(newScore));
        } catch {}
      }

      checkGameStates(boardWithNewTile);
    }
  }, [board, score, bestScore, gameOver, addRandomTile, checkGameStates]);

  const undoMove = () => {
    if (previousBoards.length === 0) return;
    const previous = previousBoards[0];
    setBoard(previous.board);
    setScore(previous.score);
    setPreviousBoards(prev => prev.slice(1));
    setGameOver(false);
    sounds.playBounce();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        handleMove('LEFT');
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        handleMove('RIGHT');
      } else if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        handleMove('UP');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        handleMove('DOWN');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Initial game setup
  useEffect(() => {
    initGame();
  }, []);

  const getTileStyles = (val: number) => {
    switch (val) {
      case 2: return 'bg-amber-50 text-slate-800 border-slate-200';
      case 4: return 'bg-orange-50 text-slate-800 border-orange-100 shadow-sm';
      case 8: return 'bg-orange-500 text-white border-transparent font-extrabold shadow-md';
      case 16: return 'bg-rose-500 text-white border-transparent font-extrabold shadow-md';
      case 32: return 'bg-pink-500 text-white border-transparent font-extrabold shadow-md';
      case 64: return 'bg-purple-600 text-white border-transparent font-extrabold shadow-md';
      case 128: return 'bg-indigo-600 text-white border-transparent font-extrabold text-sm shadow-[0_0_10px_rgba(79,70,229,0.3)]';
      case 256: return 'bg-blue-600 text-white border-transparent font-extrabold text-sm shadow-[0_0_12px_rgba(37,99,235,0.4)]';
      case 512: return 'bg-teal-500 text-white border-transparent font-extrabold text-sm shadow-[0_0_14px_rgba(20,184,166,0.45)]';
      case 1024: return 'bg-emerald-500 text-white border-transparent font-extrabold text-xs shadow-[0_0_16px_rgba(16,185,129,0.5)]';
      case 2048: return 'bg-amber-400 text-slate-900 border-transparent font-extrabold text-xs shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse';
      default: return 'bg-slate-800/10 text-slate-400 border-slate-200/50';
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-slate-800 flex flex-col items-center">
      
      {/* Top Info block */}
      <div className="w-full flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
        <div>
          <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">Interactive Tile Solver</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Number Merge 2048</h2>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-center font-medium">
            <span className="text-[10px] text-slate-400 block font-normal leading-3">Points</span>
            <span className="font-mono text-slate-800 font-bold">{score}</span>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-center font-medium">
            <span className="text-[10px] text-slate-450 block font-normal leading-3 flex items-center gap-0.5 justify-center">
              <Award className="w-3 h-3 text-amber-500" /> Best
            </span>
            <span className="font-mono text-slate-800 font-bold">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="w-full flex justify-between gap-4 mb-4">
        <button
          id="2048-undo-btn"
          disabled={previousBoards.length === 0}
          onClick={undoMove}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition select-none cursor-pointer ${previousBoards.length > 0 ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' : 'bg-gray-55/40 text-gray-400 border-gray-100 cursor-not-allowed opacity-50'}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Undo ({previousBoards.length})
        </button>

        <button
          id="2048-restart-btn"
          onClick={() => { sounds.playClick(); initGame(); }}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Start Fresh
        </button>
      </div>

      {/* Board Arena */}
      <div className="relative w-full aspect-square max-w-[340px] bg-slate-100 rounded-xl p-3 border border-slate-200/60 shadow-inner">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((row, r) => 
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                id={`cell-${r}-${c}`}
                className={`rounded-lg border flex items-center justify-center font-sans font-bold text-lg transition-all duration-150 select-none ${getTileStyles(cell)}`}
              >
                {cell > 0 ? cell : ''}
              </div>
            ))
          )}
        </div>

        {/* Modal overlays */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/90 rounded-xl flex flex-col justify-center items-center text-center p-6 text-white backdrop-blur-sm">
            <h3 className="text-xl font-extrabold text-rose-400">Terminal Overload!</h3>
            <p className="text-xs text-slate-300 mt-1">Grid is fully locked. No adjacent combos available.</p>
            <div className="text-sm font-semibold font-mono mt-3 bg-white/10 px-3 py-1 rounded">Score: {score}</div>
            <button
              id="2048-retry-btn"
              onClick={initGame}
              className="mt-5 px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-lg text-xs transition hover:scale-105 shadow-lg flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {hasWon && (
          <div className="absolute inset-0 bg-amber-400/95 rounded-xl flex flex-col justify-center items-center text-center p-6 text-slate-950 backdrop-blur-sm">
            <span className="text-3xl">🏆</span>
            <h3 className="text-xl font-black mt-2">Level Resolved!</h3>
            <p className="text-xs text-slate-900 font-medium">You reached the legendary 2048 tile.</p>
            <button
              id="2048-continue-btn"
              onClick={() => { sounds.playClick(); setHasWon(false); }}
              className="mt-5 px-5 py-2 bg-slate-950 text-white font-bold rounded-lg text-xs transition hover:scale-105 shadow-md cursor-pointer"
            >
              Keep Advancing
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-[10px] leading-relaxed">
        <span className="font-bold text-slate-600 block mb-1">How to Play:</span> Use keyboard <span className="font-mono text-slate-800 bg-white border px-1 py-0.2 rounded font-semibold">WASD</span> or <span className="font-mono text-slate-800 bg-white border px-1 py-0.2 rounded font-semibold">Arrows</span> to slide matching tiles together. Merge tiles of the same tier to reach <span className="font-bold text-amber-600">2048</span>. Use the <strong className="text-amber-700">Undo</strong> helper to walk back mistakes anytime.
      </div>
    </div>
  );
}
