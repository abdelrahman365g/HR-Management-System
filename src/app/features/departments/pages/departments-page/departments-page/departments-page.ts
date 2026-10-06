import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { DepartmentsService } from '../../../services/departments-service';
import { AuthService } from '../../../../../core/services/auth';
import { ConfirmService } from '../../../../../core/services/confirm';
import { Department } from '../../../../../core/interfaces/employee.interface';
import {
  TranslatedMessage,
  msg,
} from '../../../../../shared/utils/i18n-key.util';

@Component({
  selector: 'app-departments-page',
  imports: [TranslatePipe],
  templateUrl: './departments-page.html',
  styleUrl: './departments-page.css',
})
export class DepartmentsPage {
  private readonly departmentsService = inject(DepartmentsService);
  private readonly authService = inject(AuthService);
  private readonly confirm = inject(ConfirmService);

  readonly departments = signal<Department[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<TranslatedMessage | null>(null);

  // Reuses the employees screen's permission group — no new ScreenKey.
  readonly canView = signal(this.authService.hasPermission('employees', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('employees', 'edit'));

  readonly newDepartmentName = signal('');
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingName = signal('');

  constructor() {
    if (!this.canView()) {
      this.loading.set(false);
      return;
    }

    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.departmentsService.listDepartments().subscribe({
      next: (departments) => {
        this.departments.set(departments);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('departments.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  onCreate(): void {
    const name = this.newDepartmentName().trim();
    if (!name || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    this.departmentsService.createDepartment({ name }).subscribe({
      next: () => {
        this.saving.set(false);
        this.newDepartmentName.set('');
        this.loadDepartments();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(this.describeSaveError(err));
      },
    });
  }

  startRename(department: Department): void {
    this.editingId.set(department.id);
    this.editingName.set(department.name);
  }

  cancelRename(): void {
    this.editingId.set(null);
    this.editingName.set('');
  }

  onSaveRename(): void {
    const departmentId = this.editingId();
    const name = this.editingName().trim();
    if (!departmentId || !name || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    this.departmentsService.updateDepartment(departmentId, { name }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelRename();
        this.loadDepartments();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(this.describeSaveError(err));
      },
    });
  }

  async onDelete(department: Department): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      params: { name: department.name },
      variant: 'danger',
    });
    if (!confirmed) return;

    this.departmentsService.deleteDepartment(department.id).subscribe({
      next: () => this.loadDepartments(),
      error: (err) => this.errorMessage.set(this.describeDeleteError(err)),
    });
  }

  private describeSaveError(err: any): TranslatedMessage {
    if (err?.code === '23505') return msg('departments.nameExists');
    if (err?.code === '42501') return msg('departments.saveForbidden');
    return msg('departments.saveFailed');
  }

  private describeDeleteError(err: any): TranslatedMessage {
    switch (err?.code) {
      case '23503':
        return msg('departments.deleteInUse');
      case '42501':
        return msg('departments.deleteForbidden');
      default:
        return msg('departments.deleteFailed');
    }
  }
}
