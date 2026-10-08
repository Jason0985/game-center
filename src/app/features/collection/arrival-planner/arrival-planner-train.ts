import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ArrivalPlannerTrainSettingsDialog } from './arrival-planner-train-settings-dialog';
import {
  buildTrainSchedule,
  DEFAULT_TRAIN_PLANNER_SETTINGS,
  delayMinutes,
  isValidTrainSettings,
  pickRecommendedJourney,
  TrainJourney,
  TrainLeg,
  TrainLocation,
  TrainPlannerSettings,
  TrainStopTime,
  transferMinutes,
} from './arrival-planner-train.model';
import { TrainConnectionsService, TrainResult } from './train-connections.service';
import { UserStateService } from '../../../services/user-state.service';

const SETTINGS_STORAGE_KEY = 'game-center-arrival-planner-train-settings';
const ROUTE_STORAGE_KEY = 'game-center-arrival-planner-train-route';
const SUGGESTION_DELAY_MS = 300;
const TIME_ZONE = 'Europe/Berlin';

interface StoredRoute {
  from?: TrainLocation | null;
  to?: TrainLocation | null;
  time?: string;
}

const timeFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});
const dayFormat = new Intl.DateTimeFormat('de-DE', { timeZone: TIME_ZONE, dateStyle: 'short' });
const weekdayFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

const MODE_ICONS: Record<string, string> = {
  HIGHSPEED_RAIL: 'train',
  LONG_DISTANCE: 'train',
  NIGHT_RAIL: 'train',
  REGIONAL_FAST_RAIL: 'train',
  REGIONAL_RAIL: 'train',
  RAIL: 'train',
  SUBURBAN: 'directions_railway',
  SUBWAY: 'subway',
  TRAM: 'tram',
  BUS: 'directions_bus',
  COACH: 'directions_bus',
  FERRY: 'directions_boat',
};

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Eingabefeld mit Vorschlagsliste für Bahnhöfe und Adressen
class LocationField {
  readonly query = signal('');
  readonly selected = signal<TrainLocation | null>(null);
  readonly suggestions = signal<TrainLocation[]>([]);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private requestId = 0;

  constructor(private readonly search: (query: string) => Promise<TrainResult<TrainLocation[]>>) {}

  input(value: string): void {
    this.query.set(value);
    this.selected.set(null);
    this.error.set(null);
    clearTimeout(this.timer);
    const requestId = ++this.requestId;

    if (value.trim().length < 2) {
      this.suggestions.set([]);
      this.searching.set(false);
      return;
    }

    this.searching.set(true);
    this.timer = setTimeout(async () => {
      const result = await this.search(value.trim());
      // Ältere Antworten verwerfen, wenn inzwischen weitergetippt wurde
      if (requestId !== this.requestId) {
        return;
      }
      this.searching.set(false);
      this.suggestions.set(result.ok ? result.value : []);
      this.error.set(result.ok ? null : result.message);
    }, SUGGESTION_DELAY_MS);
  }

  set(location: TrainLocation | null): void {
    clearTimeout(this.timer);
    this.requestId++;
    this.selected.set(location);
    this.query.set(location?.name ?? '');
    this.suggestions.set([]);
    this.searching.set(false);
    this.error.set(null);
  }

  dispose(): void {
    clearTimeout(this.timer);
  }
}

interface SearchedRequest {
  from: TrainLocation;
  to: TrainLocation;
  target: Date;
}

@Component({
  selector: 'app-arrival-planner-train',
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './arrival-planner-train.html',
  styleUrl: './arrival-planner-train.scss',
})
export class ArrivalPlannerTrain {
  private readonly dialog = inject(MatDialog);
  private readonly connections = inject(TrainConnectionsService);
  private readonly userState = inject(UserStateService);

  readonly from = new LocationField((query) => this.connections.searchLocations(query));
  readonly to = new LocationField((query) => this.connections.searchLocations(query));
  readonly focusedField = signal<'from' | 'to' | null>(null);
  readonly arrivalDate = signal(todayIsoDate());
  readonly arrivalTime = signal('');
  readonly minDate = todayIsoDate();
  readonly settings = signal(this.loadSettings());

  readonly status = signal<'idle' | 'loading' | 'error' | 'done'>('idle');
  readonly errorMessage = signal('');
  readonly journeys = signal<TrainJourney[]>([]);
  readonly selectedIndex = signal(-1);
  readonly recommendedIndex = signal(-1);
  readonly request = signal<SearchedRequest | null>(null);

  readonly target = computed(() => {
    if (!this.arrivalDate() || !this.arrivalTime()) {
      return null;
    }
    const date = new Date(`${this.arrivalDate()}T${this.arrivalTime()}`);
    return Number.isNaN(date.getTime()) ? null : date;
  });

  readonly canSearch = computed(
    () =>
      !!this.from.selected() &&
      !!this.to.selected() &&
      !!this.target() &&
      this.status() !== 'loading',
  );

  readonly activeSuggestions = computed(() => {
    const field = this.focusedField();
    return field ? this[field].suggestions() : [];
  });

  readonly selectedJourney = computed(() => this.journeys()[this.selectedIndex()] ?? null);

  readonly schedule = computed(() => {
    const journey = this.selectedJourney();
    const request = this.request();
    if (!journey || !request) {
      return null;
    }
    return buildTrainSchedule(
      journey,
      request.target,
      this.settings(),
      request.from.kind === 'stop',
    );
  });

  constructor() {
    this.restoreRoute(this.read<StoredRoute>(ROUTE_STORAGE_KEY));
    this.userState.connect(
      'arrival-planner-train',
      () => ({ settings: this.settings(), route: this.route() }),
      (value) => {
        const stored = value as { settings?: Partial<TrainPlannerSettings>; route?: StoredRoute };
        if (stored?.settings && isValidTrainSettings(stored.settings)) {
          this.settings.set(stored.settings as TrainPlannerSettings);
          this.store(SETTINGS_STORAGE_KEY, stored.settings);
        }
        if (stored?.route) {
          this.restoreRoute(stored.route);
          this.store(ROUTE_STORAGE_KEY, this.route());
        }
      },
    );
    inject(DestroyRef).onDestroy(() => {
      this.from.dispose();
      this.to.dispose();
    });
  }

  // --- Eingaben -----------------------------------------------------------------------------

  onLocationInput(field: 'from' | 'to', event: Event): void {
    this[field].input((event.target as HTMLInputElement).value);
    this.resetResults();
  }

  onLocationEnter(field: 'from' | 'to', event: Event): void {
    const first = this[field].suggestions()[0];
    if (first) {
      event.preventDefault();
      this.chooseLocation(field, first);
    }
  }

  chooseLocation(field: 'from' | 'to', location: TrainLocation): void {
    this[field].set(location);
    this.focusedField.set(null);
    this.saveRoute();
  }

  swapLocations(): void {
    const from = this.from.selected();
    const fromQuery = this.from.query();
    const to = this.to.selected();
    const toQuery = this.to.query();
    this.from.set(to);
    this.from.query.set(toQuery);
    this.to.set(from);
    this.to.query.set(fromQuery);
    this.resetResults();
    this.saveRoute();
  }

  updateArrivalDate(event: Event): void {
    this.arrivalDate.set((event.target as HTMLInputElement).value);
    this.resetResults();
  }

  updateArrivalTime(event: Event): void {
    this.arrivalTime.set((event.target as HTMLInputElement).value);
    this.resetResults();
    this.saveRoute();
  }

  // --- Suche --------------------------------------------------------------------------------

  async search(): Promise<void> {
    const from = this.from.selected();
    const to = this.to.selected();
    const target = this.target();
    if (!from || !to || !target || this.status() === 'loading') {
      return;
    }

    const arriveBy = new Date(target.getTime() - this.settings().arrivalBufferMinutes * 60 * 1000);
    this.status.set('loading');
    const result = await this.connections.searchJourneys(from, to, arriveBy);

    if (!result.ok) {
      this.status.set('error');
      this.errorMessage.set(result.message);
      return;
    }

    const recommended = pickRecommendedJourney(result.value);
    this.request.set({ from, to, target });
    this.journeys.set(result.value);
    this.recommendedIndex.set(recommended);
    this.selectedIndex.set(recommended >= 0 ? recommended : result.value.length - 1);
    this.status.set('done');
  }

  selectJourney(index: number): void {
    this.selectedIndex.set(index);
  }

  openSettingsDialog(): void {
    this.dialog
      .open(ArrivalPlannerTrainSettingsDialog, {
        width: 'min(92vw, 480px)',
        data: this.settings(),
      })
      .afterClosed()
      .subscribe((settings: TrainPlannerSettings | undefined) => {
        if (settings) {
          // Der Puffer verschiebt die Suchzeit, also alte Ergebnisse verwerfen
          if (settings.arrivalBufferMinutes !== this.settings().arrivalBufferMinutes) {
            this.resetResults();
          }
          this.settings.set(settings);
          this.store(SETTINGS_STORAGE_KEY, settings);
          this.saveToAccount();
        }
      });
  }

  // --- Anzeige-Helfer -----------------------------------------------------------------------

  formatTime(value: string | Date): string {
    return timeFormat.format(typeof value === 'string' ? new Date(value) : value);
  }

  // "Vortag" o. ä., wenn der Zeitpunkt nicht am Tag der Wunsch-Ankunft liegt
  dayHint(value: string | Date): string | null {
    const target = this.request()?.target;
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!target || dayFormat.format(date) === dayFormat.format(target)) {
      return null;
    }
    const previousDay = new Date(target.getTime() - 24 * 60 * 60 * 1000);
    return dayFormat.format(date) === dayFormat.format(previousDay)
      ? 'Vortag'
      : weekdayFormat.format(date);
  }

  targetLabel(): string {
    const target = this.request()?.target;
    return target ? `${weekdayFormat.format(target)}, ${this.formatTime(target)} Uhr` : '';
  }

  delay(stop: TrainStopTime): number {
    return delayMinutes(stop);
  }

  transferBefore(legs: TrainLeg[], index: number): number | null {
    const previous = legs
      .slice(0, index)
      .reverse()
      .find((leg) => leg.kind === 'transit');
    return previous && legs[index].kind === 'transit'
      ? transferMinutes(previous, legs[index])
      : null;
  }

  modeIcon(leg: TrainLeg): string {
    return leg.kind === 'walk' ? 'directions_walk' : (MODE_ICONS[leg.mode] ?? 'commute');
  }

  transitLines(journey: TrainJourney): string[] {
    return journey.legs.filter((leg) => leg.kind === 'transit').map((leg) => leg.line ?? leg.mode);
  }

  transfersLabel(transfers: number): string {
    return transfers === 0 ? 'Direkt' : `${transfers} Umstieg${transfers === 1 ? '' : 'e'}`;
  }

  durationLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours} Std. ${minutes % 60} Min.` : `${minutes} Min.`;
  }

  locationIcon(location: TrainLocation): string {
    return location.kind === 'stop' ? 'train' : location.kind === 'address' ? 'home' : 'place';
  }

  // --- Speicher -----------------------------------------------------------------------------

  private resetResults(): void {
    if (this.status() === 'loading') {
      return;
    }
    this.status.set('idle');
    this.journeys.set([]);
    this.selectedIndex.set(-1);
    this.recommendedIndex.set(-1);
    this.request.set(null);
  }

  private route(): StoredRoute {
    return { from: this.from.selected(), to: this.to.selected(), time: this.arrivalTime() };
  }

  private saveRoute(): void {
    this.store(ROUTE_STORAGE_KEY, this.route());
    this.saveToAccount();
  }

  private saveToAccount(): void {
    this.userState.save('arrival-planner-train', {
      settings: this.settings(),
      route: this.route(),
    });
  }

  private restoreRoute(route: StoredRoute | null): void {
    const isLocation = (value: unknown): value is TrainLocation =>
      typeof (value as TrainLocation)?.place === 'string' &&
      typeof (value as TrainLocation)?.name === 'string';

    if (isLocation(route?.from)) {
      this.from.set(route.from);
    }
    if (isLocation(route?.to)) {
      this.to.set(route.to);
    }
    if (typeof route?.time === 'string' && /^\d{2}:\d{2}$/.test(route.time)) {
      this.arrivalTime.set(route.time);
    }
  }

  private loadSettings(): TrainPlannerSettings {
    const stored = this.read<Partial<TrainPlannerSettings>>(SETTINGS_STORAGE_KEY);
    return stored && isValidTrainSettings(stored)
      ? (stored as TrainPlannerSettings)
      : { ...DEFAULT_TRAIN_PLANNER_SETTINGS };
  }

  private read<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  private store(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ohne Speicher geht nur das Merken verloren
    }
  }
}
