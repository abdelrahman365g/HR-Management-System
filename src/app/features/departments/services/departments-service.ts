import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import { Department, DepartmentInput } from '../../../core/interfaces/employee.interface';

@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly supabase = inject(Supabase);

  listDepartments(): Observable<Department[]> {
    return from(this.supabase.client.from('departments').select('id, name').order('name')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Department[];
      }),
    );
  }

  createDepartment(input: DepartmentInput): Observable<Department> {
    return from(
      this.supabase.client.from('departments').insert(input).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Department;
      }),
    );
  }

  updateDepartment(departmentId: string, input: DepartmentInput): Observable<Department> {
    return from(
      this.supabase.client
        .from('departments')
        .update(input)
        .eq('id', departmentId)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Department;
      }),
    );
  }

  deleteDepartment(departmentId: string): Observable<void> {
    return from(this.supabase.client.from('departments').delete().eq('id', departmentId)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
