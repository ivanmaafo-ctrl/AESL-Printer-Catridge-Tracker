import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  AlertTriangle,
  ShieldAlert,
  PackageCheck,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  Package,
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

  // Custom editable reorder quantities
  const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    lowStockAlerts.forEach((a) => {
      map[a.cartridge.id] = a.suggestedReorder;
    });
    return map;
  });

  const [poNumber, setPoNumber] = useState(
    `PO-RESTOCK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [batchSuccess, setBatchSuccess] = useState(false);

  // Sync if alerts change
  React.useEffect(() => {
    setReorderQuantities((prev) => {
      const next = { ...prev };
      lowStockAlerts.forEach((a) => {
        if (next[a.cartridge.id] === undefined) {
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

    if (
      window.confirm(
        `Confirm intake receipt for ${totalSuggestedUnits} units across ${lowStockAlerts.length} SKUs into central warehouse with ${poNumber}?`
      )
    ) {
      const items = lowStockAlerts.map((a) => ({
        cartridgeId: a.cartridge.id,
        quantity: reorderQuantities[a.cartridge.id] ?? a.suggestedReorder,
      }));

      batchTopUpAlerts(items, poNumber);
      setBatchSuccess(true);
      setTimeout(() => setBatchSuccess(false), 3000);
    }
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Low Stock Alerts & Top-Up Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated threshold surveillance, suggested supplier order quantities, and batch intake
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lowStockAlerts.length > 0 && (
            <button
              onClick={handleExportReorderPO}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Purchase Order CSV</span>
            </button>
          )}

          <button
            onClick={() => onOpenRestock()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Single Restock Intake</span>
          </button>
        </div>
      </div>

      {/* Success banner if batch received */}
      {batchSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-emerald-900">
                Top-Up Completed Successfully!
              </span>
              <span>All depleted cartridges have been received and credited to central warehouse inventory.</span>
            </div>
          </div>
        </div>
      )}

      {/* Stock Health Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Critical Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Critical (≤15 Left)
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-rose-700 mt-2">
            {criticalCount} SKUs
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Prone to stockouts if branch demands toner immediately
          </span>
        </div>

        {/* Low Stock Warning Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Low Stock Warning
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-amber-800 mt-2">
            {warningCount} SKUs
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Below safe minimum buffer threshold
          </span>
        </div>

        {/* Healthy Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Adequate Stock
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            {cartridges.length - lowStockAlerts.length} SKUs
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Operating above designated safe threshold
          </span>
        </div>
      </div>

      {/* Suggested Reorder List & Batch Replenish Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Purchase Order Requisition & Top-Up Sheet
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculates suggested order amounts based on minimum threshold, safety buffer, and factory pack sizes
            </p>
          </div>

          {lowStockAlerts.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Est. PO Total</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  ${totalEstimatedCost.toFixed(2)} ({totalSuggestedUnits} units)
                </span>
              </div>

              <button
                onClick={handleBatchReceiveAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap"
              >
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span>Receive All Into Warehouse</span>
              </button>
            </div>
          )}
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">All Central Inventory is Healthy!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Every printer cartridge SKU in central warehouse is currently stocked above its configured minimum threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Cartridge Model & SKU</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">In Office at the Moment</th>
                  <th className="py-3 px-4 text-center">50-Gauge Status</th>
                  <th className="py-3 px-4 text-center">Suggested Order</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Estimated Line Total</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockAlerts.map((alert) => {
                  const currentQty =
                    reorderQuantities[alert.cartridge.id] ?? alert.suggestedReorder;
                  const lineTotal = currentQty * alert.cartridge.unitCost;

                  return (
                    <tr key={alert.cartridge.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Model & SKU */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {alert.cartridge.model}
                            </span>
                            {alert.cartridge.isBestSeller && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                Best Seller
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                                alert.severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {alert.currentStock === 0 ? 'OUT OF STOCK' : alert.severity}
                            </span>
                          </div>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {alert.cartridge.sku} · {alert.cartridge.color} · Pack of {alert.cartridge.reorderPackSize}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {alert.cartridge.supplier}
                      </td>

                      {/* In Office (Current Stock) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums ${
                            alert.currentStock === 0
                              ? 'text-rose-600'
                              : 'text-amber-700'
                          }`}
                        >
                          {alert.currentStock} units
                        </span>
                      </td>

                      {/* 50-Gauge Indicator */}
                      <td className="py-3.5 px-4 text-center">
                        <GaugeIndicator
                          currentStock={alert.currentStock}
                          gaugeTarget={alert.minThreshold || 50}
                          compact={true}
                        />
                      </td>

                      {/* Suggested Order Qty (editable) */}
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
                            className="w-16 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                          />
                          <span className="text-[11px] text-slate-400">units</span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800">
                        {alert.cartridge.unitCost > 0 ? `$${alert.cartridge.unitCost.toFixed(2)}` : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Estimated Total */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onOpenRestock(alert.cartridge.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Top Up Item</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Restock Intake History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Recent Warehouse Top-Up Intake Receipts
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {restocks.length} recorded deliveries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">PO / Intake #</th>
                <th className="py-2.5 px-4">Cartridge Model</th>
                <th className="py-2.5 px-4 text-center">Units Received</th>
                <th className="py-2.5 px-4">Vendor</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Receiver</th>
                <th className="py-2.5 px-4 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {restocks.map((rst) => (
                <tr key={rst.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {rst.poNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {rst.cartridgeModel}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-emerald-700">
                    +{rst.quantityReceived}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rst.supplier}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{rst.receivedDate}</td>
                  <td className="py-3 px-4 text-slate-600">{rst.receivedBy}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
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
