import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Flip7 } from './flip-7';

describe('Flip7', () => {
  let component: Flip7;
  let fixture: ComponentFixture<Flip7>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Flip7],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Flip7);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
