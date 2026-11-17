import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminTier } from '../types/auth';
import { INITIAL_ADMIN_USERS } from '../data/initialAuthData';

interface AdminAuthContextType {
  currentUser: AdminUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  users: AdminUser[];
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  createAdminUser: (userData: {
    username: string;
    password: string;
    displayName: string;
    role: AdminTier;
  }) => { success: boolean; error?: string };
  updateAdminPassword: (userId: string, newPassword: string) => { success: boolean; error?: string };
  deleteAdminUser: (userId: string) => { success: boolean; error?: string };
  resetDefaultCredentials: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'aesl_printflow_auth_users',
  SESSION: 'aesl_printflow_auth_session',
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed = JSON.parse(saved) as AdminUser[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify that IvanTheDon exists; if not, ensure it's restored
          const hasIvan = parsed.some((u) => u.username.toLowerCase() === 'ivanthedon');
          if (!hasIvan) {
            const ivanUser = INITIAL_ADMIN_USERS.find((u) => u.username === 'IvanTheDon')!;
            const updated = [ivanUser, ...parsed];
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
            return updated;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse admin users from localStorage', e);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_ADMIN_USERS));
    return INITIAL_ADMIN_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSession) {
        const parsedUser = JSON.parse(savedSession) as AdminUser;
        return parsedUser;
      }
    } catch (e) {
      console.warn('Failed to parse admin session', e);
    }
    return null;
  });

  // Save users when state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save admin users', e);
    }
  }, [users]);

  // Keep current user in sync if user record was edited
  useEffect(() => {
    if (currentUser) {
      const matchingUser = users.find((u) => u.id === currentUser.id);
      if (matchingUser) {
        setCurrentUser(matchingUser);
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(matchingUser));
      } else {
        // User was deleted
        logout();
      }
    }
  }, [users]);

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    const found = users.find(
      (u) => u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === password
    );

    if (!found) {
      return {
        success: false,
        error: 'Invalid username or password. Please verify your credentials.',
      };
    }

    const updatedUser: AdminUser = {
      ...found,
      lastLogin: new Date().toISOString(),
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === found.id ? updatedUser : u))
    );

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Could not store session', e);
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (e) {
      console.warn('Could not remove session', e);
    }
  };

  const createAdminUser = (userData: {
    username: string;
    password: string;
    displayName: string;
    role: AdminTier;
  }): { success: boolean; error?: string } => {
    const trimmed = userData.username.trim();
    if (!trimmed) {
      return { success: false, error: 'Username is required.' };
    }
    if (!userData.password || userData.password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }
    if (!userData.displayName.trim()) {
      return { success: false, error: 'Full name or display title is required.' };
    }

    const exists = users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return { success: false, error: `Username "${trimmed}" already exists.` };
    }

    const newUser: AdminUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: trimmed,
      password: userData.password,
      displayName: userData.displayName.trim(),
      role: userData.role,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  const updateAdminPassword = (userId: string, newPassword: string): { success: boolean; error?: string } => {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'User not found.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );

    return { success: true };
  };

  const deleteAdminUser = (userId: string): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'User not found.' };
    }

    if (target.username.toLowerCase() === 'ivanthedon') {
      return { success: false, error: 'Cannot delete the master Super Admin account (IvanTheDon).' };
    }

    if (currentUser?.id === userId) {
      return { success: false, error: 'Cannot delete your own currently logged-in account.' };
    }

    // Ensure at least one super admin remains
    if (target.role === 'SUPER_ADMIN') {
      const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;
      if (superAdminCount <= 1) {
        return { success: false, error: 'Cannot delete the only remaining Super Admin account.' };
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
  };

  const resetDefaultCredentials = () => {
    setUsers(INITIAL_ADMIN_USERS);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_ADMIN_USERS));
  };

  const isAuthenticated = currentUser !== null;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;

  return (
    <AdminAuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        users,
        login,
        logout,
        createAdminUser,
        updateAdminPassword,
        deleteAdminUser,
        resetDefaultCredentials,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
