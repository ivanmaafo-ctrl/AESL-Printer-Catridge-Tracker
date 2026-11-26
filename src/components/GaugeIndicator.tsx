import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GaugeIndicatorProps {
  currentStock: number;
  gaugeTarget?: number; // default 15
  compact?: boolean;
  showText?: boolean;
}

export const GaugeIndicator: React.FC<GaugeIndicatorProps> = ({
  currentStock,
  gaugeTarget = 15,
  compact = false,
  showText = true,
}) => {
  const percentage = Math.min(100, Math.round((currentStock / gaugeTarget) * 100));
  const criticalCutoff = Math.max(1, Math.floor(gaugeTarget / 3));
  const isCritical = currentStock <= criticalCutoff;
  const isBelowGauge = currentStock < gaugeTarget;

  let colorClass = 'bg-blue-600 dark:bg-sky-400';
  let statusTextClass = 'text-blue-700 dark:text-sky-400';
  let textLabel = 'In Stock';

  if (currentStock === 0) {
    colorClass = 'bg-rose-600 dark:bg-rose-500';
    statusTextClass = 'text-rose-700 dark:text-rose-400';
    textLabel = 'Out of Stock';
  } else if (isCritical) {
    colorClass = 'bg-rose-500';
    statusTextClass = 'text-rose-700 dark:text-rose-400';
    textLabel = 'Very Low';
  } else if (isBelowGauge) {
    colorClass = 'bg-amber-500';
    statusTextClass = 'text-amber-700 dark:text-amber-400';
    textLabel = 'Low Stock';
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <div className="flex items-center justify-between w-full text-xs tabular-nums">
          <span className={`font-semibold ${statusTextClass}`}>{textLabel}</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            {currentStock} / {gaugeTarget}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>

        {showText && isBelowGauge && (
          <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            Needs {Math.max(1, gaugeTarget - currentStock)} more to reach target
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-200 dark:border-white/10 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {currentStock === 0 || isCritical ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          ) : isBelowGauge ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          )}
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Target Stock Level ({gaugeTarget} units)
          </span>
        </div>

        <span className={`text-xs font-bold tabular-nums ${statusTextClass}`}>
          {textLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between tabular-nums">
        <div>
          <span className="text-3xl font-display font-bold tabular-nums text-slate-900 dark:text-white">
            {currentStock}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-300 ml-1.5">in office</span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Minimum safe level: <strong>{gaugeTarget}</strong>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs tabular-nums text-slate-500 dark:text-slate-400">
          <span>0 (Empty)</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{gaugeTarget} (Safe Target)</span>
          <span>{gaugeTarget * 2}+</span>
        </div>
      </div>

      {isBelowGauge && (
        <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 font-medium leading-relaxed">
          In-office stock is below the {gaugeTarget}-unit safe level. Top-up is recommended.
        </p>
      )}
    </div>
  );
};
