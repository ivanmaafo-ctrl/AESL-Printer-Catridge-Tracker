import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Package,
  Truck,
  Send,
  ArrowRight,
  Building2,
  AlertTriangle,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDispatch: () => void;
  onOpenRestock: (cartridgeId?: string) => void;
  onOpenLogUsage: () => void;
  onOpenGuide: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenDispatch,
  onOpenRestock,
  onOpenLogUsage,
}) => {
  const {
    cartridges,
    branches,
    dispatches,
    usages,
    lowStockAlerts,
    criticalCount,
    totalCentralStockUnits,
  } = useInventory();

  const [activityTab, setActivityTab] = useState<'deliveries' | 'usage'>('deliveries');

  const inTransitCount = dispatches
    .filter((d) => d.status === 'In Transit' || d.status === 'Pending')
    .reduce((sum, d) => sum + d.quantity, 0);

  const hqBranchesCount = branches.filter(
    (b) => b.category === 'Headquarters' || b.code.startsWith('HQ')
  ).length;
  const regionalBranchesCount = branches.length - hqBranchesCount;

  const recentDispatches = dispatches.slice(0, 5);
  const recentUsages = usages.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 1. Clean Page Header — Calm, Direct, Zero Nested Cards */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Warehouse Overview
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl">
            Check central toner stock and manage deliveries across all {branches.length} AESL locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenDispatch}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Truck className="w-4 h-4 text-sky-400 dark:text-[#06090F] shrink-0" />
            <span>Send to Branch</span>
          </button>

          <button
            onClick={() => onOpenRestock()}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-300 dark:border-white/15 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-blue-700 dark:text-sky-400 shrink-0" />
            <span>Top Up Stock</span>
          </button>

          <button
            onClick={onOpenLogUsage}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Send className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Log Swap</span>
          </button>
        </div>
      </header>

      {/* 2. Four Spacious Key Numbers */}
      <section aria-label="Key warehouse numbers" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <button
          onClick={() => setActiveTab('inventory')}
          className="text-left bg-white dark:bg-[#0D131F] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-sky-400/40 transition-colors flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">In Office Stock</span>
            <Package className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalCentralStockUnits}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">units</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>{cartridges.length} toner types</span>
            <span className="font-semibold text-blue-700 dark:text-sky-400 inline-flex items-center gap-1">
              Open <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('reorder')}
          className={`text-left rounded-2xl p-5 sm:p-6 border transition-colors flex flex-col justify-between cursor-pointer ${
            criticalCount > 0
              ? 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 hover:border-rose-300'
              : lowStockAlerts.length > 0
              ? 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 hover:border-amber-300'
              : 'bg-white dark:bg-[#0D131F] border-slate-200 dark:border-white/10 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Low Stock Alerts</span>
            <AlertTriangle
              className={`w-5 h-5 shrink-0 ${
                criticalCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : lowStockAlerts.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-sky-400'
              }`}
            />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={`text-4xl font-display font-bold tracking-tight tabular-nums ${
                criticalCount > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : lowStockAlerts.length > 0
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-blue-700 dark:text-sky-400'
              }`}
            >
              {lowStockAlerts.length}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">items low</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-sm">
            <span className={criticalCount > 0 ? 'text-rose-700 dark:text-rose-300 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
              {criticalCount > 0 ? `${criticalCount} very low` : 'All monitored'}
            </span>
            <span className="font-semibold text-[#0B0F17] dark:text-white inline-flex items-center gap-1">
              Review <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('dispatches')}
          className="text-left bg-white dark:bg-[#0D131F] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-sky-400/40 transition-colors flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">On the Way</span>
            <Truck className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {inTransitCount}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">in transit</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>{dispatches.length} total deliveries</span>
            <span className="font-semibold text-blue-700 dark:text-sky-400 inline-flex items-center gap-1">
              Track <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className="text-left bg-white dark:bg-[#0D131F] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-sky-400/40 transition-colors flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Offices & Branches</span>
            <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {branches.length}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">locations</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>{hqBranchesCount} HQ · {regionalBranchesCount} Regional</span>
            <span className="font-semibold text-blue-700 dark:text-sky-400 inline-flex items-center gap-1">
              View <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </button>
      </section>

      {/* 3. Needs Attention — Clean Vertical List (No Nested Cards) */}
      <section className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0B0F17] dark:text-white">
              Toners Needing Restock
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Items currently below the 15-unit safe warehouse level
            </p>
          </div>
          {lowStockAlerts.length > 0 && (
            <button
              onClick={() => setActiveTab('reorder')}
              className="min-h-[40px] inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-sky-400 hover:underline self-start sm:self-auto cursor-pointer"
            >
              <span>See all {lowStockAlerts.length} alerts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-8 sm:p-10 text-center">
            <CheckCircle2 className="w-9 h-9 text-blue-600 dark:text-sky-400 mx-auto mb-2.5" />
            <p className="text-base font-bold text-[#0B0F17] dark:text-white">
              All toners are well stocked
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Every cartridge in the central store is above its minimum target.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-white/10">
            {lowStockAlerts.slice(0, 5).map((alert) => {
              const isEmpty = alert.currentStock === 0;
              const isCritical = alert.severity === 'CRITICAL';

              return (
                <div
                  key={alert.cartridge.id}
                  className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-bold text-[#0B0F17] dark:text-white">
                        {alert.cartridge.model}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isEmpty || isCritical
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isEmpty ? 'Out of Stock' : isCritical ? 'Very Low' : 'Low Stock'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {alert.cartridge.sku}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.cartridge.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span>{alert.cartridge.color}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right tabular-nums">
                      <span
                        className={`text-lg font-display font-bold block leading-tight ${
                          isEmpty
                            ? 'text-rose-700 dark:text-rose-400'
                            : isCritical
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {alert.currentStock} left
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Target: {alert.minThreshold}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenRestock(alert.cartridge.id)}
                      className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-[#06090F] bg-blue-50 hover:bg-blue-100 dark:bg-sky-400 dark:hover:bg-sky-300 border border-blue-200 dark:border-transparent rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Top Up</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Recent Activity — Single Clean Card with Easy 2-Tab Switcher */}
      <section className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 self-start">
            <button
              onClick={() => setActivityTab('deliveries')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activityTab === 'deliveries'
                  ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              Recent Deliveries
            </button>
            <button
              onClick={() => setActivityTab('usage')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activityTab === 'usage'
                  ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              Recent Printer Swaps
            </button>
          </div>

          <button
            onClick={() => setActiveTab(activityTab === 'deliveries' ? 'dispatches' : 'usage')}
            className="min-h-[40px] inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-sky-400 hover:underline self-start sm:self-auto cursor-pointer"
          >
            <span>{activityTab === 'deliveries' ? 'View all deliveries' : 'View all swaps'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {activityTab === 'deliveries' ? (
          <div className="divide-y divide-slate-200/80 dark:divide-white/10">
            {recentDispatches.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No deliveries have been sent yet.
              </div>
            ) : (
              recentDispatches.map((dsp) => (
                <div
                  key={dsp.id}
                  className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-base font-bold text-[#0B0F17] dark:text-white">
                      {dsp.branchName}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {dsp.quantity} × {dsp.cartridgeModel}
                      </span>
                      <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
                      <span>{dsp.carrier}</span>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 tabular-nums">
                    <span
                      className={`text-sm font-bold ${
                        dsp.status === 'Delivered'
                          ? 'text-blue-700 dark:text-sky-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {dsp.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {dsp.dispatchDate}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-white/10">
            {recentUsages.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No printer swaps have been logged yet.
              </div>
            ) : (
              recentUsages.map((usg) => (
                <div
                  key={usg.id}
                  className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-base font-bold text-[#0B0F17] dark:text-white">
                      {usg.branchName}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {usg.quantity} unit
                      </span>{' '}
                      installed in {usg.printerName}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0 tabular-nums">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {usg.installedBy}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {usg.installedDate} · {usg.reason}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
