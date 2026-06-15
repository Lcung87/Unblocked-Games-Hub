import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Award, ShieldAlert, Zap } from 'lucide-react';
import { sounds } from './AudioEngine';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Asteroid {
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function SpaceShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [weaponUpgrade, setWeaponUpgrade] = useState<number>(1); // 1 = Single, 2 = Double, 3 = Spread!

  const stateRef = useRef({
    playerX: 200,
    playerY: 340,
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    particles: [] as Particle[],
    stars: [] as Star[],
    keys: {} as Record<string, boolean>,
    canShoot: true,
    lastShootTime: 0,
    spawnTimer: 0,
    gameStarted: false,
    gameOver: false,
  });

  const width = 400;
  const height = 400;

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unblocked_games_shooter_best');
      if (saved) setHighScore(Number(saved));
    } catch {}
  }, []);

  // Initialize stars
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 1.5 + 0.5,
      });
    }
    stateRef.current.stars = stars;
  }, []);

  const spawnAsteroid = useCallback(() => {
    const sizeRoll = Math.random();
    let radius = 10;
    let health = 1;
    let speed = Math.random() * 1.5 + 1;
    let color = '#a1a1aa'; // default zinc

    if (sizeRoll > 0.85) {
      radius = 24;
      health = 3;
      speed = Math.random() * 0.8 + 0.6;
      color = '#f59e0b'; // amber large
    } else if (sizeRoll > 0.6) {
      radius = 16;
      health = 2;
      color = '#ef4444'; // red mid
    }

    stateRef.current.asteroids.push({
      x: Math.random() * (width - radius * 2) + radius,
      y: -radius,
      radius,
      speed,
      health,
      color,
    });
  }, []);

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.5 + 1.2,
        color,
        alpha: 1,
        decay: Math.random() * 0.04 + 0.02
      });
    }
  };

  const resetGame = () => {
    const state = stateRef.current;
    state.playerX = width / 2;
    state.bullets = [];
    state.asteroids = [];
    state.particles = [];
    state.canShoot = true;
    state.lastShootTime = 0;
    state.spawnTimer = 0;
    state.gameOver = false;
    state.gameStarted = true;

    setScore(0);
    setLives(3);
    setWeaponUpgrade(1);
    setGameOver(false);
    setGameStarted(true);
    sounds.playScore();
  };

  // Setup loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      
      // Update Game state sync
      state.gameStarted = gameStarted;
      state.gameOver = gameOver;

      // CLEAR & BACKGROUND
      ctx.fillStyle = '#090d16'; // Cosmic obsidian black
      ctx.fillRect(0, 0, width, height);

      // 1. STARS BACKGROUND
      ctx.fillStyle = '#ffffff';
      state.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.speed / 2})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
        if (gameStarted && !gameOver) {
          star.y += star.speed;
          if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
          }
        }
      });

      if (gameStarted && !gameOver) {
        // 2. MOVEMENT CONTROLS
        const moveSpeed = 5;
        if (state.keys['ArrowLeft'] || state.keys['a']) {
          state.playerX = Math.max(20, state.playerX - moveSpeed);
        }
        if (state.keys['ArrowRight'] || state.keys['d']) {
          state.playerX = Math.min(width - 20, state.playerX + moveSpeed);
        }

        // AUTO SHOOT or SPACE SHOOT
        if (state.keys[' '] || state.keys['ArrowUp'] || state.keys['w']) {
          const now = Date.now();
          if (now - state.lastShootTime > 240) {
            sounds.playLaser();
            if (weaponUpgrade === 1) {
              // Single centered bullet
              state.bullets.push({ x: state.playerX - 2, y: state.playerY - 12, width: 4, height: 10, speed: -6 });
            } else if (weaponUpgrade === 2) {
              // Dual side barrels
              state.bullets.push({ x: state.playerX - 8, y: state.playerY - 8, width: 4, height: 10, speed: -6 });
              state.bullets.push({ x: state.playerX + 4, y: state.playerY - 8, width: 4, height: 10, speed: -6 });
            } else {
              // Spread 3 shot
              state.bullets.push({ x: state.playerX - 2, y: state.playerY - 12, width: 4, height: 10, speed: -6 });
              state.bullets.push({ x: state.playerX - 6, y: state.playerY - 12, width: 4, height: 10, speed: -6 });
              state.bullets.push({ x: state.playerX + 2, y: state.playerY - 12, width: 4, height: 10, speed: -6 });
            }
            state.lastShootTime = now;
          }
        }

        // SPAWN ASTEROIDS
        state.spawnTimer++;
        if (state.spawnTimer > Math.max(30, 80 - score / 10)) {
          spawnAsteroid();
          state.spawnTimer = 0;
        }

        // UPDATE BULLETS
        state.bullets.forEach((bullet, index) => {
          bullet.y += bullet.speed;
          if (bullet.y < 0) {
            state.bullets.splice(index, 1);
          }
        });

        // UPDATE ASTEROIDS & BULLET COLLISION
        state.asteroids.forEach((ast, astIdx) => {
          ast.y += ast.speed;

          // Collision with Ship!
          const distToShipX = ast.x - state.playerX;
          const distToShipY = ast.y - state.playerY;
          const distToShip = Math.sqrt(distToShipX * distToShipX + distToShipY * distToShipY);

          if (distToShip < ast.radius + 14) { // Estimating ship radius size
            createExplosion(ast.x, ast.y, '#f59e0b');
            sounds.playExplosion();
            state.asteroids.splice(astIdx, 1);
            setLives(prev => {
              const next = prev - 1;
              if (next <= 0) {
                setGameOver(true);
                sounds.playExplosion();
              } else {
                // Drop weapon power down slightly on hit
                setWeaponUpgrade(w => Math.max(1, w - 1));
              }
              return next;
            });
            return;
          }

          // Off-screen clean
          if (ast.y > height + ast.radius) {
            state.asteroids.splice(astIdx, 1);
            return;
          }

          // Collision with Bullets
          state.bullets.forEach((bullet, bulIdx) => {
            const bulCenterX = bullet.x + bullet.width/2;
            const bulCenterY = bullet.y;
            const dx = ast.x - bulCenterX;
            const dy = ast.y - bulCenterY;
            const bulletDist = Math.sqrt(dx*dx + dy*dy);

            if (bulletDist < ast.radius + 4) {
              // Hit!
              state.bullets.splice(bulIdx, 1);
              ast.health -= 1;
              
              if (ast.health <= 0) {
                // Destroyed!
                createExplosion(ast.x, ast.y, ast.color);
                sounds.playBounce();
                state.asteroids.splice(astIdx, 1);
                
                // Roll weapon powerup chance
                if (Math.random() > 0.88) {
                  setWeaponUpgrade(w => Math.min(3, w + 1));
                }

                setScore(prev => {
                  const next = prev + (ast.radius > 20 ? 30 : 10);
                  if (next > highScore) {
                    setHighScore(next);
                    try {
                      localStorage.setItem('unblocked_games_shooter_best', String(next));
                    } catch {}
                  }
                  return next;
                });
              } else {
                // Spark minor hit particle
                createExplosion(bullet.x, bullet.y, '#ffffff');
              }
            }
          });
        });

        // UPDATE PARTICLES
        state.particles.forEach((part, partIdx) => {
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= part.decay;
          if (part.alpha <= 0) {
            state.particles.splice(partIdx, 1);
          }
        });
      }

      // RENDER BULLETS
      ctx.fillStyle = '#67e8f9'; // Electric cyan bullets
      state.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      });

      // RENDER ASTEROIDS
      state.asteroids.forEach(ast => {
        ctx.fillStyle = ast.color;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.radius, 0, Math.PI * 2);
        ctx.fill();

        // draw details like mini ridges
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.arc(ast.x - ast.radius/3, ast.y - ast.radius/3, ast.radius/4, 0, Math.PI * 2);
        ctx.fill();
      });

      // RENDER EXPLOSION PARTICLES
      state.particles.forEach(part => {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.alpha;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // reset alpha
      });

      // RENDER PLAYER SHIP
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24'; // beautiful golden wing neon glow
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(state.playerX, state.playerY - 12); // nose cone
      ctx.lineTo(state.playerX - 12, state.playerY + 8); // left wing
      ctx.lineTo(state.playerX + 12, state.playerY + 8); // right wing
      ctx.closePath();
      ctx.fill();

      // inner structural details
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(state.playerX, state.playerY - 8);
      ctx.lineTo(state.playerX - 4, state.playerY + 5);
      ctx.lineTo(state.playerX + 4, state.playerY + 5);
      ctx.closePath();
      ctx.fill();

      // Thruster engine fire
      if (gameStarted && !gameOver && Math.random() > 0.3) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(state.playerX - 3, state.playerY + 9);
        ctx.lineTo(state.playerX + 3, state.playerY + 9);
        ctx.lineTo(state.playerX, state.playerY + 14 + (Math.random() * 5));
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowBlur = 0; // reset shadows

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animId);
  }, [gameStarted, gameOver, weaponUpgrade, score, highScore, spawnAsteroid]);

  // Handle keys presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault(); // prevent spacing scroll in wrapper
      }
      stateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl bg-slate-950 text-gray-100 rounded-xl p-6 shadow-2xl border border-slate-900 flex flex-col items-center">
      
      <div className="w-full flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
        <div>
          <span className="text-[10px] tracking-widest text-[#fbbf24] font-mono uppercase">Vanguard interceptor core</span>
          <h2 className="text-xl font-bold text-white font-sans">Cosmic Defender</h2>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-center bg-slate-900/50 border border-slate-800/80 px-3 py-1 rounded">
            <span className="text-[9px] text-slate-500 block leading-3">LIVES</span>
            <span className="font-mono text-rose-500 font-extrabold text-sm">{'♥ '.repeat(Math.max(0, lives))}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium">Points</div>
            <div className="text-lg font-bold font-mono text-[#fbbf24]">{score}</div>
          </div>
          <div className="text-right border-l border-slate-900 pl-4">
            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-end">
              <Award className="w-3 h-3 text-amber-500" /> High Score
            </div>
            <div className="text-lg font-bold font-mono text-amber-500">{highScore}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full">
        {/* Canvas Arena */}
        <div className="relative border-4 border-amber-500/20 rounded-lg overflow-hidden bg-[#090d16] shadow-xl flex items-center justify-center">
          <canvas
            id="space-shooter-canvas"
            ref={canvasRef}
            width={width}
            height={height}
            className="block w-full max-w-[400px] aspect-square"
          />

          {!gameStarted && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center">
              {gameOver ? (
                <>
                  <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
                  <h3 className="text-xl font-extrabold text-rose-400 mt-2">Ship Obliterated!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">Hulls collapsed after catastrophic meteor core index. Mission failure.</p>
                  <p className="text-sm font-bold font-mono text-white mt-3">Final Score: {score}</p>
                  
                  <button
                    id="shooter-reboot-btn"
                    onClick={resetGame}
                    className="mt-6 font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Deploy Interceptor
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-400/20 text-[#fbbf24] flex items-center justify-center animate-pulse">
                    <Zap className="w-6 h-6 fill-[#fbbf24] text-[#fbbf24]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">Ready to Launch</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px]">Control the fighter craft. Shoot asteroids, claim dynamic power-ups, defend sectors.</p>
                  
                  <div className="p-3 bg-amber-950/30 border border-amber-900/30 rounded text-[10px] text-amber-200 mt-3 max-w-[280px]">
                    ★ Powerup bonus: Destroying red cores has an 12% probability of generating spreads!
                  </div>

                  <button
                    id="shooter-launch-btn"
                    onClick={resetGame}
                    className="mt-6 font-semibold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-8 py-2.5 rounded-lg flex items-center gap-2 transition hover:from-amber-300 hover:to-yellow-450 shadow-lg cursor-pointer"
                  >
                    Launch Vanguard
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info & responsive mobile controls keys */}
        <div className="flex flex-col gap-4 max-w-sm w-full">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="text-xs font-bold text-amber-400 block mb-2 font-mono">Flight Panel Data</span>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex justify-between"><span>Navigation keys:</span> <span className="font-mono text-white font-semibold">A / D / Left-Right</span></li>
              <li className="flex justify-between"><span>Weapon Blasters:</span> <span className="font-mono text-white font-semibold">SPACE / W / Up</span></li>
              <li className="flex justify-between font-bold text-amber-300">
                <span>Active blaster:</span> 
                <span>{weaponUpgrade === 1 ? 'Single Cannon' : weaponUpgrade === 2 ? 'Dual Laser' : 'Spread Multi-Blaster'}</span>
              </li>
            </ul>
          </div>

          {/* On-screen control pads for easy sandbox play */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 font-mono block text-center mb-2.5">Mobile & Sandbox On-Screen Controllers</span>
            <div className="flex gap-2 justify-center">
              <button
                id="shooter-btn-left"
                onMouseDown={() => { stateRef.current.keys['ArrowLeft'] = true; }}
                onMouseUp={() => { stateRef.current.keys['ArrowLeft'] = false; }}
                onTouchStart={() => { stateRef.current.keys['ArrowLeft'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['ArrowLeft'] = false; }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 text-white rounded-lg px-4 py-2 text-xs font-bold shrink-0 border border-slate-700 cursor-pointer"
              >
                ◀ FLY L
              </button>
              
              <button
                id="shooter-btn-fire"
                onMouseDown={() => { stateRef.current.keys[' '] = true; }}
                onMouseUp={() => { stateRef.current.keys[' '] = false; }}
                onTouchStart={() => { stateRef.current.keys[' '] = true; }}
                onTouchEnd={() => { stateRef.current.keys[' '] = false; }}
                className="bg-red-950/60 border border-red-900 text-red-400 hover:bg-red-800/80 hover:text-white px-5 py-2 rounded-lg text-xs font-black shrink-0 cursor-pointer"
              >
                FIRING CORE
              </button>

              <button
                id="shooter-btn-right"
                onMouseDown={() => { stateRef.current.keys['ArrowRight'] = true; }}
                onMouseUp={() => { stateRef.current.keys['ArrowRight'] = false; }}
                onTouchStart={() => { stateRef.current.keys['ArrowRight'] = true; }}
                onTouchEnd={() => { stateRef.current.keys['ArrowRight'] = false; }}
                className="bg-slate-800 hover:bg-slate-700 active:bg-amber-500 text-white rounded-lg px-4 py-2 text-xs font-bold shrink-0 border border-slate-700 cursor-pointer"
              >
                FLY R ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
