import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  AlertTriangle,
  ShieldAlert,
  PackageCheck,
  CheckCircle2,
  Download,
  Plus,
  Minus,
  FileText,
} from 'lucide-react';
import { GaugeIndicator } from './GaugeIndicator';

interface ReorderCenterViewProps {
  onOpenRestock: (cartridgeId?: string) => void;
}

export const ReorderCenterView: React.FC<ReorderCenterViewProps> = ({ onOpenRestock }) => {
  const {
    lowStockAlerts,
    criticalCount,
    warningCount,
    batchTopUpAlerts,
    restocks,
    cartridges,
  } = useInventory();

  const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    lowStockAlerts.forEach((a) => {
      map[a.cartridge.id] = a.suggestedReorder;
    });
    return map;
  });

  const [poNumber] = useState(
    `PO-RESTOCK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [batchSuccess, setBatchSuccess] = useState(false);

  React.useEffect(() => {
    setReorderQuantities((prev) => {
      const next = { ...prev };
      lowStockAlerts.forEach((a) => {
        if (
          next[a.cartridge.id] === undefined ||
          (a.cartridge.isBestSeller && next[a.cartridge.id] !== 40 && next[a.cartridge.id] === 15)
        ) {
          next[a.cartridge.id] = a.suggestedReorder;
        }
      });
      return next;
    });
  }, [lowStockAlerts]);

  const handleQuantityChange = (cartridgeId: string, val: number) => {
    setReorderQuantities((prev) => ({
      ...prev,
      [cartridgeId]: Math.max(1, val),
    }));
  };

  const totalEstimatedCost = lowStockAlerts.reduce((sum, a) => {
    const qty = reorderQuantities[a.cartridge.id] ?? a.suggestedReorder;
    return sum + qty * a.cartridge.unitCost;
  }, 0);

  const totalSuggestedUnits = lowStockAlerts.reduce((sum, a) => {
    return sum + (reorderQuantities[a.cartridge.id] ?? a.suggestedReorder);
  }, 0);

  const handleBatchReceiveAll = () => {
    if (lowStockAlerts.length === 0) return;

    const items = lowStockAlerts.map((a) => ({
      cartridgeId: a.cartridge.id,
      quantity: reorderQuantities[a.cartridge.id] ?? a.suggestedReorder,
    }));

    batchTopUpAlerts(items, poNumber);
    setBatchSuccess(true);
    setTimeout(() => setBatchSuccess(false), 3000);
  };

  const handleExportReorderPO = () => {
    const headers = [
      'SKU',
      'Cartridge Model',
      'Supplier',
      'Current Central Stock',
      'Alert Threshold',
      'Order Quantity',
      'Pack Size',
      'Unit Cost ($)',
      'Total Estimated ($)',
    ];

    const rows = lowStockAlerts.map((a) => {
      const qty = reorderQuantities[a.cartridge.id] ?? a.suggestedReorder;
      return [
        a.cartridge.sku,
        `"${a.cartridge.model}"`,
        `"${a.cartridge.supplier}"`,
        a.currentStock,
        a.minThreshold,
        qty,
        a.cartridge.reorderPackSize,
        a.cartridge.unitCost.toFixed(2),
        (qty * a.cartridge.unitCost).toFixed(2),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `Anointed Engineering Services Limited - IT Department`,
        `Purchase Order Requisition: ${poNumber}`,
        `Generated: ${new Date().toISOString()}`,
        '',
        headers.join(','),
        ...rows.map((e) => e.join(',')),
        '',
        `,,,,,Total Units,${totalSuggestedUnits},Total Estimated,$${totalEstimatedCost.toFixed(2)}`,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AESL_IT_cartridge_reorder_${poNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-7">
      {/* Clean Flat Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Low Stock Alerts
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Toners below the 15-unit target level, ready for restocking or purchase orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {lowStockAlerts.length > 0 && (
            <button
              onClick={handleExportReorderPO}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
              <span>Export Order List</span>
            </button>
          )}

          <button
            onClick={() => onOpenRestock()}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Top Up One Toner</span>
          </button>
        </div>
      </header>

      {batchSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-950 dark:text-sky-200 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0" />
          <div>
            <span className="font-bold block">Restock saved successfully</span>
            <span>All listed quantities have been added to central warehouse stock.</span>
          </div>
        </div>
      )}

      {/* 3 Calm Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50/70 dark:bg-rose-500/10 rounded-2xl p-5 border border-rose-200 dark:border-rose-500/25">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">
              Very Low (5 or less)
            </span>
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-rose-700 dark:text-rose-300">
              {criticalCount}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300">toners</span>
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-500/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-500/25">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Below Target
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-amber-800 dark:text-amber-300">
              {warningCount}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300">toners</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D131F] rounded-2xl p-5 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Well Stocked
            </span>
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-blue-700 dark:text-sky-400">
              {cartridges.length - lowStockAlerts.length}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">toners above target</span>
          </div>
        </div>
      </div>

      {/* Reorder Sheet */}
      <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0B0F17] dark:text-white">
              Suggested Restock List
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Adjust quantities below, then receive individual items or all at once.
            </p>
          </div>

          {lowStockAlerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="text-sm text-slate-700 dark:text-slate-200 tabular-nums">
                Total: <strong className="font-bold">{totalSuggestedUnits} units</strong>
                {totalEstimatedCost > 0 && (
                  <span> · ${totalEstimatedCost.toFixed(2)}</span>
                )}
              </div>

              <button
                onClick={handleBatchReceiveAll}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <PackageCheck className="w-4 h-4 text-sky-400 dark:text-[#06090F]" />
                <span>Receive All Into Stock</span>
              </button>
            </div>
          )}
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-10 text-center text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-sky-400 mx-auto mb-2.5" />
            <h3 className="text-lg font-bold text-[#0B0F17] dark:text-white">
              All Warehouse Stock Is Healthy
            </h3>
            <p className="text-sm mt-1">
              Every toner is currently at or above its safe target level.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-white/10">
              {lowStockAlerts.map((alert) => {
                const currentQty = reorderQuantities[alert.cartridge.id] ?? alert.suggestedReorder;

                return (
                  <div key={alert.cartridge.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-base text-[#0B0F17] dark:text-white block">
                          {alert.cartridge.model}
                        </span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                          {alert.cartridge.sku} · {alert.cartridge.color}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold shrink-0 ${
                          alert.severity === 'CRITICAL'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {alert.currentStock === 0 ? 'Out of Stock' : alert.severity === 'CRITICAL' ? 'Very Low' : 'Low Stock'}
                      </span>
                    </div>

                    <GaugeIndicator
                      currentStock={alert.currentStock}
                      gaugeTarget={alert.minThreshold || 15}
                      compact={true}
                      showText={false}
                    />

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(alert.cartridge.id, currentQty - 1)}
                          className="w-11 h-11 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                          aria-label={`Decrease quantity for ${alert.cartridge.sku}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={currentQty}
                          onChange={(e) =>
                            handleQuantityChange(alert.cartridge.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-11 px-2 text-base font-mono font-bold text-center border border-slate-300 dark:border-white/15 rounded-xl bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(alert.cartridge.id, currentQty + 1)}
                          className="w-11 h-11 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                          aria-label={`Increase quantity for ${alert.cartridge.sku}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenRestock(alert.cartridge.id)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-[#06090F] bg-blue-50 dark:bg-sky-400 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-transparent cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Top Up</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Toner Model & Code</th>
                    <th className="py-3.5 px-5 text-center">In Office</th>
                    <th className="py-3.5 px-5">Stock Level</th>
                    <th className="py-3.5 px-5 text-center">Order Qty</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                  {lowStockAlerts.map((alert) => {
                    const currentQty =
                      reorderQuantities[alert.cartridge.id] ?? alert.suggestedReorder;

                    return (
                      <tr key={alert.cartridge.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-bold text-[#0B0F17] dark:text-white text-base block">
                            {alert.cartridge.model}
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-300 text-xs">
                            {alert.cartridge.sku} · {alert.cartridge.color} · {alert.cartridge.supplier}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span
                            className={`font-mono font-bold text-lg tabular-nums ${
                              alert.currentStock === 0
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {alert.currentStock}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <GaugeIndicator
                            currentStock={alert.currentStock}
                            gaugeTarget={alert.minThreshold || 15}
                            compact={true}
                            showText={false}
                          />
                        </td>

                        <td className="py-4 px-5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              value={currentQty}
                              onChange={(e) =>
                                handleQuantityChange(
                                  alert.cartridge.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 h-10 px-2.5 text-sm font-mono font-bold text-center border border-slate-300 dark:border-white/15 rounded-xl bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-300">units</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => onOpenRestock(alert.cartridge.id)}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-[#06090F] bg-blue-50 dark:bg-sky-400 hover:bg-blue-100 dark:hover:bg-sky-300 rounded-xl border border-blue-200 dark:border-transparent transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Top Up</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Past Restock History */}
      {restocks.length > 0 && (
        <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700 dark:text-sky-400" />
              <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">
                Recent Restock Receipts
              </h3>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {restocks.length} records
            </span>
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-white/10">
            {restocks.slice(0, 8).map((rst) => (
              <div
                key={rst.id}
                className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-bold text-[#0B0F17] dark:text-white block">
                    {rst.cartridgeModel}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                    <span className="font-mono">{rst.poNumber}</span> · {rst.receivedDate} · {rst.supplier} · By {rst.receivedBy}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-base font-bold text-blue-700 dark:text-sky-400 shrink-0">
                  +{rst.quantityReceived} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
