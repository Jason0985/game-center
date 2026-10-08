// Lädt die Icon-Schriften einmalig von Google herunter, damit die App sie selbst ausliefert
// (keine Verbindung der Nutzer zu Google, DSGVO). Aufruf: node scripts/update-icon-fonts.mjs
// Die Symbols-Schrift enthält nur die unten gelisteten Symbole: ein neues Symbol hier
// alphabetisch ergänzen und das Skript erneut ausführen, sonst erscheint sein Name als Text.
import { writeFile } from 'node:fs/promises';

const ROUNDED_SYMBOLS = [
  'ac_unit',
  'add',
  'arrow_back',
  'auto_awesome',
  'autorenew',
  'block',
  'campaign',
  'chevron_right',
  'close',
  'delete_sweep',
  'emoji_events',
  'event_seat',
  'expand_more',
  'favorite',
  'filter_3',
  'group',
  'history',
  'hourglass_bottom',
  'layers',
  'lock',
  'logout',
  'meeting_room',
  'menu_book',
  'more_vert',
  'move_to_inbox',
  'palette',
  'pan_tool',
  'play_arrow',
  'refresh',
  'replay',
  'shuffle',
  'skip_next',
  'sports_esports',
  'star',
  'stop_circle',
  'style',
  'swap_horiz',
  'sync_alt',
  'warning',
];

const FONTS = [
  {
    file: 'public/fonts/material-icons-outlined.woff2',
    css: 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined',
  },
  {
    file: 'public/fonts/material-symbols-rounded.woff2',
    css:
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400..600,0..1,0' +
      `&icon_names=${ROUNDED_SYMBOLS.join(',')}&display=block`,
  },
];

// Mit Browser-Kennung liefert Google WOFF2 statt TTF
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

for (const font of FONTS) {
  const css = await (await fetch(font.css, { headers: { 'User-Agent': USER_AGENT } })).text();
  const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
  if (!url) {
    throw new Error(`Keine Schrift-URL in ${font.css}`);
  }
  const data = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(font.file, data);
  console.log(`${font.file} (${Math.round(data.length / 1024)} KB)`);
}
