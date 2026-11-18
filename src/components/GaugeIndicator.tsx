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
  let textLabel = 'Office Stock Healthy';

  if (currentStock === 0) {
    colorClass = 'bg-rose-600 dark:bg-rose-500';
    statusTextClass = 'text-rose-600 dark:text-rose-400';
    textLabel = 'OUT OF STOCK';
  } else if (isCritical) {
    colorClass = 'bg-rose-500';
    statusTextClass = 'text-rose-600 dark:text-rose-400';
    textLabel = `CRITICAL (≤${criticalCutoff})`;
  } else if (isBelowGauge) {
    colorClass = 'bg-amber-500';
    statusTextClass = 'text-amber-700 dark:text-amber-400';
    textLabel = `BELOW ${gaugeTarget} GAUGE`;
  }

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 min-w-[120px]">
        <div className="flex items-center justify-between w-full text-[11px] tabular-nums">
          <span
            className={`font-semibold tabular-nums ${
              isBelowGauge
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {currentStock} in office
          </span>
          <span className="text-slate-400 dark:text-slate-500">/ {gaugeTarget}</span>
        </div>

        <div className="w-full bg-slate-200/80 dark:bg-white/10 rounded-full h-1.5 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>

        {showText && isBelowGauge && (
          <span className={`text-[10px] font-semibold tabular-nums ${statusTextClass}`}>
            {currentStock === 0 ? 'EMPTY' : `ALERT (<${gaugeTarget})`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {currentStock === 0 || isCritical ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          ) : isBelowGauge ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          )}
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            In-Office {gaugeTarget}-Unit Gauge
          </span>
        </div>

        <span className={`text-[11px] font-semibold tabular-nums ${statusTextClass}`}>
          {textLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between tabular-nums">
        <div>
          <span className="text-2xl font-display font-bold tabular-nums text-slate-900 dark:text-white">
            {currentStock}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">in office</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Target Buffer: <strong>{gaugeTarget}</strong> units
        </div>
      </div>

      <div className="space-y-1">
        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200 dark:border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
          <span>0 (Empty)</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">{gaugeTarget} (Gauge Safe Target)</span>
          <span>{gaugeTarget * 2}+</span>
        </div>
      </div>

      {isBelowGauge && (
        <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-200 dark:border-amber-500/20 font-medium leading-tight">
          Stock in central office has dropped below the {gaugeTarget}-unit threshold. Top-up recommended.
        </p>
      )}
    </div>
  );
};
