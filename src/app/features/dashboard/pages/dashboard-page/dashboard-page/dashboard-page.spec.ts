import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardPage } from './dashboard-page';
import { DashboardService, DashboardStats } from '../../../services/dashboard-service';
import { AttendanceService } from '../../../../attendance/services/attendance-service';
import { AuthService } from '../../../../../core/services/auth';
import { provideTranslateTesting } from '../../../../../../testing/translate-testing';

function statsFixture(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    today: '2026-10-01',
    is_holiday_today: false,
    attendance: { expected: 10, checked_in: 7, checked_out: 2, not_checked_in: 3 },
    headcount: { total: 12, by_department: [{ department: 'IT', count: 5 }] },
    upcoming_holidays: [{ name: 'Eid', date: '2026-10-20', days_until: 19 }],
    salary: {
      month: 9,
      year: 2026,
      eligible_employees: 12,
      snapshots_saved: 10,
      pending: 2,
    },
    ...overrides,
  };
}

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let getStats: ReturnType<typeof vi.fn>;

  const authStub = {
    currentUser: () => ({
      id: '1',
      full_name: 'Ada Lovelace',
      username: 'ada',
      email: 'a@b.c',
      permission_group_id: null,
      is_hr_admin: true,
      is_active: true,
    }),
    currentGroup: () => null,
    isHrAdmin: () => true,
    hasPermission: () => true,
  };

  beforeEach(async () => {
    getStats = vi.fn().mockReturnValue(of(statsFixture()));

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        provideTranslateTesting(),
        { provide: AuthService, useValue: authStub },
        { provide: DashboardService, useValue: { getStats } },
        {
          provide: AttendanceService,
          useValue: { searchRecords: () => of({ items: [], total: 0 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the greeting with the user name', () => {
    expect(el().textContent).toContain('Ada Lovelace');
  });

  it('hides sections that are null', async () => {
    getStats.mockReturnValue(
      of(statsFixture({ attendance: null, headcount: null, salary: null, upcoming_holidays: null })),
    );
    const compFixture = TestBed.createComponent(DashboardPage);
    compFixture.detectChanges();
    await compFixture.whenStable();
    compFixture.detectChanges();

    const root = compFixture.nativeElement as HTMLElement;
    // The salary KPI link and the attendance/headcount numbers are gone;
    // only quick actions (permission-based) may still link to salary-reports.
    const salaryLinks = Array.from(root.querySelectorAll('a[href="/salary-reports"]'));
    const inkTileLink = salaryLinks.find((a) => a.className.includes('bg-ink'));
    expect(inkTileLink).toBeUndefined();
    expect(root.textContent).not.toContain('7');
  });

  it('shows the holiday banner when today is a holiday', async () => {
    getStats.mockReturnValue(of(statsFixture({ is_holiday_today: true })));
    const compFixture = TestBed.createComponent(DashboardPage);
    compFixture.detectChanges();
    await compFixture.whenStable();
    compFixture.detectChanges();

    expect(
      (compFixture.nativeElement as HTMLElement).textContent,
    ).toContain('dashboard.holidayToday');
  });

  it('shows the error state with retry when loading fails', async () => {
    getStats.mockReturnValue(throwError(() => new Error('boom')));
    const compFixture = TestBed.createComponent(DashboardPage);
    compFixture.detectChanges();
    await compFixture.whenStable();
    compFixture.detectChanges();

    expect((compFixture.nativeElement as HTMLElement).textContent).toContain(
      'dashboard.loadError',
    );
  });
});
