import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
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
    <div className="space-y-7">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg bg-blue-700 text-white text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Flat Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Offices & Branches
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5">
            {regionalCount} regional branches and {hqCount} headquarters offices at Anointed House.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              loadAESLBranches();
              showToast(`Official ${AESL_LOCATIONS.length} AESL locations restored.`);
            }}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 text-blue-700 dark:text-sky-400 shrink-0" />
            <span>Reload {AESL_LOCATIONS.length} Sites</span>
          </button>

          <button
            onClick={onOpenAddBranch}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Location</span>
          </button>
        </div>
      </header>

      {/* Spacious Location Selector */}
      <section className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              All ({branches.length})
            </button>

            <button
              onClick={() => setCategoryFilter('Headquarters')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                categoryFilter === 'Headquarters'
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              HQ Offices ({hqCount})
            </button>

            <button
              onClick={() => setCategoryFilter('Regional Branch')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                categoryFilter === 'Regional Branch'
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              Regional ({regionalCount})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search office or city..."
              className="w-full min-h-[44px] pl-11 pr-9 py-2 text-base bg-slate-50 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Roomier 3-Column Location Grid */}
        {filteredBranches.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            No offices or branches match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredBranches.map((b) => {
              const isSelected = b.id === effectiveSelectedBranchId;
              const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
              const stock = getBranchStockDetails(b.id);
              const totalOnHand = stock.reduce((s, i) => s + i.onHandCount, 0);

              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-3.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 dark:border-sky-400 text-[#0B0F17] dark:text-white'
                      : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate text-[#0B0F17] dark:text-white">
                      {b.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                      <span className="font-mono font-semibold">{b.code}</span> · {isHq ? 'HQ' : b.city.split('-')[0].trim()}
                    </div>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200 shrink-0">
                    {totalOnHand} on site
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected Branch Detail Section */}
      {selectedBranch && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-[#0B0F17] dark:text-white">
                    {selectedBranch.code}
                  </span>
                  <h2 className="text-xl font-bold text-[#0B0F17] dark:text-white">
                    {selectedBranch.name}
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-300 sm:flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedBranch.address}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Lead: {selectedBranch.managerName}</span>
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedBranch.contactPhone}</span>
                  </span>
                  <span className="flex items-center gap-1.5 break-all">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedBranch.email}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 shrink-0" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                  <span>Log Swap</span>
                </button>

                <button
                  onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-sky-400 dark:text-[#06090F] shrink-0" />
                  <span>Send Toner</span>
                </button>
              </div>
            </div>

            {/* Sub-tab selection */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubTab('inventory')}
                className={`min-h-[42px] px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubTab === 'inventory'
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                On-Site Stock ({branchStock.length})
              </button>

              <button
                onClick={() => setActiveSubTab('history')}
                className={`min-h-[42px] px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubTab === 'history'
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                History ({branchDispatches.length + branchUsages.length})
              </button>

              <button
                onClick={() => setActiveSubTab('printers')}
                className={`min-h-[42px] px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubTab === 'printers'
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                Printers ({selectedBranch.printers.length})
              </button>
            </div>
          </div>

          {/* Subtab 1: On-Site Cartridge Inventory */}
          {activeSubTab === 'inventory' && (
            <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-white/10">
                <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">
                  Toners at {selectedBranch.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Delivered shipments minus recorded printer swaps
                </p>
              </div>

              {branchStock.length === 0 ? (
                <div className="p-10 text-center text-slate-600 dark:text-slate-300">
                  <Package className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
                  <p className="text-base font-bold text-[#0B0F17] dark:text-white">
                    No toners sent to this location yet.
                  </p>
                  <button
                    onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                    className="mt-4 min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Send First Delivery</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Stock Cards */}
                  <div className="md:hidden divide-y divide-slate-200 dark:divide-white/10">
                    {branchStock.map((item) => (
                      <div key={item.cartridgeId} className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-base text-[#0B0F17] dark:text-white">
                              {item.cartridgeModel}
                            </h4>
                            <span className="text-sm text-slate-600 dark:text-slate-300">{item.cartridgeColor}</span>
                          </div>
                          <span
                            className={`font-mono text-base font-bold ${
                              item.onHandCount <= 1
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-blue-700 dark:text-sky-400'
                            }`}
                          >
                            {item.onHandCount} left
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-sm bg-slate-50 dark:bg-white/[0.03] rounded-xl p-2.5">
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Delivered</span>
                            <span className="font-mono font-bold text-[#0B0F17] dark:text-white">{item.totalReceived}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">In Transit</span>
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{item.inTransitCount}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Used</span>
                            <span className="font-mono font-bold text-[#0B0F17] dark:text-white">{item.totalUsed}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <button
                            onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                            className="min-h-[42px] px-3 py-2 text-sm font-semibold text-blue-800 dark:text-sky-300 bg-blue-50 dark:bg-blue-500/15 rounded-xl cursor-pointer"
                          >
                            Log Swap
                          </button>
                          <button
                            onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                            className="min-h-[42px] px-3 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl cursor-pointer"
                          >
                            Send More
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
                        <tr>
                          <th className="py-3.5 px-5">Toner Model</th>
                          <th className="py-3.5 px-5 text-right">Delivered</th>
                          <th className="py-3.5 px-5 text-right">In Transit</th>
                          <th className="py-3.5 px-5 text-right">Used</th>
                          <th className="py-3.5 px-5 text-right">On Site Now</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {branchStock.map((item) => (
                          <tr key={item.cartridgeId} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-5">
                              <span className="font-bold text-[#0B0F17] dark:text-white block">
                                {item.cartridgeModel}
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                {item.cartridgeColor}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                              {item.totalReceived}
                            </td>
                            <td className="py-4 px-5 text-right font-mono tabular-nums">
                              {item.inTransitCount > 0 ? (
                                <span className="text-amber-700 dark:text-amber-400 font-bold">{item.inTransitCount}</span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600">0</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                              {item.totalUsed}
                            </td>
                            <td className="py-4 px-5 text-right font-mono tabular-nums">
                              <span
                                className={`font-bold text-base ${
                                  item.onHandCount <= 1
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : 'text-blue-700 dark:text-sky-400'
                                }`}
                              >
                                {item.onHandCount}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right space-x-3">
                              <button
                                onClick={() => onOpenLogUsageForBranch(selectedBranch.id)}
                                className="text-sm font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
                              >
                                Log Swap
                              </button>
                              <button
                                onClick={() => onOpenDispatchForBranch(selectedBranch.id)}
                                className="text-sm font-semibold text-[#0B0F17] dark:text-white hover:underline cursor-pointer"
                              >
                                Send More
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Subtab 2: History */}
          {activeSubTab === 'history' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">
                    Deliveries ({branchDispatches.length})
                  </h3>
                </div>
                {branchDispatches.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 p-8 text-center">
                    No deliveries recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/80 dark:divide-white/10 max-h-96 overflow-y-auto">
                    {branchDispatches.map((d) => (
                      <div key={d.id} className="p-4 flex justify-between items-start gap-3 text-sm">
                        <div>
                          <span className="font-bold text-[#0B0F17] dark:text-white block">{d.cartridgeModel}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 block">
                            {d.dispatchDate} · {d.carrier}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-[#0B0F17] dark:text-white block">{d.quantity} units</span>
                          <span
                            className={`text-xs font-semibold ${
                              d.status === 'Delivered'
                                ? 'text-blue-700 dark:text-sky-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">
                    Printer Swaps ({branchUsages.length})
                  </h3>
                </div>
                {branchUsages.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 p-8 text-center">
                    No printer swaps logged yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/80 dark:divide-white/10 max-h-96 overflow-y-auto">
                    {branchUsages.map((u) => (
                      <div key={u.id} className="p-4 flex justify-between items-start gap-3 text-sm">
                        <div>
                          <span className="font-bold text-[#0B0F17] dark:text-white block">{u.cartridgeModel}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 block">
                            {u.printerName} · {u.installedDate}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-[#0B0F17] dark:text-white block">{u.quantity} used</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">by {u.installedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 3: Printers */}
          {activeSubTab === 'printers' && (
            <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">
                    Printers at {selectedBranch.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Assigned office printers and locations
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="min-h-[42px] px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-sky-300 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 rounded-xl border border-blue-200 dark:border-blue-500/30 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Edit Printers
                </button>
              </div>

              {selectedBranch.printers.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-slate-300 text-sm border border-dashed border-slate-300 dark:border-white/15 rounded-2xl">
                  No printers added for this location yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {selectedBranch.printers.map((printer) => (
                    <div
                      key={printer.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] flex items-start gap-3"
                    >
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-sky-400 rounded-xl shrink-0">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#0B0F17] dark:text-white truncate">
                          {printer.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                          {printer.model}
                        </p>
                        <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{printer.location}</span>
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
