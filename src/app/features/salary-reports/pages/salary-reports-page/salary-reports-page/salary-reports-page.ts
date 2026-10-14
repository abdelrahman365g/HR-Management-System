import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SalaryReportsService } from '../../../services/salary-reports-service';
import { DepartmentsService } from '../../../../departments/services/departments-service';
import { AuthService } from '../../../../../core/services/auth';
import { LanguageService } from '../../../../../core/services/language';
import { ConfirmService } from '../../../../../core/services/confirm';
import { Department } from '../../../../../core/interfaces/employee.interface';
import {
  SalaryReportRow,
  YearlySalaryReport,
} from '../../../../../core/interfaces/salary-report.interface';
import {
  COMPANY_NAME,
  CURRENCY_CODE,
  SALARY_REPORT_MESSAGES,
} from '../../../../../core/constants/payroll.constant';
import { monthName as intlMonthName } from '../../../../../shared/utils/locale-format.util';
import {
  formatGeneratedOn,
  formatHours,
  formatMoney,
  isCurrentMonth,
  isFuturePeriod,
  maskNationalId,
  monthlyReportFileName,
  payslipFileName,
  periodLabel,
  yearlyReportFileName,
} from '../../../../../shared/utils/payslip-pdf.util';
import { buildMonthlyReportPdf, buildYearlyReportPdf } from '../../../utils/salary-report-pdf.util';
import { TranslatedMessage, msg } from '../../../../../shared/utils/i18n-key.util';
import { SalaryReportCard } from '../../../components/salary-report-card/salary-report-card';
import { DetailsDialogService } from '../../../../../core/services/details-dialog.service';
import { DetailField } from '../../../../../core/interfaces/details-dialog.interface';

const PAGE_SIZE = 10;

type ReportMode = 'monthly' | 'yearly';

@Component({
  selector: 'app-salary-reports-page',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, SalaryReportCard],
  templateUrl: './salary-reports-page.html',
  styleUrl: './salary-reports-page.css',
})
export class SalaryReportsPage {
  private readonly salaryReportsService = inject(SalaryReportsService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);
  protected readonly languageService = inject(LanguageService);
  private readonly details = inject(DetailsDialogService);

  readonly rows = signal<SalaryReportRow[]>([]);
  readonly yearlyReport = signal<YearlySalaryReport | null>(null);
  readonly departments = signal<Department[]>([]);
  readonly loading = signal(false);
  readonly savingSnapshot = signal(false);
  readonly printing = signal(false);
  readonly searched = signal(false);
  readonly errorMessage = signal<TranslatedMessage | null>(null);
  readonly infoMessage = signal<TranslatedMessage | null>(null);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly pageSize = PAGE_SIZE;
  readonly mode = signal<ReportMode>('monthly');
  readonly isMobile = signal(window.innerWidth < 1024);

  readonly canView = signal(this.authService.hasPermission('salary_reports', 'view'));
  readonly canEdit = signal(this.authService.hasPermission('salary_reports', 'edit'));

  readonly messages = SALARY_REPORT_MESSAGES;
  readonly companyName = COMPANY_NAME;
  readonly currencyCode = CURRENCY_CODE;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() < this.totalPages() - 1);

  readonly minYear = signal(new Date().getFullYear());
  readonly maxYear = new Date().getFullYear();
  readonly yearOptions = computed(() => {
    const years: number[] = [];
    for (let y = this.maxYear; y >= this.minYear(); y--) {
      years.push(y);
    }
    return years;
  });

  private lastQuery: {
    month: number;
    year: number;
    employeeId: string | null;
    departmentId: string | null;
  } | null = null;

  readonly form: FormGroup = this.fb.group({
    employeeName: [''],
    department_id: [''],
    month: [new Date().getMonth() + 1],
    year: [new Date().getFullYear()],
  });

  constructor() {
    this.departmentsService.listDepartments().subscribe({
      next: (departments) => this.departments.set(departments),
      error: () => {},
    });

    this.salaryReportsService.getFoundingYear().subscribe({
      next: (year) => this.minYear.set(year),
      error: () => {},
    });

    if (this.canView()) {
      this.loadReport();
    }
  }

  setMode(mode: ReportMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.rows.set([]);
    this.yearlyReport.set(null);
    this.total.set(0);
    this.page.set(0);
    this.searched.set(false);
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }

  isMonthly(): boolean {
    return this.mode() === 'monthly';
  }

  onSearch(): void {
    this.infoMessage.set(null);
    this.errorMessage.set(null);

    const { employeeName, department_id, month, year } = this.form.getRawValue();
    const name = String(employeeName ?? '').trim();
    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    // Year/future-period validation happens before any query.
    if (selectedYear < this.minYear() || isFuturePeriod(selectedMonth, selectedYear)) {
      this.clearResults();
      this.errorMessage.set(msg(this.salaryMessages().invalidYear));
      return;
    }

    // Employee-name validation (required in yearly mode, optional
    // filter in monthly mode). An unknown name must not reach the DB.
    if (name || !this.isMonthly()) {
      if (!name) {
        this.clearResults();
        this.errorMessage.set(msg(this.salaryMessages().invalidEmployee));
        return;
      }
      this.loading.set(true);
      this.salaryReportsService.findEmployeeByName(name).subscribe({
        next: (matches) => {
          if (matches.length === 0) {
            this.loading.set(false);
            this.clearResults();
            this.errorMessage.set(msg(this.salaryMessages().invalidEmployee));
            return;
          }
          this.runQuery(selectedMonth, selectedYear, matches[0].id, department_id || null);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set(msg(this.salaryMessages().employeeLookupFailed));
        },
      });
      return;
    }

    this.runQuery(selectedMonth, selectedYear, null, department_id || null);
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadReport();
  }

  /** Typed accessor so the template can bind message keys. */
  salaryMessages() {
    return SALARY_REPORT_MESSAGES;
  }

  /** Formatted helpers used by the template (PDF stays English). */
  money(value: number): string {
    return formatMoney(value);
  }

  hours(value: number): string {
    return formatHours(value);
  }

  maskedNationalId(row: SalaryReportRow): string {
    return maskNationalId(row.national_id);
  }

  period(): string {
    return periodLabel(Number(this.form.getRawValue().month), Number(this.form.getRawValue().year));
  }

  /** Localized month name for selects/tables (Western digits). */
  monthLabel(month: number): string {
    return intlMonthName(month, this.languageService.current());
  }

  snapshotCoverageLabel(snapshotMonths: number, monthsCount: number): string {
    return this.salaryMessages()
      .snapshotCoverage.replace('{n}', String(snapshotMonths))
      .replace('{m}', String(monthsCount));
  }

  isSourceSaved(source: string): boolean {
    return source === 'snapshot';
  }

  sourceLabelKey(source: string): string {
    return this.isSourceSaved(source)
      ? this.salaryMessages().sourceSaved
      : this.salaryMessages().sourceLive;
  }

  /** Snapshot button visibility: edit permission + not a future period. */
  canSaveSnapshot(): boolean {
    if (!this.canEdit() || !this.isMonthly()) return false;
    const { month, year } = this.form.getRawValue();
    return !isFuturePeriod(Number(month), Number(year));
  }

  isCurrentPeriod(): boolean {
    const { month, year } = this.form.getRawValue();
    return isCurrentMonth(Number(month), Number(year));
  }

  async onPrint(row: SalaryReportRow): Promise<void> {
    const { month, year } = this.form.getRawValue();
    const { jsPDF } = await import('jspdf'); // loaded only on click

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const left = 20;
    let y = 24;

    doc.setFontSize(16);
    doc.text(this.companyName, left, y);
    y += 8;

    doc.setFontSize(13);
    doc.text('Payslip', left, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Pay period: ${periodLabel(Number(month), Number(year))}`, left, y);
    y += 6;
    doc.text(formatGeneratedOn(row.generated_at), left, y);
    y += 10;

    doc.line(left, y - 4, 190, y - 4);

    const lines: Array<[string, string] | null> = [
      ['Employee name', row.employee_name],
      ['National ID', maskNationalId(row.national_id)],
      ['Department', row.department_name],
      null,
      ['Base salary', `${formatMoney(row.base_salary)} ${CURRENCY_CODE}`],
      ['Attendance days', String(row.attendance_days)],
      ['Absence days', String(row.absence_days)],
      ['Daily rate', `${formatMoney(row.daily_rate)} ${CURRENCY_CODE}`],
      null,
      [
        'Overtime',
        `${formatHours(row.overtime_hours)} h / ${formatMoney(row.total_overtime_amount)} ${CURRENCY_CODE}`,
      ],
      null,
      ['Late arrival / early departure hours', `${formatHours(row.deduction_hours)} h`],
      [
        'Late arrival / early departure deduction',
        `${formatMoney(row.total_deduction_amount)} ${CURRENCY_CODE}`,
      ],
      [
        this.salaryMessages()
          .absenceDeductionLine.replace('{days}', String(row.absence_days))
          .replace('{rate}', formatMoney(row.daily_rate)),
        `${formatMoney(row.total_absence_amount)} ${CURRENCY_CODE}`,
      ],
      // Proration line only when there are days before the joining date.
      row.not_employed_days > 0
        ? [
            this.salaryMessages()
              .beforeJoiningLine.replace('{days}', String(row.not_employed_days))
              .replace('{rate}', formatMoney(row.daily_rate)),
            formatMoney(Math.round(row.not_employed_days * row.daily_rate * 100) / 100) +
              ` ${CURRENCY_CODE}`,
          ]
        : null,
      null,
      // Keep net salary as the LAST salary line.
      ['Net salary', `${formatMoney(row.net_salary)} ${CURRENCY_CODE}`],
    ];

    doc.setFontSize(10);
    for (const line of lines) {
      if (!line) {
        y += 4;
        continue;
      }
      const [label, value] = line;
      doc.text(label, left, y);
      doc.text(value, 130, y);
      y += 6;
    }

    doc.save(payslipFileName(row.employee_name, Number(month), Number(year)));
  }

  /** Prints the full monthly listing for the current filters. */
  async onPrintMonthlyReport(): Promise<void> {
    if (!this.lastQuery || this.printing()) return;

    this.printing.set(true);
    this.errorMessage.set(null);

    try {
      const rows = await firstValueFrom(
        this.salaryReportsService.getAllReportRows({
          ...this.lastQuery,
          page: 0,
          pageSize: this.pageSize,
        }),
      );

      if (rows === null) {
        this.errorMessage.set(msg('salary.reportCapReachedText', { cap: 2000 }));
        return;
      }

      const { month, year } = this.form.getRawValue();
      const employeeFilter = String(this.form.getRawValue().employeeName ?? '').trim();
      const department = this.departments().find((d) => d.id === this.lastQuery?.departmentId);

      await buildMonthlyReportPdf({
        companyName: this.companyName,
        title: 'Monthly Salary Report',
        periodLabel: periodLabel(Number(month), Number(year)),
        filterDescription: [
          `Employee: ${employeeFilter || 'All'}`,
          `Department: ${department?.name ?? 'All'}`,
        ].join(' | '),
        generatedOn: null,
        pageOfTemplate: this.salaryMessages().pageOf,
        fileName: monthlyReportFileName(Number(year), Number(month)),
        rows,
      });
    } catch {
      this.errorMessage.set(msg(this.salaryMessages().printFailed));
    } finally {
      this.printing.set(false);
    }
  }

  async onSaveSnapshot(): Promise<void> {
    if (!this.canSaveSnapshot() || this.savingSnapshot()) return;

    const { month, year } = this.form.getRawValue();
    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.snapshotTitle',
      messageKey: this.isCurrentPeriod()
        ? 'confirm.snapshotCurrentMessage'
        : 'confirm.snapshotMessage',
      params: { month: this.monthLabel(Number(month)), year: Number(year) },
      variant: 'info',
    });
    if (!confirmed) return;

    this.savingSnapshot.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.salaryReportsService.generateSnapshots(Number(month), Number(year)).subscribe({
      next: (written) => {
        this.savingSnapshot.set(false);
        this.infoMessage.set(msg('salary.snapshotSavedInfo', { count: written }));
        this.page.set(0);
        this.loadReport();
      },
      error: (err) => {
        this.savingSnapshot.set(false);
        this.errorMessage.set(this.describeSnapshotError(err));
      },
    });
  }

  private clearResults(): void {
    this.rows.set([]);
    this.yearlyReport.set(null);
    this.total.set(0);
    this.searched.set(false);
  }

  private runQuery(
    month: number,
    year: number,
    employeeId: string | null,
    departmentId: string | null,
  ): void {
    this.lastQuery = { month, year, employeeId, departmentId };
    this.page.set(0);
    this.loadReport();
  }

  private loadReport(): void {
    if (!this.canView() || !this.lastQuery) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.salaryReportsService
      .getReport({ ...this.lastQuery, page: this.page(), pageSize: this.pageSize })
      .subscribe({
        next: ({ rows, total }) => {
          this.rows.set(rows);
          this.total.set(total);
          this.searched.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          this.rows.set([]);
          this.total.set(0);
          this.searched.set(true);
          this.loading.set(false);
          this.errorMessage.set(this.describeReportError(err));
        },
      });
  }

  private describeReportError(err: any): TranslatedMessage {
    const message = String(err?.message ?? '');
    if (message.includes('FORBIDDEN') || err?.code === '42501') {
      return msg(this.salaryMessages().noPermission);
    }
    if (message.includes('INVALID_PERIOD')) {
      return msg(this.salaryMessages().invalidYear);
    }
    if (message.includes('EMPLOYEE_NOT_FOUND')) {
      return msg(this.salaryMessages().invalidEmployee);
    }
    if (message.includes('SETTINGS_NOT_CONFIGURED')) {
      return msg(this.salaryMessages().settingsMissing);
    }
    return msg(this.salaryMessages().loadFailed);
  }

  private describeSnapshotError(err: any): TranslatedMessage {
    const message = String(err?.message ?? '');
    if (message.includes('FORBIDDEN') || err?.code === '42501') {
      return msg(this.salaryMessages().snapshotForbidden);
    }
    if (message.includes('INVALID_PERIOD')) {
      return msg(this.salaryMessages().invalidYear);
    }
    if (message.includes('SETTINGS_NOT_CONFIGURED')) {
      return msg(this.salaryMessages().settingsMissing);
    }
    return msg(this.salaryMessages().snapshotFailed);
  }

  onView(row: SalaryReportRow): void {
    const { month, year } = this.form.getRawValue();
    const period = new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));

    void this.details.open({
      titleKey: 'salaryDetails.title',
      titleParams: { name: row.employee_name },
      subtitle: period,
      size: 'lg',
      data: row,
      highlights: [
        {
          path: 'net_salary',
          labelKey: 'salaryDetails.fields.netSalary',
          type: 'money',
          currency: CURRENCY_CODE,
          emphasis: true,
        },
        {
          path: 'attendance_days',
          labelKey: 'salaryDetails.fields.attendanceDays',
          type: 'number',
        },
      ],
      sections: [
        {
          kind: 'fields',
          titleKey: 'salaryDetails.sections.employee',
          fields: [
            { path: 'employee_name', labelKey: 'salaryDetails.fields.employeeName' },
            { path: 'department_name', labelKey: 'salaryDetails.fields.department' },
            { path: 'national_id', labelKey: 'salaryDetails.fields.nationalId', type: 'id' },
            {
              path: 'generated_at',
              labelKey: 'salaryDetails.fields.generatedAt',
              type: 'datetime',
              hideWhenEmpty: true,
            },
          ],
        },
        {
          kind: 'fields',
          titleKey: 'salaryDetails.sections.attendance',
          fields: [
            { path: 'absence_days', labelKey: 'salaryDetails.fields.absenceDays', type: 'number' },
            ...((row.not_employed_days ?? 0) > 0
              ? [
                  {
                    path: 'not_employed_days',
                    labelKey: 'salaryDetails.fields.notEmployedDays',
                    type: 'number',
                    hideWhenEmpty: true,
                  } as DetailField,
                ]
              : []),
            {
              path: 'overtime_hours',
              labelKey: 'salaryDetails.fields.overtimeHours',
              type: 'number',
              decimals: 2,
              suffixKey: 'salaryDetails.unit.hours',
            },
            {
              path: 'deduction_hours',
              labelKey: 'salaryDetails.fields.deductionHours',
              type: 'number',
              decimals: 2,
              suffixKey: 'salaryDetails.unit.hours',
            },
          ],
        },
        {
          kind: 'fields',
          titleKey: 'salaryDetails.sections.amounts',
          fields: [
            {
              path: 'base_salary',
              labelKey: 'salaryDetails.fields.baseSalary',
              type: 'money',
              currency: CURRENCY_CODE,
            },
            {
              path: 'daily_rate',
              labelKey: 'salaryDetails.fields.dailyRate',
              type: 'money',
              currency: CURRENCY_CODE,
            },
            {
              path: 'total_overtime_amount',
              labelKey: 'salaryDetails.fields.overtimeAmount',
              type: 'money',
              currency: CURRENCY_CODE,
            },
            {
              path: 'total_deduction_amount',
              labelKey: 'salaryDetails.fields.deductionAmount',
              type: 'money',
              currency: CURRENCY_CODE,
            },
            {
              path: 'total_absence_amount',
              labelKey: 'salaryDetails.fields.absenceAmount',
              type: 'money',
              currency: CURRENCY_CODE,
            },
          ],
        },
      ],
    });
  }
}
