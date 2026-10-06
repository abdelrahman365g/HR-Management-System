import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ATTENDANCE_MESSAGES } from '../../../../core/constants/validation.constant';
import { AttendanceService } from '../../services/attendance-service';

interface EmployeeOption {
  id: string;
  full_name: string;
}

@Component({
  selector: 'app-employee-picker',
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="mb-5">
      <label class="field-label mb-1.5 block" for="employee_search">
        {{ 'attendance.employee' | translate }}
      </label>
      <input
        id="employee_search"
        type="text"
        [(ngModel)]="searchText"
        (input)="onSearch()"
        [attr.placeholder]="'attendance.employeeSearchPlaceholder' | translate"
        class="field-input"
      />
      @if (errorMessage(); as key) {
        <p class="field-error">{{ key | translate }}</p>
      }
      @if (options().length > 0) {
        <ul class="mt-1 max-h-48 overflow-auto rounded-md border border-line bg-surface shadow-sm">
          @for (employee of options(); track employee.id) {
            <li class="border-b border-line last:border-b-0">
              <button
                type="button"
                (click)="pick(employee)"
                class="w-full px-3 py-2 text-start text-sm text-fg transition hover:bg-primary-50"
              >
                {{ employee.full_name }}
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class EmployeePicker {
  private readonly attendanceService = inject(AttendanceService);

  readonly picked = output<{ id: string; full_name: string }>();

  readonly options = signal<EmployeeOption[]>([]);
  readonly errorMessage = signal<string | null>(null);

  searchText = '';
  private searchSeq = 0;

  onSearch(): void {
    const text = this.searchText.trim();
    this.errorMessage.set(null);
    if (text.length < 2) {
      this.options.set([]);
      return;
    }

    const seq = ++this.searchSeq;
    this.attendanceService.findEmployeeByName(text).subscribe({
      next: (employees) => {
        // Ignore stale responses from earlier keystrokes.
        if (seq !== this.searchSeq) return;
        this.options.set(employees.map((e) => ({ id: e.id, full_name: e.full_name })));
        if (employees.length === 0) {
          this.errorMessage.set(ATTENDANCE_MESSAGES.employeeNotFound);
        }
      },
      error: () => {
        if (seq !== this.searchSeq) return;
        this.errorMessage.set(ATTENDANCE_MESSAGES.employeeSearchFailed);
      },
    });
  }

  pick(employee: EmployeeOption): void {
    this.searchText = employee.full_name;
    this.options.set([]);
    this.picked.emit(employee);
  }
}
