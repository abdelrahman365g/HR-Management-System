import { Injectable, inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Supabase } from '../../../core/services/supabase';
import { DEFAULT_FOUNDING_DATE } from '../../../core/constants/validation.constant';

export interface OfficialHoliday {
  id: string;
  name: string;
  holiday_date: string; // ISO date
  year: number;         // generated column in 0001
}

export interface OfficialHolidayInput {
  name: string;
  holiday_date: string;
}

@Injectable({ providedIn: 'root' })
export class OfficialHolidaysService {
  private readonly supabase = inject(Supabase);

  listByYear(year: number): Observable<OfficialHoliday[]> {
    return from(
      this.supabase.client
        .from('official_holidays')
        .select('id, name, holiday_date, year')
        .eq('year', year)
        .order('holiday_date'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as OfficialHoliday[];
      }),
    );
  }

  // Distinct years already on file, newest first — feeds the year
  // selector so older holidays stay reachable.
  listYears(): Observable<number[]> {
    return from(
      this.supabase.client
        .from('official_holidays')
        .select('year')
        .order('year', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return [...new Set((data ?? []).map((row) => row.year as number))];
      }),
    );
  }

  create(input: OfficialHolidayInput): Observable<void> {
    return from(this.supabase.client.from('official_holidays').insert(input)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  delete(holidayId: string): Observable<void> {
    return from(
      this.supabase.client.from('official_holidays').delete().eq('id', holidayId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // Holiday dates may not precede the founding date (same lookup the
  // employee form uses; app_config is readable by any authed user).
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
}
