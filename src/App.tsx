import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gamepad2, Search, Heart, RefreshCw, Plus, Trash2, ExternalLink, Play, 
  Settings, Volume2, VolumeX, EyeOff, Award, Clock, Activity, Shield, 
  HelpCircle, ChevronRight, CornerDownRight, X
} from 'lucide-react';

import { Game, GameCategory, UserStats } from './types';
import { sounds } from './components/AudioEngine';

// Native games imports
import SnakeGame from './components/SnakeGame';
import Game2048 from './components/Game2048';
import SpaceShooter from './components/SpaceShooter';
import IdleGame from './components/IdleGame';

const DEFAULT_GAMES: Game[] = [
  {
    id: 'pixel-shooter',
    title: 'Pixel Shooter',
    description: 'A thrilling 3D pixelated retro shooter game. Face off against enemies, pick up items, and secure victory with amazing shooting skills.',
    category: 'arcade',
    isNative: false,
    externalUrl: 'https://ubg77.github.io/pixel-shooter/',
    iconName: 'Gamepad2',
    colorTheme: 'indigo',
    rating: 4.8,
    playedCount: 0,
    playTime: 0,
    isFavorite: false,
  },
  {
    id: 'block-blast',
    title: 'Block Blast',
    description: 'An addictive and vibrant block puzzle game. Fit diverse shapes onto the board, clear lines, and blast your way to a high score.',
    category: 'puzzle',
    isNative: false,
    externalUrl: 'https://d11jzht7mj96rr.cloudfront.net/games/2024/unity3/block-blast/index-gg.html',
    iconName: 'Gamepad2',
    colorTheme: 'emerald',
    rating: 4.9,
    playedCount: 0,
    playTime: 0,
    isFavorite: false,
  },
  {
    id: 'woodoku',
    title: 'Woodoku',
    description: 'An elegant and relaxing wood block puzzle game. Match wood blocks in rows, columns, or squares to clear them and achieve high scores.',
    category: 'puzzle',
    isNative: false,
    externalUrl: 'https://html5.gamedistribution.com/9ed0d4b243484a6cb2456068085e0aa2/?gd_sdk_referrer_url=https://www.bubbleshooter.net/game/woodoku/',
    iconName: 'Gamepad2',
    colorTheme: 'purple',
    rating: 4.8,
    playedCount: 0,
    playTime: 0,
    isFavorite: false,
  },
  {
    id: 'hangman',
    title: 'Hangman',
    description: 'A classic and engaging word guessing game. Guess letters to figure out the secret word before your attempts run out!',
    category: 'puzzle',
    isNative: false,
    externalUrl: 'https://fourneauxthibaut.github.io/Hangman/',
    iconName: 'Gamepad2',
    colorTheme: 'purple',
    rating: 4.8,
    playedCount: 0,
    playTime: 0,
    isFavorite: false,
  }
];

export default function App() {
  if (typeof window !== 'undefined' && (window.location.pathname === '/blank' || window.location.pathname.endsWith('/blank') || window.location.pathname.endsWith('/blank/'))) {
    return (
      <div className="w-full h-full min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2 select-none">
        <Gamepad2 className="w-8 h-8 text-slate-750 animate-bounce" />
        <span>Custom HTML Workspace Frame Ready</span>
      </div>
    );
  }

  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all' | 'favorite'>('all');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAddGameModal, setShowAddGameModal] = useState<boolean>(false);
  const [sessionTime, setSessionTime] = useState<number>(0);
  
  // Custom game form validation
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<GameCategory>('arcade');
  const [newColor, setNewColor] = useState('indigo');

  // Load custom and default states
  useEffect(() => {
    try {
      const savedGames = localStorage.getItem('unblock_arcade_games_collection');
      if (savedGames) {
        const parsed = JSON.parse(savedGames);
        // Sync defaults in case schema changed, keep custom items (custom ids start with 'custom-')
        const customs = parsed.filter((g: Game) => g.id.startsWith('custom-'));
        const savedDefaultStates = parsed.filter((g: Game) => !g.id.startsWith('custom-'));

        const loaded: Game[] = DEFAULT_GAMES.map(def => {
          const matched = savedDefaultStates.find((s: Game) => s.id === def.id);
          if (matched) {
            return {
              ...def,
              isFavorite: matched.isFavorite,
              bestScore: matched.bestScore,
              playedCount: matched.playedCount,
              playTime: matched.playTime || 0
            };
          }
          return def;
        });

        setGames([...loaded, ...customs]);
      } else {
        setGames(DEFAULT_GAMES);
      }
    } catch {
      setGames(DEFAULT_GAMES);
    }
  }, []);

  // Save games on change
  const saveGamesToStorage = (updatedGames: Game[]) => {
    try {
      localStorage.setItem('unblock_arcade_games_collection', JSON.stringify(updatedGames));
    } catch {}
  };

  // Master Mute Sync
  useEffect(() => {
    sounds.setMute(isMuted);
  }, [isMuted]);

  // Tracking game time dynamically
  useEffect(() => {
    if (!activeGameId) {
      setSessionTime(0);
      return;
    }

    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGameId]);

  // Overall User Stats Selector
  const userStats = useMemo<UserStats>(() => {
    let totalSecs = 0;
    let counts = 0;
    let favs = 0;

    games.forEach(g => {
      totalSecs += g.playTime || 0;
      counts += g.playedCount || 0;
      if (g.isFavorite) favs++;
    });

    return {
      totalPlayTime: totalSecs,
      totalGamesPlayed: counts,
      favoriteGamesCount: favs
    };
  }, [games]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const updated = games.map(g => {
      if (g.id === id) {
        return { ...g, isFavorite: !g.isFavorite };
      }
      return g;
    });
    setGames(updated);
    saveGamesToStorage(updated);
  };

  const handleLaunchGame = (id: string) => {
    sounds.playScore();
    const updated = games.map(g => {
      if (g.id === id) {
        return { ...g, playedCount: g.playedCount + 1 };
      }
      return g;
    });
    setGames(updated);
    saveGamesToStorage(updated);
    setActiveGameId(id);
    setSessionTime(0);
  };

  const handleCloseGame = () => {
    sounds.playBounce();
    if (activeGameId) {
      const updated = games.map(g => {
        if (g.id === activeGameId) {
          return { ...g, playTime: (g.playTime || 0) + sessionTime };
        }
        return g;
      });
      setGames(updated);
      saveGamesToStorage(updated);
    }
    setActiveGameId(null);
    setSessionTime(0);
  };

  const handleAddCustomGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    sounds.playScore();
    let sanitizedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }

    const freshGame: Game = {
      id: 'custom-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom bookmarked user HTML5 iframe link.',
      category: newCategory,
      isNative: false,
      externalUrl: sanitizedUrl,
      iconName: 'ExternalLink',
      colorTheme: newColor,
      rating: 5.0,
      playedCount: 0,
      playTime: 0,
      isFavorite: false
    };

    const updated = [...games, freshGame];
    setGames(updated);
    saveGamesToStorage(updated);

    // Reset Form
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setShowAddGameModal(false);
  };

  const handleDeleteCustomGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this custom bookmarked link?')) return;

    sounds.playExplosion();
    const updated = games.filter(g => g.id !== id);
    setGames(updated);
    saveGamesToStorage(updated);
  };

  // Filter & Search Engine
  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            g.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorite') return g.isFavorite;
      return g.category === selectedCategory;
    });
  }, [games, searchQuery, selectedCategory]);

  const activeGame = useMemo(() => {
    return games.find(g => g.id === activeGameId) || null;
  }, [games, activeGameId]);

  // Convert seconds to human readable time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      


      {/* Main Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 backdrop-blur-md z-40 px-6 py-4 flex items-center justify-between">
        <div id="hero-logo-box" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center shadow-lg relative overflow-hidden group">
            <Gamepad2 className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition" />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-5">UNBLOCKED GAMES HUB</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">SECURE CLASSROOM ARCADE</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            id="nav-mute-toggle"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title={isMuted ? "Unmute Sound Engine" : "Mute Sound Engine"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* Active Game Overlay Frame */}
      {activeGame && (
        <div id="active-game-overlay-wrapper" className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col pt-16">
          {/* Game Top Controls Bar */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-900/85 px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <button
                id="close-game-arena-btn"
                onClick={handleCloseGame}
                className="text-slate-450 hover:text-white flex items-center gap-1.5 text-xs font-bold bg-slate-900 px-3 py-1.5 rounded-lg transition border border-slate-800 cursor-pointer"
              >
                ◀ Back to Lounge
              </button>
              <div className="h-5 w-px bg-slate-800"></div>
              <div>
                <h3 className="font-extrabold text-white text-sm">{activeGame.title}</h3>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{activeGame.isNative ? 'Native React Play' : 'External Iframe Sandboxed'}</span>
              </div>
            </div>

            {/* In-Game Active Session Counters */}
            <div className="flex items-center gap-6 text-xs select-none">
              <div className="flex items-center gap-1.5 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-850">
                <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-slate-400 font-mono">Session time:</span>
                <span className="font-bold text-white font-mono">{formatTime(sessionTime)}</span>
              </div>
            </div>
          </div>

          {/* Active Game Display Arena */}
          <div className="flex-1 w-full flex items-center justify-center p-4 overflow-auto">
            {activeGame.isNative ? (
              <div className="w-full flex justify-center py-6">
                {activeGame.id === 'space-miner-clicker' && <IdleGame />}
                {activeGame.id === 'neon-snake' && <SnakeGame />}
                {activeGame.id === 'number-merge-2048' && <Game2048 />}
                {activeGame.id === 'cosmic-defender' && <SpaceShooter />}
              </div>
            ) : (
              <div className="w-full max-w-5xl aspect-video bg-[#0d1117] rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                {/* Embed header warnings */}
                <div className="bg-slate-900 px-4 py-2 text-slate-400 text-[10px] border-b border-slate-800 flex justify-between items-center select-none">
                  <span>Providing custom web viewport frame securely (Sandbox active)</span>
                  <a 
                    href={activeGame.externalUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Launch native tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <iframe
                  id={
                    activeGame.id === 'woodoku' || activeGame.id === 'pixel-shooter' || activeGame.id === 'hangman'
                      ? 'innerFrame'
                      : activeGame.id === 'block-blast' 
                        ? 'gameFrame' 
                        : 'external-unblocked-game-frame'
                  }
                  name={
                    activeGame.id === 'woodoku' || activeGame.id === 'block-blast' || activeGame.id === 'pixel-shooter' || activeGame.id === 'hangman'
                      ? 'innerFrame' 
                      : undefined
                  }
                  data-src={activeGame.id === 'block-blast' ? './index-gg.html' : undefined}
                  src={activeGame.externalUrl}
                  title={activeGame.title}
                  className="w-full flex-1 border-0"
                  scrolling={activeGame.id === 'block-blast' ? 'no' : undefined}
                  style={
                    activeGame.id === 'block-blast' 
                       ? { pointerEvents: 'auto' } 
                       : activeGame.id === 'pixel-shooter' || activeGame.id === 'woodoku' || activeGame.id === 'hangman'
                        ? { pointerEvents: 'auto', overflow: 'auto' } 
                        : undefined
                  }
                  allowFullScreen
                  allow="autoplay; fullscreen; keyboard"
                  sandbox={
                    activeGame.id === 'woodoku' || activeGame.id === 'block-blast' || activeGame.id === 'pixel-shooter' || activeGame.id === 'hangman'
                      ? "allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads allow-storage-access-by-user-activation"
                      : "allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads allow-modals allow-storage-access-by-user-activation"
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        


        {/* Search, Discovery & Categories filters */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          {/* Categories Grid list */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/30 p-1 rounded-xl w-fit border border-slate-900/85">
            <button
              id="category-all-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition select-none cursor-pointer ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              All Library
            </button>
            <button
              id="category-favorite-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('favorite'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition flex items-center gap-1 cursor-pointer ${selectedCategory === 'favorite' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" /> Favorites
            </button>
            <div className="w-px h-4 bg-slate-800"></div>
            <button
              id="category-action-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('action'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${selectedCategory === 'action' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Action ☄
            </button>
            <button
              id="category-arcade-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('arcade'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${selectedCategory === 'arcade' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Arcade 🕹
            </button>
            <button
              id="category-idle-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('idle'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${selectedCategory === 'idle' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Idle / Casual ⏳
            </button>
            <button
              id="category-puzzle-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('puzzle'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${selectedCategory === 'puzzle' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              Puzzles 🧩
            </button>
            <button
              id="category-custom-btn"
              onClick={() => { sounds.playClick(); setSelectedCategory('custom'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${selectedCategory === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              My Bookmarks 📁
            </button>
          </div>

          {/* Search Box inputs */}
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="dashboard-search-input"
              type="text"
              placeholder="Search unblocked titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition shadow-inner"
            />
            {searchQuery && (
              <button 
                id="reset-search-query-btn"
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>
        </section>

        {/* Curated Games Cards Grid List */}
        <section id="arcade-games-grid-lounge" className="flex-1">
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredGames.map(game => (
                <div
                  key={game.id}
                  id={`game-item-card-${game.id}`}
                  onClick={() => handleLaunchGame(game.id)}
                  className="bg-slate-900/35 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/60 rounded-2xl p-5 flex flex-col justify-between transition duration-200 cursor-pointer shadow-sm relative group overflow-hidden"
                >
                  {/* Subtle color card tags */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 group-hover:w-3.5 transition-all" style={{ backgroundColor: game.colorTheme === 'indigo' ? '#6366f1' : game.colorTheme === 'amber' ? '#f59e0b' : game.colorTheme === 'cyan' ? '#06b6d4' : game.colorTheme === 'emerald' ? '#10b981' : '#a855f7' }}></div>

                  <div className="pl-4">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-white border border-slate-800">
                          {game.id === 'space-miner-clicker' && '⏳'}
                          {game.id === 'cosmic-defender' && '☄'}
                          {game.id === 'neon-snake' && '🕹'}
                          {game.id === 'number-merge-2048' && '🧩'}
                          {!game.isNative && '🌐'}
                        </div>
                        <div>
                          <span className="text-[9px] font-mono tracking-wider text-slate-450 uppercase block">{game.category} game</span>
                          <h4 className="font-extrabold text-[#ffffff] text-sm group-hover:text-indigo-300 transition-all">{game.title}</h4>
                        </div>
                      </div>

                      {/* Favorites pin */}
                      <button
                        id={`fav-${game.id}`}
                        onClick={(e) => toggleFavorite(game.id, e)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${game.isFavorite ? 'bg-pink-950/20 border-pink-900 text-pink-400' : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-300'}`}
                        title="Pin to Favorites"
                      >
                        <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Desc */}
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{game.description}</p>
                  </div>

                  {/* Footer status blocks */}
                  <div className="pl-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <div className="flex gap-3">
                      <span>Rating: <strong className="text-slate-350">{game.rating} ★</strong></span>
                      <span>Playtime: <strong className="text-slate-350">{formatTime(game.playTime || 0)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      {game.id.startsWith('custom-') && (
                        <button
                          id={`del-custom-${game.id}`}
                          onClick={(e) => handleDeleteCustomGame(game.id, e)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded shrink-0 cursor-pointer"
                          title="Remove custom link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <span className="text-indigo-400 group-hover:text-white font-bold transition flex items-center gap-0.5">
                        Play Now <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div id="no-games-found-placeholder" className="py-20 text-center text-slate-500 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10 flex flex-col items-center justify-center gap-3">
              <EyeOff className="w-10 h-10 stroke-1 text-slate-600" />
              {games.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 max-w-sm px-4">
                  <p className="text-sm font-semibold text-slate-300">Your Hub is Empty!</p>
                  <p className="text-xs text-slate-500">We have removed all default games as requested. Click the button below or "Add Custom" in the top bar to bookmark secure unblocked web game URLs.</p>
                  <button
                    id="add-first-game-btn"
                    onClick={() => { sounds.playClick(); setShowAddGameModal(true); }}
                    className="bg-indigo-605 bg-indigo-650/10 border border-indigo-700/50 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg px-4 py-2 mt-2 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Game Track
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">No unblocked game titles match your search filters.</p>
                  <button
                    id="reset-discovered-filters"
                    onClick={() => { sounds.playClick(); setSearchQuery(''); setSelectedCategory('all'); }}
                    className="bg-slate-900 text-slate-300 hover:text-white rounded-lg px-4 py-2 text-xs transition border border-slate-800 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add Custom Game Bookmark Modal */}
      {showAddGameModal && (
        <div id="add-game-modal-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              id="close-add-modal-btn"
              onClick={() => { sounds.playClick(); setShowAddGameModal(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-900 pb-3 mb-4">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-indigo-400" /> Bookmark Custom Web Game
              </h3>
              <p className="text-xs text-slate-500 mt-1">Add unblocked HTML5 game links from safe, public networks.</p>
            </div>

            <form onSubmit={handleAddCustomGame} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-400">Game Title</label>
                <input
                  id="add-title-input"
                  type="text"
                  placeholder="e.g., Chess, Pacman, Classic Tetris"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-400">Game Viewport URL / Secure Link</label>
                <input
                  id="add-url-input"
                  type="text"
                  placeholder="e.g., https://game-author.github.io/tetris-web/"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Provide secure URLs beginning with https:// for iframe sandboxing.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-400">Brief Description</label>
                <textarea
                  id="add-desc-input"
                  placeholder="Brief summary explaining core mechanics..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400">Arcade Category</label>
                  <select
                    id="add-category-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as GameCategory)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="action">Action ☄</option>
                    <option value="arcade">Arcade 🕹</option>
                    <option value="idle">Idle / Casual ⏳</option>
                    <option value="puzzle">Puzzle 🧩</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-400">Accent Trim Color</label>
                  <select
                    id="add-color-select"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="indigo">Royal Indigo</option>
                    <option value="amber">Warm Amber</option>
                    <option value="cyan">Cyber Cyan</option>
                    <option value="emerald">Jade Emerald</option>
                    <option value="purple">Cosmic Purple</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end mt-4 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  id="add-game-cancel-btn"
                  onClick={() => { sounds.playClick(); setShowAddGameModal(false); }}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg hover:bg-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="add-game-submit-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md transition hover:shadow-indigo-500/15 cursor-pointer"
                >
                  Save in Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer credits disclaimer */}
      <footer className="border-t border-slate-900 py-6 text-center text-slate-500 text-[10px] select-none">
        <p className="max-w-xl mx-auto px-4 leading-relaxed">
          Unblocked Games Hub offers premium browser-based HTML5 action frameworks natively structured in TS. This software behaves purely as a client-side virtual playground sandbox. State saved locally in browser space. All systems operational.
        </p>
      </footer>
    </div>
  );
}
