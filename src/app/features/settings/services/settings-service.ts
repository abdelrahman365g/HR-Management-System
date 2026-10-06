import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';

export interface OvertimeDeductionSettings {
  id: string;
  overtime_unit_hours: number;
  overtime_rate_per_unit: number;
  deduction_unit_hours: number;
  deduction_rate_per_unit: number;
  effective_from: string;
  created_at: string;
}

export interface OvertimeDeductionInput {
  overtime_unit_hours: number;
  overtime_rate_per_unit: number;
  deduction_unit_hours: number;
  deduction_rate_per_unit: number;
}

export interface WeeklyHoliday {
  id: string;
  day_of_week: number;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly supabase = inject(Supabase);

  loadOvertimeDeduction(): Observable<OvertimeDeductionSettings | null> {
    return from(
      this.supabase.client
        .from('settings_overtime_deduction')
        .select('*')
        .order('effective_from', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data?.[0] as OvertimeDeductionSettings) ?? null;
      }),
    );
  }

  saveOvertimeDeduction(
    id: string | null,
    input: OvertimeDeductionInput,
  ): Observable<void> {
    const query = id
      ? this.supabase.client
          .from('settings_overtime_deduction')
          .update(input)
          .eq('id', id)
      : this.supabase.client.from('settings_overtime_deduction').insert(input);

    return from(query).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  loadWeeklyHolidays(): Observable<WeeklyHoliday[]> {
    return from(this.supabase.client.from('weekly_holidays').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = new Map(
          (data ?? []).map((row) => [row.day_of_week as number, row as WeeklyHoliday]),
        );
        return Array.from({ length: 7 }, (_, day) => ({
          id: rows.get(day)?.id ?? '',
          day_of_week: day,
          is_active: rows.get(day)?.is_active ?? false,
        }));
      }),
    );
  }

  saveWeeklyHolidays(days: WeeklyHoliday[]): Observable<void> {
    const payload = days.map(({ day_of_week, is_active }) => ({ day_of_week, is_active }));
    return from(
      this.supabase.client
        .from('weekly_holidays')
        .upsert(payload, { onConflict: 'day_of_week' }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
