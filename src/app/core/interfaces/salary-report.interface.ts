export interface SalaryReport {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  attendance_days: number;
  absence_days: number;
  overtime_hours: number;
  deduction_hours: number;
  total_overtime_amount: number;
  total_deduction_amount: number;
  net_salary: number;
  // Phase 5 columns (migration 0007) — absent on rows created before
  // the migration ran, hence optional.
  daily_rate?: number;
  not_employed_days?: number;
  total_absence_amount?: number;
}

export interface SalaryReportRow {
  employee_id: string;
  employee_name: string;
  national_id: string;
  department_name: string;
  base_salary: number;
  attendance_days: number;
  absence_days: number;
  not_employed_days: number;
  overtime_hours: number;
  deduction_hours: number;
  daily_rate: number;
  total_overtime_amount: number;
  total_deduction_amount: number;
  total_absence_amount: number;
  net_salary: number;
  source: 'snapshot' | 'live';
  generated_at: string | null;
  total_count: number;
}

export interface SalaryReportCriteria {
  month: number;
  year: number;
  employeeId?: string | null;
  departmentId?: string | null;
  page: number; // 0-based
  pageSize: number;
}

export interface SalaryReportResult {
  rows: SalaryReportRow[];
  total: number;
}

// Yearly report (get_yearly_salary_report RPC, migration 0007).

export interface YearlyReportEmployee {
  id: string;
  name: string;
  national_id: string;
  department_name: string;
}

export interface YearlyReportMonth {
  month: number; // 1-12
  base_salary: number;
  attendance_days: number;
  absence_days: number;
  not_employed_days: number;
  overtime_hours: number;
  deduction_hours: number;
  daily_rate: number;
  total_overtime_amount: number;
  total_deduction_amount: number;
  total_absence_amount: number;
  net_salary: number;
  source: 'snapshot' | 'live';
  generated_at: string | null;
}

export interface YearlyReportTotals {
  months_count: number;
  snapshot_months: number;
  live_months: number;
  includes_current_month: boolean;
  attendance_days: number;
  absence_days: number;
  not_employed_days: number;
  overtime_hours: number;
  deduction_hours: number;
  total_base_salary: number;
  total_overtime_amount: number;
  total_deduction_amount: number;
  total_absence_amount: number;
  total_net_salary: number;
}

export interface YearlySalaryReport {
  employee: YearlyReportEmployee;
  year: number;
  months: YearlyReportMonth[];
  totals: YearlyReportTotals;
}
