export interface LogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string;
  changed_at: string;
  diff: Record<string, unknown> | null;
  full_name: string | null;
  email: string;
}

export interface LogEntryCriteria {
  table_name?: string | null;
  record_id?: string | null;
  action?: string | null;
  changed_by?: string | null;
  changed_at_start?: string | null;
  changed_at_end?: string | null;
  page: number;
  pageSize: number;
}

export interface LogEntryResult {
  rows: LogEntry[];
  total: number;
}

export const AUDIT_TABLES = [
  'employees',
  'departments',
  'attendance_records',
  'settings_overtime_deduction',
  'weekly_holidays',
  'official_holidays',
  'salary_reports',
  'app_users',
  'permission_groups',
] as const;
