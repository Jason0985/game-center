import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { SkeletonRows } from '../../../ui/skeleton-rows';
import { Place, RouteCheckService, Schedule } from './route-check.service';
import { DAYS } from './route-format';

const SEARCH_DELAY_MS = 300;
const WORKDAYS = [1, 2, 3, 4, 5];

type Field = 'origin' | 'dest';

interface ScheduleDraft extends Schedule {
  key: number;
}

/** Route anlegen oder bearbeiten: Start, Ziel, Check-Zeiten und Benachrichtigungen. */
@Component({
  selector: 'app-route-editor',
  imports: [MatIcon, RouterLink, SkeletonRows],
  templateUrl: './route-editor.html',
  styleUrl: './route-editor.scss',
})
export class RouteEditor {
  private readonly service = inject(RouteCheckService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);
  readonly days = DAYS;
  readonly fields: Field[] = ['origin', 'dest'];

  // Aus der Route (:id); fehlt sie, wird eine neue Route angelegt
  readonly id = signal(inject(ActivatedRoute).snapshot.paramMap.get('id') ?? undefined);
  readonly editing = computed(() => !!this.id());

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly name = signal('');
  readonly origin = signal<Place | null>(null);
  readonly dest = signal<Place | null>(null);
  readonly schedules = signal<ScheduleDraft[]>([]);
  readonly liveAlerts = signal(true);
  readonly notifyClear = signal(true);

  // Ortssuche: Text je Feld, Vorschläge fürs gerade aktive Feld
  readonly queries = signal<Record<Field, string>>({ origin: '', dest: '' });
  readonly activeField = signal<Field | null>(null);
  readonly suggestions = signal<Place[]>([]);
  readonly searching = signal(false);
  readonly searchError = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private searchToken = 0;
  private nextKey = 1;

  readonly valid = computed(
    () => !!this.name().trim() && !!this.origin() && !!this.dest() && !this.saving(),
  );

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && this.session.user()) void this.load(id);
    });
    // Neue Route: wie im Alltag, morgens hin und nachmittags zurück
    if (!this.id()) {
      this.schedules.set([
        { key: this.nextKey++, time: '06:45', days: WORKDAYS, reverse: false },
        { key: this.nextKey++, time: '16:30', days: WORKDAYS, reverse: true },
      ]);
    }
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    const result = await this.service.get(id);
    this.loading.set(false);
    if (!result.ok || !result.value) {
      this.toast.error(result.ok ? 'Diese Route gibt es nicht mehr.' : result.message);
      void this.router.navigate(['/collection/routen-check']);
      return;
    }
    const route = result.value;
    this.name.set(route.name);
    this.origin.set({ label: route.origin_label, lat: route.origin_lat, lon: route.origin_lon });
    this.dest.set({ label: route.dest_label, lat: route.dest_lat, lon: route.dest_lon });
    this.queries.set({ origin: route.origin_label, dest: route.dest_label });
    this.schedules.set(route.schedules.map((s) => ({ ...s, key: this.nextKey++ })));
    this.liveAlerts.set(route.live_alerts);
    this.notifyClear.set(route.notify_clear);
  }

  // ---------------------------------------------------------------- Ortssuche

  type(field: Field, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.queries.update((q) => ({ ...q, [field]: value }));
    // Getippt: die gewählte Stelle gilt nicht mehr
    this[field].set(null);
    this.activeField.set(field);
    this.searchError.set('');
    clearTimeout(this.searchTimer);
    if (value.trim().length < 3) {
      this.suggestions.set([]);
      return;
    }
    this.searchTimer = setTimeout(() => void this.search(value.trim()), SEARCH_DELAY_MS);
  }

  private async search(query: string): Promise<void> {
    const token = ++this.searchToken;
    this.searching.set(true);
    const result = await this.service.search(query);
    if (token !== this.searchToken) return;
    this.searching.set(false);
    if (result.ok) {
      this.suggestions.set(result.value);
      if (!result.value.length) this.searchError.set('Nichts gefunden. Probier Straße und Ort.');
    } else {
      this.suggestions.set([]);
      this.searchError.set(result.message);
    }
  }

  selected(field: Field): Place | null {
    return this[field]();
  }

  focus(field: Field): void {
    if (this.activeField() !== field) this.suggestions.set([]);
    this.activeField.set(field);
  }

  blur(): void {
    // Kurz warten, damit ein Tipp auf einen Vorschlag noch ankommt
    setTimeout(() => {
      this.activeField.set(null);
      this.suggestions.set([]);
    }, 150);
  }

  choose(field: Field, place: Place): void {
    this[field].set(place);
    this.queries.update((q) => ({ ...q, [field]: place.label }));
    this.suggestions.set([]);
    this.activeField.set(null);
    if (!this.name().trim() && field === 'dest') this.name.set(defaultName(place.label));
  }

  swap(): void {
    const origin = this.origin();
    this.origin.set(this.dest());
    this.dest.set(origin);
    this.queries.update((q) => ({ origin: q.dest, dest: q.origin }));
  }

  // ---------------------------------------------------------------- Check-Zeiten

  addSchedule(): void {
    const last = this.schedules().at(-1);
    this.schedules.update((list) => [
      ...list,
      {
        key: this.nextKey++,
        time: last ? (last.reverse ? '06:45' : '16:30') : '07:00',
        days: last ? [...last.days] : WORKDAYS,
        reverse: last ? !last.reverse : false,
      },
    ]);
  }

  removeSchedule(key: number): void {
    this.schedules.update((list) => list.filter((s) => s.key !== key));
  }

  setTime(key: number, event: Event): void {
    const time = (event.target as HTMLInputElement).value;
    if (/^\d{2}:\d{2}$/.test(time)) this.updateSchedule(key, { time });
  }

  setReverse(key: number, reverse: boolean): void {
    this.updateSchedule(key, { reverse });
  }

  toggleDay(key: number, day: number): void {
    const schedule = this.schedules().find((s) => s.key === key);
    if (!schedule) return;
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day].sort((a, b) => a - b);
    // Mindestens ein Tag bleibt
    if (days.length) this.updateSchedule(key, { days });
  }

  private updateSchedule(key: number, patch: Partial<Schedule>): void {
    this.schedules.update((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  // ---------------------------------------------------------------- Speichern

  async save(): Promise<void> {
    const origin = this.origin();
    const dest = this.dest();
    if (!this.valid() || !origin || !dest) return;
    this.saving.set(true);
    const result = await this.service.save({
      id: this.id(),
      name: this.name().trim(),
      origin,
      dest,
      schedules: this.schedules().map(({ time, days, reverse }) => ({ time, days, reverse })),
      live_alerts: this.liveAlerts(),
      notify_clear: this.notifyClear(),
    });
    this.saving.set(false);
    if (!result.ok) {
      this.toast.error(result.message);
      return;
    }
    this.toast.success(this.editing() ? 'Route gespeichert' : 'Route angelegt');
    void this.router.navigate(['/collection/routen-check']);
  }

  async remove(): Promise<void> {
    const id = this.id();
    if (!id) return;
    const confirmed = await firstValueFrom(
      this.dialog
        .open<ConfirmationDialog, ConfirmationDialogData, boolean>(ConfirmationDialog, {
          data: {
            title: 'Route löschen?',
            message: `„${this.name()}“ und ihre Check-Zeiten werden gelöscht. Es kommen keine Mitteilungen mehr dazu.`,
            confirmLabel: 'Löschen',
            icon: 'delete',
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    const result = await this.service.remove(id);
    if (!result.ok) {
      this.toast.error(result.message);
      return;
    }
    this.toast.success('Route gelöscht');
    void this.router.navigate(['/collection/routen-check']);
  }
}

// "Firma GmbH, Frankfurt" -> "Firma GmbH"; "Hauptstraße 1, 60311 Frankfurt" -> "Hauptstraße 1"
function defaultName(label: string): string {
  return label.split(',')[0].trim().slice(0, 60);
}
