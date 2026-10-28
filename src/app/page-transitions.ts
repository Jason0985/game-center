import { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';

// Seitenwechsel wie in iOS: tiefer in eine Seite schiebt von rechts herein (forward),
// zurück schiebt nach rechts hinaus (back), zwischen Tabs wird überblendet (tab). Die
// Richtung steht als data-nav auf <html>; die Animation selbst steht in styles.scss.
export function onPageTransition({ transition, from, to }: ViewTransitionInfo): void {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    transition.skipTransition();
    return;
  }
  root.dataset['nav'] = direction(urlOf(from), urlOf(to));
  transition.finished.finally(() => delete root.dataset['nav']);
}

export function direction(from: string, to: string): 'forward' | 'back' | 'tab' {
  const a = depthOf(from);
  const b = depthOf(to);
  if (a === 0 && b === 0) return 'tab';
  if (b > a) return 'forward';
  if (b < a) return 'back';
  return 'tab';
}

// Tiefe in der App, nicht in der URL: Tabs sind 0; Einstellungen, Benachrichtigungen und
// das Ranking liegen eine Ebene unter ihrem Tab, obwohl ihre URL flach ist
const TAB_ROOTS = ['/', '/multiplayer', '/collection', '/profile'];
const NESTED_FLAT = ['/settings', '/notifications', '/ranking'];

function depthOf(url: string): number {
  const path = url.split(/[?#]/)[0] || '/';
  if (TAB_ROOTS.includes(path)) return 0;
  const segments = path.split('/').filter(Boolean).length;
  const flat = NESTED_FLAT.some((page) => path === page || path.startsWith(page + '/'));
  return flat ? segments : segments - 1;
}

function urlOf(snapshot: ActivatedRouteSnapshot): string {
  const parts: string[] = [];
  let node: ActivatedRouteSnapshot | null = snapshot;
  while (node) {
    parts.push(...node.url.map((segment) => segment.path));
    node = node.firstChild;
  }
  return '/' + parts.join('/');
}
