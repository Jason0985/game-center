import { parseDealerPage } from '../../../../../supabase/functions/gt7-legend-check/gt7-parser';

// Ausschnitt im Aufbau von gtdb.io/gt7/legend-cars-dealer/ (November 2026)
const card = (id: string, maker: string, name: string, price: string, extra = '', badge = '') =>
  `<div><a href="/gt7/car/${id}/" class=""><div class="text-xs font-light">${maker}</div>` +
  `<div class="text-base font-light">${name}</div><div class="border-b border-t border-blue-400 my-4 relative">` +
  `<img width="3840" height="1400" src="https://imagedelivery.net/x/${id}/public" alt="${maker} ${name}" class="aspect-video object-cover opacity-100 grayscale-0">` +
  `${badge || '<!---->'}</div><div class="text-base font-light"> Cr. <span class="text-2xl">${price}</span></div>${extra || '<!---->'}</a></div>`;

const PAGE =
  '<div class="font-mono text-xs mt-8">Last updated on <time data-date-style="long" datetime="2026-11-09T00:15:22.099Z">November 9, 2026</time></div>' +
  '<div class="py-8"><div class="grid sm:grid-cols-3 gap-x-4 gap-y-8"><!--[-->' +
  card('330-p4-67', 'Ferrari', '330 P4 &#39;67', '20,000,000') +
  card(
    'corvette-c2-63',
    'Chevrolet',
    'Corvette (C2) &#39;63',
    '255,000',
    '',
    '<div class="absolute top-1/2 text-red-600 border px-0.5 -rotate-12"> SOLD OUT </div>',
  ) +
  card(
    'e-type-coupe-61',
    'Jaguar',
    'E-type Coupé &#39;61',
    '193,000',
    '<div class="text-red-700 text-xs flex gap-1 font-semibold justify-center mt-2"><svg></svg> Limited Stock </div>',
  ) +
  '<!--]--></div></div>' +
  '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2"><!--[-->' +
  '<a href="/gt7/car/xj13-66/" class="group"><img src="x"><div class="mt-1 group-hover:text-blue-400">Jaguar XJ13 &#39;66</div></a>' +
  '<!--]--></div>';

describe('gt7 dealer parser', () => {
  it('reads every car of the dealer with price and stock state', () => {
    const page = parseDealerPage(PAGE);
    expect(page.updatedAt).toBe('2026-11-09T00:15:22.099Z');
    expect(page.cars).toEqual([
      {
        carId: '330-p4-67',
        maker: 'Ferrari',
        name: "330 P4 '67",
        price: 20_000_000,
        imageUrl: 'https://imagedelivery.net/x/330-p4-67/public',
        soldOut: false,
        limitedStock: false,
      },
      expect.objectContaining({ carId: 'corvette-c2-63', soldOut: true, limitedStock: false }),
      expect.objectContaining({
        carId: 'e-type-coupe-61',
        name: "E-type Coupé '61",
        price: 193_000,
        soldOut: false,
        limitedStock: true,
      }),
    ]);
  });

  it('ignores cars linked outside the dealer list', () => {
    expect(parseDealerPage(PAGE).cars.map((car) => car.carId)).not.toContain('xj13-66');
  });

  it('finds nothing when the page layout changed', () => {
    expect(parseDealerPage('<html><body>Neu gestaltet</body></html>').cars).toEqual([]);
  });
});
