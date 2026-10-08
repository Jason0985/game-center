import { Injectable, inject } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { AppErrorService } from '../../../services/app-error.service';
import { describeSupabaseError } from '../../../services/supabase-errors';
import { GAMES, gameOf } from '../../multiplayer/lobby.model';

// Eine Zeile aus game_results (eigene Ergebnisse, Uno je Runde)
export interface GameResult {
  game_id: string;
  round_no: number;
  game_key: string;
  placement: number;
  player_count: number;
  won: boolean;
  score: number | null;
  finished_at: string;
}

export interface GameBreakdown {
  key: string;
  name: string;
  icon: string;
  played: number;
  wins: number;
  winRate: number | null;
  // Flip 7: höchster Endstand, Uno: meiste Punkte in einer gewonnenen Runde
  best: number | null;
}

export interface GameStats {
  played: number;
  wins: number;
  winRate: number | null;
  evenings: number;
  // Nur Spiele ab 4 Spielern, darunter ist man immer unter den ersten drei
  top3Rate: number | null;
  averagePlacement: number | null;
  currentStreak: number;
  longestStreak: number;
  favorite: string | null;
  bestEvening: { date: Date; wins: number } | null;
  perGame: GameBreakdown[];
  recent: GameResult[];
}

// Ein Spieleabend geht bis 6 Uhr morgens
const EVENING_OFFSET_MS = 6 * 60 * 60 * 1000;
const RECENT_COUNT = 10;

const rate = (part: number, total: number): number | null => (total ? part / total : null);

function eveningOf(result: GameResult): string {
  const date = new Date(Date.parse(result.finished_at) - EVENING_OFFSET_MS);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// results: neueste zuerst (wie geladen)
export function computeStats(results: GameResult[]): GameStats {
  const wins = results.filter((result) => result.won).length;
  const bigGames = results.filter((result) => result.player_count >= 4);

  let longestStreak = 0;
  let run = 0;
  for (const result of [...results].reverse()) {
    run = result.won ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  const firstLoss = results.findIndex((result) => !result.won);
  const currentStreak = firstLoss === -1 ? results.length : firstLoss;

  const evenings = new Map<string, { date: Date; wins: number }>();
  for (const result of results) {
    const key = eveningOf(result);
    const evening = evenings.get(key) ?? { date: new Date(result.finished_at), wins: 0 };
    evening.wins += result.won ? 1 : 0;
    evenings.set(key, evening);
  }
  const bestEvening = [...evenings.values()].reduce<{ date: Date; wins: number } | null>(
    (best, evening) => (evening.wins > (best?.wins ?? 0) ? evening : best),
    null,
  );

  const perGame = GAMES.filter((game) => !game.url).map((game): GameBreakdown => {
    const own = results.filter((result) => result.game_key === game.key);
    const ownWins = own.filter((result) => result.won);
    const scores = (game.key === 'uno' ? ownWins : own)
      .map((result) => result.score)
      .filter((score): score is number => score !== null);
    return {
      key: game.key,
      name: game.name,
      icon: game.icon,
      played: own.length,
      wins: ownWins.length,
      winRate: rate(ownWins.length, own.length),
      best: game.key !== 'skip-bo' && scores.length ? Math.max(...scores) : null,
    };
  });
  const favorite = perGame.reduce<GameBreakdown | null>(
    (top, game) => (game.played > (top?.played ?? 0) ? game : top),
    null,
  );

  return {
    played: results.length,
    wins,
    winRate: rate(wins, results.length),
    evenings: evenings.size,
    top3Rate: rate(bigGames.filter((result) => result.placement <= 3).length, bigGames.length),
    averagePlacement: results.length
      ? results.reduce((sum, result) => sum + result.placement, 0) / results.length
      : null,
    currentStreak,
    longestStreak,
    favorite: favorite?.name ?? null,
    bestEvening,
    perGame,
    recent: results.slice(0, RECENT_COUNT),
  };
}

export const resultGameName = (result: GameResult): string =>
  gameOf(result.game_key)?.name ?? result.game_key;

@Injectable({ providedIn: 'root' })
export class GameResultsService {
  private readonly appErrors = inject(AppErrorService);

  // null = Fehler (schon gemeldet)
  async getResults(userId: string, limit = 5000): Promise<GameResult[] | null> {
    const { data, error } = await supabase
      .from('game_results')
      .select('game_id, round_no, game_key, placement, player_count, won, score, finished_at')
      .eq('user_id', userId)
      .order('finished_at', { ascending: false })
      // ponytail: alles auf einmal laden, bei sehr vielen Spielen in der DB zusammenfassen
      .limit(limit);

    if (error) {
      console.error('Spielergebnisse konnten nicht geladen werden.', error);
      this.appErrors.report(describeSupabaseError(error), { title: 'Statistik nicht geladen' });
      return null;
    }
    return data as GameResult[];
  }
}
