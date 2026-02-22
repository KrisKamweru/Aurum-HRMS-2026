export type AppRole = 'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee' | 'pending';
export type OAuthProvider = 'google' | 'microsoft';

export type PasswordResetRequestResult =
  | {
      status: 'sent';
      message: string;
    }
  | {
      status: 'unsupported';
      message: string;
    };

export interface SessionUser {
  id: string;
  name: string;
  role: AppRole;
  email?: string;
}
