import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadDialog } from './download-dialog';

describe('DownloadDialog', () => {
  let component: DownloadDialog;
  let fixture: ComponentFixture<DownloadDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
