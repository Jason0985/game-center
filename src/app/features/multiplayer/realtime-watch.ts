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

  const channel = supabase.channel(`${name}-${++channelCounter}`);
  for (const { table, filter } of tables) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter }, notify);
  }
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') notify();
  });
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
    void supabase.removeChannel(channel);
  };
}
