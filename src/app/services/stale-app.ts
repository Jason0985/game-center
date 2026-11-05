// Nach einem Deploy fehlen auf GitHub Pages die alten Code-Teile (Dateinamen mit Hash). Läuft im
// Browser noch die alte App, schlägt das Nachladen beim Seitenwechsel fehl. Dann hilft nur ein
// Neuladen – einmal, damit bei echten Netzfehlern keine Schleife entsteht.

const RELOAD_KEY = 'game-center-stale-reload';
const RELOAD_WINDOW_MS = 60_000;

const CHUNK_ERROR =
  /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed|Unable to preload CSS/i;

/** Fehler beim Nachladen eines Code-Teils (alte App nach einem Deploy, kurz offline). */
export function isChunkLoadError(error: unknown): boolean {
  const cause = (error as { rejection?: unknown; error?: unknown })?.rejection ?? error;
  const message =
    cause instanceof Error
      ? `${cause.name}: ${cause.message}`
      : String((cause as { message?: unknown })?.message ?? cause ?? '');
  return CHUNK_ERROR.test(message);
}

/**
 * Seite einmal neu laden (optional mit Ziel-URL). Gibt false zurück, wenn in der letzten Minute
 * schon neu geladen wurde – dann ist es kein veralteter Stand, sondern ein echter Fehler.
 */
export function reloadOnce(url?: string): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Ohne sessionStorage lieber nicht automatisch neu laden (könnte sonst kreisen)
    return false;
  }
  if (url) location.assign(url);
  else location.reload();
  return true;
}

/** Anonyme Meldung des Browsers für Fehler aus fremden Skripten (z. B. Erweiterungen). */
export function isOpaqueScriptError(error: unknown): boolean {
  const cause = (error as { rejection?: unknown })?.rejection ?? error;
  const message = cause instanceof Error ? cause.message : String(cause ?? '');
  return /^(Error: )?Script error\.?$/i.test(message.trim());
}

/** Gerade (in den letzten Sekunden) neu geladen: Folgefehler desselben Ladevorgangs nicht melden. */
export function reloadJustStarted(ms = 5000): boolean {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) < ms;
  } catch {
    return false;
  }
}
