import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GameSetup } from './game-setup';

describe('GameSetup', () => {
  let component: GameSetup;
  let fixture: ComponentFixture<GameSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSetup],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GameSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
