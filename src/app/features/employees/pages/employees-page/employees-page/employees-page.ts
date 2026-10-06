import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { EmployeesService } from '../../../services/employees-service';
import { DepartmentsService } from '../../../../departments/services/departments-service';
import { AuthService } from '../../../../../core/services/auth';
import { LanguageService } from '../../../../../core/services/language';
import { ConfirmService } from '../../../../../core/services/confirm';
import { Department, Employee } from '../../../../../core/interfaces/employee.interface';
import { formatMoney } from '../../../../../shared/utils/locale-format.util';
import {
  TranslatedMessage,
  msg,
} from '../../../../../shared/utils/i18n-key.util';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-employees-page',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './employees-page.html',
  styleUrl: './employees-page.css',
})
export class EmployeesPage {
  private readonly employeesService = inject(EmployeesService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly authService = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  protected readonly languageService = inject(LanguageService);

  readonly employees = signal<Employee[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<TranslatedMessage | null>(null);

  readonly canView = signal(this.authService.hasPermission('employees', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('employees', 'edit'));

  readonly searchTerm = signal('');
  readonly departmentFilter = signal('');
  readonly page = signal(0);
  readonly total = signal(0);
  readonly pageSize = PAGE_SIZE;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() < this.totalPages() - 1);

  constructor() {
    if (!this.canView()) {
      this.loading.set(false);
      return;
    }

    this.loadEmployees();
    this.departmentsService.listDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => {
        this.errorMessage.set(msg('employees.loadDepartmentsFailed'));
      },
    });
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.employeesService
      .loadEmployees({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.searchTerm(),
        departmentId: this.departmentFilter() || null,
      })
      .subscribe({
        next: ({ items, total }) => {
          this.employees.set(items);
          this.total.set(total);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(msg('employees.loadFailed'));
          this.loading.set(false);
        },
      });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.resetAndLoad();
  }

  onDepartmentFilterChanged(value: string): void {
    this.departmentFilter.set(value);
    this.resetAndLoad();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadEmployees();
  }

  departmentName(employee: Employee): string {
    return employee.departments?.name ?? '—';
  }

  /** Locale-aware money with Western digits. */
  salary(employee: Employee): string {
    return formatMoney(Number(employee.base_salary), this.languageService.current());
  }

  /** ISO date formatted for the active language, Western digits. */
  contractDate(employee: Employee): string {
    const iso = String(employee.contract_date ?? '');
    if (!iso) return '—';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(this.languageService.current() === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      numberingSystem: 'latn',
    }).format(d);
  }

  async onDelete(employee: Employee): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      params: { name: employee.full_name },
      variant: 'danger',
    });
    if (!confirmed) return;

    this.employeesService.deleteEmployee(employee.id).subscribe({
      next: () => this.loadEmployees(),
      error: (err) => this.errorMessage.set(this.describeDeleteError(err)),
    });
  }

  private resetAndLoad(): void {
    this.page.set(0);
    this.loadEmployees();
  }

  private describeDeleteError(err: any): TranslatedMessage {
    switch (err?.code) {
      case '23503':
        return msg('employees.deleteReferenced');
      case '42501':
        return msg('employees.deleteForbidden');
      default:
        return msg('employees.deleteFailed');
    }
  }
}
