import { Component, inject, input, output, signal } from '@angular/core';
import { Employee } from '../../../../core/interfaces/employee.interface';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EmployeesService } from '../../services/employees-service';
import { ConfirmService } from '../../../../core/services/confirm';
import { msg, TranslatedMessage } from '../../../../shared/utils/i18n-key.util';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslatePipe],
  selector: 'app-employee-card',
  styleUrl: './employee-card.css',
  templateUrl: './employee-card.html',
})
export class EmployeeCard {
  private readonly employeesService = inject(EmployeesService);
  private readonly confirm = inject(ConfirmService);

  readonly employee = input<Employee>();
  readonly department = input<string | null>();
  readonly canEdit = input<boolean>(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly reload = output<void>();

  async onDelete(employee: Employee | undefined): Promise<void> {
    if (!this.canEdit()) return;
    if (!employee) return;
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      params: { name: employee.full_name },
      variant: 'danger',
    });
    if (!confirmed) return;

    this.employeesService.deleteEmployee(employee.id).subscribe({
      next: () => this.reload.emit(),
      error: (err) => this.errorMessage.set(this.describeDeleteError(err)),
    });
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
