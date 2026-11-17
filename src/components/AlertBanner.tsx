import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AlertTriangle, ArrowRight, X, ShieldAlert, Sparkles } from 'lucide-react';

interface AlertBannerProps {
  onNavigateToReorder: () => void;
  onOpenRestock: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  onNavigateToReorder,
  onOpenRestock,
}) => {
  const { lowStockAlerts, criticalCount } = useInventory();
  const [dismissed, setDismissed] = useState(false);

  if (lowStockAlerts.length === 0 || dismissed) {
    return null;
  }

  const criticalItems = lowStockAlerts.filter((a) => a.severity === 'CRITICAL');
  const warningItems = lowStockAlerts.filter((a) => a.severity === 'WARNING');

  return (
    <div className="mb-6 bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            {criticalCount > 0 ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900">
                {criticalCount > 0
                  ? `Critical Low Stock Alert: ${criticalCount} SKU(s) critically low in office`
                  : `50-Unit Gauge Alert: ${lowStockAlerts.length} cartridge specification(s) dropped below 50 units in office`}
              </h2>
              <span className="text-xs text-slate-600 font-mono">
                (50-Unit Safety Buffer Alert)
              </span>
            </div>
            
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
              {criticalItems.length > 0 && (
                <span className="font-semibold text-rose-700 mr-2">
                  Immediate attention: {criticalItems.map((c) => `${c.cartridge.model} (${c.currentStock} left)`).join(', ')}
                </span>
              )}
              {warningItems.length > 0 && (
                <span>
                  Approaching minimum: {warningItems.slice(0, 3).map((w) => `${w.cartridge.model} (${w.currentStock}/${w.minThreshold})`).join(', ')}
                  {warningItems.length > 3 && ` +${warningItems.length - 3} more`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={onNavigateToReorder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100/60 transition-colors shadow-xs"
          >
            <span>Review Reorder List</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
          </button>

          <button
            onClick={onOpenRestock}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Top Up Now</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            title="Dismiss notification"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
