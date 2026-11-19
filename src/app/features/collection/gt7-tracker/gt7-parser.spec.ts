import {
  carSlug,
  dealerUpdateMessage,
  parseGt7Info,
} from '../../../../../supabase/functions/gt7-legend-check/gt7-parser';

// Ausschnitt aus ddm999.github.io/gt7info/data.json (November 2026)
const DATA = {
  updatetimestamp: '2026-11-17',
  used: { cars: [] },
  legend: {
    date: '26-11-17',
    cars: [
      {
        carid: '1551',
        manufacturer: 'Ferrari',
        name: "330 P4 '67",
        credits: 20000000,
        state: 'limited',
        new: false,
        estimatedays: 1,
      },
      {
        carid: '3487',
        manufacturer: 'Ford',
        name: "Mustang Boss 429 '69",
        credits: 318000,
        state: 'normal',
        new: true,
        estimatedays: 8,
      },
      {
        carid: '1540',
        manufacturer: 'McLaren',
        name: "McLaren F1 '94",
        credits: 20000000,
        state: 'soldout',
        new: false,
        estimatedays: 0,
      },
    ],
  },
};

describe('gt7 dealer (GT7 Info)', () => {
  it('reads every legend car with price, stock state and days left', () => {
    const page = parseGt7Info(DATA);
    expect(page.updatedAt).toBe('2026-11-17T00:00:00.000Z');
    expect(page.cars).toEqual([
      {
        carId: '330-p4-67',
        maker: 'Ferrari',
        name: "330 P4 '67",
        price: 20_000_000,
        imageUrl: null,
        soldOut: false,
        limitedStock: true,
        isNew: false,
        daysLeft: 1,
      },
      expect.objectContaining({ carId: 'mustang-boss-429-69', isNew: true, daysLeft: 8 }),
      expect.objectContaining({ carId: 'mclaren-f1-94', soldOut: true, daysLeft: 0 }),
    ]);
  });

  it('builds the same car ids as gtdb, so watchlists keep working', () => {
    expect(carSlug("XJ13 '66")).toBe('xj13-66');
    expect(carSlug("E-type Coupé '61")).toBe('e-type-coupe-61');
    expect(carSlug("Skyline 2000GT-R (KPGC110) '73")).toBe('skyline-2000gt-r-kpgc110-73');
  });

  it('finds nothing when the data changed shape', () => {
    expect(parseGt7Info({ legend: { cars: 'weg' } }).cars).toEqual([]);
    expect(parseGt7Info(null)).toEqual({ cars: [], updatedAt: null });
  });

  it('writes the dealer update message', () => {
    const [, mustang, mclaren] = parseGt7Info(DATA).cars;
    expect(dealerUpdateMessage([])).toBeNull();
    expect(dealerUpdateMessage([mustang])).toEqual({
      title: "GT7: Ford Mustang Boss 429 '69 beim Legend-Händler",
      message: "Ford Mustang Boss 429 '69 (Cr. 318.000), ca. 8 Tage",
    });
    expect(dealerUpdateMessage([mustang, mclaren])?.title).toBe(
      'GT7: 2 neue Autos beim Legend-Händler',
    );
    expect(dealerUpdateMessage([mclaren])?.message).toBe(
      "McLaren F1 '94 (Cr. 20.000.000), heute letzter Tag",
    );
  });
});
