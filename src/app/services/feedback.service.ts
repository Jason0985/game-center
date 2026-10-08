import { DestroyRef, Injectable, inject, signal } from '@angular/core';

// tap: eigener Zug; turn: man ist dran; alert: Uno-Ruf, Flip 7 eines anderen;
// win: man hat gewonnen; bust: bei Flip 7 rausgeflogen
export type FeedbackCue = 'tap' | 'turn' | 'alert' | 'win' | 'bust';

// Ton: Frequenz (Hz), Start und Dauer (s) ab Abspielbeginn
type Note = [hz: number, at: number, duration: number];

// Vibration in ms (an, Pause, an …); unter ~30 ms spüren viele Handys nichts
const CUES: Record<FeedbackCue, { vibrate: number | number[]; notes: Note[] }> = {
  tap: { vibrate: 35, notes: [[880, 0, 0.05]] },
  turn: {
    vibrate: [150, 100, 150],
    notes: [
      [659, 0, 0.12],
      [988, 0.1, 0.22],
    ],
  },
  alert: {
    vibrate: [200, 100, 200, 100, 200],
    notes: [
      [784, 0, 0.09],
      [784, 0.12, 0.09],
      [1047, 0.24, 0.25],
    ],
  },
  win: {
    vibrate: [120, 80, 120, 80, 400],
    notes: [
      [523, 0, 0.12],
      [659, 0.12, 0.12],
      [784, 0.24, 0.12],
      [1047, 0.36, 0.45],
    ],
  },
  bust: {
    vibrate: 500,
    notes: [
      [311, 0, 0.18],
      [233, 0.16, 0.35],
    ],
  },
};

const VOLUME = 0.18;
const STORAGE_KEY = 'game-center-feedback';

// Töne und Vibration am Spieltisch; beides abschaltbar, gilt nur für dieses Gerät
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly stored = readStored();
  readonly sound = signal(this.stored.sound ?? true);
  readonly vibration = signal(this.stored.vibration ?? true);
  // iPhone/iPad und Desktop-Browser vibrieren nicht
  readonly canVibrate = typeof globalThis.navigator?.vibrate === 'function';
  private audio: AudioContext | null = null;

  constructor() {
    // Browser (vor allem Safari) spielen Töne erst nach einem Tippen; der Zug-Ton kommt
    // aber per Realtime, darum jedes Tippen nutzen, um den Ton freizuschalten
    const unlock = () => {
      if (this.sound()) void this.context()?.resume();
    };
    addEventListener('pointerdown', unlock, { capture: true, passive: true });
    inject(DestroyRef).onDestroy(() => removeEventListener('pointerdown', unlock, true));
  }

  play(cue: FeedbackCue): void {
    const { vibrate, notes } = CUES[cue];
    if (this.vibration() && this.canVibrate) navigator.vibrate(vibrate);
    if (this.sound()) this.tone(notes);
  }

  setSound(on: boolean): void {
    this.sound.set(on);
    this.save();
    if (on) this.play('turn');
  }

  setVibration(on: boolean): void {
    this.vibration.set(on);
    this.save();
    if (on) this.play('turn');
  }

  private tone(notes: Note[]): void {
    const ctx = this.context();
    if (!ctx) return;

    void ctx.resume();
    const start = ctx.currentTime;
    for (const [hz, at, duration] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = start + at;
      osc.type = 'triangle';
      osc.frequency.value = hz;
      // Kurz ein- und ausblenden, sonst knackt es
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(VOLUME, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    }
  }

  private context(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    return (this.audio ??= new AudioContext());
  }

  private save(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sound: this.sound(), vibration: this.vibration() }),
      );
    } catch {
      // Speicher nicht verfügbar (z. B. privater Modus): gilt nur für diese Sitzung
    }
  }
}

function readStored(): { sound?: boolean; vibration?: boolean } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}
