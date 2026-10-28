import {
  eventAge,
  formatClock,
  keyCards,
  KeyedCard,
  seatSpots,
  sizeClass,
  slotCards,
} from './table.model';

describe('formatClock', () => {
  it('shows minutes and padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(48.9)).toBe('0:48');
    expect(formatClock(125)).toBe('2:05');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('eventAge', () => {
  const latest = '2026-10-01T12:01:00Z';

  it('measures from local arrival plus the server gap', () => {
    // Neuestes Ereignis kam vor 5 s an: "jetzt"
    expect(eventAge(105_000, 100_000, latest, latest)).toBe('jetzt');
    // Älteres Ereignis lag laut Server 60 s davor
    expect(eventAge(105_000, 100_000, latest, '2026-10-01T12:00:00Z')).toBe('1:05');
  });

  it('is empty without a valid time', () => {
    expect(eventAge(105_000, 100_000, latest, undefined)).toBe('');
    expect(eventAge(105_000, 100_000, undefined, latest)).toBe('');
  });
});

describe('slotCards', () => {
  const card = (key: string) => ({ key });
  const keys = (slots: ({ key: string } | null)[]) => slots.map((slot) => slot?.key ?? '-');

  it('leaves a gap where a card was taken and fills gaps from the left', () => {
    const full = slotCards([], ['a', 'b', 'c', 'd', 'e'].map(card), 5);
    expect(keys(full)).toEqual(['a', 'b', 'c', 'd', 'e']);

    const played = slotCards(full, ['a', 'c', 'e'].map(card), 5);
    expect(keys(played)).toEqual(['a', '-', 'c', '-', 'e']);

    // Nachziehen: neue Karten in die Lücken, die alten bleiben, wo sie sind
    const drawn = slotCards(played, ['a', 'c', 'e', 'f', 'g'].map(card), 5);
    expect(keys(drawn)).toEqual(['a', 'f', 'c', 'g', 'e']);
  });
});

describe('keyCards', () => {
  let id = 0;
  const newKey = () => `k${++id}`;

  it('keeps keys when a card leaves the middle and gives drawn cards new ones', () => {
    const hand = keyCards<string>([], ['5', '9', 'SB', '2', '5'], newKey);
    const played = keyCards(hand, ['5', '9', '2', '5'], newKey);
    expect(played.map((item) => item.key)).toEqual([
      hand[0].key,
      hand[1].key,
      hand[3].key,
      hand[4].key,
    ]);

    const drawn: KeyedCard<string>[] = keyCards(played, ['5', '9', '2', '5', '7'], newKey);
    expect(drawn.slice(0, 4)).toEqual(played);
    expect(played.map((item) => item.key)).not.toContain(drawn[4].key);
  });
});

describe('seatSpots', () => {
  const near = (actual: { x: number; y: number }, x: number, y: number) => {
    expect(Math.abs(actual.x - x)).toBeLessThanOrEqual(2);
    expect(Math.abs(actual.y - y)).toBeLessThanOrEqual(2);
  };

  it('matches the artboard seats', () => {
    const phone = seatSpots('phone', 3);
    near(phone[0], 70.9, 215);
    near(phone[1], 189.2, 40);
    near(phone[2], 307.2, 215.4);
    near(seatSpots('laptop', 5)[0], 65.9, 274.4);
  });
});

describe('sizeClass', () => {
  it('shrinks the seats with more players', () => {
    expect([2, 3, 4, 5, 6].map(sizeClass)).toEqual(['l', 'l', 'm', 's', 's']);
  });
});
