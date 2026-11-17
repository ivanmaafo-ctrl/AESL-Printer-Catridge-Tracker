import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GaugeIndicatorProps {
  currentStock: number;
  gaugeTarget?: number; // default 50
  compact?: boolean;
  showText?: boolean;
}

export const GaugeIndicator: React.FC<GaugeIndicatorProps> = ({
  currentStock,
  gaugeTarget = 50,
  compact = false,
  showText = true,
}) => {
  const percentage = Math.min(100, Math.round((currentStock / gaugeTarget) * 100));
  const isCritical = currentStock <= 15;
  const isBelowGauge = currentStock < gaugeTarget;

  // Determine color scheme
  let colorClass = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let textLabel = 'Office Stock Healthy';

  if (currentStock === 0) {
    colorClass = 'bg-rose-600';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    textLabel = 'OUT OF STOCK';
  } else if (isCritical) {
    colorClass = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    textLabel = 'CRITICAL (<15)';
  } else if (isBelowGauge) {
    colorClass = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    textLabel = `BELOW ${gaugeTarget} GAUGE`;
  }

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 min-w-[120px]">
        <div className="flex items-center justify-between w-full text-[11px] font-mono">
          <span className={`font-bold tabular-nums ${isBelowGauge ? 'text-amber-700' : 'text-slate-800'}`}>
            {currentStock} in office
          </span>
          <span className="text-slate-400">/ {gaugeTarget} gauge</span>
        </div>

        {/* Gauge bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>

        {showText && isBelowGauge && (
          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${badgeColor}`}>
            {currentStock === 0 ? 'EMPTY' : `ALERT (<${gaugeTarget})`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {currentStock === 0 || isCritical ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
          ) : isBelowGauge ? (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span className="text-xs font-semibold text-slate-800">
            In-Office 50-Unit Gauge
          </span>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
          {textLabel}
        </span>
      </div>

      {/* Numerical display */}
      <div className="flex items-baseline justify-between font-mono">
        <div>
          <span className="text-2xl font-bold tabular-nums text-slate-900">
            {currentStock}
          </span>
          <span className="text-xs text-slate-500 ml-1">in office</span>
        </div>
        <div className="text-xs text-slate-500">
          Target Buffer: <strong>{gaugeTarget}</strong> units
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0 (Empty)</span>
          <span className="font-semibold text-slate-600">50 (Gauge Safe Target)</span>
          <span>100+</span>
        </div>
      </div>

      {isBelowGauge && (
        <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200 font-medium leading-tight">
          Stock in central office has dropped below the 50-unit threshold. Top-up recommended.
        </p>
      )}
    </div>
  );
};
