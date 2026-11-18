import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminLoginView } from './AdminLoginView';
import { AdminUserManagementTab } from './AdminUserManagementTab';
import {
  Shield,
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
  Edit2,
  LogOut,
  Users,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { CartridgeSKU, Branch } from '../types/inventory';
import { GaugeIndicator } from './GaugeIndicator';
import { AESL_LOCATIONS } from '../data/aeslLocations';
import { BrandLogo } from './BrandLogo';

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
    isAdmin,
    logout,
    users,
  } = useAdminAuth();

  const {
    cartridges,
    branches,
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

  const [stockDrafts, setStockDrafts] = useState<Record<string, { stock: number; threshold: number; spec: string }>>({});
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchDrafts, setBranchDrafts] = useState<Record<string, { name: string; code: string; city: string; address: string }>>({});

  const [activeAdminTab, setActiveAdminTab] = useState<'inventory' | 'branches' | 'backup' | 'netlify' | 'users'>('inventory');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'sample' | 'wipe' | 'branches' | null>(null);
  const [adminBranchFilter, setAdminBranchFilter] = useState<'all' | 'Headquarters' | 'Regional Branch'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) {
    return <AdminLoginView />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-white/10 p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EFF6FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-400 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0B0F17] dark:text-white">
            Administrator Clearance Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            You are signed in as <strong>{currentUser?.displayName}</strong> (<span className="font-mono">{currentUser?.email}</span>) with <strong>IT Staff</strong> clearance.
            You can view live inventory, dispatch toner to branches, log printer swaps, top up stock, and print reports from the main navigation.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Ask the AESL Super Admin (<span className="font-mono">maafok830@gmail.com</span>) to upgrade your role if you need Master Console access.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 rounded-full transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  const getDraft = (cart: CartridgeSKU) => {
    return (
      stockDrafts[cart.id] || {
        stock: cart.centralStock,
        threshold: cart.minThreshold !== undefined ? cart.minThreshold : 15,
        spec: cart.specification || '',
      }
    );
  };

  const handleStockDraftChange = (id: string, field: 'stock' | 'threshold' | 'spec', value: string | number) => {
    setStockDrafts((prev) => {
      const current = prev[id] || {
        stock: cartridges.find((c) => c.id === id)?.centralStock || 0,
        threshold: cartridges.find((c) => c.id === id)?.minThreshold || 15,
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
      {/* Modern Blue / Moving Dark Gradient Admin Header */}
      <section className="bg-blue-hero rounded-3xl p-6 sm:p-8 border border-blue-200/70 dark:border-blue-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <BrandLogo className="w-12 h-12 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className={`font-semibold ${isSuperAdmin ? 'text-amber-700 dark:text-amber-400' : 'text-blue-800 dark:text-sky-400'}`}>
                  {isSuperAdmin ? 'Tier 1 · Super Admin Authority' : 'Tier 2 · Operations Admin'}
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  AESL IT Department
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1">
                Master Administration & Backup Console
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                Direct control over In-Office warehouse counts, branch allocations, 15-unit threshold gauges, and Netlify backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 dark:bg-white/10 border border-slate-200/80 dark:border-white/15 text-xs">
              <span className="font-bold text-[#0B0F17] dark:text-white">{currentUser?.displayName}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">({currentUser?.email || currentUser?.username})</span>
              <button
                type="button"
                onClick={logout}
                className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 rounded-full text-[11px] font-semibold transition cursor-pointer"
                title="Sign out of AESL Portal"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>

            <button
              onClick={onOpenAddBranch}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200/90 dark:border-white/15 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              title="Add a new AESL office, workshop, or branch location"
            >
              <Plus className="w-4 h-4 text-blue-700 dark:text-sky-400" />
              <span>Add Location</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200/90 dark:border-white/15 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
              <span>Download JSON Backup</span>
            </button>

            <button
              onClick={() => {
                if (!isSuperAdmin) {
                  showToast('error', 'Restoring database from backup requires Super Admin clearance.');
                  return;
                }
                fileInputRef.current?.click();
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                isSuperAdmin
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] hover:bg-slate-800 dark:hover:bg-sky-300'
                  : 'bg-white/60 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
              }`}
              title={!isSuperAdmin ? 'Requires Super Admin clearance' : 'Upload backup file'}
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
              {!isSuperAdmin && <Lock className="w-3 h-3 ml-0.5 text-amber-600 dark:text-amber-400" />}
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

        {/* Admin Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-blue-900/10 dark:border-white/10 flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'inventory', label: `Master Inventory (${cartridges.length})`, icon: Package },
            { id: 'branches', label: `Offices & Branches (${branches.length})`, icon: Building2 },
            { id: 'backup', label: 'Backup & Portability', icon: FileCode },
            { id: 'netlify', label: 'Netlify Hosting', icon: Globe },
            { id: 'users', label: `IT Team & Access (${users.length})`, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as typeof activeAdminTab)}
                className={`px-3.5 py-2 rounded-full font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'bg-white/75 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
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

      {/* Tab 1: Master Inventory Matrix */}
      {activeAdminTab === 'inventory' && (
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6F8FC] dark:bg-white/[0.03]">
            <div>
              <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">
                Direct Master Inventory Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly adjust current stock In Office (Warehouse), Gauge Alert Threshold (default 15), and specifications.
              </p>
            </div>

            <button
              onClick={onOpenAddCartridge}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Cartridge SKU</span>
            </button>
          </div>

          {cartridges.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Cartridge Models Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Click &ldquo;Add New Cartridge SKU&rdquo; to enter your cartridge models and specifications.
              </p>
              <button
                onClick={onOpenAddCartridge}
                className="px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full cursor-pointer"
              >
                Add First Cartridge SKU
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Model & SKU</th>
                    <th className="py-3 px-4">Specifications / Notes</th>
                    <th className="py-3 px-4 text-center">In Office at the Moment</th>
                    <th className="py-3 px-4 text-center">15-Unit Gauge Status</th>
                    <th className="py-3 px-4 text-center">Gauge Alert Trigger</th>
                    <th className="py-3 px-4 text-center">Sent Out to Branches</th>
                    <th className="py-3 px-4 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {cartridges.map((cart) => {
                    const draft = getDraft(cart);
                    const sentOutCount = getSentOutCountForCartridge(cart.id);

                    return (
                      <tr key={cart.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#0B0F17] dark:text-white block text-xs sm:text-sm">
                            {cart.model}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {cart.sku} · {cart.color}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <input
                            type="text"
                            value={draft.spec}
                            onChange={(e) => handleStockDraftChange(cart.id, 'spec', e.target.value)}
                            placeholder="e.g. CE505A Black, High Yield"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </td>

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
                              className="w-18 px-2 py-1 text-xs font-mono font-bold text-center border-2 border-blue-500/60 dark:border-sky-400/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white"
                            />
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">units</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <GaugeIndicator
                            currentStock={draft.stock}
                            gaugeTarget={draft.threshold}
                            compact={true}
                          />
                        </td>

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
                              className="w-16 px-1.5 py-1 text-xs font-mono text-center border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white rounded-lg focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">trigger</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200 text-xs">
                          {sentOutCount} units sent
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveCartridge(cart.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors cursor-pointer"
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
                              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F6F8FC] dark:bg-white/[0.03]">
            <div>
              <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">
                Offices & Branches Master Registry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add, rename, edit location codes, and manage all company branch destinations.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-full bg-slate-200/70 dark:bg-white/5 p-0.5 text-xs">
                <button
                  onClick={() => setAdminBranchFilter('all')}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    adminBranchFilter === 'all'
                      ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                  }`}
                >
                  All ({branches.length})
                </button>
                <button
                  onClick={() => setAdminBranchFilter('Headquarters')}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    adminBranchFilter === 'Headquarters'
                      ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                  }`}
                >
                  HQ Offices ({branches.filter((b) => b.category === 'Headquarters' || b.code.startsWith('HQ')).length})
                </button>
                <button
                  onClick={() => setAdminBranchFilter('Regional Branch')}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    adminBranchFilter === 'Regional Branch'
                      ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                  }`}
                >
                  Regional ({branches.filter((b) => b.category !== 'Headquarters' && !b.code.startsWith('HQ')).length})
                </button>
              </div>

              <button
                onClick={onOpenAddBranch}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Location</span>
              </button>
            </div>
          </div>

          {branches.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Offices or Branches Configured</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Add your company branch offices, site locations, or client projects.
              </p>
              <button
                onClick={onOpenAddBranch}
                className="px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full cursor-pointer"
              >
                Add First Office / Branch
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
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
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
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
                        <tr key={b.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
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
                                className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white rounded-lg"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{b.code}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-semibold ${isHq ? 'text-blue-700 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {isHq ? 'Headquarters' : 'Regional Branch'}
                            </span>
                          </td>

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
                                className="w-full px-2 py-1 text-xs font-bold border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white rounded-lg"
                              />
                            ) : (
                              <span className="font-bold text-[#0B0F17] dark:text-white">{b.name}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
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
                                className="w-28 px-2 py-1 text-xs border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white rounded-lg"
                              />
                            ) : (
                              b.city
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
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
                                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white rounded-lg"
                              />
                            ) : (
                              <span className="truncate block" title={b.address}>
                                {b.address}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                            {b.printers.length} devices
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveBranch(b.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white dark:text-[#06090F] bg-blue-600 dark:bg-sky-400 hover:bg-blue-700 rounded-full transition-colors cursor-pointer"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Save</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => startEditBranch(b)}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-full transition-colors cursor-pointer"
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
                                className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
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

      {/* Tab 3: Backup & Portability Hub */}
      {activeAdminTab === 'backup' && (
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">
              Database Backup, Migration & Portability Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export your complete inventory, branch allocations, and logs as a single JSON file and restore it on any computer or browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#0B0F17] dark:text-white font-bold text-sm">
                  <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
                  <span>Download Full JSON Backup</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Exports all cartridges, branches, deliveries, and usage records into a structured JSON file.
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export & Download Database (.json)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#0B0F17] dark:text-white font-bold text-sm">
                  <Upload className="w-4 h-4 text-blue-700 dark:text-sky-400" />
                  <span>Restore from JSON Backup</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Upload a previously saved JSON backup to immediately restore all cartridge specifications, branch allocations, and logs.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 rounded-full transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-700 dark:text-sky-400" />
                <span>Select & Restore Backup File</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-white block">Database Reset & Official AESL Locations</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Reload the {branches.length} AESL locations, load sample data, or start fresh.
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {!isSuperAdmin ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl text-xs text-amber-900 dark:text-amber-300">
                  <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>Clearing data or reloading locations requires <strong>Super Admin (maafok830@gmail.com)</strong>.</span>
                </div>
              ) : confirmAction === null ? (
                <>
                  <button
                    onClick={() => setConfirmAction('branches')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-800 dark:text-sky-300 bg-[#EFF6FF] dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 border border-blue-200 dark:border-blue-500/30 rounded-full transition-colors cursor-pointer"
                  >
                    Restore {AESL_LOCATIONS.length} AESL Locations
                  </button>

                  <button
                    onClick={() => setConfirmAction('sample')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-full transition-colors cursor-pointer"
                  >
                    Load Sample Template
                  </button>

                  <button
                    onClick={() => setConfirmAction('wipe')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 rounded-full transition-colors cursor-pointer"
                  >
                    Clear All Data
                  </button>
                </>
              ) : confirmAction === 'branches' ? (
                <div className="flex items-center gap-2 bg-[#EFF6FF] dark:bg-blue-500/15 p-1.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                  <span className="text-xs text-blue-950 dark:text-sky-200 font-semibold px-2">Restore all {AESL_LOCATIONS.length} AESL locations?</span>
                  <button
                    onClick={() => {
                      loadAESLBranches();
                      setConfirmAction(null);
                      showToast('success', `Official AESL ${AESL_LOCATIONS.length} locations restored successfully.`);
                    }}
                    className="px-3 py-1 bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Yes, Restore
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2.5 py-1 bg-white dark:bg-white/10 text-slate-600 dark:text-slate-200 rounded-full text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : confirmAction === 'sample' ? (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 p-1.5 rounded-full border border-slate-300 dark:border-white/15">
                  <span className="text-xs text-slate-800 dark:text-white font-semibold px-2">Load sample records?</span>
                  <button
                    onClick={() => {
                      loadSampleTemplateData();
                      setConfirmAction(null);
                      showToast('success', 'Sample template loaded successfully.');
                    }}
                    className="px-3 py-1 bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Yes, Load
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2.5 py-1 bg-white dark:bg-white/10 text-slate-600 dark:text-slate-200 rounded-full text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/15 p-1.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                  <span className="text-xs text-rose-900 dark:text-rose-200 font-semibold px-2">Wipe all records?</span>
                  <button
                    onClick={() => {
                      clearAllData();
                      setConfirmAction(null);
                      showToast('success', 'All records cleared. Database is now completely empty.');
                    }}
                    className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                  >
                    Yes, Wipe Clean
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2.5 py-1 bg-white dark:bg-white/10 text-slate-600 dark:text-slate-200 rounded-full text-xs cursor-pointer"
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
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-[#0B0F17] dark:text-white font-bold text-base">
              <Globe className="w-5 h-5 text-blue-700 dark:text-sky-400" />
              <span>Hosting for Free on Netlify via GitHub</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your application is built with React 19 + Vite + Tailwind CSS and is 100% pre-configured for free static hosting on Netlify.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <h3 className="text-xs font-bold text-[#0B0F17] dark:text-white">Push the Codebase to GitHub</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create a repository on GitHub (e.g. <code className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">anointed-it-printflow</code>) and push the project files.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <h3 className="text-xs font-bold text-[#0B0F17] dark:text-white">Connect GitHub to Netlify (Free Account)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sign in to <span className="font-semibold text-slate-700 dark:text-slate-200">netlify.com</span>, click <strong>&ldquo;Add new site&rdquo; → &ldquo;Import an existing project&rdquo;</strong>, and choose your GitHub repo.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] font-bold text-xs flex items-center justify-center shrink-0">3</span>
              <div className="w-full">
                <h3 className="text-xs font-bold text-[#0B0F17] dark:text-white">Pre-Configured Build Settings</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The files <code className="font-mono text-[11px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded">netlify.toml</code> and <code className="font-mono text-[11px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded">public/_redirects</code> are already configured:
                </p>
                <div className="mt-2 font-mono text-xs bg-[#0B0F17] text-slate-200 p-3.5 rounded-xl space-y-1 border border-white/10">
                  <div>Build command: <span className="text-sky-400">npm run build</span></div>
                  <div>Publish directory: <span className="text-sky-400">dist</span></div>
                  <div>SPA Redirects: <span className="text-sky-400">/* -&gt; /index.html 200</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#EFF6FF] dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-950 dark:text-sky-200 flex items-start gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <span>After Netlify publishes your live URL (e.g. <code className="font-mono text-[11px]">your-site.netlify.app</code>), add that domain inside Firebase Console → <strong>Authentication → Settings → Authorized domains</strong> so team logins work immediately.</span>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Accounts & Tier Access Management */}
      {activeAdminTab === 'users' && <AdminUserManagementTab />}
    </div>
  );
};
