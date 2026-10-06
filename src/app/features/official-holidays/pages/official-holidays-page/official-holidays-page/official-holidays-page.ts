import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../../../core/services/auth';
import { LanguageService } from '../../../../../core/services/language';
import { ConfirmService } from '../../../../../core/services/confirm';
import {
  DEFAULT_FOUNDING_DATE,
  VALIDATION_MESSAGES,
} from '../../../../../core/constants/validation.constant';
import { nonEmptyValidator } from '../../../../../shared/validators/employee.validators';
import {
  formatDate,
  weekdayName,
} from '../../../../../shared/utils/locale-format.util';
import {
  OfficialHoliday,
  OfficialHolidaysService,
} from '../../../services/official-holidays-service';
import { TranslatedMessage, msg } from '../../../../../shared/utils/i18n-key.util';

@Component({
  selector: 'app-official-holidays-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './official-holidays-page.html',
  styleUrl: './official-holidays-page.css',
})
export class OfficialHolidaysPage {
  private readonly holidaysService = inject(OfficialHolidaysService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);
  protected readonly languageService = inject(LanguageService);

  readonly holidays = signal<OfficialHoliday[]>([]);
  readonly years = signal<number[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);

  readonly canView = signal(this.authService.hasPermission('official_holidays', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('official_holidays', 'edit'));

  readonly messages = VALIDATION_MESSAGES;

  readonly selectedYear = signal(new Date().getFullYear());
  readonly foundingDate = signal(DEFAULT_FOUNDING_DATE);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, nonEmptyValidator()]],
    holiday_date: ['', [Validators.required, foundingDateValidator(() => this.foundingDate())]],
  });

  constructor() {
    if (!this.canView()) {
      this.loading.set(false);
      return;
    }

    this.loadFoundingDate();
    this.loadYears();
    this.loadHolidays();
  }

  loadFoundingDate(): void {
    this.holidaysService.getFoundingDate().subscribe({
      next: (date) => this.foundingDate.set(date),
      error: () => {
        this.foundingDate.set(DEFAULT_FOUNDING_DATE);
      },
    });
  }

  loadYears(): void {
    this.holidaysService.listYears().subscribe({
      next: (years) => {
        const currentYear = new Date().getFullYear();
        this.years.set([...new Set([currentYear, ...years])].sort((a, b) => b - a));
      },
      error: () => {
        this.errorMessage.set(msg('holidays.yearsFailed'));
      },
    });
  }

  loadHolidays(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.holidaysService.listByYear(this.selectedYear()).subscribe({
      next: (holidays) => {
        this.holidays.set(holidays);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(msg('holidays.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  onYearChanged(year: string): void {
    this.selectedYear.set(Number(year));
    this.loadHolidays();
  }

  onCreate(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const { name, holiday_date } = this.form.getRawValue();
    this.holidaysService.create({ name: String(name).trim(), holiday_date }).subscribe({
      next: () => {
        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.saving.set(false);
        this.loadYears();
        this.loadHolidays();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(this.describeSaveError(err));
      },
    });
  }

  async onDelete(holiday: OfficialHoliday): Promise<void> {
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.deleteTitle',
      messageKey: 'confirm.deleteMessage',
      params: { name: holiday.name },
      variant: 'danger',
    });
    if (!confirmed) return;

    this.holidaysService.delete(holiday.id).subscribe({
      next: () => {
        this.loadYears();
        this.loadHolidays();
      },
      error: (err) => this.errorMessage.set(this.describeDeleteError(err)),
    });
  }

  /** Weekday name from Intl for the active language. */
  weekdayLabel(holiday: OfficialHoliday): string {
    return weekdayName(new Date(holiday.holiday_date + 'T00:00:00').getDay(), this.languageService.current());
  }

  /** Localized date, Western digits. */
  dateLabel(holiday: OfficialHoliday): string {
    return formatDate(holiday.holiday_date, this.languageService.current());
  }

  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || control.valid || !control.touched) return null;
    if (control.hasError('required')) return this.messages.required;
    if (control.hasError('holidayDate')) return this.messages.holidayDateEarly;
    return this.messages.required;
  }

  private describeSaveError(err: any): TranslatedMessage {
    switch (err?.code) {
      case '23505':
        return msg(this.messages.holidayDateDuplicate);
      case '42501':
        return msg('holidays.manageForbidden');
      case '23514':
        return msg('holidays.nameEmpty');
      default:
        return msg(this.messages.saveFailed);
    }
  }

  private describeDeleteError(err: any): TranslatedMessage {
    switch (err?.code) {
      case '42501':
        return msg('holidays.manageForbidden');
      default:
        return msg('holidays.deleteFailed');
    }
  }
}

function foundingDateValidator(minDate: () => string): ValidatorFn {
  return (control) => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    const min = minDate();
    if (!min) return null;
    return value >= min ? null : { holidayDate: true };
  };
}
