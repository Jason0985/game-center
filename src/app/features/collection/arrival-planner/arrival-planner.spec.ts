import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArrivalPlanner } from './arrival-planner';

describe('ArrivalPlanner', () => {
  let component: ArrivalPlanner;
  let fixture: ComponentFixture<ArrivalPlanner>;

  beforeEach(async () => {
    localStorage.removeItem('game-center-arrival-planner-settings');
    await TestBed.configureTestingModule({
      imports: [ArrivalPlanner],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ArrivalPlanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('calculates alarm, departure, and arrival times from the target time', () => {
    component.settings.set({
      travelMinutes: 40,
      trafficBufferMinutes: 15,
      preparationMinutes: 35,
    });
    component.arrivalTime.set('08:30');

    expect(component.plan()).toEqual({
      target: { time: '08:30', dayOffset: 0 },
      alarm: { time: '07:00', dayOffset: 0 },
      departure: { time: '07:35', dayOffset: 0 },
      arrivalWithoutBuffer: { time: '08:15', dayOffset: 0 },
    });
  });

  it('marks times before midnight as the previous day', () => {
    component.settings.set({
      travelMinutes: 30,
      trafficBufferMinutes: 10,
      preparationMinutes: 20,
    });
    component.arrivalTime.set('00:20');

    expect(component.plan()?.alarm).toEqual({ time: '23:20', dayOffset: -1 });
    expect(component.plan()?.departure).toEqual({ time: '23:40', dayOffset: -1 });
    expect(component.plan()?.arrivalWithoutBuffer).toEqual({ time: '00:10', dayOffset: 0 });
  });
});
