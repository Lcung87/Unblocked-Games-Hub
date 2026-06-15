export type GameCategory = 'action' | 'arcade' | 'idle' | 'puzzle' | 'custom';

export interface Game {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  isNative: boolean;
  externalUrl?: string;
  iconName: string; // Dynamic Lucide icon key
  colorTheme: string; // Tailwind bg color class prefix, e.g. "emerald", "amber"
  rating: number;
  playedCount: number;
  bestScore?: number;
  playTime: number; // in seconds
  isFavorite: boolean;
}

export interface UserStats {
  totalPlayTime: number; // in seconds
  totalGamesPlayed: number;
  favoriteGamesCount: number;
}
