import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { SkeletonRows } from '../../../ui/skeleton-rows';
import { forDirection } from '../../../../../supabase/functions/route-traffic/route-logic';
import { CheckResult, MAX_ROUTES, RouteCheckService, RouteWatch } from './route-check.service';
import { formatMinutes, formatSchedule, KIND, routeState, stateText } from './route-format';

const clock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dayClock = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Routen-Check: eigene Autostrecken mit der Lage beim letzten Check (Fahrzeit, Staus,
 * Baustellen, Sperrungen). Die Edge Function route-traffic prüft zu den Check-Zeiten und
 * meldet neue Staus und Sperrungen sofort per Mitteilung und Push.
 */
@Component({
  selector: 'app-route-check',
  imports: [MatIcon, RouterLink, SkeletonRows],
  templateUrl: './route-check.html',
  styleUrl: './route-check.scss',
})
export class RouteCheck {
  private readonly service = inject(RouteCheckService);
  private readonly toast = inject(ToastService);
  readonly session = inject(SessionService);
  readonly kind = KIND;
  readonly maxRoutes = MAX_ROUTES;

  readonly loading = signal(true);
  readonly error = signal('');
  readonly routes = signal<RouteWatch[]>([]);
  // Route-ID + Richtung, die gerade geprüft wird
  readonly checking = signal<string | null>(null);

  readonly cards = computed(() =>
    this.routes().map((route) => {
      const result = route.last_check;
      const reverse = result?.reverse ?? false;
      const incidents = result ? forDirection(result.incidents, reverse) : [];
      const state = routeState(result, incidents);
      return {
        route,
        result,
        reverse,
        state,
        status: stateText(result, state),
        meta: this.meta(route, result),
        incidents: [...incidents].sort(
          (a, b) => rank(a.kind) - rank(b.kind) || a.position - b.position,
        ),
        // Auf dem Band immer in Fahrtrichtung: Start links, Ziel rechts
        marks: incidents.map((incident) => ({
          incident,
          left: (reverse ? 1 - incident.position : incident.position) * 100,
        })),
        from: shortPlace(reverse ? route.dest_label : route.origin_label),
        to: shortPlace(reverse ? route.origin_label : route.dest_label),
        schedules: route.schedules.map(formatSchedule),
      };
    }),
  );

  constructor() {
    effect(() => {
      if (this.session.initialized() && this.session.user()) void this.load();
      else if (this.session.initialized()) this.loading.set(false);
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const result = await this.service.list();
    if (result.ok) this.routes.set(result.value);
    else this.error.set(result.message);
    this.loading.set(false);
  }

  async check(route: RouteWatch, reverse: boolean): Promise<void> {
    if (this.checking()) return;
    this.checking.set(`${route.id}:${reverse}`);
    const result = await this.service.check(route.id, reverse);
    this.checking.set(null);
    if (!result.ok) {
      this.toast.error(result.message);
      return;
    }
    this.routes.update((routes) =>
      routes.map((r) =>
        r.id === route.id
          ? { ...r, last_check: result.value, last_checked_at: result.value.checkedAt }
          : r,
      ),
    );
  }

  isChecking(route: RouteWatch, reverse: boolean): boolean {
    return this.checking() === `${route.id}:${reverse}`;
  }

  async toggleLive(route: RouteWatch): Promise<void> {
    const live = !route.live_alerts;
    this.patch(route.id, { live_alerts: live });
    const result = await this.service.update(route.id, { live_alerts: live });
    if (!result.ok) {
      this.patch(route.id, { live_alerts: !live });
      this.toast.error(result.message);
    }
  }

  private patch(id: string, patch: Partial<RouteWatch>): void {
    this.routes.update((routes) => routes.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  private meta(route: RouteWatch, result: CheckResult | null): string {
    const parts: string[] = [];
    if (result) {
      parts.push(result.reverse ? 'Rückweg' : 'Hinweg');
      const checked = new Date(result.checkedAt);
      const today = checked.toDateString() === new Date().toDateString();
      parts.push(`geprüft ${(today ? clock : dayClock).format(checked)}`);
    }
    const km = result?.lengthKm ?? (route.length_m ? Math.round(route.length_m / 100) / 10 : null);
    if (km) parts.push(`${km.toLocaleString('de-DE')} km`);
    const base =
      result?.baseMinutes ?? (route.base_seconds ? Math.round(route.base_seconds / 60) : null);
    if (base) parts.push(`sonst ${formatMinutes(base)}`);
    return parts.join(', ');
  }
}

const rank = (kind: string) => ['closure', 'jam', 'roadworks', 'warning'].indexOf(kind);

// "Musterstraße 5, 60311 Frankfurt am Main" -> "Frankfurt am Main"
function shortPlace(label: string): string {
  const parts = label
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1] ?? label;
  return last.replace(/^\d{4,5}\s+/, '') || label;
}
