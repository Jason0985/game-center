import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PaddleTable } from './paddle-table';

describe('PaddleTable', () => {
  let component: PaddleTable;
  let fixture: ComponentFixture<PaddleTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaddleTable],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PaddleTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
