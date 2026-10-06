import { TestBed } from '@angular/core/testing';
import { MONTHLY_REPORT_MAX_ROWS, SalaryReportsService } from './salary-reports-service';

describe('SalaryReportsService', () => {
  let service: SalaryReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SalaryReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('caps the printable monthly report at 2000 rows', () => {
    expect(MONTHLY_REPORT_MAX_ROWS).toBe(2000);
  });
});
