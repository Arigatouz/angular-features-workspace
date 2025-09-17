import { TestBed } from '@angular/core/testing';

import {GoogleGenAiService} from './google-gen-ai';

describe('GoogleGenAi', () => {
  let service: GoogleGenAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleGenAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
