export type PermissionAction = 'view' | 'edit';

export type ScreenKey =
  | 'employees'
  | 'settings'
  | 'official_holidays'
  | 'attendance'
  | 'salary_reports'
  | 'permission_groups'
  | 'users';

export type PermissionMap = Partial<Record<ScreenKey, Partial<Record<PermissionAction, boolean>>>>;

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: PermissionMap;
}