import { Injectable, inject } from '@angular/core';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import { Employee, EmployeeInput } from '../../../core/interfaces/employee.interface';
import { DEFAULT_FOUNDING_DATE } from '../../../core/constants/validation.constant';

export interface EmployeeQuery {
  page: number;
  pageSize: number;
  search?: string;
  departmentId?: string | null;
}

export interface EmployeePage {
  items: Employee[];
  total: number;
}

const EMPLOYEE_SELECT = '*, departments(id, name)';

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private readonly supabase = inject(Supabase);

  loadEmployees(query: EmployeeQuery): Observable<EmployeePage> {
    // PostgREST can't OR a top-level column with an embedded one in a
    // single filter, so resolve matching department ids first.
    return this.matchingDepartmentIds(query.search ?? '').pipe(
      switchMap((departmentIds) => {
        let builder = this.supabase.client
          .from('employees')
          .select(EMPLOYEE_SELECT, { count: 'exact' });

        if (query.departmentId) {
          builder = builder.eq('department_id', query.departmentId);
        }

        const pattern = toIlikePattern(query.search ?? '');
        if (pattern) {
          builder = builder.or(
            departmentIds.length > 0
              ? `full_name.ilike.${pattern},department_id.in.(${departmentIds.join(',')})`
              : `full_name.ilike.${pattern}`,
          );
        }

        const start = query.page * query.pageSize;
        return from(
          builder
            .order('full_name')
            .range(start, start + query.pageSize - 1),
        );
      }),
      map(({ data, error, count }) => {
        if (error) throw error;
        return {
          items: (data ?? []) as Employee[],
          total: count ?? 0,
        };
      }),
    );
  }

  getEmployee(employeeId: string): Observable<Employee> {
    return from(
      this.supabase.client.from('employees').select(EMPLOYEE_SELECT).eq('id', employeeId).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Employee;
      }),
    );
  }

  createEmployee(input: EmployeeInput): Observable<Employee> {
    return from(
      this.supabase.client.from('employees').insert(input).select(EMPLOYEE_SELECT).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Employee;
      }),
    );
  }

  updateEmployee(employeeId: string, input: EmployeeInput): Observable<Employee> {
    return from(
      this.supabase.client
        .from('employees')
        .update(input)
        .eq('id', employeeId)
        .select(EMPLOYEE_SELECT)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Employee;
      }),
    );
  }

  deleteEmployee(employeeId: string): Observable<void> {
    return from(this.supabase.client.from('employees').delete().eq('id', employeeId)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getFoundingDate(): Observable<string> {
    return from(
      this.supabase.client
        .from('app_config')
        .select('value')
        .eq('key', 'company_founding_date')
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data?.value as string) ?? DEFAULT_FOUNDING_DATE;
      }),
    );
  }

  private matchingDepartmentIds(search: string): Observable<string[]> {
    const pattern = toIlikePattern(search);
    if (!pattern) return of([]);

    return from(this.supabase.client.from('departments').select('id').ilike('name', pattern)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((department) => department.id as string);
      }),
    );
  }
}

function toIlikePattern(search: string): string {
  const cleaned = search.replace(/[%"'(),\\]/g, ' ').trim();
  return cleaned ? `%${cleaned}%` : '';
}
