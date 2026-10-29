// Wortfilter für den Lobby-Chat: Wörter mit einem dieser Stämme werden ganz durch * ersetzt.
// start: Wort beginnt mit dem Stamm (bei Stämmen, die sonst in harmlosen Wörtern stecken,
// z. B. „arsch“ in „Marsch“); anywhere: Stamm irgendwo im Wort (auch in Zusammensetzungen).
const START = [
  'arsch',
  'hure',
  'nutte',
  'spast',
  'kanake',
  'neger',
  'slut',
  'pisse',
  'retard',
  'wix',
];
const ANYWHERE = [
  'scheis',
  'fick',
  'fotze',
  'wichs',
  'kacke',
  'pisser',
  'schlampe',
  'titten',
  'porno',
  'pimmel',
  'missgeburt',
  'schwuchtel',
  'arschloch',
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'whore',
  'asshole',
  'dickhead',
  'nigger',
  'nigga',
  'faggot',
];

// Zahlen und Zeichen statt Buchstaben (f4ck, $hit, 5cheiße) zählen mit
const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  ß: 'ss',
};

// Jeder Buchstabe darf sich wiederholen: „fuuuck“ trifft „fuck“, „niger“ aber nicht „nigger“
const stem = (word: string) => [...word].map((char) => `${char}+`).join('');
const BLOCKED = new RegExp(`^(?:${START.map(stem).join('|')})|${ANYWHERE.map(stem).join('|')}`);

const WORD = /[\p{L}\p{N}@$]+/gu;

function normalize(word: string): string {
  return [...word.toLowerCase()].map((char) => LEET[char] ?? char).join('');
}

// Text mit verschleierten Schimpfwörtern; alles andere bleibt, wie es ist
export function censor(text: string): string {
  return text.replace(WORD, (word) =>
    BLOCKED.test(normalize(word)) ? '*'.repeat([...word].length) : word,
  );
}
