import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../core/services/auth';
import { LanguageService } from '../../../../../core/services/language';
import { formatDate, formatToday, monthName } from '../../../../../shared/utils/locale-format.util';
import {
  DashboardService,
  DashboardStats,
} from '../../../services/dashboard-service';
import { AttendanceService } from '../../../../attendance/services/attendance-service';

interface QuickAction {
  labelKey: string;
  link: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, TranslatePipe],
  providers: [DatePipe],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);
  private readonly attendanceService = inject(AttendanceService);
  protected readonly auth = inject(AuthService);
  protected readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly recentAttendance = signal<
    { id: string; employeeName: string; department: string; checkIn: string | null; checkOut: string | null; date: string }[]
  >([]);
  protected readonly recentAttendanceLoading = signal(false);
  protected readonly recentAttendanceFailed = signal(false);

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return this.translate.instant('dashboard.greetingMorning');
    if (hour < 18) return this.translate.instant('dashboard.greetingAfternoon');
    return this.translate.instant('dashboard.greetingEvening');
  });

  protected readonly canAttendanceView = this.auth.hasPermission('attendance', 'view');
  protected readonly canEmployeesView = this.auth.hasPermission('employees', 'view');
  protected readonly canEmployeesEdit = this.auth.hasPermission('employees', 'edit');
  protected readonly canAttendanceEdit = this.auth.hasPermission('attendance', 'edit');
  protected readonly canSalaryView = this.auth.hasPermission('salary_reports', 'view');
  protected readonly canHolidaysView = this.auth.hasPermission('official_holidays', 'view');

  protected readonly quickActions = computed<QuickAction[]>(() => {
    const actions: QuickAction[] = [];
    if (this.canAttendanceView) {
      actions.push({
        labelKey: 'dashboard.actionClock',
        link: '/attendance/clock',
        icon: 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
        color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200',
      });
    }
    if (this.canEmployeesEdit) {
      actions.push({
        labelKey: 'dashboard.actionAddEmployee',
        link: '/employees/new',
        icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6',
        color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200',
      });
    }
    if (this.canAttendanceEdit) {
      actions.push({
        labelKey: 'dashboard.actionImportAttendance',
        link: '/attendance/import',
        icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
        color: 'bg-secondary-soft text-secondary-ink',
      });
    }
    if (this.canSalaryView) {
      actions.push({
        labelKey: 'dashboard.actionSalaryReports',
        link: '/salary-reports',
        icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
        color: 'bg-success-soft text-success-ink',
      });
    }
    if (this.canHolidaysView) {
      actions.push({
        labelKey: 'dashboard.actionHolidays',
        link: '/official-holidays',
        icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
        color: 'bg-warning-soft text-warning-ink',
      });
    }
    return actions;
  });

  constructor() {
    this.load();
    if (this.canAttendanceView) {
      this.loadRecentAttendance();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadRecentAttendance(): void {
    this.recentAttendanceLoading.set(true);
    this.recentAttendanceFailed.set(false);

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const toIso = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    this.attendanceService
      .searchRecords({
        dateFrom: toIso(today),
        dateTo: toIso(today),
        page: 0,
        pageSize: 8,
      })
      .subscribe({
        next: ({ items }) => {
          this.recentAttendance.set(
            items.map((row) => ({
              id: row.id,
              employeeName: row.employees?.full_name ?? '',
              department: row.employees?.departments?.name ?? '',
              checkIn: row.check_in_actual?.slice(0, 5) ?? null,
              checkOut: row.check_out_actual?.slice(0, 5) ?? null,
              date: row.record_date,
            })),
          );
          this.recentAttendanceLoading.set(false);
        },
        error: () => {
          this.recentAttendanceFailed.set(true);
          this.recentAttendanceLoading.set(false);
        },
      });
  }

  protected holidayDate(iso: string): string {
    return formatDate(iso, this.languageService.current());
  }

  protected todayLabel(): string {
    return formatToday(new Date(), this.languageService.current());
  }

  protected salaryPeriod(month: number, year: number): string {
    return `${monthName(month, this.languageService.current())} ${year}`;
  }

  protected attendancePercent(checkedIn: number, expected: number): number {
    if (!expected) return 0;
    return Math.min(100, Math.round((checkedIn / expected) * 100));
  }
}
