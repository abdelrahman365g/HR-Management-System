export interface AttendanceRecord {
  id: string;
  employee_id: string;
  record_date: string;         // ISO date
  check_in_actual: string | null;
  check_out_actual: string | null;
  source: 'manual' | 'excel_import';
  created_by: string | null;
}