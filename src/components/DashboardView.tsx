import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Branch } from '../types/inventory';
import {
  Package,
  Truck,
  Send,
  ArrowUpRight,
  Building2,
  Printer,
  FileSpreadsheet,
  BookOpen,
  X,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { BrandLogo } from './BrandLogo';

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
  onOpenGuide,
}) => {
  const {
    cartridges,
    branches,
    dispatches,
    usages,
    lowStockAlerts,
    criticalCount,
    totalCentralStockUnits,
    totalDispatchedUnits,
    totalUsedUnits,
    getBranchStockDetails,
  } = useInventory();

  const inTransitCount = dispatches
    .filter((d) => d.status === 'In Transit')
    .reduce((sum, d) => sum + d.quantity, 0);

  const recentDispatches = dispatches.slice(0, 5);
  const recentUsages = usages.slice(0, 5);

  const [dashboardBranchFilter, setDashboardBranchFilter] = useState<'all' | 'Headquarters' | 'Regional Branch'>('all');
  const [hideGuideBanner, setHideGuideBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aesl_printflow_hide_guide_banner') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissGuideBanner = () => {
    setHideGuideBanner(true);
    try {
      localStorage.setItem('aesl_printflow_hide_guide_banner', 'true');
    } catch {
      // ignore storage errors
    }
  };

  const displayedBranches = useMemo(() => {
    return branches.filter((b) => {
      const isHq = b.category === 'Headquarters' || b.code.startsWith('HQ');
      if (dashboardBranchFilter === 'Headquarters') return isHq;
      if (dashboardBranchFilter === 'Regional Branch') return !isHq;
      return true;
    });
  }, [branches, dashboardBranchFilter]);

  const hqBranchesCount = branches.filter((b) => b.category === 'Headquarters' || b.code.startsWith('HQ')).length;
  const regionalBranchesCount = branches.length - hqBranchesCount;

  const totalTargetUnits = useMemo(() => {
    return cartridges.reduce((sum, c) => sum + (c.minThreshold || 15), 0);
  }, [cartridges]);

  const readinessPct = useMemo(() => {
    if (totalTargetUnits <= 0) return 0;
    return Math.min(100, Math.round((totalCentralStockUnits / totalTargetUnits) * 100));
  }, [totalCentralStockUnits, totalTargetUnits]);

  const topShelfSkus = useMemo(() => {
    return [...cartridges]
      .sort((a, b) => b.centralStock - a.centralStock)
      .slice(0, 4);
  }, [cartridges]);

  const maxShelfCount = useMemo(() => {
    return Math.max(1, ...topShelfSkus.map((c) => c.centralStock));
  }, [topShelfSkus]);

  const arcRadius = 52;
  const halfCircumference = Math.PI * arcRadius;
  const arcOffset = halfCircumference - (halfCircumference * readinessPct) / 100;

  return (
    <div className="space-y-7">
      {/* 1. Modern Luminous Blue / Moving Dark Gradient Atmospheric Hero Card */}
      <section className="bg-blue-hero rounded-3xl p-4 sm:p-8 lg:p-9 border border-blue-200/70 dark:border-blue-500/20 shadow-[0_1px_3px_rgba(11,15,23,0.03)] dark:shadow-none">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-7 items-center">
          {/* Left Column: Editorial Headline & Crisp Pill CTAs */}
          <div className="xl:col-span-7 space-y-4 sm:space-y-5">
            <div className="text-[11px] sm:text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2 flex-wrap">
              <BrandLogo className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
              <span className="font-semibold text-[#0B0F17] dark:text-white">Anointed Engineering Services Limited</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="hidden sm:inline">IT Department Fleet Portal</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#0B0F17] dark:text-white leading-[1.12]">
                Manage fleet toners,
                <span className="block text-blue-700 dark:text-sky-400">across all {branches.length} locations.</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mt-2.5 sm:mt-3 leading-relaxed">
                Track central warehouse cartridges, monitor 15-unit safety thresholds, dispatch supplies to Anointed House offices and regional branches, and export filtered reports in seconds.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:flex-wrap pt-1">
              <button
                onClick={onOpenDispatch}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 rounded-full transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Truck className="w-4 h-4 text-sky-400 dark:text-[#06090F] shrink-0" />
                <span>Dispatch</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200/90 dark:border-white/15 rounded-full transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-700 dark:text-sky-400 shrink-0" />
                <span>Reports</span>
              </button>

              <button
                onClick={onOpenLogUsage}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                <span>Log Swap</span>
              </button>

              <button
                onClick={onOpenGuide}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-blue-950 dark:text-sky-300 bg-blue-950/5 dark:bg-blue-500/15 hover:bg-blue-950/10 dark:hover:bg-blue-500/25 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-700 dark:text-sky-400 shrink-0" />
                <span>Guide</span>
              </button>
            </div>
          </div>

          {/* Right Column: Floating Bento Analytics Cards */}
          <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Floating Card A: Radial Stock Buffer Gauge */}
            <div className="bg-white/95 dark:bg-[#0C141F]/90 backdrop-blur-md rounded-2xl p-4 border border-white dark:border-white/10 shadow-[0_10px_30px_rgba(11,15,23,0.06)] dark:shadow-none flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">15-Gauge Buffer</span>
                <button
                  onClick={() => setActiveTab('reorder')}
                  className="text-[11px] font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Alerts →
                </button>
              </div>

              <div className="my-2 flex flex-col items-center">
                <svg viewBox="0 0 130 76" className="w-36 h-22 overflow-visible" aria-label="Warehouse gauge readiness">
                  <path
                    d="M 13 65 A 52 52 0 0 1 117 65"
                    fill="none"
                    className="stroke-slate-200 dark:stroke-white/10"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 13 65 A 52 52 0 0 1 117 65"
                    fill="none"
                    stroke={readinessPct < 25 ? '#E11D48' : readinessPct < 60 ? '#F59E0B' : '#2563EB'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={halfCircumference}
                    strokeDashoffset={arcOffset}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="-mt-8 text-center">
                  <span className="text-2xl font-display font-bold tabular-nums text-[#0B0F17] dark:text-white">
                    {readinessPct}%
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Shelf Capacity
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                <span>{totalCentralStockUnits} on shelf</span>
                <span>{totalTargetUnits} target</span>
              </div>
            </div>

            {/* Floating Card B: Top Shelf SKUs */}
            <div className="bg-white/95 dark:bg-[#0C141F]/90 backdrop-blur-md rounded-2xl p-4 border border-white dark:border-white/10 shadow-[0_10px_30px_rgba(11,15,23,0.06)] dark:shadow-none flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Top In-Office Stock</span>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:underline cursor-pointer"
                >
                  All ({cartridges.length}) →
                </button>
              </div>

              <div className="space-y-2.5 my-auto">
                {topShelfSkus.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No SKUs recorded</p>
                ) : (
                  topShelfSkus.map((sku) => {
                    const widthPct = Math.max(8, Math.round((sku.centralStock / maxShelfCount) * 100));
                    return (
                      <div key={sku.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-semibold text-[#0B0F17] dark:text-white truncate">{sku.sku}</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                            {sku.centralStock}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 dark:bg-sky-400"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {cartridges.filter((c) => c.centralStock === 0).length} out of stock
                </span>
                <button
                  onClick={() => onOpenRestock()}
                  className="font-semibold text-[#0B0F17] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  + Top Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dismissible Beginner Walkthrough Strip */}
      {!hideGuideBanner && (
        <div className="bg-[#F3F8FF] dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B0F17] dark:bg-sky-400 text-sky-400 dark:text-[#06090F] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                New to PrintFlow? Take the 7-Step Beginner Walkthrough
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Learn how to check warehouse stock, dispatch toners to any of the {branches.length} AESL locations, log printer swaps, handle 15-gauge alerts, and export custom reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400 dark:text-[#06090F]" />
              <span>Start Beginner Guide</span>
            </button>
            <button
              onClick={handleDismissGuideBanner}
              title="Dismiss welcome banner"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-blue-100/70 dark:hover:bg-white/10 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Clean Editorial Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Office (Warehouse)</span>
            <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalCentralStockUnits}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">units left</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{cartridges.length} toner SKUs</span>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
            >
              View Stock <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sent Out to Branches</span>
            <Truck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalDispatchedUnits}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">dispatched</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums text-amber-700 dark:text-amber-400 font-medium">{inTransitCount} in transit</span>
            <button
              onClick={() => setActiveTab('dispatches')}
              className="text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Deliveries <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Installed / Used</span>
            <Send className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalUsedUnits}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">consumed</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{branches.length} locations</span>
            <button
              onClick={() => setActiveTab('usage')}
              className="text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
            >
              Usage Log <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('reorder')}
          className={`rounded-2xl p-4 sm:p-5 border cursor-pointer transition-colors flex flex-col justify-between ${
            criticalCount > 0
              ? 'bg-rose-50/40 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-500/25 hover:border-rose-300 dark:hover:border-rose-400/40'
              : lowStockAlerts.length > 0
              ? 'bg-amber-50/40 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/25 hover:border-amber-300 dark:hover:border-amber-400/40'
              : 'bg-[#F3F8FF] dark:bg-blue-500/10 border-blue-200/80 dark:border-blue-500/25 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Replenish Alerts</span>
            <TrendingDown className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-display font-bold tracking-tight tabular-nums ${
                criticalCount > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : lowStockAlerts.length > 0
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-blue-700 dark:text-sky-400'
              }`}
            >
              {lowStockAlerts.length}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">SKUs low</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
            <span className={criticalCount > 0 ? 'text-rose-700 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
              {criticalCount > 0 ? `${criticalCount} critical (≤5 units)` : 'Threshold monitored'}
            </span>
            <span className="text-[#0B0F17] dark:text-white font-semibold inline-flex items-center gap-0.5">
              Reorder <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Active Low Stock Alerts Bento Showcase */}
      {lowStockAlerts.length > 0 && (
        <section className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-white/10">
            <div>
              <h2 className="text-base font-bold text-[#0B0F17] dark:text-white">
                Central Inventory Replenishment Priority
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toners currently below the 15-unit safety buffer, ordered by urgency
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reorder')}
              className="text-xs text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold self-start sm:self-auto inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Generate Reorder PO ({lowStockAlerts.length} items)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {lowStockAlerts.slice(0, 6).map((alert) => (
              <div
                key={alert.cartridge.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#F8FAFD] dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[#0B0F17] dark:text-white line-clamp-1">
                        {alert.cartridge.model}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{alert.cartridge.sku}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.cartridge.brand}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.cartridge.type}</span>
                        {alert.cartridge.isBestSeller && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-blue-700 dark:text-sky-400">Best Seller</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold shrink-0 ${
                        alert.currentStock === 0 || alert.severity === 'CRITICAL'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {alert.currentStock === 0
                        ? 'Out of Stock'
                        : alert.severity === 'CRITICAL'
                        ? 'Critical'
                        : 'Low'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs tabular-nums">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Left: </span>
                    <strong className={alert.currentStock === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#0B0F17] dark:text-white'}>
                      {alert.currentStock}
                    </strong>
                    <span className="text-slate-400 dark:text-slate-500"> / {alert.minThreshold}</span>
                  </div>
                  <button
                    onClick={() => onOpenRestock(alert.cartridge.id)}
                    className="px-3 py-1 text-[11px] font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 hover:bg-[#0B0F17] hover:text-white dark:hover:bg-sky-400 dark:hover:text-[#06090F] rounded-full transition-colors cursor-pointer"
                  >
                    + Top Up
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Branch Network & Headquarters Allocation Summary */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-[#0B0F17] dark:text-white">
              Branch Network & Headquarters Allocation Summary
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex rounded-full bg-slate-100 dark:bg-white/5 p-0.5 text-xs">
              <button
                onClick={() => setDashboardBranchFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  dashboardBranchFilter === 'all'
                    ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                All ({branches.length})
              </button>
              <button
                onClick={() => setDashboardBranchFilter('Headquarters')}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  dashboardBranchFilter === 'Headquarters'
                    ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                HQ Offices ({hqBranchesCount})
              </button>
              <button
                onClick={() => setDashboardBranchFilter('Regional Branch')}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  dashboardBranchFilter === 'Regional Branch'
                    ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                Regional ({regionalBranchesCount})
              </button>
            </div>

            <button
              onClick={() => setActiveTab('branches')}
              className="text-xs text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Manage Network →
            </button>
          </div>
        </div>

        {/* Mobile Branch Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
          {displayedBranches.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No locations found in this category.</p>
            </div>
          ) : (
            displayedBranches.map((branch: Branch) => {
              const isHq = branch.category === 'Headquarters' || branch.code.startsWith('HQ');
              const stockDetails = getBranchStockDetails(branch.id);
              const totalDelivered = stockDetails.reduce((s, i) => s + i.totalReceived, 0);
              const totalTransit = stockDetails.reduce((s, i) => s + i.inTransitCount, 0);
              const totalUsed = stockDetails.reduce((s, i) => s + i.totalUsed, 0);
              const onHand = stockDetails.reduce((s, i) => s + i.onHandCount, 0);

              return (
                <div key={branch.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-blue-700 dark:text-sky-400">{branch.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{isHq ? 'HQ' : 'Regional'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{branch.city}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white mt-0.5 truncate">
                        {branch.name}
                      </h3>
                    </div>

                    <button
                      onClick={onOpenDispatch}
                      className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0B0F17] dark:text-[#06090F] bg-[#E8F1FF] dark:bg-sky-400 rounded-full shrink-0 cursor-pointer"
                    >
                      Dispatch
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-center">
                    <div className="bg-[#F8FAFD] dark:bg-white/[0.03] rounded-xl py-1.5 px-1">
                      <span className="text-[10px] text-slate-400 block">Delivered</span>
                      <span className="text-xs font-mono font-bold text-[#0B0F17] dark:text-white tabular-nums">{totalDelivered}</span>
                    </div>
                    <div className="bg-[#F8FAFD] dark:bg-white/[0.03] rounded-xl py-1.5 px-1">
                      <span className="text-[10px] text-slate-400 block">Transit</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${totalTransit > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{totalTransit}</span>
                    </div>
                    <div className="bg-[#F8FAFD] dark:bg-white/[0.03] rounded-xl py-1.5 px-1">
                      <span className="text-[10px] text-slate-400 block">Used</span>
                      <span className="text-xs font-mono font-bold text-[#0B0F17] dark:text-white tabular-nums">{totalUsed}</span>
                    </div>
                    <div className="bg-[#F8FAFD] dark:bg-white/[0.03] rounded-xl py-1.5 px-1">
                      <span className="text-[10px] text-slate-400 block">Reserve</span>
                      <span className={`text-xs font-mono font-bold tabular-nums ${onHand <= 1 ? 'text-slate-500' : 'text-blue-700 dark:text-sky-400'}`}>{onHand}u</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Location / Office</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Printers</th>
                <th className="py-3 px-4 text-right">Delivered</th>
                <th className="py-3 px-4 text-right">In Transit</th>
                <th className="py-3 px-4 text-right">Consumed</th>
                <th className="py-3 px-4 text-right">On-Site Reserve</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {displayedBranches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No locations found in this category.</p>
                  </td>
                </tr>
              ) : (
                displayedBranches.map((branch: Branch) => {
                  const isHq = branch.category === 'Headquarters' || branch.code.startsWith('HQ');
                  const stockDetails = getBranchStockDetails(branch.id);
                  const totalDelivered = stockDetails.reduce((s, i) => s + i.totalReceived, 0);
                  const totalTransit = stockDetails.reduce((s, i) => s + i.inTransitCount, 0);
                  const totalUsed = stockDetails.reduce((s, i) => s + i.totalUsed, 0);
                  const onHand = stockDetails.reduce((s, i) => s + i.onHandCount, 0);

                  return (
                    <tr key={branch.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#0B0F17] dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 dark:text-slate-500 font-normal">{branch.code}</span>
                          <span>{branch.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {isHq ? 'Headquarters' : 'Regional Branch'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{branch.city}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{branch.printers.length} device{branch.printers.length === 1 ? '' : 's'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {totalDelivered}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {totalTransit > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">{totalTransit}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {totalUsed}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className={`font-semibold ${onHand <= 1 ? 'text-slate-500 dark:text-slate-400' : 'text-blue-700 dark:text-sky-400'}`}>
                          {onHand} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={onOpenDispatch}
                          className="text-xs font-semibold text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          Dispatch
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Two-Column Activity Feeds: Recent Dispatches & Recent Usages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Dispatches */}
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0B0F17] dark:text-sky-400" />
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                Recent Branch Deliveries & Dispatches
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('dispatches')}
              className="text-xs text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold cursor-pointer"
            >
              All Deliveries →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentDispatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No deliveries dispatched yet.
              </div>
            ) : (
              recentDispatches.map((dsp) => (
                <div key={dsp.id} className="p-4 hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#0B0F17] dark:text-white">{dsp.branchName}</span>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {dsp.quantity} × <span className="font-semibold">{dsp.cartridgeModel}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        dsp.status === 'Delivered' ? 'text-blue-700 dark:text-sky-400' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {dsp.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{dsp.dispatchDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dsp.carrier}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{dsp.trackingNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Usages */}
        <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-700 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                Recent Printer Installations & Usages
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('usage')}
              className="text-xs text-[#0B0F17] dark:text-sky-400 hover:text-blue-700 font-semibold cursor-pointer"
            >
              All Usages →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentUsages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No printer usage recorded yet.
              </div>
            ) : (
              recentUsages.map((usg) => (
                <div key={usg.id} className="p-4 hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#0B0F17] dark:text-white">{usg.branchName}</span>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {usg.quantity} unit into <span className="font-medium">{usg.printerName}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {usg.cartridgeColor}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 tabular-nums">
                      <span>{usg.installedDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{usg.installedBy}</span>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">{usg.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Editorial Quick Workflow Strip (01..04 numbered pattern) */}
      <section className="bg-[#F6F8FC] dark:bg-white/[0.03] rounded-2xl border border-slate-200/70 dark:border-white/10 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">Daily Workflow at a Glance</h3>
          <button
            onClick={onOpenGuide}
            className="text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
          >
            Open Interactive Tour →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: '01', title: 'Check Stock Levels', desc: 'Monitor In-Office quantities against the 15-unit gauge.', action: () => setActiveTab('inventory') },
            { num: '02', title: 'Dispatch Supplies', desc: 'Send toners to HQ offices or regional branches with tracking.', action: onOpenDispatch },
            { num: '03', title: 'Log Printer Swaps', desc: 'Record installations to track true consumption per branch.', action: onOpenLogUsage },
            { num: '04', title: 'Filter & Export Reports', desc: 'Include or exclude any toner details and save CSV/PDF.', action: () => setActiveTab('reports') },
          ].map((item) => (
            <button
              key={item.num}
              onClick={item.action}
              className="text-left p-4 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-sky-400/30 transition-colors cursor-pointer group"
            >
              <span className="font-display text-xs font-bold tabular-nums text-blue-700 dark:text-sky-400 block mb-1.5">
                {item.num}
              </span>
              <span className="text-xs font-bold text-[#0B0F17] dark:text-white block group-hover:text-blue-800 dark:group-hover:text-sky-300">
                {item.title}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
