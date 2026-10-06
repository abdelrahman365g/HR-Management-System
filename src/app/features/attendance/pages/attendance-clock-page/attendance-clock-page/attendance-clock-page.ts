import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AttendanceService, ClockAction, ClockEmployee } from '../../../services/attendance-service';
import { AuthService } from '../../../../../core/services/auth';
import { TranslatedMessage, msg } from '../../../../../shared/utils/i18n-key.util';

interface DepartmentGroup {
  name: string;
  employees: ClockEmployee[];
}

@Component({
  selector: 'app-attendance-clock-page',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './attendance-clock-page.html',
})
export class AttendanceClockPage {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);

  readonly employees = signal<ClockEmployee[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly busyEmployeeId = signal<string | null>(null);

  readonly canView = signal(this.authService.hasPermission('attendance', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('attendance', 'edit'));

  // Plain string bound via ngModel; the `groups` computed below re-filters
  // instantly on every keystroke — no search button, no server round trip.
  departmentFilter = '';

  readonly groups = computed<DepartmentGroup[]>(() => {
    const filter = this.departmentFilter.trim().toLowerCase();
    const filtered = filter
      ? this.employees().filter((e) => e.department_name.toLowerCase().includes(filter))
      : this.employees();

    const byDepartment = new Map<string, ClockEmployee[]>();
    for (const employee of filtered) {
      const list = byDepartment.get(employee.department_name) ?? [];
      list.push(employee);
      byDepartment.set(employee.department_name, list);
    }

    return Array.from(byDepartment.entries())
      .map(([name, employees]) => ({ name, employees }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    if (!this.canView()) {
      this.loading.set(false);
      return;
    }
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.attendanceService.listEmployeesGroupedForClock().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('attendance.clock.loadEmployeesFailed'));
        this.loading.set(false);
      },
    });
  }

  onClock(employee: ClockEmployee, action: ClockAction): void {
    if (this.busyEmployeeId()) return; // one in-flight click at a time

    this.busyEmployeeId.set(employee.id);
    this.errorMessage.set(null);

    this.attendanceService.clock(employee.id, action).subscribe({
      next: (record) => {
        this.busyEmployeeId.set(null);
        this.employees.update((list) =>
          list.map((e) =>
            e.id === employee.id
              ? { ...e, check_in_actual: record.check_in_actual, check_out_actual: record.check_out_actual }
              : e,
          ),
        );
      },
      error: (err) => {
        this.busyEmployeeId.set(null);
        this.errorMessage.set(this.describeClockError(err, action));
      },
    });
  }

  /** Row status for the status rail: checked-out > checked-in > pending. */
  statusOf(employee: ClockEmployee): 'present' | 'late' | 'none' {
    if (employee.check_in_actual && employee.check_out_actual) return 'present';
    if (employee.check_in_actual) return 'late';
    return 'none';
  }

  private describeClockError(err: any, action: ClockAction): TranslatedMessage {
    switch (err?.message) {
      case 'ALREADY_CHECKED_IN':
        return msg('attendance.clock.alreadyCheckedIn');
      case 'ALREADY_CHECKED_OUT':
        return msg('attendance.clock.alreadyCheckedOut');
      case 'ALREADY_RECORDED':
        return msg('attendance.clock.alreadyRecorded');
      case 'ATTENDANCE_ON_HOLIDAY':
        return msg('attendance.clock.holiday');
      case 'FORBIDDEN':
        return msg('attendance.clock.forbidden');
      case 'INVALID_TIME_RANGE':
        return msg('attendance.clock.invalidTimeRange');
      default:
        return msg(action === 'check_in' ? 'attendance.clock.checkInFailed' : 'attendance.clock.checkOutFailed');
    }
  }
}
