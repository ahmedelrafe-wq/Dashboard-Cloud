import { TestBed } from '@angular/core/testing';

import { Dropbox } from './dropbox';

describe('Dropbox', () => {
  let service: Dropbox;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dropbox);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
