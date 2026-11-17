export type AdminTier = 'SUPER_ADMIN' | 'ADMIN';

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: AdminTier;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: AdminUser;
  token: string;
  loginTime: string;
}
