import { Injectable, inject, signal } from '@angular/core';
import { PaddleDebtEntry, PaddlePlayer } from './paddle-player.model';
import { UserStateService } from '../../../services/user-state.service';

const STORAGE_KEY = 'gameroster:paddle-players';
const DEBTS_STORAGE_KEY = 'gameroster:paddle-debts';
const WIN_VALUE_STORAGE_KEY = 'gameroster:paddle-win-value';
const DEFAULT_WIN_VALUE = 2.5;

interface PaddleState {
  players: PaddlePlayer[];
  debtEntries: PaddleDebtEntry[];
  winValue: number;
}

@Injectable({ providedIn: 'root' })
export class PaddleService {
  private readonly userState = inject(UserStateService);
  readonly defaultWinValue = DEFAULT_WIN_VALUE;
  readonly winValue = signal(this.loadWinValue());
  readonly players = signal<PaddlePlayer[]>(this.loadPlayers());
  readonly debtEntries = signal<PaddleDebtEntry[]>(this.loadDebtEntries());

  constructor() {
    this.userState.connect<PaddleState>(
      'paddle',
      () => (this.players().length || this.debtEntries().length ? this.state() : null),
      (value) => this.applyState(value),
    );
  }

  addPlayer(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    this.players.update((players) => [
      ...players,
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        wins: 0,
        losses: 0,
        balance: 0,
      },
    ]);
    this.persist();
  }

  removePlayer(playerId: string): void {
    this.players.update((players) => players.filter((player) => player.id !== playerId));
    this.persist();
  }

  recordWin(playerId: string): void {
    this.updatePlayer(playerId, (player) => ({
      ...player,
      wins: player.wins + 1,
      balance: player.balance + this.winValue(),
    }));
  }

  recordLoss(playerId: string): void {
    this.updatePlayer(playerId, (player) => ({
      ...player,
      losses: player.losses + 1,
      balance: player.balance - this.winValue(),
    }));
  }

  setWinValue(value: number): void {
    if (!Number.isFinite(value) || value <= 0) return;

    const normalizedValue = Math.round(value * 100) / 100;
    this.winValue.set(normalizedValue);
    this.persist();
  }

  addDebtEntry(winnerIds: string[], loserIds: string[], rounds = 1): void {
    const uniqueWinnerIds = [...new Set(winnerIds)];
    const uniqueLoserIds = [...new Set(loserIds)];
    const participantIds = new Set([...uniqueWinnerIds, ...uniqueLoserIds]);
    const normalizedRounds = Number.isInteger(rounds) && rounds > 0 ? rounds : 1;
    const currentWinValue = this.winValue();

    if (
      uniqueWinnerIds.length === 0 ||
      uniqueLoserIds.length === 0 ||
      participantIds.size < 2 ||
      participantIds.size > 4
    ) {
      return;
    }

    this.players.update((players) =>
      players.map((player) => {
        const wins = uniqueWinnerIds.includes(player.id) ? normalizedRounds : 0;
        const losses = uniqueLoserIds.includes(player.id) ? normalizedRounds : 0;

        return wins || losses
          ? {
              ...player,
              wins: player.wins + wins,
              losses: player.losses + losses,
              balance: player.balance + (wins - losses) * currentWinValue,
            }
          : player;
      }),
    );

    this.debtEntries.update((entries) => [
      ...entries,
      {
        id: crypto.randomUUID(),
        winnerIds: uniqueWinnerIds,
        loserIds: uniqueLoserIds,
        rounds: normalizedRounds,
        winValue: currentWinValue,
      },
    ]);
    this.persist();
  }

  endGame(): void {
    this.players.set([]);
    this.debtEntries.set([]);
    this.persist();
  }

  private updatePlayer(playerId: string, update: (player: PaddlePlayer) => PaddlePlayer): void {
    this.players.update((players) =>
      players.map((player) => (player.id === playerId ? update(player) : player)),
    );
    this.persist();
  }

  private state(): PaddleState {
    return { players: this.players(), debtEntries: this.debtEntries(), winValue: this.winValue() };
  }

  // Stand aus dem Konto übernehmen
  private applyState(value: unknown): void {
    const state = value as Partial<PaddleState> | null;
    if (!Array.isArray(state?.players) || !Array.isArray(state.debtEntries)) return;

    this.players.set(state.players);
    this.debtEntries.set(state.debtEntries);
    const winValue = Number(state.winValue);
    this.winValue.set(Number.isFinite(winValue) && winValue > 0 ? winValue : DEFAULT_WIN_VALUE);
    this.storeLocal();
  }

  private persist(): void {
    this.storeLocal();
    this.userState.save('paddle', this.state());
  }

  private storeLocal(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.players()));
      localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(this.debtEntries()));
      localStorage.setItem(WIN_VALUE_STORAGE_KEY, String(this.winValue()));
    } catch {}
  }

  private loadPlayers(): PaddlePlayer[] {
    try {
      const rawPlayers = localStorage.getItem(STORAGE_KEY);
      if (!rawPlayers) return [];

      const players = JSON.parse(rawPlayers) as PaddlePlayer[];
      return Array.isArray(players) ? players : [];
    } catch {
      return [];
    }
  }

  private loadDebtEntries(): PaddleDebtEntry[] {
    try {
      const rawEntries = localStorage.getItem(DEBTS_STORAGE_KEY);
      if (!rawEntries) return [];

      const entries = JSON.parse(rawEntries) as PaddleDebtEntry[];
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  private loadWinValue(): number {
    try {
      const rawValue = localStorage.getItem(WIN_VALUE_STORAGE_KEY);
      if (!rawValue) return DEFAULT_WIN_VALUE;

      const value = Number(rawValue);
      return Number.isFinite(value) && value > 0 ? value : DEFAULT_WIN_VALUE;
    } catch {
      return DEFAULT_WIN_VALUE;
    }
  }
}
