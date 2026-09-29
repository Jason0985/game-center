import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { DetailedView } from './detailed-view';

describe('DetailedView', () => {
  let component: DetailedView;
  let fixture: ComponentFixture<DetailedView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailedView],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'australia' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailedView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
