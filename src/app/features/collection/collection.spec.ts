import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Collection } from './collection';

describe('Collection', () => {
  let component: Collection;
  let fixture: ComponentFixture<Collection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collection],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Collection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists every multiplayer game, collapsed at first; Monopoly links out', () => {
    const multiplayer = component.groups().find((group) => group.title === 'Multiplayer')!;
    expect(multiplayer.open).toBe(false);
    expect(multiplayer.items.map((item) => item.title)).toEqual([
      'Flip 7',
      'Skip-Bo',
      'Uno',
      'Blackjack',
      'Monopoly',
    ]);
    expect(multiplayer.items[0].path).toBe('/multiplayer');
    expect(multiplayer.items[4].href).toBe('https://richup.io');
    expect(
      component
        .groups()
        .filter((group) => group.title !== 'Multiplayer')
        .every((g) => g.open),
    ).toBe(true);

    component.searchTerm.set('uno');
    expect(component.groups().map((group) => [group.title, group.open])).toEqual([
      ['Multiplayer', true],
    ]);
  });

  it('includes a link to Ranking', () => {
    expect(component.items[0]).toMatchObject({
      title: 'Ranking',
      path: '/ranking',
    });
  });
});
