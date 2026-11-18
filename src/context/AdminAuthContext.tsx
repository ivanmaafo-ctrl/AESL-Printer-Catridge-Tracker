import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
  encodeEmailKey,
  clampStr,
} from '../firebase';
import { AdminUser, AdminTier, StaffInvite } from '../types/auth';

export const BOOTSTRAPPED_SUPER_ADMIN_EMAIL = 'maafok830@gmail.com';
export const CORPORATE_EMAIL_DOMAIN = '@anointedengineering.com';

interface AdminAuthContextType {
  currentUser: AdminUser | null;
  firebaseUser: User | null;
  authReady: boolean;
  isAuthenticated: boolean;
  needsVerification: boolean;
  accessDeniedReason: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  users: AdminUser[];
  staffInvites: StaffInvite[];
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearAccessDenied: () => void;
  inviteStaffMember: (data: {
    email: string;
    displayName: string;
    role: AdminTier;
  }) => Promise<{ success: boolean; error?: string }>;
  toggleInviteActive: (inviteId: string, active: boolean) => Promise<{ success: boolean; error?: string }>;
  removeStaffInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (uid: string, role: AdminTier) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (uid: string, status: 'active' | 'disabled') => Promise<{ success: boolean; error?: string }>;
  removeStaffProfile: (uid: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function formatTs(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function mapFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid work email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact the AESL Super Admin.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect work email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a minute and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in needs to be enabled in Firebase Console → Authentication → Sign-in method.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed before completing.';
    case 'auth/network-request-failed':
      return 'Network error while reaching Firebase. Check your internet connection.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);

  const syncSignedInUser = useCallback(async (fbUser: User) => {
    const email = (fbUser.email || '').trim().toLowerCase();
    const isBootstrapped = email === BOOTSTRAPPED_SUPER_ADMIN_EMAIL;
    const isCorporateDomain = email.endsWith(CORPORATE_EMAIL_DOMAIN);
    const isPasswordUser = fbUser.providerData.some((p) => p.providerId === 'password');

    if (!fbUser.emailVerified) {
      setCurrentUser(null);
      setAuthReady(true);
      return;
    }

    // Check authorization: bootstrapped super admin, corporate email, password account, or active invite
    let invitedDoc: { displayName?: string; role?: AdminTier; active?: boolean } | null = null;
    if (email) {
      const inviteKey = encodeEmailKey(email);
      try {
        const invSnap = await getDoc(doc(db, 'staffInvites', inviteKey));
        if (invSnap.exists()) {
          invitedDoc = invSnap.data() as { displayName?: string; role?: AdminTier; active?: boolean };
        }
      } catch {
        // Ignore if no invite exists
      }
    }

    const hasActiveInvite = invitedDoc !== null && invitedDoc.active === true;
    if (!isBootstrapped && !isCorporateDomain && !isPasswordUser && !hasActiveInvite) {
      await signOut(auth);
      setCurrentUser(null);
      setAccessDeniedReason(
        `Access restricted. "${email || 'This account'}" is not an authorized AESL IT Team account. Ask the Super Admin to invite your email.`
      );
      setAuthReady(true);
      return;
    }

    if (invitedDoc && invitedDoc.active === false && !isBootstrapped) {
      await signOut(auth);
      setCurrentUser(null);
      setAccessDeniedReason('Your AESL IT Team invitation has been deactivated by the Super Admin.');
      setAuthReady(true);
      return;
    }

    const userRef = doc(db, 'users', fbUser.uid);
    const privateRef = doc(db, 'users', fbUser.uid, 'private', 'info');

    let profileSnap;
    try {
      profileSnap = await getDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
    }

    const fallbackName =
      clampStr(fbUser.displayName, 100) ||
      clampStr(invitedDoc?.displayName, 100) ||
      clampStr(email.split('@')[0], 100) ||
      'AESL IT Staff';

    if (!profileSnap.exists()) {
      const initialRole: AdminTier = isBootstrapped ? 'SUPER_ADMIN' : 'STAFF';
      try {
        await setDoc(userRef, {
          uid: fbUser.uid,
          displayName: fallbackName,
          role: initialRole,
          department: 'IT Department',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
      }

      try {
        await setDoc(privateRef, {
          uid: fbUser.uid,
          email: clampStr(email, 160),
          lastLogin: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}/private/info`);
      }

      if (isBootstrapped) {
        try {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            uid: fbUser.uid,
            role: 'SUPER_ADMIN',
            grantedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `admins/${fbUser.uid}`);
        }
      }

      setCurrentUser({
        id: fbUser.uid,
        uid: fbUser.uid,
        email,
        username: email || fallbackName,
        displayName: fallbackName,
        department: 'IT Department',
        role: initialRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    } else {
      const data = profileSnap.data() as any;
      if (data.status === 'disabled' && !isBootstrapped) {
        await signOut(auth);
        setCurrentUser(null);
        setAccessDeniedReason('Your AESL IT Team account has been disabled by a Super Admin.');
        setAuthReady(true);
        return;
      }

      const resolvedRole: AdminTier = isBootstrapped
        ? 'SUPER_ADMIN'
        : (data.role as AdminTier) || 'STAFF';

      try {
        await setDoc(privateRef, {
          uid: fbUser.uid,
          email: clampStr(email, 160),
          lastLogin: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}/private/info`);
      }

      setCurrentUser({
        id: fbUser.uid,
        uid: fbUser.uid,
        email,
        username: email || fallbackName,
        displayName: data.displayName || fallbackName,
        department: data.department || 'IT Department',
        role: resolvedRole,
        status: data.status || 'active',
        createdAt: formatTs(data.createdAt),
        lastLogin: new Date().toISOString(),
      });
    }

    setAccessDeniedReason(null);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setCurrentUser(null);
        setUsers([]);
        setStaffInvites([]);
        setAuthReady(true);
        return;
      }

      try {
        await syncSignedInUser(fbUser);
      } catch (err) {
        console.error('Error syncing authenticated user:', err);
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [syncSignedInUser]);

  // Listen to users & invites for Super Admin team management
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified || !currentUser) {
      return;
    }

    const emailLower = (firebaseUser.email || '').trim().toLowerCase();
    const isBootstrapped = emailLower === BOOTSTRAPPED_SUPER_ADMIN_EMAIL;

    if (!isBootstrapped) {
      setUsers([currentUser]);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      async (snapshot) => {
        const list: AdminUser[] = [];
        for (const docSnap of snapshot.docs) {
          const d = docSnap.data() as any;
          let userEmail = '';
          let lastLoginStr: string | undefined;
          try {
            const pSnap = await getDoc(doc(db, 'users', docSnap.id, 'private', 'info'));
            if (pSnap.exists()) {
              const pData = pSnap.data() as any;
              userEmail = pData.email || '';
              if (pData.lastLogin) lastLoginStr = formatTs(pData.lastLogin);
            }
          } catch {
            // Private info optional if not yet created
          }

          list.push({
            id: docSnap.id,
            uid: d.uid || docSnap.id,
            email: userEmail || (docSnap.id === firebaseUser.uid ? emailLower : ''),
            username: userEmail || d.displayName || docSnap.id,
            displayName: d.displayName || 'AESL IT Staff',
            department: d.department || 'IT Department',
            role: (d.role as AdminTier) || 'STAFF',
            status: d.status || 'active',
            createdAt: formatTs(d.createdAt),
            lastLogin: lastLoginStr,
          });
        }
        setUsers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    const unsubInvites = onSnapshot(
      collection(db, 'staffInvites'),
      (snapshot) => {
        const list: StaffInvite[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            email: data.email || '',
            displayName: data.displayName || '',
            role: (data.role as AdminTier) || 'STAFF',
            active: data.active !== false,
            createdByUid: data.createdByUid || '',
            createdAt: formatTs(data.createdAt),
          };
        });
        setStaffInvites(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'staffInvites');
      }
    );

    return () => {
      unsubUsers();
      unsubInvites();
    };
  }, [authReady, firebaseUser, currentUser]);

  const loginWithEmail = async (email: string, password: string) => {
    setAccessDeniedReason(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      return { success: false, error: 'Please enter both your work email and password.' };
    }
    try {
      await signInWithEmailAndPassword(auth, trimmed, password);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const loginWithGoogle = async () => {
    setAccessDeniedReason(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const sendPasswordReset = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { success: false, error: 'Enter your work email address first.' };
    }
    try {
      await sendPasswordResetEmail(auth, trimmed);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      return { success: false, error: 'Not currently signed in.' };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const updatedUser = auth.currentUser;
    setFirebaseUser(updatedUser);
    if (updatedUser.emailVerified) {
      await syncSignedInUser(updatedUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    setCurrentUser(null);
    setAccessDeniedReason(null);
    await signOut(auth);
  };

  const clearAccessDenied = () => setAccessDeniedReason(null);

  const inviteStaffMember = async (data: {
    email: string;
    displayName: string;
    role: AdminTier;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser || currentUser?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only Super Admin can invite IT team members.' };
    }
    const emailNorm = clampStr(data.email.toLowerCase(), 160);
    const displayNorm = clampStr(data.displayName, 100);
    if (!emailNorm || !emailNorm.includes('@')) {
      return { success: false, error: 'Please provide a valid work email address.' };
    }
    if (!displayNorm) {
      return { success: false, error: 'Please provide the staff member’s name.' };
    }

    const inviteId = encodeEmailKey(emailNorm);
    try {
      await setDoc(doc(db, 'staffInvites', inviteId), {
        email: emailNorm,
        displayName: displayNorm,
        role: data.role,
        active: true,
        createdByUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `staffInvites/${inviteId}`);
    }
  };

  const toggleInviteActive = async (inviteId: string, active: boolean) => {
    const target = staffInvites.find((i) => i.id === inviteId);
    if (!target) return { success: false, error: 'Invite not found.' };
    try {
      await updateDoc(doc(db, 'staffInvites', inviteId), {
        displayName: clampStr(target.displayName, 100),
        role: target.role,
        active,
      });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `staffInvites/${inviteId}`);
    }
  };

  const removeStaffInvite = async (inviteId: string) => {
    try {
      await deleteDoc(doc(db, 'staffInvites', inviteId));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `staffInvites/${inviteId}`);
    }
  };

  const updateUserRole = async (uid: string, role: AdminTier) => {
    const target = users.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'Staff profile not found.' };
    if (target.email.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL) {
      return { success: false, error: 'Bootstrapped Super Admin role cannot be downgraded.' };
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
      if (role === 'SUPER_ADMIN') {
        await setDoc(doc(db, 'admins', uid), {
          uid,
          role: 'SUPER_ADMIN',
          grantedAt: serverTimestamp(),
        });
      } else {
        try {
          await deleteDoc(doc(db, 'admins', uid));
        } catch {
          // ignore if admin marker didn't exist
        }
      }
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const toggleUserStatus = async (uid: string, status: 'active' | 'disabled') => {
    const target = users.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'Staff profile not found.' };
    if (target.email.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL) {
      return { success: false, error: 'Bootstrapped Super Admin cannot be disabled.' };
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        status,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const removeStaffProfile = async (uid: string) => {
    const target = users.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'Staff profile not found.' };
    if (target.email.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL || uid === currentUser?.uid) {
      return { success: false, error: 'Cannot remove your own or master Super Admin profile.' };
    }
    try {
      await deleteDoc(doc(db, 'users', uid));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const needsVerification = Boolean(firebaseUser && !firebaseUser.emailVerified);
  const isAuthenticated = Boolean(
    firebaseUser && firebaseUser.emailVerified && currentUser && currentUser.status === 'active'
  );
  const isSuperAdmin = isAuthenticated && currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = isAuthenticated && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN');

  return (
    <AdminAuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        authReady,
        isAuthenticated,
        needsVerification,
        accessDeniedReason,
        isSuperAdmin,
        isAdmin,
        users,
        staffInvites,
        loginWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        resendVerificationEmail,
        refreshVerificationStatus,
        logout,
        clearAccessDenied,
        inviteStaffMember,
        toggleInviteActive,
        removeStaffInvite,
        updateUserRole,
        toggleUserStatus,
        removeStaffProfile,
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
