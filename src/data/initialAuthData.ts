import { AdminUser } from '../types/auth';

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-superadmin-ivan',
    username: 'IvanTheDon',
    password: 'Ivan@456',
    displayName: 'Ivan (Super Administrator)',
    role: 'SUPER_ADMIN',
    createdAt: '2025-01-01T08:00:00.000Z',
    lastLogin: undefined,
  },
  {
    id: 'usr-admin-aesl',
    username: 'admin',
    password: 'AeslAdmin@2024',
    displayName: 'AESL Operations Admin',
    role: 'ADMIN',
    createdAt: '2025-01-01T08:00:00.000Z',
    lastLogin: undefined,
  },
];
