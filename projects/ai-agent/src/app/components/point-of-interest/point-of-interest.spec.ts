import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointOfInterest } from './point-of-interest';

describe('PointOfInterest', () => {
  let component: PointOfInterest;
  let fixture: ComponentFixture<PointOfInterest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointOfInterest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointOfInterest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
