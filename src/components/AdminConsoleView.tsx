import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminLoginView } from './AdminLoginView';
import { AdminUserManagementTab } from './AdminUserManagementTab';
import {
  Shield,
  Key,
  Save,
  Download,
  Upload,
  Building2,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Globe,
  GitBranch,
  RefreshCw,
  Edit2,
  Sliders,
  LogOut,
  Users,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { CartridgeSKU, Branch } from '../types/inventory';
import { GaugeIndicator } from './GaugeIndicator';

interface AdminConsoleViewProps {
  onOpenAddCartridge: () => void;
  onOpenAddBranch: () => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  onOpenAddCartridge,
  onOpenAddBranch,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isSuperAdmin,
    logout,
    users,
  } = useAdminAuth();

  const {
    cartridges,
    branches,
    dispatches,
    directUpdateStock,
    updateCartridge,
    deleteCartridge,
    updateBranch,
    deleteBranch,
    getSentOutCountForCartridge,
    exportDatabaseJSON,
    importDatabaseJSON,
    clearAllData,
    loadSampleTemplateData,
    loadAESLBranches,
  } = useInventory();

  // Local draft states for inline quick editing
  const [stockDrafts, setStockDrafts] = useState<Record<string, { stock: number; threshold: number; spec: string }>>({});
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchDrafts, setBranchDrafts] = useState<Record<string, { name: string; code: string; city: string; address: string }>>({});

  const [activeAdminTab, setActiveAdminTab] = useState<'inventory' | 'branches' | 'backup' | 'netlify' | 'users'>('inventory');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'sample' | 'wipe' | 'branches' | null>(null);
  const [adminBranchFilter, setAdminBranchFilter] = useState<'all' | 'Headquarters' | 'Regional Branch'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If not authenticated, show secure login portal
  if (!isAuthenticated) {
    return <AdminLoginView />;
  }

  // Initialize stock drafts
  const getDraft = (cart: CartridgeSKU) => {
    return (
      stockDrafts[cart.id] || {
        stock: cart.centralStock,
        threshold: cart.minThreshold !== undefined ? cart.minThreshold : 50,
        spec: cart.specification || '',
      }
    );
  };

  const handleStockDraftChange = (id: string, field: 'stock' | 'threshold' | 'spec', value: any) => {
    setStockDrafts((prev) => {
      const current = prev[id] || {
        stock: cartridges.find((c) => c.id === id)?.centralStock || 0,
        threshold: cartridges.find((c) => c.id === id)?.minThreshold || 50,
        spec: cartridges.find((c) => c.id === id)?.specification || '',
      };
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveCartridge = (id: string) => {
    const draft = stockDrafts[id];
    if (draft) {
      directUpdateStock(id, draft.stock, draft.threshold);
      if (draft.spec !== undefined) {
        updateCartridge(id, { specification: draft.spec });
      }
      showToast('success', 'Changes saved successfully to master database.');
    }
  };

  // Branch editing
  const startEditBranch = (b: Branch) => {
    setEditingBranchId(b.id);
    setBranchDrafts((prev) => ({
      ...prev,
      [b.id]: {
        name: b.name,
        code: b.code,
        city: b.city,
        address: b.address,
      },
    }));
  };

  const handleSaveBranch = (id: string) => {
    const draft = branchDrafts[id];
    if (draft) {
      updateBranch(id, {
        name: draft.name,
        code: draft.code,
        city: draft.city,
        address: draft.address,
      });
      setEditingBranchId(null);
      showToast('success', 'Branch details updated.');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Export JSON file
  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AESL_IT_PrintFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Backup file downloaded successfully.');
  };

  // Import JSON file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseJSON(content);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Mode Badge Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg text-white shrink-0 mt-0.5 ${
              isSuperAdmin ? 'bg-gradient-to-tr from-amber-600 to-amber-500' : 'bg-blue-600'
            }`}>
              {isSuperAdmin ? <ShieldCheck className="w-6 h-6 text-slate-950" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isSuperAdmin
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {isSuperAdmin ? 'Tier 1 · Super Admin Authority' : 'Tier 2 · Operations Admin'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Anointed Engineering Services Limited · IT Department
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                Master Administration & Cloud Portability Console
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Full direct control over In-Office warehouse counts, Sent-Out branch allocations, 50-unit threshold gauges, and Netlify hosting backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Authenticated user session info */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">{currentUser?.displayName || currentUser?.username}</span>
                  <span className="text-[10px] text-slate-400 font-mono">(@{currentUser?.username})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 rounded text-[11px] font-semibold transition"
                title="Sign out of Admin Portal"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download JSON Backup</span>
            </button>

            <button
              onClick={() => {
                if (!isSuperAdmin) {
                  showToast('error', 'Restoring database from backup requires Super Admin (IvanTheDon) clearance.');
                  return;
                }
                fileInputRef.current?.click();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                isSuperAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title={!isSuperAdmin ? 'Requires Super Admin clearance' : 'Upload backup file'}
            >
              <Upload className="w-4 h-4" />
              <span>Restore from Backup</span>
              {!isSuperAdmin && <Lock className="w-3 h-3 ml-0.5 text-amber-400" />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveAdminTab('inventory')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Master Inventory & 50-Gauge Editor ({cartridges.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('branches')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'branches'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Offices & Branches Manager ({branches.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'backup'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Data Export / Import Hub</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('netlify')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'netlify'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Netlify & GitHub Hosting Helper</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeAdminTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin Accounts & Tiers ({users.length})</span>
            {isSuperAdmin && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Super Admin Control Active" />
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
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

      {/* Tab 1: Master Inventory & 50-Gauge Direct Editor */}
      {activeAdminTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Direct Master Inventory Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Directly adjust current stock In Office (Warehouse), Gauge Alert Threshold (default 50), and specifications with 0 restrictions.
              </p>
            </div>

            <button
              onClick={onOpenAddCartridge}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Cartridge SKU</span>
            </button>
          </div>

          {cartridges.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Cartridge Models Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Click "+ Add New Cartridge SKU" to enter your cartridge models and specifications.
              </p>
              <button
                onClick={onOpenAddCartridge}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add First Cartridge SKU
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Model & SKU</th>
                    <th className="py-3 px-4">Specifications / Notes</th>
                    <th className="py-3 px-4 text-center">In Office at the Moment</th>
                    <th className="py-3 px-4 text-center">50-Unit Gauge Status</th>
                    <th className="py-3 px-4 text-center">Gauge Alert Trigger</th>
                    <th className="py-3 px-4 text-center">Sent Out to Branches</th>
                    <th className="py-3 px-4 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartridges.map((cart) => {
                    const draft = getDraft(cart);
                    const sentOutCount = getSentOutCountForCartridge(cart.id);

                    return (
                      <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Model & SKU */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            {cart.model}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {cart.sku} · {cart.color}
                          </span>
                        </td>

                        {/* Specification */}
                        <td className="py-3 px-4 max-w-xs">
                          <input
                            type="text"
                            value={draft.spec}
                            onChange={(e) => handleStockDraftChange(cart.id, 'spec', e.target.value)}
                            placeholder="e.g. CE505A Black, High Yield 2.3k pages"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-blue-500 focus:outline-none"
                          />
                        </td>

                        {/* In Office (Warehouse) direct input */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={draft.stock}
                              onChange={(e) =>
                                handleStockDraftChange(
                                  cart.id,
                                  'stock',
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                              className="w-18 px-2 py-1 text-xs font-mono font-bold text-center border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            />
                            <span className="text-[11px] text-slate-500">units</span>
                          </div>
                        </td>

                        {/* Visual 50-Unit Gauge */}
                        <td className="py-3 px-4 text-center">
                          <GaugeIndicator
                            currentStock={draft.stock}
                            gaugeTarget={draft.threshold}
                            compact={true}
                          />
                        </td>

                        {/* Alert Threshold input (default 50) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={draft.threshold}
                              onChange={(e) =>
                                handleStockDraftChange(
                                  cart.id,
                                  'threshold',
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-16 px-1.5 py-1 text-xs font-mono text-center border border-slate-300 rounded focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400">trigger</span>
                          </div>
                        </td>

                        {/* Sent Out to Other Offices */}
                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-800 text-sm">
                          {sentOutCount} units sent
                        </td>

                        {/* Master Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveCartridge(cart.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${cart.model}?`)) {
                                  deleteCartridge(cart.id);
                                  showToast('success', 'Cartridge deleted.');
                                }
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Offices & Branches Master Manager */}
      {activeAdminTab === 'branches' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Offices & Branches Master Registry
              </h2>
              <p className="text-xs text-slate-500">
                Add, rename, edit location codes, and manage all company branch destinations.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-xs">
                <button
                  onClick={() => setAdminBranchFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    adminBranchFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({branches.length})
                </button>
                <button
                  onClick={() => setAdminBranchFilter('Headquarters')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    adminBranchFilter === 'Headquarters'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  HQ Offices ({branches.filter((b) => b.category === 'Headquarters' || b.code.startsWith('HQ')).length})
                </button>
                <button
                  onClick={() => setAdminBranchFilter('Regional Branch')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    adminBranchFilter === 'Regional Branch'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Regional ({branches.filter((b) => b.category !== 'Headquarters' && !b.code.startsWith('HQ')).length})
                </button>
              </div>

              <button
                onClick={onOpenAddBranch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Location</span>
              </button>
            </div>
          </div>

          {branches.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Offices or Branches Configured</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Add your company branch offices, site locations, or client projects.
              </p>
              <button
                onClick={onOpenAddBranch}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add First Office / Branch
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Office / Branch Name</th>
                    <th className="py-3 px-4">City / Area</th>
                    <th className="py-3 px-4">Address / Site Location</th>
                    <th className="py-3 px-4 text-center">Printers Configured</th>
                    <th className="py-3 px-4 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches
                    .filter((b) => {
                      const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
                      if (adminBranchFilter === 'Headquarters') return isHq;
                      if (adminBranchFilter === 'Regional Branch') return !isHq;
                      return true;
                    })
                    .map((b) => {
                      const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
                      const isEditing = editingBranchId === b.id;
                      const draft = branchDrafts[b.id] || {
                        name: b.name,
                        code: b.code,
                        city: b.city,
                        address: b.address,
                      };

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Code */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={draft.code}
                                onChange={(e) =>
                                  setBranchDrafts((prev) => ({
                                    ...prev,
                                    [b.id]: { ...draft, code: e.target.value },
                                  }))
                                }
                                className="w-20 px-2 py-1 text-xs font-mono border rounded"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-700">{b.code}</span>
                            )}
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isHq ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isHq ? 'Headquarters' : 'Regional Branch'}
                            </span>
                          </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(e) =>
                                setBranchDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...draft, name: e.target.value },
                                }))
                              }
                              className="w-full px-2 py-1 text-xs font-bold border rounded"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{b.name}</span>
                          )}
                        </td>

                        {/* City */}
                        <td className="py-3 px-4 text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={draft.city}
                              onChange={(e) =>
                                setBranchDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...draft, city: e.target.value },
                                }))
                              }
                              className="w-28 px-2 py-1 text-xs border rounded"
                            />
                          ) : (
                            b.city
                          )}
                        </td>

                        {/* Address */}
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          {isEditing ? (
                            <input
                              type="text"
                              value={draft.address}
                              onChange={(e) =>
                                setBranchDrafts((prev) => ({
                                  ...prev,
                                  [b.id]: { ...draft, address: e.target.value },
                                }))
                              }
                              className="w-full px-2 py-1 text-xs border rounded"
                            />
                          ) : (
                            <span className="truncate block" title={b.address}>
                              {b.address}
                            </span>
                          )}
                        </td>

                        {/* Printers count */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {b.printers.length} devices
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveBranch(b.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => startEditBranch(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete ${b.name}?`)) {
                                  deleteBranch(b.id);
                                  showToast('success', 'Branch deleted.');
                                }
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Data Export / Import Backup Hub */}
      {activeAdminTab === 'backup' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Database Backup, Migration & Portability Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Because you intend to host on Netlify via GitHub, this hub lets you export your complete data as a single JSON file and restore it on any computer or browser seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Export Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Full JSON Backup</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Exports all cartridges, branches, deliveries, and usage records into a structured JSON file. Keep a copy in your GitHub repository or on your hard drive.
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-blue-300" />
                <span>Export & Download Database (.json)</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restore from JSON Backup</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a previously saved JSON backup to immediately restore all your cartridge specifications, branch allocations, and logs.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Select & Restore Backup File</span>
              </button>
            </div>

          </div>

          {/* Wipe Clean Slate or Load Sample */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Database Reset & Official AESL Locations</span>
              <span className="text-[11px] text-slate-400">
                Reload the 24 official AESL locations (19 regional branches + 5 headquarters offices), or start fresh.
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {!isSuperAdmin ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Clearing data or reloading locations requires <strong>IvanTheDon (Super Admin)</strong>.</span>
                </div>
              ) : confirmAction === null ? (
                <>
                  <button
                    onClick={() => setConfirmAction('branches')}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    Restore 24 AESL Locations
                  </button>

                  <button
                    onClick={() => setConfirmAction('sample')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                  >
                    Load Sample Template
                  </button>

                  <button
                    onClick={() => setConfirmAction('wipe')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    Clear All Data
                  </button>
                </>
              ) : confirmAction === 'branches' ? (
                <div className="flex items-center gap-2 bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                  <span className="text-xs text-blue-900 font-semibold px-1">Restore all 24 AESL locations?</span>
                  <button
                    onClick={() => {
                      loadAESLBranches();
                      setConfirmAction(null);
                      showToast('success', 'Official AESL 24 locations restored successfully.');
                    }}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                  >
                    Yes, Restore
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : confirmAction === 'sample' ? (
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-300">
                  <span className="text-xs text-slate-800 font-semibold px-1">Load sample records? (Replaces current)</span>
                  <button
                    onClick={() => {
                      loadSampleTemplateData();
                      setConfirmAction(null);
                      showToast('success', 'Sample template loaded successfully.');
                    }}
                    className="px-2.5 py-1 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900"
                  >
                    Yes, Load
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                  <span className="text-xs text-rose-900 font-semibold px-1">Wipe all database records?</span>
                  <button
                    onClick={() => {
                      clearAllData();
                      setConfirmAction(null);
                      showToast('success', 'All records cleared. Database is now completely empty.');
                    }}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                  >
                    Yes, Wipe Clean
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Netlify & GitHub Hosting Helper */}
      {activeAdminTab === 'netlify' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Hosting for Free on Netlify via GitHub</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your application is built with React 19 + Vite + Tailwind CSS and is 100% pre-configured for free static hosting on Netlify.
            </p>
          </div>

          <div className="space-y-4">
            
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Push the Codebase to GitHub</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create a repository on GitHub (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">anointed-it-printflow</code>) and push the project files.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Connect GitHub to Netlify (Free Account)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in to <span className="font-semibold text-slate-700">netlify.com</span>, click <strong>"Add new site" → "Import an existing project"</strong>, and choose your GitHub repo.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Pre-Configured Build Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The files <code className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded">netlify.toml</code> and <code className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded">public/_redirects</code> have already been generated in the project:
                </p>
                <div className="mt-2 font-mono text-xs bg-slate-900 text-slate-200 p-3 rounded-md space-y-1">
                  <div>Build command: <span className="text-emerald-400">npm run build</span></div>
                  <div>Publish directory: <span className="text-emerald-400">dist</span></div>
                  <div>SPA Redirects: <span className="text-emerald-400">/* -&gt; /index.html 200</span></div>
                </div>
              </div>
            </div>

          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Whenever you push changes or updates to your GitHub main branch, Netlify will automatically build and publish your app for free!</span>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Accounts & Tier Access Management */}
      {activeAdminTab === 'users' && (
        <AdminUserManagementTab />
      )}

    </div>
  );
};
