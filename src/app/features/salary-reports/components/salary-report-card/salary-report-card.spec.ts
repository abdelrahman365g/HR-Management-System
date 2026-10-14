import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalaryReportCard } from './salary-report-card';

describe('SalaryReportCard', () => {
  let component: SalaryReportCard;
  let fixture: ComponentFixture<SalaryReportCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryReportCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SalaryReportCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
