// Welcher Tab der Hauptnavigation zu einer URL gehört (Index 0–3, -1 = keiner)
const TABS = ['/multiplayer', '/collection', '/profile', '/settings'] as const;
// Seiten, die in der Sammlung liegen, aber eigene Pfade haben
const COLLECTION_PAGES = ['/ranking'];

export function tabOf(url: string): number {
  const path = url.split(/[?#]/)[0];
  if (path === '/' || path === '') return 0;
  if (COLLECTION_PAGES.some((page) => path === page || path.startsWith(page + '/'))) return 2;
  const i = TABS.findIndex((tab) => path === tab || path.startsWith(tab + '/'));
  // Einstellungen gehören zum Profil
  return i < 0 ? -1 : Math.min(i + 1, 3);
}
