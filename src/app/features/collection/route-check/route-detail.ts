import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  distanceM,
  forDirection,
  MAX_VIAS,
  orderVias,
} from '../../../../../supabase/functions/route-traffic/route-logic';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { SkeletonRows } from '../../../ui/skeleton-rows';
import {
  LatLon,
  Place,
  RouteCheckService,
  RouteOption,
  RouteStep,
  RouteWatch,
  Via,
} from './route-check.service';
import { formatMinutes, KIND } from './route-format';
import { MapLine, MapMarker, RouteMap } from './route-map';

const SEARCH_DELAY_MS = 300;

/**
 * Strecke einer Route im Detail: Karte und Straßenverlauf, den der Routen-Check prüft.
 * Anpassen über Zwischenziele (Suche oder Tippen auf die Karte) oder eine der Alternativen;
 * gespeichert wird über die Edge Function (Aktion reroute), die die Strecke neu plant.
 */
@Component({
  selector: 'app-route-detail',
  imports: [MatIcon, RouterLink, SkeletonRows, RouteMap],
  templateUrl: './route-detail.html',
  styleUrl: './route-detail.scss',
})
export class RouteDetail {
  private readonly service = inject(RouteCheckService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);
  readonly maxVias = MAX_VIAS;
  readonly kind = KIND;
  readonly formatTime = formatMinutes;

  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(true);
  readonly route = signal<RouteWatch | null>(null);

  // Entwurf: Zwischenziele und die Strecken zum Vergleichen (null = noch nicht geplant)
  readonly vias = signal<Via[]>([]);
  readonly options = signal<RouteOption[] | null>(null);
  readonly selected = signal(0);
  readonly planning = signal(false);
  readonly saving = signal(false);
  readonly planError = signal('');

  // Ortssuche fürs Zwischenziel
  readonly query = signal('');
  readonly suggestions = signal<Place[]>([]);
  readonly searching = signal(false);
  readonly searchError = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private searchToken = 0;
  private planToken = 0;

  readonly viasChanged = computed(() => {
    const route = this.route();
    return !!route && !sameVias(route.vias ?? [], this.vias());
  });

  // Etwas zu speichern: andere Zwischenziele oder eine andere Strecke gewählt
  readonly dirty = computed(() => {
    const route = this.route();
    if (!route) return false;
    if (this.viasChanged()) return true;
    const options = this.options();
    if (!options) return false;
    // Gewählt ist eine Alternative oder (bei fest gewählter Strecke) wieder die schnellste
    return this.selected() > 0 || route.follow_path;
  });

  readonly current = computed(() => {
    const route = this.route();
    const option = this.options()?.[this.selected()];
    if (option) {
      return {
        path: option.path,
        steps: option.steps,
        roads: option.roads,
        km: option.lengthM ? Math.round(option.lengthM / 100) / 10 : null,
        minutes: option.travelSeconds ? Math.round(option.travelSeconds / 60) : null,
        delay: option.delaySeconds ? Math.round(option.delaySeconds / 60) : 0,
        saved: false,
      };
    }
    if (!route) return null;
    const result = route.last_check?.reverse === false ? route.last_check : null;
    return {
      path: route.path ?? [],
      steps: route.steps ?? [],
      roads: route.roads ?? [],
      km: route.length_m ? Math.round(route.length_m / 100) / 10 : null,
      minutes:
        result?.travelMinutes ?? (route.base_seconds ? Math.round(route.base_seconds / 60) : null),
      delay: result?.delayMinutes ?? 0,
      saved: true,
    };
  });

  readonly lines = computed<MapLine[]>(() => {
    const options = this.options();
    if (options) {
      return options.map((option, index) => ({
        id: String(index),
        path: option.path,
        tone: index === this.selected() ? 'main' : 'alt',
      }));
    }
    const path = this.route()?.path ?? [];
    return path.length > 1 ? [{ id: 'saved', path, tone: 'main' }] : [];
  });

  readonly markers = computed<MapMarker[]>(() => {
    const route = this.route();
    if (!route) return [];
    const markers: MapMarker[] = [
      {
        lat: route.origin_lat,
        lon: route.origin_lon,
        kind: 'start',
        label: `Start: ${route.origin_label}`,
      },
      {
        lat: route.dest_lat,
        lon: route.dest_lon,
        kind: 'goal',
        label: `Ziel: ${route.dest_label}`,
      },
      ...this.vias().map((via) => ({
        lat: via.lat,
        lon: via.lon,
        kind: 'via' as const,
        label: `Über: ${via.label}`,
      })),
    ];
    // Störungen vom letzten Check nur auf der gespeicherten Strecke
    if (!this.options() && route.last_check && route.path?.length > 1) {
      for (const incident of forDirection(route.last_check.incidents, route.last_check.reverse)) {
        const [lat, lon] = pointAlong(route.path, incident.position);
        markers.push({ lat, lon, kind: incident.kind, label: incident.title });
      }
    }
    return markers;
  });

  readonly optionCards = computed(() => {
    const options = this.options() ?? [];
    const fastest = Math.min(...options.map((o) => o.travelSeconds ?? Infinity));
    return options.map((option, index) => {
      const minutes = option.travelSeconds ? Math.round(option.travelSeconds / 60) : null;
      const slower =
        option.travelSeconds && Number.isFinite(fastest)
          ? Math.round((option.travelSeconds - fastest) / 60)
          : 0;
      return {
        index,
        title:
          index === 0
            ? this.vias().length
              ? 'Über deine Punkte'
              : 'Schnellste'
            : `Alternative ${index}`,
        time: minutes !== null ? formatMinutes(minutes) : '–',
        note: slower > 0 ? `+${slower} Min.` : index === 0 || slower === 0 ? 'am schnellsten' : '',
        km: option.lengthM
          ? `${(Math.round(option.lengthM / 100) / 10).toLocaleString('de-DE')} km`
          : '',
        via: summary(option.steps, option.roads),
      };
    });
  });

  constructor() {
    effect(() => {
      if (this.session.initialized() && this.session.user()) void this.load();
      else if (this.session.initialized()) this.loading.set(false);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const result = await this.service.get(this.id);
    this.loading.set(false);
    if (!result.ok || !result.value) {
      this.toast.error(result.ok ? 'Diese Route gibt es nicht mehr.' : result.message);
      void this.router.navigate(['/collection/routen-check']);
      return;
    }
    this.route.set(result.value);
    this.vias.set(result.value.vias ?? []);
  }

  // ---------------------------------------------------------------- Strecken vergleichen

  async plan(): Promise<void> {
    const route = this.route();
    if (!route) return;
    const token = ++this.planToken;
    this.planning.set(true);
    this.planError.set('');
    const result = await this.service.plan(origin(route), dest(route), this.vias());
    if (token !== this.planToken) return;
    this.planning.set(false);
    if (!result.ok) {
      this.planError.set(result.message);
      return;
    }
    this.options.set(result.value);
    this.selected.set(0);
  }

  select(index: number): void {
    if (this.options()?.[index]) this.selected.set(index);
  }

  chooseLine(id: string): void {
    this.select(Number(id));
  }

  // ---------------------------------------------------------------- Zwischenziele

  // Tippen auf die Karte: über diese Stelle fahren
  pickOnMap(point: LatLon): void {
    if (this.vias().length >= MAX_VIAS || this.saving()) return;
    const route = this.route();
    if (!route) return;
    // Zu nah an Start oder Ziel: kein sinnvoller Zwischenpunkt
    const ends: LatLon[] = [
      [route.origin_lat, route.origin_lon],
      [route.dest_lat, route.dest_lon],
    ];
    if (ends.some((end) => distanceM(end, point) < 300)) return;
    this.addVia({
      label: `Punkt auf der Karte ${this.vias().length + 1}`,
      lat: point[0],
      lon: point[1],
    });
  }

  addVia(via: Via): void {
    if (this.vias().length >= MAX_VIAS) return;
    const path = this.current()?.path ?? this.route()?.path ?? [];
    this.vias.set(orderVias([...this.vias(), via], path));
    void this.plan();
  }

  removeVia(index: number): void {
    this.vias.update((vias) => vias.filter((_, i) => i !== index));
    void this.plan();
  }

  // Zurück zur schnellsten Strecke ohne Zwischenziele
  fastest(): void {
    this.vias.set([]);
    void this.plan();
  }

  type(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
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

  chooseSuggestion(place: Place): void {
    this.query.set('');
    this.suggestions.set([]);
    this.addVia(place);
  }

  // ---------------------------------------------------------------- Speichern

  async save(): Promise<void> {
    const route = this.route();
    if (!route || !this.dirty() || this.saving() || this.planning()) return;
    const options = this.options();
    const index = this.selected();
    // Alternative gewählt: genau diese Strecke; sonst die schnellste über die Zwischenziele
    const path = options && index > 0 ? options[index].path : undefined;
    this.saving.set(true);
    const result = await this.service.reroute(route.id, this.vias(), path);
    this.saving.set(false);
    if (!result.ok) {
      this.toast.error(result.message);
      return;
    }
    this.route.set(result.value);
    this.vias.set(result.value.vias ?? []);
    this.options.set(null);
    this.selected.set(0);
    this.toast.success('Strecke gespeichert', 'Der Routen-Check prüft ab jetzt diese Strecke.');
  }

  discard(): void {
    this.vias.set(this.route()?.vias ?? []);
    this.options.set(null);
    this.selected.set(0);
    this.planError.set('');
    this.planToken++;
    this.planning.set(false);
  }

  roadKind(road: string): 'a' | 'b' | 'other' {
    if (/^A\d/.test(road)) return 'a';
    if (/^B\d/.test(road)) return 'b';
    return 'other';
  }
}

const origin = (route: RouteWatch): Place => ({
  label: route.origin_label,
  lat: route.origin_lat,
  lon: route.origin_lon,
});
const dest = (route: RouteWatch): Place => ({
  label: route.dest_label,
  lat: route.dest_lat,
  lon: route.dest_lon,
});

const sameVias = (a: Via[], b: Via[]) =>
  a.length === b.length && a.every((via, i) => via.lat === b[i].lat && via.lon === b[i].lon);

// Kurz: "über A5, A661" bzw. die längsten Straßen
function summary(steps: RouteStep[], roads: string[]): string {
  if (roads.length) return `über ${roads.slice(0, 4).join(', ')}`;
  const longest = [...steps].sort((a, b) => b.km - a.km).slice(0, 3);
  return longest.length ? `über ${longest.map((s) => s.road).join(', ')}` : '';
}

// Punkt bei fraction (0–1) entlang der Strecke
export function pointAlong(path: LatLon[], fraction: number): LatLon {
  if (path.length < 2) return path[0] ?? [0, 0];
  const lengths = path.slice(1).map((point, i) => distanceM(path[i], point));
  let rest = Math.max(0, Math.min(1, fraction)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (rest <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? Math.min(1, rest / lengths[i]) : 0;
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * t,
        path[i][1] + (path[i + 1][1] - path[i][1]) * t,
      ];
    }
    rest -= lengths[i];
  }
  return path[path.length - 1];
}
