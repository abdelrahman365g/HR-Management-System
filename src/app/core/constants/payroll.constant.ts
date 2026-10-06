// Phase 5 — payroll constants. Sibling of VALIDATION_MESSAGES so all
// user-facing salary-report wording lives in constants, never inside
// components (same pattern as ATTENDANCE_MESSAGES). Values are i18n
// keys (see src/assets/i18n/en.json); call sites translate them.
// Month and weekday names come from Intl for the active language.

// Printed on every payslip PDF (PDFs stay English — jsPDF cannot
// render Arabic without an embedded Arabic font and shaping).
export const COMPANY_NAME = 'HRMS Company';

// Display currency for all money values in the report table and PDF.
export const CURRENCY_CODE = 'EGP';

export const SALARY_REPORT_MESSAGES = {
  noPermission: 'salary.noPermission',
  invalidEmployee: 'salary.invalidEmployee',
  invalidYear: 'salary.invalidYear',
  loadFailed: 'salary.loadFailed',
  employeeLookupFailed: 'salary.employeeLookupFailed',
  settingsMissing: 'salary.settingsMissing',
  snapshotFailed: 'salary.snapshotFailed',
  snapshotForbidden: 'salary.snapshotForbidden',
  snapshotConfirm: 'confirm.snapshotTitle',
  snapshotConfirmCurrent: 'confirm.snapshotCurrentMessage',
  snapshotSavedSuffix: 'salary.snapshotSavedSuffix',
  sourceSaved: 'salary.sourceSaved',
  sourceLive: 'salary.sourceLive',
  emptyReport: 'salary.emptyReport',
  tableNote: 'salary.tableNote',
  snapshotCurrentNote: 'salary.snapshotCurrentNote',
  reportTypeMonthly: 'salary.reportTypeMonthly',
  reportTypeYearly: 'salary.reportTypeYearly',
  filtersAll: 'salary.filtersAll',
  monthlyReportTitle: 'salary.monthlyReportTitle',
  yearlyReportTitle: 'salary.yearlyReportTitle',
  printReport: 'salary.printReport',
  printYearlyReport: 'salary.printYearlyReport',
  printFailed: 'salary.printFailed',
  // {cap} is replaced with the actual row cap (kept as-is for PDFs).
  reportCapReached: 'The report exceeds the {cap}-row printing limit. Narrow the filters and try again.',
  // {x} and {y} are replaced with the current/last page numbers (PDF).
  pageOf: 'Page {x} of {y}',
  // Payslip lines ({days} and {rate} are replaced) — PDF strings stay English.
  absenceDeductionLine: 'Absence deduction ({days} days × {rate} daily rate)',
  beforeJoiningLine: 'Days before joining date ({days} days × {rate} daily rate)',
  // Yearly view.
  notEmployedColumn: 'salary.notEmployedColumn',
  summaryTitle: 'salary.summaryTitle',
  totalNetSalary: 'salary.totalNetSalary',
  totalOvertime: 'salary.totalOvertime',
  totalDeduction: 'salary.totalDeduction',
  totalAbsence: 'salary.totalAbsence',
  totalAttendance: 'salary.totalAttendance',
  totalAbsenceDays: 'salary.totalAbsenceDays',
  totalsRow: 'salary.totalsRow',
  yearlyLiveNotice: 'salary.yearlyLiveNotice',
  // {n} and {m} are replaced with the snapshot/month counts (PDF only).
  snapshotCoverage: '{n} of {m} months from saved snapshots.',
  yearlyEmpty: 'salary.yearlyEmpty',
  sourceColumn: 'salary.sourceHeader',
} as const;
