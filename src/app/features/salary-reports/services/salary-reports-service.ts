import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import {
  SalaryReportResult,
  YearlySalaryReport,
} from '../../../core/interfaces/salary-report.interface';
import { DEFAULT_FOUNDING_DATE } from '../../../core/constants/validation.constant';

/** Hard cap for the printable monthly report (every page at once). */
export const MONTHLY_REPORT_MAX_ROWS = 2000;

export interface SalaryReportQuery {
  month: number;
  year: number;
  employeeId: string | null;
  departmentId: string | null;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class SalaryReportsService {
  private readonly supabase = inject(Supabase);

  /** Rows + total for one period, via the get_salary_report RPC. */
  getReport(criteria: SalaryReportQuery): Observable<SalaryReportResult> {
    return from(
      this.supabase.client.rpc('get_salary_report', {
        p_month: criteria.month,
        p_year: criteria.year,
        p_employee_id: criteria.employeeId || null,
        p_department_id: criteria.departmentId || null,
        p_limit: criteria.pageSize,
        p_offset: criteria.page * criteria.pageSize,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as SalaryReportResult['rows'];
        // count(*) over() repeats the full-set count on every row.
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
        return { rows, total };
      }),
    );
  }

  /** Upserts snapshots for the period; returns the number written. */
  generateSnapshots(month: number, year: number): Observable<number> {
    return from(
      this.supabase.client.rpc('generate_salary_snapshots', {
        p_month: month,
        p_year: year,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return Number(data ?? 0);
      }),
    );
  }

  /** Yearly roll-up for one employee via the yearly report RPC. */
  getYearlyReport(employeeId: string, year: number): Observable<YearlySalaryReport> {
    return from(
      this.supabase.client.rpc('get_yearly_salary_report', {
        p_employee_id: employeeId,
        p_year: year,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as YearlySalaryReport;
      }),
    );
  }

  /**
   * Fetches EVERY page for the current filters (for the printable
   * monthly report). Resolves to `null` when the result set exceeds
   * MONTHLY_REPORT_MAX_ROWS so the caller can warn instead of printing
   * a silently truncated document.
   */
  getAllReportRows(query: SalaryReportQuery): Observable<SalaryReportResult['rows'] | null> {
    return this.getReport({ ...query, page: 0, pageSize: MONTHLY_REPORT_MAX_ROWS }).pipe(
      map(({ rows, total }) => (total > MONTHLY_REPORT_MAX_ROWS ? null : rows)),
    );
  }

  /** Optional name filter: resolves a typed name to an employee id. */
  findEmployeeByName(name: string): Observable<{ id: string; full_name: string }[]> {
    const pattern = toIlikePattern(name);
    if (!pattern) return from([]);
    return from(
      this.supabase.client
        .from('employees')
        .select('id, full_name')
        .ilike('full_name', pattern)
        .limit(1),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as { id: string; full_name: string }[];
      }),
    );
  }

  getFoundingYear(): Observable<number> {
    return from(
      this.supabase.client
        .from('app_config')
        .select('value')
        .eq('key', 'company_founding_date')
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const year = Number((data?.value as string)?.slice(0, 4));
        return Number.isFinite(year) && year > 0 ? year : Number(DEFAULT_FOUNDING_DATE.slice(0, 4));
      }),
    );
  }
}

function toIlikePattern(search: string): string {
  const cleaned = search.replace(/[%'"(),\\]/g, ' ').trim();
  return cleaned ? `%${cleaned}%` : '';
}
