import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { F1Strategy } from './f1-strategy';

describe('F1Strategy', () => {
  let component: F1Strategy;
  let fixture: ComponentFixture<F1Strategy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [F1Strategy],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(F1Strategy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
