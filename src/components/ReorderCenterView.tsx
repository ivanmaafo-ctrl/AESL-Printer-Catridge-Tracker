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
        if (next[a.cartridge.id] === undefined || (a.cartridge.isBestSeller && next[a.cartridge.id] !== 40 && next[a.cartridge.id] === 15)) {
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
    <div className="space-y-5 sm:space-y-6">
      {/* Modern Blue / Moving Dark Gradient Header */}
      <section className="bg-blue-hero rounded-3xl p-4 sm:p-8 border border-blue-200/70 dark:border-blue-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div>
          <div className="text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-[#0B0F17] dark:text-white">15-Unit Buffer Surveillance</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{lowStockAlerts.length} SKUs Flagged</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1.5">
            Low Stock Alerts & Top-Up Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Automated threshold surveillance, suggested supplier order quantities, and batch warehouse intake.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0">
          {lowStockAlerts.length > 0 && (
            <button
              onClick={handleExportReorderPO}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
              <span>Export Purchase Order CSV</span>
            </button>
          )}

          <button
            onClick={() => onOpenRestock()}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Single Restock Intake</span>
          </button>
        </div>
      </section>

      {batchSuccess && (
        <div className="p-4 rounded-2xl bg-[#EFF6FF] dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-sky-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-blue-950 dark:text-white">
                Top-Up Completed Successfully
              </span>
              <span>All depleted cartridges have been received and credited to central warehouse inventory.</span>
            </div>
          </div>
        </div>
      )}

      {/* Stock Health Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-rose-50/50 dark:bg-rose-500/10 rounded-2xl p-4 sm:p-5 border border-rose-200/80 dark:border-rose-500/25">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-rose-700 dark:text-rose-400">
              Critical (≤5 Left)
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-rose-700 dark:text-rose-300 mt-1.5 sm:mt-2">
            {criticalCount} <span className="text-xs font-sans font-normal">SKUs</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 block">
            High stockout risk
          </span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl p-4 sm:p-5 border border-amber-200/80 dark:border-amber-500/25">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-800 dark:text-amber-300">
              Low Warning
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-amber-800 dark:text-amber-300 mt-1.5 sm:mt-2">
            {warningCount} <span className="text-xs font-sans font-normal">SKUs</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 block">
            Below safe buffer
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#F3F8FF] dark:bg-blue-500/10 rounded-2xl p-4 sm:p-5 border border-blue-200/80 dark:border-blue-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-sky-300">
              Adequate Stock
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-blue-700 dark:text-sky-400 mt-1.5 sm:mt-2">
            {cartridges.length - lowStockAlerts.length} <span className="text-xs font-sans font-normal">SKUs</span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
            Operating above designated safe threshold
          </span>
        </div>
      </div>

      {/* Suggested Reorder List & Batch Replenish */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F6F8FC] dark:bg-white/[0.03]">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-700 dark:text-sky-400 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-[#0B0F17] dark:text-white">
                Purchase Order Requisition & Top-Up Sheet
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Suggests 40 units for Best Sellers below gauge, or pack multiples by SKU threshold
            </p>
          </div>

          {lowStockAlerts.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
              <div className="text-left md:text-right">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block">Est. PO Total</span>
                <span className="text-sm font-display font-bold tabular-nums text-[#0B0F17] dark:text-white">
                  ${totalEstimatedCost.toFixed(2)} <span className="font-sans text-xs font-medium text-slate-500 dark:text-slate-400">({totalSuggestedUnits} units)</span>
                </span>
              </div>

              <button
                onClick={handleBatchReceiveAll}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors whitespace-nowrap cursor-pointer"
              >
                <PackageCheck className="w-4 h-4 text-sky-400 dark:text-[#06090F]" />
                <span>Receive All Into Warehouse</span>
              </button>
            </div>
          )}
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-sky-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">All Central Inventory is Healthy</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Every printer cartridge SKU in central warehouse is currently stocked above its configured minimum threshold.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Reorder Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {lowStockAlerts.map((alert) => {
                const currentQty = reorderQuantities[alert.cartridge.id] ?? alert.suggestedReorder;
                const lineTotal = currentQty * alert.cartridge.unitCost;

                return (
                  <div key={alert.cartridge.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-[#0B0F17] dark:text-white">
                            {alert.cartridge.model}
                          </span>
                          {alert.cartridge.isBestSeller && (
                            <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-400">
                              · Best Seller
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {alert.cartridge.sku} · {alert.cartridge.color} · {alert.cartridge.supplier}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          alert.severity === 'CRITICAL'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {alert.currentStock === 0 ? 'Out of Stock' : alert.severity === 'CRITICAL' ? 'Critical' : 'Low Stock'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                          In Office Now
                        </span>
                        <span
                          className={`font-display font-bold text-base tabular-nums ${
                            alert.currentStock === 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {alert.currentStock} units
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <GaugeIndicator
                          currentStock={alert.currentStock}
                          gaugeTarget={alert.minThreshold || 15}
                          compact={true}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(alert.cartridge.id, currentQty - 1)}
                          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 cursor-pointer"
                          aria-label={`Decrease suggested quantity for ${alert.cartridge.sku}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={currentQty}
                          onChange={(e) =>
                            handleQuantityChange(alert.cartridge.id, parseInt(e.target.value) || 1)
                          }
                          className="w-14 h-10 px-1.5 text-base font-mono font-bold text-center border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(alert.cartridge.id, currentQty + 1)}
                          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 cursor-pointer"
                          aria-label={`Increase suggested quantity for ${alert.cartridge.sku}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {lineTotal > 0 && (
                          <span className="font-mono text-xs font-bold text-[#0B0F17] dark:text-white">
                            ${lineTotal.toFixed(2)}
                          </span>
                        )}
                        <button
                          onClick={() => onOpenRestock(alert.cartridge.id)}
                          className="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-[#0B0F17] dark:text-[#06090F] bg-[#E8F1FF] dark:bg-sky-400 hover:bg-blue-200 dark:hover:bg-sky-300 rounded-full border border-blue-200 dark:border-transparent transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Top Up</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Cartridge Model & SKU</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-center">In Office at the Moment</th>
                    <th className="py-3 px-4 text-center">Gauge Status</th>
                    <th className="py-3 px-4 text-center">Suggested Order</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Estimated Line Total</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {lowStockAlerts.map((alert) => {
                    const currentQty =
                      reorderQuantities[alert.cartridge.id] ?? alert.suggestedReorder;
                    const lineTotal = currentQty * alert.cartridge.unitCost;

                    return (
                      <tr key={alert.cartridge.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#0B0F17] dark:text-white text-xs sm:text-sm">
                                {alert.cartridge.model}
                              </span>
                              {alert.cartridge.isBestSeller && (
                                <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-400">
                                  · Best Seller
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  alert.severity === 'CRITICAL'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                · {alert.currentStock === 0 ? 'OUT OF STOCK' : alert.severity}
                              </span>
                            </div>
                            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                              {alert.cartridge.sku} · {alert.cartridge.color} · Pack of {alert.cartridge.reorderPackSize}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {alert.cartridge.supplier}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono font-bold text-sm tabular-nums ${
                              alert.currentStock === 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {alert.currentStock} units
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <GaugeIndicator
                            currentStock={alert.currentStock}
                            gaugeTarget={alert.minThreshold || 15}
                            compact={true}
                          />
                        </td>

                        <td className="py-3.5 px-4 text-center">
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
                              className="w-16 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 dark:border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white"
                            />
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">units</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {alert.cartridge.unitCost > 0 ? `$${alert.cartridge.unitCost.toFixed(2)}` : <span className="text-slate-400 dark:text-slate-600">—</span>}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-[#0B0F17] dark:text-white">
                          {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : <span className="text-slate-400 dark:text-slate-600">—</span>}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onOpenRestock(alert.cartridge.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#0B0F17] dark:text-[#06090F] bg-[#E8F1FF] dark:bg-sky-400 hover:bg-blue-200 dark:hover:bg-sky-300 rounded-full border border-blue-200 dark:border-transparent transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-3 h-3" />
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

      {/* Past Restock Intake History */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white">
              Recent Warehouse Top-Up Intake Receipts
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {restocks.length} deliveries
          </span>
        </div>

        {/* Mobile History Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
          {restocks.map((rst) => (
            <div key={rst.id} className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {rst.poNumber} · {rst.receivedDate}
                  </span>
                  <span className="text-sm font-bold text-[#0B0F17] dark:text-white block truncate mt-0.5">
                    {rst.cartridgeModel}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-sm font-bold text-blue-700 dark:text-sky-400 shrink-0">
                  +{rst.quantityReceived}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">{rst.supplier} · By {rst.receivedBy}</span>
                <span className="font-mono font-semibold text-[#0B0F17] dark:text-white shrink-0">
                  ${(rst.quantityReceived * rst.unitCost).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">PO / Intake #</th>
                <th className="py-3 px-4">Cartridge Model</th>
                <th className="py-3 px-4 text-center">Units Received</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Receiver</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {restocks.map((rst) => (
                <tr key={rst.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0B0F17] dark:text-white">
                    {rst.poNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {rst.cartridgeModel}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-blue-700 dark:text-sky-400">
                    +{rst.quantityReceived}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rst.supplier}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{rst.receivedDate}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rst.receivedBy}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    ${(rst.quantityReceived * rst.unitCost).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
