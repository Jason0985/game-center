import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { SkeletonRows } from '../../../ui/skeleton-rows';
import { carIdFrom, Gt7Car, Gt7Service, Gt7Status, Gt7Watch, nameFromId } from './gt7.service';

const dateTime = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const credits = (price: number | null) =>
  price === null ? '' : `Cr. ${price.toLocaleString('de-DE')}`;

/**
 * GT7-Tracker (nur Admins): aktueller Legend Cars Dealer aus Gran Turismo 7 und die eigene
 * Merkliste. Die Edge Function gt7-legend-check prüft zweimal täglich und meldet Autos von der
 * Merkliste per Mitteilung (und Push), sobald sie verfügbar sind.
 */
@Component({
  selector: 'app-gt7-tracker',
  imports: [MatIcon, RouterLink, SkeletonRows],
  templateUrl: './gt7-tracker.html',
  styleUrl: './gt7-tracker.scss',
})
export class Gt7Tracker {
  private readonly service = inject(Gt7Service);
  private readonly toast = inject(ToastService);
  readonly session = inject(SessionService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly running = signal<'check' | 'test' | null>(null);
  readonly draft = signal('');
  private readonly cars = signal<Gt7Car[]>([]);
  private readonly watches = signal<Gt7Watch[]>([]);
  readonly status = signal<Gt7Status | null>(null);

  private readonly watched = computed(() => new Set(this.watches().map((w) => w.car_id)));

  readonly dealer = computed(() =>
    this.cars().map((car) => ({
      car,
      title: car.maker && !car.name.startsWith(car.maker) ? `${car.maker} ${car.name}` : car.name,
      price: credits(car.price),
      watched: this.watched().has(car.car_id),
    })),
  );

  readonly watchlist = computed(() => {
    const byId = new Map(this.cars().map((car) => [car.car_id, car]));
    return this.watches().map((watch) => {
      const car = byId.get(watch.car_id);
      const state: 'available' | 'sold-out' | 'away' = !car
        ? 'away'
        : car.sold_out
          ? 'sold-out'
          : 'available';
      return {
        watch,
        title:
          watch.maker && !watch.name.startsWith(watch.maker)
            ? `${watch.maker} ${watch.name}`
            : watch.name,
        state,
        detail:
          state === 'available'
            ? `Beim Händler, ${credits(car!.price)}${car!.limited_stock ? ', wenige auf Lager' : ''}`
            : state === 'sold-out'
              ? 'Beim Händler, aber ausverkauft'
              : 'Gerade nicht beim Händler',
      };
    });
  });

  readonly statusText = computed(() => {
    const status = this.status();
    if (!status?.checked_at) return 'Noch nicht geprüft.';
    const checked = `Zuletzt geprüft ${dateTime.format(new Date(status.checked_at))}`;
    if (!status.ok) return `${checked}: ${status.message ?? 'Fehler.'}`;
    const page = status.page_updated_at
      ? `, Stand bei gtdb ${dateTime.format(new Date(status.page_updated_at))}`
      : '';
    return `${checked}${page}.`;
  });

  constructor() {
    effect(() => {
      if (this.session.initialized() && this.session.user()) void this.load();
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const { cars, watches, status } = await this.service.load();
      this.cars.set(cars);
      this.watches.set(watches);
      this.status.set(status);
    } catch {
      this.error.set('Der Tracker konnte nicht geladen werden. Prüf die Verbindung.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(car: Gt7Car): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId) return;
    try {
      if (this.watched().has(car.car_id)) await this.service.unwatch(car.car_id);
      else await this.service.watch(userId, car);
      await this.load();
    } catch {
      this.toast.error('Die Merkliste konnte nicht gespeichert werden.');
    }
  }

  async remove(watch: Gt7Watch): Promise<void> {
    try {
      await this.service.unwatch(watch.car_id);
      await this.load();
    } catch {
      this.toast.error('Das Auto konnte nicht entfernt werden.');
    }
  }

  async add(event: Event): Promise<void> {
    event.preventDefault();
    const userId = this.session.user()?.id;
    const id = carIdFrom(this.draft());
    if (!userId) return;
    if (!id) {
      this.toast.error('Füge einen Link wie gtdb.io/gt7/car/xj13-66/ oder die ID ein.');
      return;
    }
    const known = this.cars().find((car) => car.car_id === id);
    try {
      await this.service.watch(userId, known ?? { car_id: id, maker: '', name: nameFromId(id) });
      this.draft.set('');
      await this.load();
    } catch {
      this.toast.error('Das Auto konnte nicht hinzugefügt werden.');
    }
  }

  async run(test: boolean): Promise<void> {
    if (this.running()) return;
    this.running.set(test ? 'test' : 'check');
    try {
      const result = await this.service.run(test);
      if (result.ok) this.toast.success(test ? 'Test geschickt' : 'Geprüft', result.message);
      else this.toast.error(result.message);
      if (!test) await this.load();
    } finally {
      this.running.set(null);
    }
  }
}
