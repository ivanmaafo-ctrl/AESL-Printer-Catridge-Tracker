export type AdminTier = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  username: string;
  displayName: string;
  department: string;
  role: AdminTier;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin?: string;
}

export interface StaffInvite {
  id: string;
  email: string;
  displayName: string;
  role: AdminTier;
  active: boolean;
  createdByUid: string;
  createdAt: string;
}

export interface AuthSession {
  user: AdminUser;
  token: string;
  loginTime: string;
}
