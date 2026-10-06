import { Injectable, inject } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import { AttendanceRecord } from '../../../core/interfaces/attendance.interface';
import { Employee } from '../../../core/interfaces/employee.interface';
import {
  ImportRow,
  SkippedRow,
  toIlikePattern,
} from '../../../shared/utils/attendance-import.util';

export interface AttendanceSearchCriteria {
  employeeName?: string;
  departmentId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page: number;
  pageSize: number;
}

export interface AttendanceSearchResult {
  items: AttendanceRow[];
  total: number;
}

export interface AttendanceRow extends AttendanceRecord {
  employees: {
    id: string;
    full_name: string;
    departments: { id: string; name: string } | null;
  } | null;
}

export interface ImportReport {
  inserted: number;
  updated: number;
  skipped: SkippedRow[];
}

export interface AttendanceRecordInput {
  employee_id: string;
  record_date: string;
  check_in_actual: string | null;
  check_out_actual: string | null;
  note?: string | null;
}

export interface AttendanceRecordUpdate {
  check_in_actual: string | null;
  check_out_actual: string | null;
  note: string | null;
}

export interface ClockEmployee {
  id: string;
  full_name: string;
  department_name: string;
  check_in_actual: string | null;
  check_out_actual: string | null;
}

export type ClockAction = 'check_in' | 'check_out';

const ATTENDANCE_SELECT = '*, employees!inner(id, full_name, departments(id, name))';

const CLOCK_TIMEZONE = 'Africa/Cairo';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly supabase = inject(Supabase);

  searchRecords(criteria: AttendanceSearchCriteria): Observable<AttendanceSearchResult> {
    let builder = this.supabase.client
      .from('attendance_records')
      .select(ATTENDANCE_SELECT, { count: 'exact' });

    const pattern = toIlikePattern(criteria.employeeName ?? '');
    if (pattern) {
      builder = builder.ilike('employees.full_name', pattern);
    }
    if (criteria.departmentId) {
      builder = builder.eq('employees.department_id', criteria.departmentId);
    }
    if (criteria.dateFrom) {
      builder = builder.gte('record_date', criteria.dateFrom);
    }
    if (criteria.dateTo) {
      builder = builder.lte('record_date', criteria.dateTo);
    }

    const start = criteria.page * criteria.pageSize;
    return from(
      builder
        .order('record_date', { ascending: false })
        .order('full_name', { referencedTable: 'employees', ascending: true })
        .range(start, start + criteria.pageSize - 1),
    ).pipe(
      map(({ data, error, count }) => {
        if (error) throw error;
        return { items: (data ?? []) as AttendanceRow[], total: count ?? 0 };
      }),
    );
  }

  getRecord(recordId: string): Observable<AttendanceRow> {
    return from(
      this.supabase.client
        .from('attendance_records')
        .select(ATTENDANCE_SELECT)
        .eq('id', recordId)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as AttendanceRow;
      }),
    );
  }

  findEmployeeByName(name: string): Observable<Employee[]> {
    const pattern = toIlikePattern(name);
    if (!pattern) return from([]);
    return from(
      this.supabase.client
        .from('employees')
        .select('id, full_name, department_id, contract_date')
        .ilike('full_name', pattern)
        .limit(10),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Employee[];
      }),
    );
  }

  createRecord(input: AttendanceRecordInput): Observable<void> {
    return from(
      this.supabase.client.from('attendance_records').insert({ ...input, source: 'manual' }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  updateRecord(recordId: string, values: AttendanceRecordUpdate): Observable<void> {
    return from(
      this.supabase.client.from('attendance_records').update(values).eq('id', recordId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  deleteRecord(recordId: string): Observable<void> {
    return from(this.supabase.client.from('attendance_records').delete().eq('id', recordId)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  isHoliday(dateIso: string): Observable<boolean> {
    return from(this.supabase.client.rpc('is_holiday', { d: dateIso })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data === true;
      }),
    );
  }

  importRows(rows: ImportRow[]): Observable<ImportReport> {
    return from(this.supabase.client.rpc('import_attendance', { p_rows: rows })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ImportReport;
      }),
    );
  }

  listEmployeesGroupedForClock(): Observable<ClockEmployee[]> {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: CLOCK_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    return from(
      this.supabase.client
        .from('employees')
        .select(
          'id, full_name, departments(name), attendance_records(check_in_actual, check_out_actual, record_date)',
        )
        .eq('attendance_records.record_date', today)
        .order('full_name'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        return (data ?? []).map((e: any) => {
          const today = (e.attendance_records ?? [])[0] ?? null;
          return {
            id: e.id,
            full_name: e.full_name,
            department_name: e.departments?.name ?? 'Unassigned',
            check_in_actual: today?.check_in_actual ?? null,
            check_out_actual: today?.check_out_actual ?? null,
          } as ClockEmployee;
        });
      }),
    );
  }

  clock(
    employeeId: string,
    action: ClockAction,
  ): Observable<{ check_in_actual: string | null; check_out_actual: string | null }> {
    return from(
      this.supabase.client.functions.invoke('attendance-clock', {
        body: { employee_id: employeeId, action },
      }),
    ).pipe(
      switchMap(async ({ data, error }) => {
        if (error) throw await toFunctionError(error);
        return (
          data as { record: { check_in_actual: string | null; check_out_actual: string | null } }
        ).record;
      }),
    );
  }
}

async function toFunctionError(error: unknown): Promise<Error> {
  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const body = await context.json();
      if (typeof body?.error === 'string') {
        return new Error(body.error);
      }
    } catch {
      return new Error('Something went wrong');
    }
  }
  return error instanceof Error ? error : new Error('UNKNOWN_ERROR');
}
