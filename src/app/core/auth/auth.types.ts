export type AppRole = 'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee' | 'pending';

export interface SessionUser {
  id: string;
  name: string;
  role: AppRole;
}
