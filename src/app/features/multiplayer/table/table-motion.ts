import { AnimationCallbackEvent } from '@angular/core';

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
// flip false: die Karte bleibt offen (kein Umdrehen im letzten Drittel)
export function flyFrom(
  card: HTMLElement,
  from: Element | DOMRect,
  { flip = true, delay = 0 } = {},
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
        { translate: `${dx}px ${dy}px`, scale: `${scale}` },
        { translate: `${dx}px ${dy - 4}px`, scale: `${scale}`, offset: 0.2 },
        { translate: `${dx * 0.45}px ${dy * 0.45 - 40}px`, scale: `${middle}`, offset: 0.6 },
        {
          translate: `${dx * 0.15}px ${dy * 0.15 - 16}px`,
          scale: flip ? `0 ${middle}` : `${middle}`,
          offset: 0.8,
        },
        { translate: '0 0', scale: '1' },
      ],
      { duration: 400, delay, easing: 'ease-out', fill: 'backwards' },
    )
    .finished.then(
      () => undefined,
      () => undefined,
    );
}
