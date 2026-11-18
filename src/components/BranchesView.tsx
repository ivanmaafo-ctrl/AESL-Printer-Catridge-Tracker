import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Building2,
  Plus,
  Truck,
  Send,
  Printer,
  MapPin,
  Mail,
  Phone,
  Package,
  History,
  Edit2,
  Search,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { EditBranchModal } from './Modals/EditBranchModal';

interface BranchesViewProps {
  onOpenAddBranch: () => void;
  onOpenDispatchForBranch: (branchId: string) => void;
  onOpenLogUsageForBranch: (branchId: string) => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({
  onOpenAddBranch,
  onOpenDispatchForBranch,
  onOpenLogUsageForBranch,
}) => {
  const { branches, getBranchStockDetails, dispatches, usages, loadAESLBranches } = useInventory();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'history' | 'printers'>('inventory');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Headquarters' | 'Regional Branch'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Ensure selected branch defaults if branch list changed
  const effectiveSelectedBranchId = useMemo(() => {
    if (selectedBranchId && branches.some((b) => b.id === selectedBranchId)) {
      return selectedBranchId;
    }
    return branches[0]?.id || '';
  }, [selectedBranchId, branches]);

  const selectedBranch = branches.find((b) => b.id === effectiveSelectedBranchId) || branches[0];
  const branchStock = selectedBranch ? getBranchStockDetails(selectedBranch.id) : [];

  const branchDispatches = selectedBranch
    ? dispatches.filter((d) => d.branchId === selectedBranch.id)
    : [];

  const branchUsages = selectedBranch
    ? usages.filter((u) => u.branchId === selectedBranch.id)
    : [];

  // Filtered branches for the picker list
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'Headquarters' && isHq) ||
        (categoryFilter === 'Regional Branch' && !isHq);

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.managerName.toLowerCase().includes(q)
      );
    });
  }, [branches, categoryFilter, searchQuery]);

  const hqCount = branches.filter((b) => b.category === 'Headquarters' || b.code.startsWith('HQ')).length;
  const regionalCount = branches.length - hqCount;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Branch Network & Headquarters Offices
            </h1>
            <span className="text-xs text-slate-500 font-medium font-mono">
              ({branches.length} locations)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            20 regional branches across Ghana & 6 headquarters offices at Anointed House
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              loadAESLBranches();
              showToast('Official AESL 26 locations restored successfully.');
            }}
            title="Reload official Anointed Engineering Services locations (20 Branches + 6 HQ Offices)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reload AESL 26 Locations</span>
          </button>

          <button
            onClick={onOpenAddBranch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Location</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Quick Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Locations ({branches.length})
            </button>

            <button
              onClick={() => setCategoryFilter('Headquarters')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'Headquarters'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Headquarters Offices ({hqCount})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('Regional Branch')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === 'Regional Branch'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Regional Branches ({regionalCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bolga, Wa, HR, Finance..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable / Compact Grid of Location Pills */}
        {filteredBranches.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No offices or branches match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
            {filteredBranches.map((b) => {
              const isSelected = b.id === effectiveSelectedBranchId;
              const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
              const stock = getBranchStockDetails(b.id);
              const totalOnHand = stock.reduce((s, i) => s + i.onHandCount, 0);

              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-400 text-slate-900 shadow-xs ring-1 ring-blue-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {b.code}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                          isHq
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isHq ? 'HQ' : 'BR'}
                      </span>
                    </div>
                    <div className="font-semibold text-xs truncate" title={b.name}>
                      {b.name}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="truncate max-w-[80px]">{b.city.split('-')[0].trim()}</span>
                    <span className="font-mono font-medium text-slate-700">{totalOnHand} units</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Branch Detail Card */}
      {selectedBranch && (
        <div className="space-y-6">
          
          {/* Branch Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 shadow-xs ${
                    selectedBranch.category === 'Headquarters' || selectedBranch.code.startsWith('HQ')
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-white'
                  }`}>
                    {selectedBranch.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedBranch.name}
                      </h2>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedBranch.category === 'Headquarters' || selectedBranch.code.startsWith('HQ')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedBranch.category === 'Headquarters' || selectedBranch.code.startsWith('HQ')
                          ? '🏢 Headquarters (Anointed House)'
                          : '📍 Regional Branch Office'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedBranch.address}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        Lead: {selectedBranch.managerName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedBranch.contactPhone}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedBranch.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch Cartridge Here</span>
                </button>

                <button
                  onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Log Usage at Location</span>
                </button>
              </div>
            </div>

            {/* Sub-tab selection */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveSubTab('inventory')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeSubTab === 'inventory'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                On-Site Cartridge Stock ({branchStock.length})
              </button>

              <button
                onClick={() => setActiveSubTab('history')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeSubTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Delivery & Usage Ledger ({branchDispatches.length + branchUsages.length})
              </button>

              <button
                onClick={() => setActiveSubTab('printers')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeSubTab === 'printers'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Printers Deployed ({selectedBranch.printers.length})
              </button>
            </div>
          </div>

          {/* Subtab Content 1: On-Site Cartridge Inventory */}
          {activeSubTab === 'inventory' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Cartridges Allocated to {selectedBranch.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated from total shipments delivered minus documented printer usage
                  </p>
                </div>
              </div>

              {branchStock.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No cartridges dispatched to this location yet.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Click "Dispatch Cartridge Here" to issue cartridges from the central office warehouse at Anointed House.
                  </p>
                  <button
                    onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Send Initial Dispatch</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Cartridge Model</th>
                        <th className="py-2.5 px-4">Color</th>
                        <th className="py-2.5 px-4 text-right">Total Delivered</th>
                        <th className="py-2.5 px-4 text-right">In Transit</th>
                        <th className="py-2.5 px-4 text-right">Consumed</th>
                        <th className="py-2.5 px-4 text-right">On-Site Reserve</th>
                        <th className="py-2.5 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branchStock.map((item) => (
                        <tr key={item.cartridgeId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {item.cartridgeModel}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.cartridgeColor === 'Black'
                                    ? 'bg-slate-900'
                                    : item.cartridgeColor === 'Cyan'
                                    ? 'bg-cyan-500'
                                    : item.cartridgeColor === 'Magenta'
                                    ? 'bg-pink-500'
                                    : item.cartridgeColor === 'Yellow'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {item.cartridgeColor}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {item.totalReceived}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {item.inTransitCount > 0 ? (
                              <span className="text-amber-700 font-semibold">{item.inTransitCount}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {item.totalUsed}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            <span
                              className={`font-semibold px-2 py-0.5 rounded text-xs ${
                                item.onHandCount <= 1
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {item.onHandCount} units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                            >
                              Log Used
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Dispatch More
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Subtab Content 2: Ledger of Dispatches & Usage */}
          {activeSubTab === 'history' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Logistics & Utilization History for {selectedBranch.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Dispatches to this branch */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      Shipments Dispatched ({branchDispatches.length})
                    </span>
                  </div>

                  {branchDispatches.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No shipments recorded yet</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {branchDispatches.map((d) => (
                        <div key={d.id} className="p-2.5 bg-white rounded border border-slate-200 text-xs flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 block">{d.dispatchCode}</span>
                            <span className="font-semibold text-slate-800">{d.cartridgeModel}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {d.dispatchDate} via {d.carrier}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">{d.quantity} units</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              d.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Usages logged at this branch */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-600" />
                      Depletion & Usage Records ({branchUsages.length})
                    </span>
                  </div>

                  {branchUsages.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No cartridge installations logged yet</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {branchUsages.map((u) => (
                        <div key={u.id} className="p-2.5 bg-white rounded border border-slate-200 text-xs flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 block">{u.usageCode}</span>
                            <span className="font-semibold text-slate-800">{u.cartridgeModel}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Installed into {u.printerName} on {u.installedDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">{u.quantity} installed</span>
                            <span className="text-[10px] text-slate-500">
                              by {u.installedBy}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subtab Content 3: Printers */}
          {activeSubTab === 'printers' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Printers Assigned to {selectedBranch.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track hardware models and assign compatible toner cartridges
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  Configure Hardware
                </button>
              </div>

              {selectedBranch.printers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  No printers assigned to this location yet. Click "Configure Hardware" to add devices.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedBranch.printers.map((printer) => (
                    <div
                      key={printer.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-3"
                    >
                      <div className="p-2 bg-blue-100/60 text-blue-700 rounded-lg shrink-0">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {printer.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Model: {printer.model}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{printer.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Branch Modal */}
      {selectedBranch && (
        <EditBranchModal
          branch={selectedBranch}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
};
