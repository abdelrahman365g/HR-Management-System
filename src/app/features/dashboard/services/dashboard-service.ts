import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';

export interface DashboardAttendance {
  expected: number;
  checked_in: number;
  checked_out: number;
  not_checked_in: number;
}

export interface DashboardHeadcount {
  total: number;
  by_department: { department: string; count: number }[];
}

export interface DashboardHoliday {
  name: string;
  date: string;
  days_until: number;
}

export interface DashboardSalary {
  month: number;
  year: number;
  eligible_employees: number;
  snapshots_saved: number;
  pending: number;
}

export interface DashboardStats {
  today: string;
  is_holiday_today: boolean;
  attendance: DashboardAttendance | null;
  headcount: DashboardHeadcount | null;
  upcoming_holidays: DashboardHoliday[] | null;
  salary: DashboardSalary | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabase = inject(Supabase);

  /** Permission-gated dashboard payload; sections are null without access. */
  getStats(): Observable<DashboardStats> {
    return from(this.supabase.client.rpc('get_dashboard_stats')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? {}) as DashboardStats;
      }),
    );
  }
}
