import { Injectable } from '@angular/core';
import { describeFunctionError } from '../../../services/supabase-errors';
import { supabase } from '../../../supabase.client';

export interface Lecture {
  date: string;
  start: string;
  end: string;
  title: string;
}

export type RaplaResult = { ok: true; lectures: Lecture[] } | { ok: false; message: string };

/** Stundenplan aus Rapla über die Edge Function rapla-lectures (Rapla erlaubt kein CORS). */
@Injectable({ providedIn: 'root' })
export class RaplaService {
  // Eine Anfrage je Link und Woche reicht; Rapla liefert immer die ganze Woche
  private readonly cache = new Map<string, Promise<RaplaResult>>();

  lectures(url: string, date: string, refresh = false): Promise<RaplaResult> {
    const key = `${url}|${mondayOf(date)}`;
    if (refresh) this.cache.delete(key);
    let result = this.cache.get(key);
    if (!result) {
      result = load(url, date);
      this.cache.set(key, result);
      // Fehler nicht zwischenspeichern
      void result.then((r) => !r.ok && this.cache.delete(key));
    }
    return result;
  }
}

async function load(url: string, date: string): Promise<RaplaResult> {
  const { data, error } = await supabase.functions.invoke<{ lectures: Lecture[] }>(
    'rapla-lectures',
    { body: { url, date } },
  );
  if (error || !data) {
    console.error('Rapla', error);
    return { ok: false, message: await describeFunctionError(error) };
  }
  return { ok: true, lectures: data.lectures ?? [] };
}

export function mondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoDate(d);
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}
