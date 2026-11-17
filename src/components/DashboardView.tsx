import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Branch } from '../types/inventory';
import {
  Package,
  Truck,
  Send,
  AlertTriangle,
  Building2,
  TrendingDown,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDispatch: () => void;
  onOpenRestock: (cartridgeId?: string) => void;
  onOpenLogUsage: () => void;
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
    totalDispatchedUnits,
    totalUsedUnits,
    getBranchStockDetails,
  } = useInventory();

  // In-transit count
  const inTransitCount = dispatches
    .filter((d) => d.status === 'In Transit')
    .reduce((sum, d) => sum + d.quantity, 0);

  // Recent 5 dispatches
  const recentDispatches = dispatches.slice(0, 5);

  // Recent 5 usages
  const recentUsages = usages.slice(0, 5);

  const [dashboardBranchFilter, setDashboardBranchFilter] = useState<'all' | 'Headquarters' | 'Regional Branch'>('all');

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

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-800">Anointed Engineering Services Limited</span>
            <span aria-hidden="true">·</span>
            <span>IT Department Fleet Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Printer Cartridge Logistics & Site Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time branch allocations across engineering sites, central IT stores monitoring, and automated replenish alerts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenDispatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch to Branch</span>
          </button>

          <button
            onClick={onOpenLogUsage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4 text-emerald-600" />
            <span>Log Branch Usage</span>
          </button>

          <button
            onClick={() => onOpenRestock()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>Top Up Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Clean single-elevation surfaces with tabular numerals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: In Office at the Moment (Warehouse) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Office (Warehouse)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {totalCentralStockUnits}
            </span>
            <span className="text-xs text-slate-500 font-medium">units in office</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{cartridges.length} cartridge SKUs</span>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5"
            >
              In-Office Stock <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Sent Out to Other Offices & Branches */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sent Out to Branches
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {totalDispatchedUnits}
            </span>
            <span className="text-xs text-slate-500 font-medium">units sent out</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-amber-700 font-medium">
              {inTransitCount} in transit
            </span>
            <button
              onClick={() => setActiveTab('dispatches')}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5"
            >
              Sent Records <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: Consumed / Used */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Used / Installed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {totalUsedUnits}
            </span>
            <span className="text-xs text-slate-500 font-medium">cartridges consumed</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Across {branches.length} branches</span>
            <button
              onClick={() => setActiveTab('usage')}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5"
            >
              Usage Log <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Low Stock Alert Status */}
        <div
          onClick={() => setActiveTab('reorder')}
          className={`rounded-xl p-5 border cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
            criticalCount > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
              : lowStockAlerts.length > 0
              ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
              : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Replenish Alerts
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                criticalCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : lowStockAlerts.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {criticalCount > 0 ? (
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              ) : lowStockAlerts.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono tabular-nums ${
                criticalCount > 0
                  ? 'text-rose-700'
                  : lowStockAlerts.length > 0
                  ? 'text-amber-800'
                  : 'text-emerald-700'
              }`}
            >
              {lowStockAlerts.length}
            </span>
            <span className="text-xs text-slate-600 font-medium">SKUs need reorder</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span
              className={
                criticalCount > 0 ? 'text-rose-700 font-semibold' : 'text-slate-600'
              }
            >
              {criticalCount > 0 ? `${criticalCount} critical (≤15 units)` : 'Threshold monitored'}
            </span>
            <span className="text-blue-700 font-semibold inline-flex items-center gap-0.5">
              Reorder PO <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Active Low Stock Alerts Showcase (if any) */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Central Inventory Replenishment Priority
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('reorder')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-start sm:self-auto"
            >
              Generate Reorder Purchase Order ({lowStockAlerts.length} items) →
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.slice(0, 6).map((alert) => (
              <div
                key={alert.cartridge.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {alert.cartridge.model}
                      </span>
                      {alert.cartridge.isBestSeller && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Best Seller · High Demand
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.currentStock === 0
                        ? 'OUT OF STOCK'
                        : alert.severity === 'CRITICAL'
                        ? 'CRITICAL'
                        : 'LOW'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>{alert.cartridge.brand}</span>
                    <span aria-hidden="true">·</span>
                    <span>{alert.cartridge.color}</span>
                    <span aria-hidden="true">·</span>
                    <span>{alert.cartridge.type}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="font-mono">
                    <span className="text-slate-500">Stock: </span>
                    <strong className={alert.currentStock <= 1 ? 'text-rose-600' : 'text-amber-700'}>
                      {alert.currentStock}
                    </strong>
                    <span className="text-slate-400"> / min {alert.minThreshold}</span>
                  </div>
                  <button
                    onClick={() => onOpenRestock(alert.cartridge.id)}
                    className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    + Top Up
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch On-Site Status Table ("where each cartridge was sent to / on hand") */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Branch Network & Headquarters Allocation Summary
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
              <button
                onClick={() => setDashboardBranchFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  dashboardBranchFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({branches.length})
              </button>
              <button
                onClick={() => setDashboardBranchFilter('Headquarters')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  dashboardBranchFilter === 'Headquarters'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HQ Offices ({hqBranchesCount})
              </button>
              <button
                onClick={() => setDashboardBranchFilter('Regional Branch')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  dashboardBranchFilter === 'Regional Branch'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Regional ({regionalBranchesCount})
              </button>
            </div>

            <button
              onClick={() => setActiveTab('branches')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Manage Network →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Location / Office</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">City</th>
                <th className="py-2.5 px-4">Active Printers</th>
                <th className="py-2.5 px-4 text-right">Delivered</th>
                <th className="py-2.5 px-4 text-right">In Transit</th>
                <th className="py-2.5 px-4 text-right">Consumed</th>
                <th className="py-2.5 px-4 text-right">On-Site Reserve</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedBranches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No locations found in this category.</p>
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
                    <tr key={branch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-normal">{branch.code}</span>
                          <span>{branch.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isHq ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isHq ? 'Headquarters' : 'Regional Branch'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{branch.city}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5 text-slate-400" />
                          <span>{branch.printers.length} devices</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {totalDelivered}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {totalTransit > 0 ? (
                          <span className="text-amber-700 font-semibold">{totalTransit}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {totalUsed}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-xs ${
                            onHand <= 1
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {onHand} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={onOpenDispatch}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
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

      {/* Two-Column Activity Feeds: Recent Dispatches & Recent Usages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Dispatches ("Where sent to") */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Branch Deliveries & Dispatches
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('dispatches')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              All Deliveries →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentDispatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No deliveries dispatched yet.
              </div>
            ) : (
              recentDispatches.map((dsp) => (
                <div key={dsp.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {dsp.branchName}
                      </span>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {dsp.quantity} × <span className="font-semibold">{dsp.cartridgeModel}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        dsp.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {dsp.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>{dsp.dispatchDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dsp.carrier}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dsp.trackingNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Usages ("How many used") */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Printer Installations & Usages
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('usage')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              All Usages →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUsages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No printer usage recorded yet.
              </div>
            ) : (
              recentUsages.map((usg) => (
                <div key={usg.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {usg.branchName}
                      </span>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {usg.quantity} unit into <span className="font-medium">{usg.printerName}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600">
                      {usg.cartridgeColor}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-2 font-mono">
                      <span>{usg.installedDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{usg.installedBy}</span>
                    </div>
                    <span className="text-slate-600 italic">{usg.reason}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
