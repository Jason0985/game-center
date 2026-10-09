import { supabase } from '../../supabase.client';

// Tabelle, deren Änderungen ein Neuladen auslösen; filter z. B. 'lobby_id=eq.<id>'
// (DELETE-Events lassen sich nicht filtern und kommen dann nicht an)
export interface WatchedTable {
  table: string;
  filter?: string;
}

// Mehrere Events kurz hintereinander (z. B. Lobby schließen löscht alle
// Mitglieder) lösen nur ein Neuladen aus
const CHANGE_DEBOUNCE_MS = 100;

// Toter Kanal (Fehler, Zeitüberschreitung, vom Server geschlossen): nach kurzer Pause neu
const RESUBSCRIBE_MS = 2000;

// Kanalnamen pro Ansicht eindeutig halten: supabase.channel() gibt sonst den noch
// nicht ganz entfernten alten Kanal zurück, und das neue Abo bleibt stumm
let channelCounter = 0;

// Ruft onChange gebündelt bei jeder Änderung auf, außerdem nach jedem
// (Wieder-)Verbinden und wenn der Tab wieder sichtbar wird: Supabase liefert
// verpasste Events nicht nach (Handy gesperrt, Verbindung weg, Änderung vor dem
// Beitritt zum Kanal). Gibt die Abmeldung zurück.
export function watchTables(
  name: string,
  tables: WatchedTable[],
  onChange: () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, CHANGE_DEBOUNCE_MS);
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') notify();
  };

  // Schließt der Server den Kanal (z. B. Sitzung abgelaufen, während das Handy schlief),
  // kämen sonst nie wieder Änderungen an: dann einen neuen Kanal aufbauen. Dessen
  // SUBSCRIBED lädt neu und holt so Verpasstes nach.
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let channel = open();

  function open() {
    const current = supabase.channel(`${name}-${++channelCounter}`);
    for (const { table, filter } of tables) {
      current.on('postgres_changes', { event: '*', schema: 'public', table, filter }, notify);
    }
    current.subscribe((status) => {
      if (stopped || current !== channel) return;
      if (status === 'SUBSCRIBED') {
        notify();
      } else {
        clearTimeout(retry);
        retry = setTimeout(() => {
          if (stopped || current !== channel) return;
          // Erst den neuen Kanal merken, dann den alten entfernen (dessen CLOSED zählt nicht)
          channel = open();
          void supabase.removeChannel(current);
        }, RESUBSCRIBE_MS);
      }
    });
    return current;
  }
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(retry);
    document.removeEventListener('visibilitychange', onVisible);
    void supabase.removeChannel(channel);
  };
}
