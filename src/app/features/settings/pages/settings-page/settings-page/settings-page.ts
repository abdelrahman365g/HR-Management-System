import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../../core/services/auth';
import { LanguageService } from '../../../../../core/services/language';
import { ConfirmService } from '../../../../../core/services/confirm';
import {
  VALIDATION_MESSAGES,
} from '../../../../../core/constants/validation.constant';
import {
  nonNegativeNumberValidator,
  positiveNumberValidator,
} from '../../../../../shared/validators/settings.validators';
import { weekdayName } from '../../../../../shared/utils/locale-format.util';
import {
  OvertimeDeductionInput,
  SettingsService,
  WeeklyHoliday,
} from '../../../services/settings-service';
import { TranslatedMessage, msg } from '../../../../../shared/utils/i18n-key.util';

interface WeeklyDayRow extends WeeklyHoliday {
  /** Translation key for the weekday name (from Intl). */
  labelKey: string;
}

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);
  protected readonly languageService = inject(LanguageService);

  readonly loading = signal(true);
  readonly savingOvertime = signal(false);
  readonly savingWeekly = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly overtimeSaved = signal(false);
  readonly weeklySaved = signal(false);

  readonly canView = signal(this.authService.hasPermission('settings', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('settings', 'edit'));

  readonly messages = VALIDATION_MESSAGES;
  readonly weekDays = signal<WeeklyDayRow[]>([]);

  private settingsId: string | null = null;

  readonly form: FormGroup = this.fb.group({
    overtime_unit_hours: ['', [Validators.required, positiveNumberValidator()]],
    overtime_rate_per_unit: ['', [Validators.required, nonNegativeNumberValidator()]],
    deduction_unit_hours: ['', [Validators.required, positiveNumberValidator()]],
    deduction_rate_per_unit: ['', [Validators.required, nonNegativeNumberValidator()]],
  });

  constructor() {
    if (!this.canView()) {
      this.loading.set(false);
      return;
    }

    this.loadWeeklyHolidays();
    this.loadOvertimeDeduction();
  }

  loadOvertimeDeduction(): void {
    this.loading.set(true);
    this.settingsService.loadOvertimeDeduction().subscribe({
      next: (settings) => {
        if (settings) {
          this.settingsId = settings.id;
          this.form.patchValue({
            overtime_unit_hours: String(settings.overtime_unit_hours),
            overtime_rate_per_unit: String(settings.overtime_rate_per_unit),
            deduction_unit_hours: String(settings.deduction_unit_hours),
            deduction_rate_per_unit: String(settings.deduction_rate_per_unit),
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('settings.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  loadWeeklyHolidays(): void {
    this.settingsService.loadWeeklyHolidays().subscribe({
      next: (days) => {
        const lang = this.languageService.current();
        this.weekDays.set(
          days.map((day) => ({
            ...day,
            // Weekday names come from Intl for the active language.
            labelKey: weekdayName(day.day_of_week, lang),
          })),
        );
      },
      error: () => {
        this.errorMessage.set(msg('settings.weeklyLoadFailed'));
      },
    });
  }

  toggleWeeklyDay(day: WeeklyDayRow, checked: boolean): void {
    this.weekDays.set(
      this.weekDays().map((row) =>
        row.day_of_week === day.day_of_week ? { ...row, is_active: checked } : row,
      ),
    );
  }

  async onSaveOvertime(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.savingOvertime()) return;

    if (this.settingsId) {
      const confirmed = await this.confirm.ask({
        titleKey: 'confirm.applySettingsTitle',
        messageKey: 'confirm.applyOvertimeMessage',
        variant: 'info',
      });
      if (!confirmed) return;
    }

    this.savingOvertime.set(true);
    this.errorMessage.set(null);
    this.overtimeSaved.set(false);

    const input = this.toOvertimeInput();
    this.settingsService.saveOvertimeDeduction(this.settingsId, input).subscribe({
      next: () => {
        this.loadOvertimeDeduction();
        this.savingOvertime.set(false);
        this.overtimeSaved.set(true);
      },
      error: (err) => {
        this.savingOvertime.set(false);
        this.errorMessage.set(this.describeSaveError(err));
      },
    });
  }

  async onSaveWeeklyHolidays(): Promise<void> {
    if (this.savingWeekly()) return;

    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.applySettingsTitle',
      messageKey: 'confirm.applyWeeklyMessage',
      variant: 'info',
    });
    if (!confirmed) return;

    this.savingWeekly.set(true);
    this.errorMessage.set(null);
    this.weeklySaved.set(false);

    this.settingsService.saveWeeklyHolidays(this.weekDays()).subscribe({
      next: () => {
        this.savingWeekly.set(false);
        this.weeklySaved.set(true);
      },
      error: (err) => {
        this.savingWeekly.set(false);
        this.errorMessage.set(this.describeSaveError(err));
      },
    });
  }

  /** Translation key for a field error. */
  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || control.valid || !control.touched) return null;
    if (control.hasError('required')) return this.messages.fieldData;
    if (control.hasError('positiveNumber')) return this.messages.positiveNumber;
    if (control.hasError('nonNegativeNumber')) return this.messages.nonNegativeNumber;
    return this.messages.fieldData;
  }

  private toOvertimeInput(): OvertimeDeductionInput {
    const value = this.form.getRawValue();
    return {
      overtime_unit_hours: Number(value.overtime_unit_hours),
      overtime_rate_per_unit: Number(value.overtime_rate_per_unit),
      deduction_unit_hours: Number(value.deduction_unit_hours),
      deduction_rate_per_unit: Number(value.deduction_rate_per_unit),
    };
  }

  private describeSaveError(err: any): TranslatedMessage {
    switch (err?.code) {
      case '42501':
        return msg('settings.noEditPermission');
      case '23514':
        return msg('settings.rangeViolation');
      default:
        return msg(this.messages.saveFailed);
    }
  }
}
