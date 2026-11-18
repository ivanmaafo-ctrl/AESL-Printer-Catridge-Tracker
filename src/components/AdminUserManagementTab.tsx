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
  Lock,
  Eye,
  EyeOff,
  UserCheck,
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

  // Create form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AdminTier>('ADMIN');

  // Change password state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  // Toast / feedback state
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
      {/* Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Admin Accounts & Tier Access Control
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage authenticated portal credentials, assign Super Admin or Admin tiers, and enforce system security.
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* User Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Portal Administrators ({users.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Active Session: <strong className="text-slate-800">{currentUser?.username}</strong> ({currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Tier / Role</th>
                <th className="px-4 py-3">Password Credentials</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {users.map((u) => {
                const isCurrentUser = currentUser?.id === u.id;
                const isMasterIvan = u.username.toLowerCase() === 'ivanthedon';
                const showPlainPass = !!showPassMap[u.id];

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Added: {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                      {u.username}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-200">
                          <Shield className="w-3 h-3 text-blue-600" />
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
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-36 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                          <button
                            onClick={() => handleUpdatePassword(u.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingUserId(null);
                              setNewPasswordInput('');
                            }}
                            className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">
                            {showPlainPass ? u.password : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-slate-400 hover:text-slate-600"
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

                    <td className="px-4 py-3.5 text-slate-500">
                      {u.lastLogin ? (
                        <span className="font-mono text-[11px]">
                          {new Date(u.lastLogin).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Never logged in</span>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            <Key className="w-3 h-3 text-slate-500" />
                            <span>Change Pass</span>
                          </button>

                          {!isMasterIvan && !isCurrentUser && (
                            <>
                              {confirmDeleteId === u.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px]"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-1.5 py-0.5 text-slate-500 text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(u.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
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

        {/* Super admin reset defaults footer */}
        {isSuperAdmin && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Need to restore system default administrator accounts?
            </span>
            {confirmResetDefaults ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-semibold">Confirm factory reset of default accounts?</span>
                <button
                  onClick={() => {
                    resetDefaultCredentials();
                    setConfirmResetDefaults(false);
                    showToast('success', 'Default administrator credentials restored.');
                  }}
                  className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded text-xs"
                >
                  Yes, Restore Defaults
                </button>
                <button
                  onClick={() => setConfirmResetDefaults(false)}
                  className="px-2 py-1 text-slate-600 hover:text-slate-800 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmResetDefaults(true)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset to Factory Default Accounts</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two-Tier Permissions Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Role-Based Access Control (RBAC) Tier Matrix</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Definitive capability comparison between Super Admin and standard Admin levels.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Feature & Operation</th>
                <th className="px-4 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                    Super Admin (IvanTheDon)
                  </span>
                </th>
                <th className="px-4 py-2.5 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 font-mono">
                    Admin (Operations)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Direct Master In-Office Stock Adjustments</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">50-Gauge Reorder Minimum Threshold Setup</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Offices & 26 Branches Information Management</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Download Full JSON Database Backups</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Restore Database from JSON Backup File</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-slate-400 font-mono">✕ Restricted</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Reload Official 26 AESL Regional & HQ Locations</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-slate-400 font-mono">✕ Restricted</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Wipe / Clear Entire Database Tables</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-slate-400 font-mono">✕ Restricted</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Manage Administrator Passwords & Create Accounts</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-slate-400 font-mono">✕ Restricted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Administrator</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Display Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Samuel (Accra IT Supervisor)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. samuel_aesl"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Authority Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminTier)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="ADMIN">Tier 2 · Standard Admin (Operational)</option>
                  <option value="SUPER_ADMIN">Tier 1 · Super Admin (Unrestricted Master Control)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
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
