import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Key,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminTier } from '../types/auth';

export const AdminUserManagementTab: React.FC = () => {
  const {
    currentUser,
    users,
    isSuperAdmin,
    createAdminUser,
    updateAdminPassword,
    deleteAdminUser,
    resetDefaultCredentials,
  } = useAdminAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AdminTier>('ADMIN');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetDefaults, setConfirmResetDefaults] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createAdminUser({
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      role: newRole,
    });

    if (res.success) {
      showToast('success', `Administrator account "${newUsername}" created successfully.`);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('ADMIN');
      setShowAddModal(false);
    } else {
      showToast('error', res.error || 'Failed to create user');
    }
  };

  const handleUpdatePassword = (userId: string) => {
    const res = updateAdminPassword(userId, newPasswordInput);
    if (res.success) {
      showToast('success', 'Password updated successfully.');
      setEditingUserId(null);
      setNewPasswordInput('');
    } else {
      showToast('error', res.error || 'Failed to update password');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const res = deleteAdminUser(userId);
    if (res.success) {
      showToast('success', 'Administrator account removed.');
      setConfirmDeleteId(null);
    } else {
      showToast('error', res.error || 'Failed to delete user');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPassMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
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
              Admin Accounts & Tier Access Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage authenticated portal credentials, assign Super Admin or Admin tiers, and enforce system security.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* User Accounts Table */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Active Portal Administrators ({users.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active Session: <strong className="text-[#0B0F17] dark:text-white">{currentUser?.username}</strong> ({currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFD] dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Tier / Role</th>
                <th className="px-4 py-3">Password Credentials</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
              {users.map((u) => {
                const isCurrentUser = currentUser?.id === u.id;
                const isMasterIvan = u.username.toLowerCase() === 'ivanthedon';
                const showPlainPass = !!showPassMap[u.id];

                return (
                  <tr key={u.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-[#0B0F17] dark:bg-amber-400 text-amber-300 dark:text-[#06090F]'
                              : 'bg-[#E8F1FF] dark:bg-blue-500/20 text-blue-800 dark:text-sky-300'
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
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            Added: {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {u.username}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-amber-700 dark:text-amber-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-blue-700 dark:text-sky-400">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder="New password"
                            className="px-2.5 py-1 border border-slate-300 dark:border-white/15 rounded-lg text-xs w-36 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          <button
                            onClick={() => handleUpdatePassword(u.id)}
                            className="px-3 py-1 bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] rounded-full font-bold text-[11px] cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingUserId(null);
                              setNewPasswordInput('');
                            }}
                            className="px-1.5 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 dark:text-slate-300">
                            {showPlainPass ? u.password : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            title={showPlainPass ? 'Hide password' : 'View password'}
                          >
                            {showPlainPass ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {u.lastLogin ? (
                        <span className="font-mono text-[11px]">
                          {new Date(u.lastLogin).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Never logged in</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      {isSuperAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setNewPasswordInput(u.password);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0B0F17] bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-full transition-colors cursor-pointer"
                          >
                            <Key className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            <span>Change Pass</span>
                          </button>

                          {!isMasterIvan && !isCurrentUser && (
                            <>
                              {confirmDeleteId === u.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full font-bold text-[10px] cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-1.5 py-0.5 text-slate-500 dark:text-slate-400 text-[10px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(u.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-full transition-colors cursor-pointer"
                                  title="Remove admin account"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isSuperAdmin && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Need to restore system default administrator accounts?
            </span>
            {confirmResetDefaults ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-700 dark:text-rose-400 font-semibold">Confirm reset of default accounts?</span>
                <button
                  onClick={() => {
                    resetDefaultCredentials();
                    setConfirmResetDefaults(false);
                    showToast('success', 'Default administrator credentials restored.');
                  }}
                  className="px-3 py-1 bg-rose-600 text-white font-bold rounded-full text-xs cursor-pointer"
                >
                  Yes, Restore Defaults
                </button>
                <button
                  onClick={() => setConfirmResetDefaults(false)}
                  className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmResetDefaults(true)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Factory Default Accounts</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two-Tier Permissions Comparison Table */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
        <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-700 dark:text-sky-400" />
          <span>Role-Based Access Control (RBAC) Tier Matrix</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Definitive capability comparison between Super Admin and standard Admin levels.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <thead className="bg-[#F8FAFD] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-2.5">Feature & Operation</th>
                <th className="px-4 py-2.5 text-center font-mono text-amber-700 dark:text-amber-400">
                  Super Admin (IvanTheDon)
                </th>
                <th className="px-4 py-2.5 text-center font-mono text-blue-700 dark:text-sky-400">
                  Admin (Operations)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {[
                ['Direct Master In-Office Stock Adjustments', true, true],
                ['15-Gauge Reorder Minimum Threshold Setup', true, true],
                ['Offices & 26 Branches Information Management', true, true],
                ['Download Full JSON Database Backups', true, true],
                ['Restore Database from JSON Backup File', true, false],
                ['Reload Official 26 AESL Regional & HQ Locations', true, false],
                ['Wipe / Clear Entire Database Tables', true, false],
                ['Manage Administrator Passwords & Create Accounts', true, false],
              ].map(([label, superAccess, adminAccess], idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{label as string}</td>
                  <td className="px-4 py-2.5 text-center text-blue-600 dark:text-sky-400 font-bold">
                    {superAccess ? '✓ Full Access' : '✕ Restricted'}
                  </td>
                  <td className={`px-4 py-2.5 text-center font-bold ${adminAccess ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 font-mono font-normal'}`}>
                    {adminAccess ? '✓ Full Access' : '✕ Restricted'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1420] rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-white/15">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#0B0F17] dark:text-white text-sm">Add New Administrator</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Display Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Samuel (Accra IT Supervisor)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. samuel_aesl"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs font-mono text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs font-mono text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Authority Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminTier)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] rounded-xl text-xs text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 font-semibold"
                >
                  <option value="ADMIN">Tier 2 · Standard Admin (Operational)</option>
                  <option value="SUPER_ADMIN">Tier 1 · Super Admin (Unrestricted Master Control)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
