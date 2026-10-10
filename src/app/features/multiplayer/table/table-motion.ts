import {
  afterNextRender,
  AnimationCallbackEvent,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';

export function reducedMotion(): boolean {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Karte von einer Quelle (Stapel) an ihren Platz: kurz anheben, im Bogen hin, im letzten
// Drittel umdrehen. Jede id fliegt nur einmal und nie beim ersten Rendern (live false).
export class CardFlyIn {
  private readonly seen = new Set<string>();
  private batch = 0;

  constructor(private readonly live: () => boolean) {}

  fly(event: AnimationCallbackEvent, id: string, from: Element | null | undefined): void {
    const isNew = this.live() && !this.seen.has(id);
    this.seen.add(id);
    const card = event.target as HTMLElement;
    if (!isNew || !from || typeof card.animate !== 'function' || reducedMotion()) {
      event.animationComplete();
      return;
    }

    const delay = this.batch++ * 100;
    if (!delay) setTimeout(() => (this.batch = 0));
    void flyFrom(card, from, { delay }).finally(() => event.animationComplete());
  }
}

// Flug von einer Quelle (Element oder gemerkte Position) an den Platz der Karte.
// flip false: die Karte bleibt offen (kein Umdrehen im letzten Drittel); hidden: bis zum
// Start unsichtbar (sonst wartet sie während delay sichtbar auf der Quelle)
export function flyFrom(
  card: HTMLElement,
  from: Element | DOMRect,
  { flip = true, delay = 0, duration = 400, hidden = false } = {},
): Promise<void> {
  const start = from instanceof Element ? from.getBoundingClientRect() : from;
  const to = card.getBoundingClientRect();
  const dx = start.left + start.width / 2 - (to.left + to.width / 2);
  const dy = start.top + start.height / 2 - (to.top + to.height / 2);
  const scale = start.width / (to.width || 1);
  const middle = (scale + 1) / 2;
  return card
    .animate(
      [
        { translate: `${dx}px ${dy}px`, scale: `${scale}`, ...(hidden && { opacity: 0 }) },
        {
          translate: `${dx}px ${dy - 4}px`,
          scale: `${scale}`,
          ...(hidden && { opacity: 1 }),
          offset: 0.2,
        },
        { translate: `${dx * 0.45}px ${dy * 0.45 - 40}px`, scale: `${middle}`, offset: 0.6 },
        {
          translate: `${dx * 0.15}px ${dy * 0.15 - 16}px`,
          scale: flip ? `0 ${middle}` : `${middle}`,
          offset: 0.8,
        },
        { translate: '0 0', scale: '1' },
      ],
      { duration, delay, easing: 'ease-out', fill: 'backwards' },
    )
    .finished.then(
      () => undefined,
      () => undefined,
    );
}

export interface Flight {
  id: number;
  from: DOMRect;
  to: DOMRect;
  delay: number;
}

// Flugebene für Dinge ohne eigenen Platz (Uno: weitergegebene Hände, Blackjack: Chips):
// Das Spiel zeichnet je Flug ein Element (selector, mit data-flight = id) fest am Ziel
// (position fixed, to), das per flyFrom von der Quelle einfliegt; jeder Schub verschwindet
// nach seinem letzten Flug, spätere Schübe fliegen daneben weiter. T: was das Spiel je Flug
// zum Zeichnen braucht (z. B. den Chipwert); hidden wie bei flyFrom.
// Nur im Injection Context (Feld-Initialisierer der Komponente).
export function injectFlights<T extends object = object>(selector: string) {
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const injector = inject(Injector);
  const list = signal<(Flight & T)[]>([]);
  let nextId = 0;

  return {
    list: list.asReadonly(),
    launch(flights: (Omit<Flight, 'id'> & T)[], duration: number, hidden = false): void {
      if (!flights.length) return;
      const batch = flights.map((flight) => ({ ...flight, id: ++nextId }));
      list.update((current) => [...current, ...batch]);
      afterNextRender(
        () => {
          const done = batch.map((flight) => {
            const element = host.nativeElement.querySelector<HTMLElement>(
              `${selector}[data-flight="${flight.id}"]`,
            );
            return element && typeof element.animate === 'function'
              ? flyFrom(element, flight.from, {
                  flip: false,
                  delay: flight.delay,
                  duration,
                  hidden,
                })
              : Promise.resolve();
          });
          void Promise.all(done).then(() =>
            list.update((current) => current.filter((flight) => !batch.includes(flight))),
          );
        },
        { injector },
      );
    },
  };
}
