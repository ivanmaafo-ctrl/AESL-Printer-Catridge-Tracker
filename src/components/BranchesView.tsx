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
} from 'lucide-react';
import { EditBranchModal } from './Modals/EditBranchModal';
import { AESL_LOCATIONS } from '../data/aeslLocations';
import { BrandLogo } from './BrandLogo';

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
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-xl shadow-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Blue / Moving Dark Gradient Header */}
      <section className="bg-blue-hero rounded-3xl p-6 sm:p-8 border border-blue-200/70 dark:border-blue-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2">
            <BrandLogo className="w-6 h-6" />
            <span className="font-semibold text-[#0B0F17] dark:text-white">AESL Location Directory</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{branches.length} Active Sites</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1.5">
            Branch Network & Headquarters Offices
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {regionalCount} regional branches across Ghana and {hqCount} headquarters offices at Anointed House.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => {
              loadAESLBranches();
              showToast(`Official AESL ${AESL_LOCATIONS.length} locations restored successfully.`);
            }}
            title="Reload official Anointed Engineering Services locations"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-700 dark:text-sky-400" />
            <span>Reload AESL {AESL_LOCATIONS.length} Locations</span>
          </button>

          <button
            onClick={onOpenAddBranch}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Location</span>
          </button>
        </div>
      </section>

      {/* Category Tabs & Quick Search */}
      <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              All Locations ({branches.length})
            </button>

            <button
              onClick={() => setCategoryFilter('Headquarters')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Headquarters'
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                  : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Headquarters Offices ({hqCount})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('Regional Branch')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Regional Branch'
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                  : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Regional Branches ({regionalCount})</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Adenta, Bolga, Workshop, HR..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#0B111B] border border-slate-200 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Grid of Location Cards */}
        {filteredBranches.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No offices or branches match your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1 max-h-60 overflow-y-auto pr-1">
            {filteredBranches.map((b) => {
              const isSelected = b.id === effectiveSelectedBranchId;
              const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
              const stock = getBranchStockDetails(b.id);
              const totalOnHand = stock.reduce((s, i) => s + i.onHandCount, 0);

              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F1FF] dark:bg-blue-500/20 border-blue-400 dark:border-sky-400/70 text-[#0B0F17] dark:text-white'
                      : 'bg-white dark:bg-[#0B111B]/80 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {b.code}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold ${isHq ? 'text-blue-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isHq ? 'HQ' : 'BR'}
                      </span>
                    </div>
                    <div className="font-semibold text-xs truncate text-[#0B0F17] dark:text-white" title={b.name}>
                      {b.name}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/10">
                    <span className="truncate max-w-[80px]">{b.city.split('-')[0].trim()}</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200 tabular-nums">{totalOnHand} u</span>
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
          <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold font-mono text-sm shrink-0 ${
                    selectedBranch.category === 'Headquarters' || selectedBranch.code.startsWith('HQ')
                      ? 'bg-blue-600 dark:bg-sky-400 text-white dark:text-[#06090F]'
                      : 'bg-[#0B0F17] dark:bg-white/15 text-white'
                  }`}
                >
                  {selectedBranch.code}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-[#0B0F17] dark:text-white">
                      {selectedBranch.name}
                    </h2>
                    <span className="text-xs font-medium text-blue-700 dark:text-sky-400">
                      · {selectedBranch.category === 'Headquarters' || selectedBranch.code.startsWith('HQ')
                        ? 'Headquarters (Anointed House)'
                        : 'Regional Branch Office'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {selectedBranch.address}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Lead: {selectedBranch.managerName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {selectedBranch.contactPhone}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {selectedBranch.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>Log Usage</span>
                </button>

                <button
                  onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Truck className="w-3.5 h-3.5 text-sky-400 dark:text-[#06090F]" />
                  <span>Dispatch Here</span>
                </button>
              </div>
            </div>

            {/* Sub-tab selection */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveSubTab('inventory')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'inventory'
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                On-Site Cartridge Stock ({branchStock.length})
              </button>

              <button
                onClick={() => setActiveSubTab('history')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'history'
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                Delivery & Usage Ledger ({branchDispatches.length + branchUsages.length})
              </button>

              <button
                onClick={() => setActiveSubTab('printers')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'printers'
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                Printers Deployed ({selectedBranch.printers.length})
              </button>
            </div>
          </div>

          {/* Subtab 1: On-Site Cartridge Inventory */}
          {activeSubTab === 'inventory' && (
            <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                    Cartridges Allocated to {selectedBranch.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculated from total shipments delivered minus documented printer usage
                  </p>
                </div>
              </div>

              {branchStock.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">No cartridges dispatched to this location yet.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                    Click &ldquo;Dispatch Here&rdquo; to issue cartridges from the central office warehouse at Anointed House.
                  </p>
                  <button
                    onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Send Initial Dispatch</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Cartridge Model</th>
                        <th className="py-3 px-4">Color</th>
                        <th className="py-3 px-4 text-right">Total Delivered</th>
                        <th className="py-3 px-4 text-right">In Transit</th>
                        <th className="py-3 px-4 text-right">Consumed</th>
                        <th className="py-3 px-4 text-right">On-Site Reserve</th>
                        <th className="py-3 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {branchStock.map((item) => (
                        <tr key={item.cartridgeId} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#0B0F17] dark:text-white">
                            {item.cartridgeModel}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {item.cartridgeColor}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {item.totalReceived}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {item.inTransitCount > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400 font-semibold">{item.inTransitCount}</span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {item.totalUsed}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            <span className={`font-semibold ${item.onHandCount <= 1 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-700 dark:text-sky-400'}`}>
                              {item.onHandCount} units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                              className="text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                              Log Used
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <button
                              onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                              className="text-xs font-semibold text-[#0B0F17] dark:text-white hover:underline cursor-pointer"
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

          {/* Subtab 2: Ledger of Dispatches & Usage */}
          {activeSubTab === 'history' && (
            <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                Logistics & Utilization History for {selectedBranch.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 bg-[#F6F8FC] dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-[#0B0F17] dark:text-white flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      Shipments Dispatched ({branchDispatches.length})
                    </span>
                  </div>

                  {branchDispatches.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No shipments recorded yet</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {branchDispatches.map((d) => (
                        <div key={d.id} className="p-3 bg-white dark:bg-[#0B111B] rounded-xl border border-slate-200/80 dark:border-white/10 text-xs flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block">{d.dispatchCode}</span>
                            <span className="font-semibold text-[#0B0F17] dark:text-white">{d.cartridgeModel}</span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {d.dispatchDate} via {d.carrier}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-[#0B0F17] dark:text-white block">{d.quantity} units</span>
                            <span className={`text-[10px] font-semibold ${d.status === 'Delivered' ? 'text-blue-700 dark:text-sky-400' : 'text-amber-700 dark:text-amber-400'}`}>
                              {d.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 bg-[#F6F8FC] dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-[#0B0F17] dark:text-white flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      Depletion & Usage Records ({branchUsages.length})
                    </span>
                  </div>

                  {branchUsages.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No cartridge installations logged yet</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {branchUsages.map((u) => (
                        <div key={u.id} className="p-3 bg-white dark:bg-[#0B111B] rounded-xl border border-slate-200/80 dark:border-white/10 text-xs flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block">{u.usageCode}</span>
                            <span className="font-semibold text-[#0B0F17] dark:text-white">{u.cartridgeModel}</span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Installed into {u.printerName} on {u.installedDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-[#0B0F17] dark:text-white block">{u.quantity} installed</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
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

          {/* Subtab 3: Printers */}
          {activeSubTab === 'printers' && (
            <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                    Printers Assigned to {selectedBranch.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track hardware models and assign compatible toner cartridges
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#0B0F17] dark:text-sky-300 bg-[#EFF6FF] dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 rounded-full transition-colors border border-blue-200 dark:border-blue-500/30 cursor-pointer"
                >
                  Configure Hardware
                </button>
              </div>

              {selectedBranch.printers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-white/15 rounded-2xl">
                  No printers assigned to this location yet. Click &ldquo;Configure Hardware&rdquo; to add devices.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedBranch.printers.map((printer) => (
                    <div
                      key={printer.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex items-start gap-3"
                    >
                      <div className="p-2 bg-[#E8F1FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-400 rounded-xl shrink-0">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#0B0F17] dark:text-white truncate">
                          {printer.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          Model: {printer.model}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
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
