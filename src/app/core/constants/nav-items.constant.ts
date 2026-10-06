import { ScreenKey } from "../interfaces/permission.interface";

export interface NavItem {
  /** Translation key for the label (translated where rendered). */
  label: string;
  path: string;
  screen: ScreenKey | 'dashboard';
  /** Inline SVG path data (lucide-style, 24x24) for the nav icon. */
  icon: string;
}

export const DASHBOARD_NAV_ITEM: NavItem = {
  label: 'nav.dashboard',
  path: '/dashboard',
  screen: 'dashboard',
  icon: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'nav.employees', path: '/employees', screen: 'employees', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { label: 'nav.departments', path: '/departments', screen: 'employees', icon: 'M4 22h16M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M10 6h4M10 10h4M10 14h4M10 18h4' },
  { label: 'nav.attendance', path: '/attendance', screen: 'attendance', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM9 16l2 2 4-4' },
  { label: 'nav.salaryReports', path: '/salary-reports', screen: 'salary_reports', icon: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2ZM13 5v2M13 17v2M13 11v2M13 7v2' },
  { label: 'nav.officialHolidays', path: '/official-holidays', screen: 'official_holidays', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z' },
  { label: 'nav.settings', path: '/settings', screen: 'settings', icon: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' },
  { label: 'nav.users', path: '/users', screen: 'users', icon: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
  { label: 'nav.permissionGroups', path: '/permission-groups', screen: 'permission_groups', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

export const PERMISSION_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item, index) => NAV_ITEMS.findIndex((other) => other.screen === item.screen) === index,
);
