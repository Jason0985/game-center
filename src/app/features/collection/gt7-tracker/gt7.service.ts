import { Injectable } from '@angular/core';
import { describeFunctionError } from '../../../services/supabase-errors';
import { supabase } from '../../../supabase.client';

// Ein Auto beim Legend Cars Dealer (Tabelle gt7_dealer, gefüllt von gt7-legend-check)
export interface Gt7Car {
  car_id: string;
  maker: string;
  name: string;
  price: number | null;
  image_url: string | null;
  sold_out: boolean;
  limited_stock: boolean;
  in_dealer: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export interface Gt7Watch {
  car_id: string;
  maker: string;
  name: string;
  created_at: string;
  notified_at: string | null;
}

export interface Gt7Status {
  checked_at: string | null;
  ok: boolean;
  message: string | null;
  page_updated_at: string | null;
  car_count: number;
}

export type Gt7Result = { ok: true; message: string } | { ok: false; message: string };

// Auto-ID bei gtdb aus einem Link (…/gt7/car/xj13-66/) oder direkt eingegeben
export function carIdFrom(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  const id = trimmed.match(/\/gt7\/car\/([a-z0-9-]+)/)?.[1] ?? trimmed;
  return /^[a-z0-9-]{1,80}$/.test(id) ? id : null;
}

// Name aus der ID, solange das Auto nicht beim Händler war (xj13-66 → "Xj13 '66")
export function nameFromId(id: string): string {
  const parts = id.split('-');
  const year = /^\d{2}$/.test(parts.at(-1) ?? '') ? ` '${parts.pop()}` : '';
  const words = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return `${words.join(' ')}${year}`.slice(0, 100);
}

/** GT7-Tracker: Händlerliste, eigene Merkliste und Prüfungen (nur für Admins, per RLS). */
@Injectable({ providedIn: 'root' })
export class Gt7Service {
  async load(): Promise<{ cars: Gt7Car[]; watches: Gt7Watch[]; status: Gt7Status | null }> {
    const [cars, watches, status] = await Promise.all([
      supabase
        .from('gt7_dealer')
        .select(
          'car_id, maker, name, price, image_url, sold_out, limited_stock, in_dealer, first_seen_at, last_seen_at',
        )
        .eq('in_dealer', true)
        .order('price', { ascending: false }),
      supabase
        .from('gt7_watchlist')
        .select('car_id, maker, name, created_at, notified_at')
        .order('created_at'),
      supabase
        .from('gt7_status')
        .select('checked_at, ok, message, page_updated_at, car_count')
        .maybeSingle(),
    ]);
    const error = cars.error ?? watches.error ?? status.error;
    if (error) throw error;
    return {
      cars: (cars.data ?? []) as Gt7Car[],
      watches: (watches.data ?? []) as Gt7Watch[],
      status: (status.data as Gt7Status | null) ?? null,
    };
  }

  async watch(userId: string, car: { car_id: string; maker: string; name: string }): Promise<void> {
    const { error } = await supabase
      .from('gt7_watchlist')
      .insert({ user_id: userId, car_id: car.car_id, maker: car.maker, name: car.name });
    // Steht schon drauf: auch gut
    if (error && error.code !== '23505') throw error;
  }

  async unwatch(carId: string): Promise<void> {
    const { error } = await supabase.from('gt7_watchlist').delete().eq('car_id', carId);
    if (error) throw error;
  }

  // Jetzt prüfen bzw. (test) eine Test-Mitteilung zu einem gerade verfügbaren Auto schicken
  async run(test: boolean): Promise<Gt7Result> {
    const { data, error } = await supabase.functions.invoke<{
      cars?: number;
      notified?: number;
      car?: string;
    }>('gt7-legend-check', { body: { test } });
    if (error || !data) {
      return { ok: false, message: await describeFunctionError(error) };
    }
    if (test) {
      return { ok: true, message: 'Test-Mitteilung ist unterwegs.' };
    }
    const notified = data.notified ?? 0;
    return {
      ok: true,
      message: notified
        ? `${notified} Auto${notified === 1 ? '' : 's'} von deiner Merkliste gemeldet.`
        : `Geprüft: ${data.cars ?? 0} Autos beim Händler.`,
    };
  }
}
