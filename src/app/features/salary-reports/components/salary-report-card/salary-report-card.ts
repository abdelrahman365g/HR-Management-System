import { Component, inject, input, output } from '@angular/core';
import { SalaryReportRow } from '../../../../core/interfaces/salary-report.interface';
import { TranslatePipe } from '@ngx-translate/core';
import { DetailsDialogService } from '../../../../core/services/details-dialog.service';
import { CURRENCY_CODE } from '../../../../core/constants/payroll.constant';
import { DetailField } from '../../../../core/interfaces/details-dialog.interface';

@Component({
  imports: [TranslatePipe],
  selector: 'app-salary-report-card',
  styleUrl: './salary-report-card.css',
  templateUrl: './salary-report-card.html',
})
export class SalaryReportCard {
  private readonly details = inject(DetailsDialogService);

  readonly row = input<SalaryReportRow>();
  readonly currencyCode = input<string>();
  readonly month = input<number>();
  readonly year = input<number>();
  readonly print = output<SalaryReportRow>();

  onView(): void {
    const period = new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(this.year()!, this.month()! - 1, 1)));

    void this.details.open({
      titleKey: 'salaryDetails.title',
      titleParams: { name: this.row()?.employee_name },
      subtitle: period,
      size: 'lg',
      data: this.row(),
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
            ...((this.row()?.not_employed_days ?? 0) > 0
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
