import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AlertTriangle, ArrowRight, X, ShieldAlert } from 'lucide-react';

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
    <div className="mb-6 bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-md border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
              criticalCount > 0
                ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
            }`}
          >
            {criticalCount > 0 ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-[#0B0F17] dark:text-white">
                {criticalCount > 0
                  ? `${criticalCount} SKU${criticalCount > 1 ? 's' : ''} critically low or out of stock`
                  : `${lowStockAlerts.length} SKU${lowStockAlerts.length > 1 ? 's' : ''} below 15-unit gauge`}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                15-Unit Buffer Monitor
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
              {criticalItems.length > 0 && (
                <span className="font-semibold text-rose-700 dark:text-rose-400 mr-2">
                  Urgent: {criticalItems.slice(0, 4).map((c) => `${c.cartridge.sku} (${c.currentStock})`).join(', ')}
                  {criticalItems.length > 4 && ` +${criticalItems.length - 4} more`}
                </span>
              )}
              {warningItems.length > 0 && (
                <span>
                  Below gauge: {warningItems.slice(0, 3).map((w) => `${w.cartridge.sku} (${w.currentStock}/${w.minThreshold})`).join(', ')}
                  {warningItems.length > 3 && ` +${warningItems.length - 3} more`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={onNavigateToReorder}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span>Review Alerts</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          <button
            onClick={onOpenRestock}
            className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer"
          >
            <span>Top Up Now</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            title="Dismiss notification"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
