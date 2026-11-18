import React, { useState } from 'react';
import {
  useAdminAuth,
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  CORPORATE_EMAIL_DOMAIN,
} from '../context/AdminAuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  UserCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Mail,
  Ban,
  Power,
} from 'lucide-react';
import { AdminTier } from '../types/auth';
import { AESL_LOCATIONS } from '../data/aeslLocations';

const FIREBASE_PROJECT_ID = 'poised-axe-nv4kj';
const FIREBASE_AUTH_USERS_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/users`;
const FIREBASE_AUTH_PROVIDERS_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`;

export const AdminUserManagementTab: React.FC = () => {
  const {
    currentUser,
    users,
    staffInvites,
    isSuperAdmin,
    inviteStaffMember,
    toggleInviteActive,
    removeStaffInvite,
    updateUserRole,
    toggleUserStatus,
    removeStaffProfile,
  } = useAdminAuth();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminTier>('STAFF');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteInviteId, setConfirmDeleteInviteId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('invite-submit');
    const res = await inviteStaffMember({
      email: inviteEmail,
      displayName: inviteDisplayName,
      role: inviteRole,
    });
    setBusyKey(null);

    if (res.success) {
      showToast('success', `Invitation added for "${inviteEmail.trim().toLowerCase()}".`);
      setInviteEmail('');
      setInviteDisplayName('');
      setInviteRole('STAFF');
      setShowInviteModal(false);
    } else {
      showToast('error', res.error || 'Failed to add staff invite.');
    }
  };

  const handleRoleChange = async (uid: string, role: AdminTier) => {
    setBusyKey(`role-${uid}`);
    const res = await updateUserRole(uid, role);
    setBusyKey(null);
    if (res.success) {
      showToast('success', `Updated team member role to ${role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Operations Admin' : 'IT Staff'}.`);
    } else {
      showToast('error', res.error || 'Failed to update role.');
    }
  };

  const handleStatusToggle = async (uid: string, currentStatus: 'active' | 'disabled') => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    setBusyKey(`status-${uid}`);
    const res = await toggleUserStatus(uid, nextStatus);
    setBusyKey(null);
    if (res.success) {
      showToast('success', `Account ${nextStatus === 'active' ? 'reactivated' : 'disabled'}.`);
    } else {
      showToast('error', res.error || 'Failed to update status.');
    }
  };

  const handleRemoveUser = async (uid: string) => {
    setBusyKey(`del-user-${uid}`);
    const res = await removeStaffProfile(uid);
    setBusyKey(null);
    setConfirmDeleteUserId(null);
    if (res.success) {
      showToast('success', 'Staff profile removed from directory.');
    } else {
      showToast('error', res.error || 'Failed to remove staff profile.');
    }
  };

  const handleToggleInvite = async (inviteId: string, currentActive: boolean) => {
    setBusyKey(`inv-toggle-${inviteId}`);
    const res = await toggleInviteActive(inviteId, !currentActive);
    setBusyKey(null);
    if (res.success) {
      showToast('success', !currentActive ? 'Invite activated.' : 'Invite paused.');
    } else {
      showToast('error', res.error || 'Failed to update invite.');
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    setBusyKey(`inv-del-${inviteId}`);
    const res = await removeStaffInvite(inviteId);
    setBusyKey(null);
    setConfirmDeleteInviteId(null);
    if (res.success) {
      showToast('success', 'Staff invite removed.');
    } else {
      showToast('error', res.error || 'Failed to remove invite.');
    }
  };

  const getRoleBadge = (role: AdminTier) => {
    if (role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-amber-700 dark:text-amber-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-blue-700 dark:text-sky-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Admin</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300">
        <UserCheck className="w-3.5 h-3.5" />
        <span>IT Staff</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-[#EFF6FF] dark:bg-blue-500/15 text-blue-900 dark:text-sky-200 border border-blue-200 dark:border-blue-500/30'
              : 'bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EFF6FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-400 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">
              IT Team Accounts & Access Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pre-approve IT teammates, manage Super Admin / Operations Admin / IT Staff tiers, and sync shared Firestore access.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href={FIREBASE_AUTH_USERS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-full transition-colors whitespace-nowrap"
            >
              <span>Firebase Auth Users</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            </a>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Pre-Approve Staff Email</span>
            </button>
          </div>
        )}
      </div>

      {/* Simple 2-Step Guide for Creating Email & Password Logins */}
      {isSuperAdmin && (
        <div className="bg-[#EFF6FF] dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-sky-300">
              How to Add a New IT Team Member (2 Simple Steps)
            </h3>
            <span className="text-[11px] font-mono text-blue-700 dark:text-sky-400">
              Project: {FIREBASE_PROJECT_ID}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/85 dark:bg-[#090E17]/80 border border-blue-200/70 dark:border-white/10">
              <div className="font-bold text-[#0B0F17] dark:text-white">
                Step 1 · Create Their Login & Password in Firebase
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Open Firebase Console → <strong>Authentication → Users → Add user</strong>, enter their work email (e.g. <code className="font-mono text-[11px]">name{CORPORATE_EMAIL_DOMAIN}</code>) and temporary password. Make sure <strong>Email/Password</strong> is enabled under{' '}
                <a
                  href={FIREBASE_AUTH_PROVIDERS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 dark:text-sky-400 underline font-semibold"
                >
                  Sign-in providers
                </a>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/85 dark:bg-[#090E17]/80 border border-blue-200/70 dark:border-white/10">
              <div className="font-bold text-[#0B0F17] dark:text-white">
                Step 2 · Pre-Approve Email & Set Role Below
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Click <strong>Pre-Approve Staff Email</strong> if they use a non-<code className="font-mono text-[11px]">{CORPORATE_EMAIL_DOMAIN}</code> address (or Gmail Sign-In). Once they verify their email and sign in once, promote or manage their tier in the team table below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Signed-In Team Profiles Table */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Registered IT Team Members ({users.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Signed in as: <strong className="text-[#0B0F17] dark:text-white">{currentUser?.email || currentUser?.displayName}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFD] dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3">Work Email</th>
                <th className="px-4 py-3">Access Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
              {users.map((u) => {
                const isCurrentUser = currentUser?.uid === u.uid;
                const isMasterSuper = u.email.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL;

                return (
                  <tr key={u.uid} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-[#0B0F17] dark:bg-amber-400 text-amber-300 dark:text-[#06090F]'
                              : u.role === 'ADMIN'
                              ? 'bg-[#E8F1FF] dark:bg-blue-500/20 text-blue-800 dark:text-sky-300'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#0B0F17] dark:text-white flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isCurrentUser && (
                              <span className="text-blue-700 dark:text-sky-400 text-[11px] font-medium">
                                · You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {u.department || 'IT Department'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200">
                      {u.email || <span className="text-slate-400 italic">Hidden</span>}
                    </td>

                    <td className="px-4 py-3.5">
                      {isSuperAdmin && !isMasterSuper ? (
                        <select
                          value={u.role}
                          disabled={busyKey === `role-${u.uid}`}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value as AdminTier)}
                          className="px-2.5 py-1 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-lg text-xs font-semibold text-[#0B0F17] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="STAFF">IT Staff</option>
                          <option value="ADMIN">Operations Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      ) : (
                        getRoleBadge(u.role)
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.status === 'active' ? (
                        <span className="text-xs font-semibold text-blue-700 dark:text-sky-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {u.lastLogin ? (
                        <span className="font-mono text-[11px]">
                          {new Date(u.lastLogin).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Never</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {isSuperAdmin && !isMasterSuper && !isCurrentUser && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyKey === `status-${u.uid}`}
                            onClick={() => handleStatusToggle(u.uid, u.status)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-full transition-colors cursor-pointer"
                            title={u.status === 'active' ? 'Disable account access' : 'Reactivate account'}
                          >
                            {u.status === 'active' ? (
                              <>
                                <Ban className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Disable</span>
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3 text-blue-600 dark:text-sky-400" />
                                <span>Enable</span>
                              </>
                            )}
                          </button>

                          {confirmDeleteUserId === u.uid ? (
                            <span className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleRemoveUser(u.uid)}
                                disabled={busyKey === `del-user-${u.uid}`}
                                className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full font-bold text-[10px] cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteUserId(null)}
                                className="px-1.5 py-0.5 text-slate-500 dark:text-slate-400 text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteUserId(u.uid)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-full transition-colors cursor-pointer"
                              title="Remove staff profile"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Approved Work Email Invites */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pre-Approved Staff Invites ({staffInvites.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              All <code className="font-mono">{CORPORATE_EMAIL_DOMAIN}</code> accounts are auto-recognized once created in Firebase Auth
            </span>
          </div>

          {staffInvites.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No custom external invites added yet. Click <strong>Pre-Approve Staff Email</strong> to authorize a team member using Gmail or another email address.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFD] dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Invited Email</th>
                    <th className="px-4 py-3">Default Role</th>
                    <th className="px-4 py-3">Invite Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {staffInvites.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-bold text-[#0B0F17] dark:text-white">
                        {inv.displayName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {inv.email}
                      </td>
                      <td className="px-4 py-3">
                        {getRoleBadge(inv.role)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${inv.active ? 'text-blue-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {inv.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyKey === `inv-toggle-${inv.id}`}
                            onClick={() => handleToggleInvite(inv.id, inv.active)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-full transition-colors cursor-pointer"
                          >
                            {inv.active ? 'Pause' : 'Activate'}
                          </button>

                          {confirmDeleteInviteId === inv.id ? (
                            <span className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteInvite(inv.id)}
                                disabled={busyKey === `inv-del-${inv.id}`}
                                className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full font-bold text-[10px] cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteInviteId(null)}
                                className="px-1.5 py-0.5 text-slate-500 dark:text-slate-400 text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteInviteId(inv.id)}
                              className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-full transition-colors cursor-pointer"
                              title="Delete invite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Three-Tier Permissions Matrix */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
        <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-700 dark:text-sky-400" />
          <span>Role-Based Access Control (RBAC) Matrix</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Capabilities enforced by both the AESL portal and Firestore Security Rules.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <thead className="bg-[#F8FAFD] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-2.5">Feature & Operation</th>
                <th className="px-4 py-2.5 text-center font-mono text-amber-700 dark:text-amber-400">
                  Super Admin
                </th>
                <th className="px-4 py-2.5 text-center font-mono text-blue-700 dark:text-sky-400">
                  Operations Admin
                </th>
                <th className="px-4 py-2.5 text-center font-mono text-slate-600 dark:text-slate-300">
                  IT Staff
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {[
                ['View Live Stock, Branches & Print Reports', true, true, true],
                ['Dispatch to Branches, Top Up & Log Swaps', true, true, true],
                ['Add / Edit Cartridge SKUs & Thresholds', true, true, false],
                ['Add / Edit Branch Locations', true, true, false],
                ['Download Full JSON Database Backups', true, true, false],
                ['Restore Database from JSON Backup File', true, false, false],
                [`Reload Official ${AESL_LOCATIONS.length} AESL Locations or Clear Data`, true, false, false],
                ['Manage IT Team Roles, Status & Invites', true, false, false],
              ].map(([label, superAccess, adminAccess, staffAccess], idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{label as string}</td>
                  <td className="px-4 py-2.5 text-center text-blue-600 dark:text-sky-400 font-bold">
                    {superAccess ? '✓ Full' : '✕ Restricted'}
                  </td>
                  <td className={`px-4 py-2.5 text-center font-bold ${adminAccess ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 font-mono font-normal'}`}>
                    {adminAccess ? '✓ Full' : '✕ Restricted'}
                  </td>
                  <td className={`px-4 py-2.5 text-center font-bold ${staffAccess ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 font-mono font-normal'}`}>
                    {staffAccess ? '✓ Full' : '✕ Restricted'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Approve Staff Email Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1420] rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-white/15">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#0B0F17] dark:text-white text-sm">Pre-Approve IT Staff Email</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteDisplayName}
                  onChange={(e) => setInviteDisplayName(e.target.value)}
                  placeholder="e.g. Samuel Boateng"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work or Approved Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={`e.g. samuel${CORPORATE_EMAIL_DOMAIN}`}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs font-mono text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Intended Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminTier)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 font-semibold"
                >
                  <option value="STAFF">Tier 3 · IT Staff (Dispatches, Top-Ups, Swaps, Reports)</option>
                  <option value="ADMIN">Tier 2 · Operations Admin (SKUs, Branches, Backups)</option>
                  <option value="SUPER_ADMIN">Tier 1 · Super Admin (Full Master Control)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  For security, new accounts sign in as IT Staff first and can be promoted above after their first sign-in.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyKey === 'invite-submit'}
                  className="px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition cursor-pointer disabled:opacity-60"
                >
                  {busyKey === 'invite-submit' ? 'Saving...' : 'Add Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
