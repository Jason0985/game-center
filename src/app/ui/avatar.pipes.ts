import { Pipe, PipeTransform } from '@angular/core';

// Kachelfarben aus _tokens.scss (--tile-*), alle mit weißem Text >= 3:1
const AVATAR_COLORS = [
  'var(--tile-pink)',
  'var(--tile-blue)',
  'var(--tile-purple)',
  'var(--tile-green)',
  'var(--tile-orange)',
  'var(--tile-gray)',
];

/** Bis zu zwei Initialen aus einem Namen, z. B. "Mia Krüger" -> "MK". */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    const parts = (name ?? '')
      .replace(/^@/, '')
      .trim()
      .split(/[\s._-]+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}

/** Stabile Avatarfarbe pro Name, damit dieselbe Person immer gleich aussieht. */
@Pipe({ name: 'avatarColor' })
export class AvatarColorPipe implements PipeTransform {
  transform(seed: string | null | undefined): string {
    let hash = 0;
    for (const char of seed ?? '') {
      hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }
}
