import { Injectable } from '@angular/core';
import { describeFunctionError } from '../../../services/supabase-errors';
import { supabase } from '../../../supabase.client';
import { ExtractedResult } from './race-results.model';

// Längste Bildkante; größer bringt dem Modell nichts und macht den Upload nur langsamer
const MAX_IMAGE_EDGE = 2000;

export type ExtractResult = { ok: true; result: ExtractedResult } | { ok: false; message: string };

@Injectable({ providedIn: 'root' })
export class RaceResultsService {
  async extract(files: File[]): Promise<ExtractResult> {
    const images = await Promise.all(files.map(toJpegBase64));
    const { data, error } = await supabase.functions.invoke<{ result: ExtractedResult }>(
      'race-result-ocr',
      { body: { images } },
    );

    if (error || !data) {
      console.error('Screenshots auslesen', error);
      return { ok: false, message: await describeFunctionError(error) };
    }
    return { ok: true, result: data.result };
  }
}

async function toJpegBase64(file: File): Promise<{ mediaType: string; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return { mediaType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.9).split(',')[1] };
}
