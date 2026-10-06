import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';
import { SalaryReportsPage } from './salary-reports-page';

describe('SalaryReportsPage', () => {
  let component: SalaryReportsPage;
  let fixture: ComponentFixture<SalaryReportsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryReportsPage],
      providers: [provideRouter([]), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SalaryReportsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initialises filters to the current month and year', () => {
    const now = new Date();
    const value = component.form.getRawValue();
    expect(Number(value.month)).toBe(now.getMonth() + 1);
    expect(Number(value.year)).toBe(now.getFullYear());
  });

  it('rejects a year before the founding year without querying', () => {
    component.minYear.set(2008);
    component.form.patchValue({ year: 2007 });
    component.onSearch();
    expect(component.errorMessage()?.key).toBe(component.salaryMessages().invalidYear);
    expect(component.searched()).toBe(false);
  });

  it('rejects a future period without querying', () => {
    const now = new Date();
    component.form.patchValue({ month: now.getMonth() + 1, year: now.getFullYear() + 1 });
    component.onSearch();
    expect(component.errorMessage()?.key).toBe(component.salaryMessages().invalidYear);
    expect(component.searched()).toBe(false);
  });

  it('hides the snapshot button for view-only users', () => {
    component.canEdit.set(false);
    expect(component.canSaveSnapshot()).toBe(false);
  });

  it('hides the snapshot button in yearly mode', () => {
    component.canEdit.set(true);
    component.setMode('yearly');
    expect(component.canSaveSnapshot()).toBe(false);
  });

  it('shows the snapshot button for editors on a past period', () => {
    component.canEdit.set(true);
    component.form.patchValue({ month: 1, year: 2020 });
    expect(component.canSaveSnapshot()).toBe(true);
  });

  it('masks the national ID for display', () => {
    const row = {
      national_id: '12345678901234',
      source: 'live',
    } as any;
    expect(component.maskedNationalId(row)).toBe('••••••••••1234');
  });

  it('starts in monthly mode and clears results when switching modes', () => {
    expect(component.isMonthly()).toBe(true);
    component.searched.set(true);
    component.setMode('yearly');
    expect(component.isMonthly()).toBe(false);
    expect(component.searched()).toBe(false);
    component.setMode('monthly');
    expect(component.isMonthly()).toBe(true);
  });

  it('requires an employee name in yearly mode without querying', () => {
    component.setMode('yearly');
    component.form.patchValue({ employeeName: '' });
    component.onSearch();
    expect(component.errorMessage()?.key).toBe(component.salaryMessages().invalidEmployee);
    expect(component.searched()).toBe(false);
    expect(component.yearlyReport()).toBeNull();
  });

  it('rejects an invalid year in yearly mode without querying', () => {
    component.setMode('yearly');
    component.minYear.set(2008);
    component.form.patchValue({ employeeName: 'John', year: 2007 });
    component.onSearch();
    expect(component.errorMessage()?.key).toBe(component.salaryMessages().invalidYear);
    expect(component.searched()).toBe(false);
  });
});
