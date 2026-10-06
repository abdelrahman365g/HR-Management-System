import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AttendanceRow, AttendanceSearchCriteria, AttendanceService } from '../../services/attendance-service';
import { DepartmentsService } from '../../../departments/services/departments-service';
import { AuthService } from '../../../../core/services/auth';
import { Department } from '../../../../core/interfaces/employee.interface';
import {
  ATTENDANCE_MESSAGES,
} from '../../../../core/constants/validation.constant';
import { dateRangeValidator } from '../../../../shared/validators/attendance.validators';
import { TranslatedMessage, msg } from '../../../../shared/utils/i18n-key.util';
import { LanguageService } from '../../../../core/services/language';
import { formatDate } from '../../../../shared/utils/locale-format.util';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-attendance-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './attendance-page.html',
  styleUrl: './attendance-page.css',
})
export class AttendancePage {
  private readonly attendanceService = inject(AttendanceService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  protected readonly languageService = inject(LanguageService);

  readonly records = signal<AttendanceRow[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly pageSize = PAGE_SIZE;
  readonly appliedDefaultRange = signal(false);

  readonly canView = signal(this.authService.hasPermission('attendance', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('attendance', 'edit'));
  readonly isHrAdmin = signal(this.authService.isHrAdmin());

  readonly attendanceMessages = ATTENDANCE_MESSAGES;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() < this.totalPages() - 1);

  private lastCriteria: Omit<AttendanceSearchCriteria, 'page' | 'pageSize'> | null = null;

  readonly form: FormGroup = this.fb.group(
    {
      employeeName: [''],
      department_id: [''],
      dateFrom: [''],
      dateTo: [''],
    },
    { validators: dateRangeValidator() },
  );

  constructor() {
    this.departmentsService.listDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => {
        this.errorMessage.set(msg('employees.loadDepartmentsFailed'));
      },
    });
  }

  onSearch(): void {
    this.form.markAllAsTouched();
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.records.set([]);
      this.searched.set(false);
      return;
    }

    const { employeeName, department_id, dateFrom, dateTo } = this.form.getRawValue();
    const name = String(employeeName ?? '').trim();

    let effectiveFrom: string | null = dateFrom || null;
    let effectiveTo: string | null = dateTo || null;
    const noCriteriaAtAll = !name && !department_id && !dateFrom && !dateTo;

    if (noCriteriaAtAll) {
      const now = new Date();
      effectiveFrom = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()-1));
      effectiveTo = toIsoDate(new Date(now.getFullYear(), now.getMonth() , now.getDate()));
      this.form.patchValue({ dateFrom: effectiveFrom, dateTo: effectiveTo }, { emitEvent: false });
    }
    this.appliedDefaultRange.set(noCriteriaAtAll);

    this.lastCriteria = {
      employeeName: name || undefined,
      departmentId: department_id || null,
      dateFrom: effectiveFrom,
      dateTo: effectiveTo,
    };
    this.page.set(0);
    this.loadRecords();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadRecords();
  }

  recordDate(iso: string): string {
    return formatDate(iso, this.languageService.current());
  }

  private loadRecords(): void {
    if (!this.lastCriteria) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.attendanceService
      .searchRecords({ ...this.lastCriteria, page: this.page(), pageSize: this.pageSize })
      .subscribe({
        next: ({ items, total }) => {
          this.records.set(items);
          this.total.set(total);
          this.searched.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.records.set([]);
          this.errorMessage.set(msg('attendance.loadFailed'));
          this.loading.set(false);
        },
      });
  }
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
