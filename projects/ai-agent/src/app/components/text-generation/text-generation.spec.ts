import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextGeneration } from './text-generation';

describe('TextGeneration', () => {
  let component: TextGeneration;
  let fixture: ComponentFixture<TextGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextGeneration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextGeneration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
