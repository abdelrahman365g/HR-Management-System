import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, throwError } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth';
import {
  ATTENDANCE_MESSAGES,
  VALIDATION_MESSAGES,
} from '../../../../core/constants/validation.constant';
import { ConfirmService } from '../../../../core/services/confirm';
import {
  actualTimeRangeValidator,
  atLeastOneTimeValidator,
  notFutureDateValidator,
} from '../../../../shared/validators/attendance.validators';
import { AttendanceService } from '../../services/attendance-service';
import { EmployeePicker } from '../employee-picker/employee-picker';
import { TranslatedMessage, msg } from '../../../../shared/utils/i18n-key.util';

@Component({
  selector: 'app-attendance-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, EmployeePicker],
  templateUrl: './attendance-form.html',
  styleUrl: './attendance-form.css',
})
export class AttendanceForm {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly confirm = inject(ConfirmService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly isEditMode = signal(false);

  readonly messages = VALIDATION_MESSAGES;
  readonly attendanceMessages = ATTENDANCE_MESSAGES;

  // Employee + date are fixed in edit mode so the unique key stays stable.
  readonly employeeName = signal('');
  readonly recordDate = signal('');
  private recordId: string | null = null;

  readonly form: FormGroup = this.fb.group(
    {
      record_date: ['', [Validators.required, notFutureDateValidator()]],
      check_in_actual: [''],
      check_out_actual: [''],
      // Optional free-text explanation for a manual entry/correction,
      // e.g. "device could not read the badge". Shown for both add and
      // edit — helpful context either way, not just on corrections.
      note: [''],
    },
    { validators: [atLeastOneTimeValidator(), actualTimeRangeValidator()] },
  );

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.recordId = idParam && idParam !== 'new' ? idParam : null;
    this.isEditMode.set(this.recordId !== null);

    if (this.isEditMode()) {
      // Only the times/note are editable on an existing record.
      this.form.get('record_date')?.disable();
      this.loadRecord();
    } else {
      this.loading.set(false);
    }
  }

  private loadRecord(): void {
    this.attendanceService.getRecord(this.recordId!).subscribe({
      next: (record) => {
        this.employeeName.set(record.employees?.full_name ?? '—');
        this.recordDate.set(record.record_date);
        this.form.patchValue({
          record_date: record.record_date,
          check_in_actual: (record.check_in_actual ?? '').slice(0, 5),
          check_out_actual: (record.check_out_actual ?? '').slice(0, 5),
          note: (record as any).note ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('attendance.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    if (this.isEditMode()) {
      const confirmed = await this.confirm.ask({
        titleKey: 'confirm.saveChangesTitle',
        messageKey: 'confirm.saveChangesMessage',
        params: { entity: 'attendance' },
        variant: 'info',
      });
      if (!confirmed) return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const times = {
      check_in_actual: (value.check_in_actual || null) as string | null,
      check_out_actual: (value.check_out_actual || null) as string | null,
    };
    const note = (value.note || null) as string | null;

    const request$ = this.isEditMode()
      ? this.attendanceService.updateRecord(this.recordId!, { ...times, note })
      : this.attendanceService
          .isHoliday(value.record_date)
          .pipe(
            switchMap((isHoliday) =>
              isHoliday
                ? throwError(() => ({ message: 'ATTENDANCE_ON_HOLIDAY' }))
                : this.attendanceService.createRecord({
                    employee_id: this.selectedEmployeeId,
                    record_date: value.record_date,
                    ...times,
                    note,
                  }),
            ),
          );

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/attendance']);
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  // The employee picker writes the chosen id here (see template).
  selectedEmployeeId = '';

  onEmployeePicked(employee: { id: string; full_name: string }): void {
    this.selectedEmployeeId = employee.id;
    this.employeeName.set(employee.full_name);
  }

  /** Translation key for a field error. */
  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || control.valid || !control.touched) return null;
    if (control.hasError('required')) return this.messages.required;
    if (control.hasError('futureDate')) return this.attendanceMessages.futureDate;
    return null;
  }

  /** Translation key for a group-level error. */
  groupError(name: 'atLeastOneTime' | 'timeRange'): string | null {
    if (!this.form.hasError(name) || !this.form.touched) return null;
    return name === 'atLeastOneTime'
      ? this.attendanceMessages.oneTimeRequired
      : this.attendanceMessages.timeRange;
  }

  goBack(): void {
    this.location.back();
  }

  private handleSaveError(err: any): void {
    this.saving.set(false);
    const message = String(err?.message ?? '');

    if (message.includes('ATTENDANCE_ON_HOLIDAY') || err?.message?.includes('ATTENDANCE_ON_HOLIDAY')) {
      this.errorMessage.set(msg(this.attendanceMessages.holiday));
      return;
    }
    if (err?.code === '23505') {
      this.errorMessage.set(msg(this.attendanceMessages.duplicateRecord));
      return;
    }
    if (err?.code === '23514' && message.includes('chk_attendance_time_range')) {
      this.errorMessage.set(msg(this.attendanceMessages.timeRange));
      return;
    }
    if (err?.code === '42501') {
      this.errorMessage.set(msg('attendance.messages.saveForbidden'));
      return;
    }
    this.errorMessage.set(
      msg(this.isEditMode() ? this.attendanceMessages.updateFailed : this.attendanceMessages.createFailed),
    );
  }
}
