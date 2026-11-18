import React, { useState } from 'react';
import { ActiveTab } from '../Navbar';
import {
  BookOpen,
  X,
  Activity,
  Package,
  Truck,
  Send,
  AlertTriangle,
  FileSpreadsheet,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { AESL_LOCATIONS } from '../../data/aeslLocations';
import { BrandLogo } from '../BrandLogo';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

interface GuideStep {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tab: ActiveTab;
  tabLabel: string;
  summary: string;
  steps: string[];
  tip: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: '1. Understanding the Dashboard',
    subtitle: `Your live snapshot of warehouse stock & ${AESL_LOCATIONS.length} AESL locations`,
    icon: Activity,
    tab: 'dashboard',
    tabLabel: 'Go to Overview',
    summary:
      'The Overview screen gives you an immediate health check of your IT central store and every office/branch across Ghana.',
    steps: [
      'Check the 4 top KPI cards: In Office (Warehouse), Sent Out to Branches, Total Used / Installed, and Replenish Alerts.',
      'Review Central Inventory Replenishment Priority to see which toners need urgent restocking first (like out-of-stock best sellers).',
      'Use the Branch Network table below to filter between HQ Offices (Anointed House) and Regional Branches.',
    ],
    tip: 'If you ever get lost, click "Overview" at the top of the left navigation bar to return to the main summary.',
  },
  {
    title: '2. Checking & Adding In-Office Stock',
    subtitle: 'Track toner models, drum units, and 15-unit safety gauges',
    icon: Package,
    tab: 'inventory',
    tabLabel: 'Open In-Office Stock',
    summary:
      'In-Office Stock lists every cartridge SKU currently tracked in the central warehouse along with its remaining quantity.',
    steps: [
      'Use the search bar or Brand / Color / Low Stock filters to find a specific toner (e.g. 1107A, CF217A, 283X, H-CF219A).',
      'Watch the 15-Unit Gauge bar: Red means Critical (≤5 or 0 left), Amber means Below 15, and Blue means Healthy.',
      'Click "Top Up" when new cartridges arrive from a supplier, or "+ Add New SKU" to register a brand-new toner model.',
    ],
    tip: 'Your "Best Seller" label highlights high-demand SKUs like 1107A so they stand out immediately.',
  },
  {
    title: '3. Sending Toners to Branches',
    subtitle: 'How to dispatch stock without losing track',
    icon: Truck,
    tab: 'dispatches',
    tabLabel: 'View Sent to Branches',
    summary:
      'Whenever an office or regional branch requests a toner, always use Dispatch to Branch so inventory deducts automatically.',
    steps: [
      'Click "Dispatch to Branch" in the left Task Operations panel (available from any screen).',
      'Select the destination office/branch, pick the toner SKU, enter the quantity, and add carrier/tracking details.',
      'The shipment starts as "In Transit". Once the branch confirms they received it, open "Sent to Branches" and mark it Delivered.',
    ],
    tip: 'You cannot dispatch more units than you currently have in the central office—if stock is 0, Top Up first.',
  },
  {
    title: '4. Logging Cartridge Installations',
    subtitle: 'Record when a spare toner is actually put into a printer',
    icon: Send,
    tab: 'usage',
    tabLabel: 'Open Usage Log',
    summary:
      'Tracking dispatches tells you what left the warehouse; logging a swap tells you when a branch actually installed it into a printer.',
    steps: [
      'Click "Log Swap" in the left Task Operations panel (or "Log Branch Usage" on the Overview screen).',
      'Pick the Branch/Office, select the Cartridge SKU and Printer, and choose the reason (e.g. Depleted or Routine Scheduled Swap).',
      'The branch\'s On-Site Reserve updates automatically so you know whether they still have spare toners left.',
    ],
    tip: 'Accurate usage logs make it easy to see which branches consume the most toners over time.',
  },
  {
    title: '5. Handling Low-Stock Alerts & Reorders',
    subtitle: 'Automated restock warnings & purchase order export',
    icon: AlertTriangle,
    tab: 'reorder',
    tabLabel: 'Open 15-Gauge Alerts',
    summary:
      'Any SKU with fewer than 15 units in the central office triggers a replenishment alert automatically.',
    steps: [
      'Open "15-Gauge Alerts" in the left sidebar to see all low and out-of-stock SKUs sorted by urgency.',
      'Adjust the Suggested Order quantities for each SKU based on your budget or supplier pack size.',
      'Click "Export Purchase Order CSV" to send the order list to procurement, or "Receive All Into Warehouse" once stock arrives.',
    ],
    tip: 'Out-of-stock best sellers appear at the very top of the reorder table so they are never missed.',
  },
  {
    title: '6. Generating Custom Reports',
    subtitle: 'Filter what to include or exclude, then export or print',
    icon: FileSpreadsheet,
    tab: 'reports',
    tabLabel: 'Open Report Builder',
    summary:
      'Create clean management or procurement reports showing toner types, quantities left, restock needs, and branch allocations.',
    steps: [
      'Click "Generate Report" in the left Task Operations panel or the "Report" button on Overview / In-Office Stock.',
      'Use Filters 1–3 to include or exclude SKUs by restock status, toner type, brand, or individual checkboxes.',
      'Use Filter 4 to choose which details/columns appear, then click "Export CSV / Excel", "Copy Text", or "Print / Save PDF".',
    ],
    tip: 'Use the "Restock Needed Only" quick button when you only want to share items that need purchasing.',
  },
  {
    title: '7. Master Admin Portal & Backups',
    subtitle: 'Role-based security, direct edits, and JSON backups',
    icon: Shield,
    tab: 'admin',
    tabLabel: 'Open Master Admin',
    summary:
      'The Master Admin Portal protects sensitive system controls behind a two-tier username and password login.',
    steps: [
      'Admins can adjust exact warehouse quantities, update 15-unit gauge thresholds, manage branch details, and export/import JSON backups.',
      'Super Admins also control user accounts, password resets, and system-wide data resets.',
      'Important: Changes are saved in your browser. Use "Data Export / Import Hub" to save a backup file or share your live snapshot with colleagues.',
    ],
    tip: 'Always sign out using the logout icon at the bottom-left of the sidebar when leaving a shared computer.',
  },
];

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const current = GUIDE_STEPS[stepIndex];
  const Icon = current.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === GUIDE_STEPS.length - 1;

  const handleJump = () => {
    onNavigateTab(current.tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150 print:hidden">
      <div className="bg-white dark:bg-[#0D1420] rounded-3xl border border-slate-200 dark:border-white/15 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-hero border-b border-blue-900/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo className="w-10 h-10" />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Beginner Walkthrough Guide
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Step {stepIndex + 1} of {GUIDE_STEPS.length} · Anointed Engineering Services Ltd
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Close walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Strip */}
        <div className="px-6 py-3 bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto">
          {GUIDE_STEPS.map((step, idx) => (
            <button
              key={step.title}
              onClick={() => setStepIndex(idx)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                idx === stepIndex
                  ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] shadow-xs'
                  : idx < stepIndex
                  ? 'bg-[#E8F1FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-500/30'
                  : 'bg-white dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {idx + 1}. {step.tab === 'dashboard' ? 'Overview' : step.tab === 'inventory' ? 'Stock' : step.tab === 'dispatches' ? 'Dispatch' : step.tab === 'usage' ? 'Usage' : step.tab === 'reorder' ? 'Alerts' : step.tab === 'reports' ? 'Reports' : 'Admin'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F1FF] dark:bg-blue-500/15 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0 border border-blue-200/70 dark:border-blue-500/30">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {current.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {current.subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={handleJump}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-sky-300 bg-[#E8F1FF] dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 border border-blue-200 dark:border-blue-500/30 rounded-full transition shrink-0 cursor-pointer"
            >
              <span>{current.tabLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-[#F6F8FC] dark:bg-white/[0.04] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10">
            {current.summary}
          </p>

          <div>
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              How It Works
            </h4>
            <ul className="space-y-2.5">
              {current.steps.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-bold text-amber-950 dark:text-amber-100">Quick Tip: </span>
            {current.tip}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-[#F6F8FC] dark:bg-white/[0.03] border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <button
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirst}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {isLast ? (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white dark:text-[#06090F] bg-blue-600 dark:bg-sky-400 hover:bg-blue-700 dark:hover:bg-sky-300 rounded-full transition cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish Walkthrough</span>
              </button>
            ) : (
              <button
                onClick={() => setStepIndex((prev) => Math.min(GUIDE_STEPS.length - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition cursor-pointer shadow-xs"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
