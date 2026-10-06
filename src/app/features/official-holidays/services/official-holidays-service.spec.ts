import { TestBed } from '@angular/core/testing';
import { OfficialHolidaysService } from './official-holidays-service';

describe('OfficialHolidaysService', () => {
  let service: OfficialHolidaysService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficialHolidaysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
