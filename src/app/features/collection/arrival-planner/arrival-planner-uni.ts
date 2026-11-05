import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ArrivalPlannerSettings, SKIP_LECTURE } from './arrival-planner.model';
import { Lecture, RaplaService, addDays, isoDate } from './rapla.service';

const DEFAULT_EARLY = 10;
const RAPLA_URL = /^https:\/\/([a-z0-9-]+\.)*dhbw\.de\/.*rapla.*[?&]key=/i;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function clock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Nur für Admins: Weckzeit aus dem Rapla-Stundenplan. Nimmt die früheste Vorlesung des
 * gewählten Tages (Standard: morgen) und rechnet mit den Auto-Einstellungen zurück.
 */
@Component({
  selector: 'app-arrival-planner-uni',
  imports: [MatIconModule],
  templateUrl: './arrival-planner-uni.html',
  styleUrl: './arrival-planner-uni.scss',
})
export class ArrivalPlannerUni {
  private readonly rapla = inject(RaplaService);
  readonly settings = input.required<ArrivalPlannerSettings>();
  readonly settingsChange = output<ArrivalPlannerSettings>();

  readonly today = isoDate(new Date());
  readonly date = signal(addDays(this.today, 1));
  readonly editing = signal(false);
  readonly draftUrl = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  private readonly week = signal<Lecture[]>([]);

  readonly url = computed(() => this.settings().raplaUrl ?? '');
  readonly early = computed(() => this.settings().lectureEarlyMinutes ?? DEFAULT_EARLY);
  readonly draftValid = computed(() => RAPLA_URL.test(this.draftUrl().trim()));

  readonly dayLabel = computed(() => {
    const date = this.date();
    const text = new Date(`${date}T12:00:00`).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
    const prefix = date === this.today ? 'Heute' : date === addDays(this.today, 1) ? 'Morgen' : '';
    return prefix ? `${prefix}, ${text}` : text;
  });

  // Ausgeschlossene Titel: eigene Liste oder, solange keine gespeichert ist, SKIP_LECTURE
  readonly isIgnored = (title: string): boolean => {
    const list = this.settings().raplaIgnore;
    return list ? list.includes(title) : SKIP_LECTURE.test(title);
  };
  readonly lectures = computed(() =>
    this.week()
      .filter((l) => l.date === this.date())
      .map((l) => ({ ...l, ignored: this.isIgnored(l.title) })),
  );
  readonly first = computed(() => this.lectures().find((l) => !l.ignored) ?? null);
  // Nächster Tag mit Vorlesung in derselben Woche, falls der gewählte frei ist
  readonly nextDay = computed(() =>
    this.first()
      ? null
      : (this.week().find((l) => l.date > this.date() && !this.isIgnored(l.title)) ?? null),
  );

  readonly plan = computed(() => {
    const first = this.first();
    if (!first) return null;
    const s = this.settings();
    const arrive = toMinutes(first.start) - this.early();
    const departure = arrive - s.travelMinutes - s.trafficBufferMinutes;
    const alarm = departure - s.preparationMinutes;
    return {
      alarm: { time: clock(alarm), dayBefore: alarm < 0 },
      departure: { time: clock(departure), dayBefore: departure < 0 },
      arrive: clock(arrive),
    };
  });

  constructor() {
    effect(() => {
      const url = this.url();
      const date = this.date();
      if (url) void this.load(url, date);
    });
  }

  async load(url: string, date: string, refresh = false): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const result = await this.rapla.lectures(url, date, refresh);
    // Inzwischen anderer Tag oder Link gewählt: altes Ergebnis verwerfen
    if (url !== this.url() || date !== this.date()) return;
    this.loading.set(false);
    if (result.ok) this.week.set(result.lectures);
    else {
      this.week.set([]);
      this.error.set(result.message);
    }
  }

  reload(): void {
    if (this.url()) void this.load(this.url(), this.date(), true);
  }

  shiftDay(days: number): void {
    this.date.update((d) => addDays(d, days));
  }

  pickDate(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.date.set(value);
  }

  startEdit(): void {
    this.draftUrl.set(this.url());
    this.editing.set(true);
  }

  onDraft(event: Event): void {
    this.draftUrl.set((event.target as HTMLInputElement).value);
  }

  saveUrl(): void {
    if (!this.draftValid()) return;
    this.settingsChange.emit({ ...this.settings(), raplaUrl: this.draftUrl().trim() });
    this.editing.set(false);
  }

  /** Eintrag als Vorlesung zählen oder nicht; speichert die ganze Liste im Konto. */
  toggleIgnore(title: string): void {
    const current =
      this.settings().raplaIgnore ??
      [...new Set(this.week().map((l) => l.title))].filter((t) => SKIP_LECTURE.test(t));
    const next = current.includes(title) ? current.filter((t) => t !== title) : [...current, title];
    this.settingsChange.emit({ ...this.settings(), raplaIgnore: next });
  }

  changeEarly(delta: number): void {
    const next = Math.max(0, Math.min(60, this.early() + delta));
    this.settingsChange.emit({ ...this.settings(), lectureEarlyMinutes: next });
  }
}
