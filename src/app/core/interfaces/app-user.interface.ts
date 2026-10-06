export interface AppUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  permission_group_id: string | null;
  is_hr_admin: boolean;
  is_active: boolean;
}