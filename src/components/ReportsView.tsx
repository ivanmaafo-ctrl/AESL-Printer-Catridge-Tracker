import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { CartridgeSKU, CartridgeType } from '../types/inventory';
import {
  Printer,
  Download,
  Filter,
  Check,
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  SlidersHorizontal,
  Building2,
} from 'lucide-react';

type RestockFilter = 'ALL' | 'NEEDS_RESTOCK' | 'OUT_OF_STOCK' | 'CRITICAL' | 'HEALTHY';
type SortOption = 'STOCK_ASC' | 'DEFICIT_DESC' | 'SKU_ASC' | 'STOCK_DESC';

interface ReportColumns {
  typeAndColor: boolean;
  quantityLeft: boolean;
  restockStatus: boolean;
  suggestedOrder: boolean;
  sentOut: boolean;
  compatiblePrinters: boolean;
  supplierAndCost: boolean;
  notesAndSpecs: boolean;
}

const DEFAULT_COLUMNS: ReportColumns = {
  typeAndColor: true,
  quantityLeft: true,
  restockStatus: true,
  suggestedOrder: true,
  sentOut: true,
  compatiblePrinters: true,
  supplierAndCost: false,
  notesAndSpecs: true,
};

const getRestockMeta = (cart: CartridgeSKU) => {
  const threshold = cart.minThreshold !== undefined ? cart.minThreshold : 15;
  const stock = cart.centralStock;
  const deficit = Math.max(0, threshold - stock);
  const pack = cart.reorderPackSize || 1;
  const suggestedOrder = deficit > 0 ? Math.max(pack, Math.ceil(deficit / pack) * pack) : 0;
  const criticalCutoff = Math.max(1, Math.floor(threshold / 3));

  if (stock === 0) {
    return {
      needsRestock: true,
      severity: 'OUT_OF_STOCK' as const,
      label: 'YES — OUT OF STOCK',
      shortLabel: 'Out of Stock',
      deficit,
      suggestedOrder,
      threshold,
    };
  }
  if (stock <= criticalCutoff) {
    return {
      needsRestock: true,
      severity: 'CRITICAL' as const,
      label: 'YES — CRITICAL',
      shortLabel: 'Critical',
      deficit,
      suggestedOrder,
      threshold,
    };
  }
  if (stock < threshold) {
    return {
      needsRestock: true,
      severity: 'LOW' as const,
      label: 'YES — BELOW GAUGE',
      shortLabel: 'Low Stock',
      deficit,
      suggestedOrder,
      threshold,
    };
  }
  return {
    needsRestock: false,
    severity: 'HEALTHY' as const,
    label: 'NO — ADEQUATE',
    shortLabel: 'Healthy',
    deficit: 0,
    suggestedOrder: 0,
    threshold,
  };
};

const escapeCsv = (val: string | number) => {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const ReportsView: React.FC = () => {
  const { cartridges, branches, getSentOutCountForCartridge, getBranchStockDetails } = useInventory();
  const { currentUser } = useAdminAuth();

  const [reportTitle, setReportTitle] = useState('AESL Printer Toner & Warehouse Inventory Report');
  const [preparedBy, setPreparedBy] = useState(currentUser?.displayName || 'IT Department');

  const [restockFilter, setRestockFilter] = useState<RestockFilter>('ALL');
  const [excludedTypes, setExcludedTypes] = useState<string[]>([]);
  const [excludedBrands, setExcludedBrands] = useState<string[]>([]);
  const [excludedSkuIds, setExcludedSkuIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('STOCK_ASC');

  const [columns, setColumns] = useState<ReportColumns>(DEFAULT_COLUMNS);
  const [includeBranchSummary, setIncludeBranchSummary] = useState(false);
  const [onlyActiveBranches, setOnlyActiveBranches] = useState(true);

  const [copiedToast, setCopiedToast] = useState(false);

  const availableTypes = useMemo<CartridgeType[]>(() => {
    return Array.from(new Set(cartridges.map((c) => c.type)));
  }, [cartridges]);

  const availableBrands = useMemo<string[]>(() => {
    return Array.from(new Set(cartridges.map((c) => c.brand)));
  }, [cartridges]);

  const toggleType = (type: string) => {
    setExcludedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBrand = (brand: string) => {
    setExcludedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleSkuInclusion = (id: string) => {
    setExcludedSkuIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleColumn = (key: keyof ReportColumns) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetAllFilters = () => {
    setRestockFilter('ALL');
    setExcludedTypes([]);
    setExcludedBrands([]);
    setExcludedSkuIds([]);
    setSortBy('STOCK_ASC');
    setColumns(DEFAULT_COLUMNS);
    setIncludeBranchSummary(false);
  };

  const includeOnlyLowStockSkus = () => {
    setRestockFilter('NEEDS_RESTOCK');
    setExcludedSkuIds([]);
  };

  const filteredRows = useMemo(() => {
    const rows = cartridges
      .filter((c) => {
        if (excludedSkuIds.includes(c.id)) return false;
        if (excludedTypes.includes(c.type)) return false;
        if (excludedBrands.includes(c.brand)) return false;

        const meta = getRestockMeta(c);
        if (restockFilter === 'NEEDS_RESTOCK') return meta.needsRestock;
        if (restockFilter === 'OUT_OF_STOCK') return c.centralStock === 0;
        if (restockFilter === 'CRITICAL') return c.centralStock <= Math.max(1, Math.floor((c.minThreshold || 15) / 3));
        if (restockFilter === 'HEALTHY') return !meta.needsRestock;
        return true;
      })
      .map((cart) => ({
        cart,
        meta: getRestockMeta(cart),
        sentOut: getSentOutCountForCartridge(cart.id),
      }));

    rows.sort((a, b) => {
      if (sortBy === 'STOCK_ASC') {
        if (a.cart.centralStock !== b.cart.centralStock) {
          return a.cart.centralStock - b.cart.centralStock;
        }
        return (b.cart.isBestSeller ? 1 : 0) - (a.cart.isBestSeller ? 1 : 0);
      }
      if (sortBy === 'STOCK_DESC') {
        return b.cart.centralStock - a.cart.centralStock;
      }
      if (sortBy === 'DEFICIT_DESC') {
        return b.meta.deficit - a.meta.deficit;
      }
      return a.cart.sku.localeCompare(b.cart.sku);
    });

    return rows;
  }, [cartridges, excludedSkuIds, excludedTypes, excludedBrands, restockFilter, sortBy, getSentOutCountForCartridge]);

  const summaryStats = useMemo(() => {
    const totalUnitsLeft = filteredRows.reduce((s, r) => s + r.cart.centralStock, 0);
    const needingRestockCount = filteredRows.filter((r) => r.meta.needsRestock).length;
    const outOfStockCount = filteredRows.filter((r) => r.cart.centralStock === 0).length;
    const totalSuggestedOrder = filteredRows.reduce((s, r) => s + r.meta.suggestedOrder, 0);
    const totalSentOut = filteredRows.reduce((s, r) => s + r.sentOut, 0);
    return {
      totalSkus: filteredRows.length,
      totalUnitsLeft,
      needingRestockCount,
      outOfStockCount,
      totalSuggestedOrder,
      totalSentOut,
    };
  }, [filteredRows]);

  const branchSummaryRows = useMemo(() => {
    if (!includeBranchSummary) return [];
    return branches
      .map((branch) => {
        const items = getBranchStockDetails(branch.id);
        const received = items.reduce((s, i) => s + i.totalReceived, 0);
        const transit = items.reduce((s, i) => s + i.inTransitCount, 0);
        const used = items.reduce((s, i) => s + i.totalUsed, 0);
        const onHand = items.reduce((s, i) => s + i.onHandCount, 0);
        return { branch, received, transit, used, onHand };
      })
      .filter((row) => !onlyActiveBranches || row.received > 0 || row.transit > 0 || row.used > 0);
  }, [includeBranchSummary, onlyActiveBranches, branches, getBranchStockDetails]);

  const activeDateStr = useMemo(() => {
    return new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleExportCSV = () => {
    const headers: string[] = ['SKU', 'Toner / Cartridge Model', 'Brand'];
    if (columns.typeAndColor) headers.push('Type', 'Color');
    if (columns.quantityLeft) headers.push('Quantity Left (In Office)');
    if (columns.restockStatus) headers.push('Min Gauge Threshold', 'Need of Restock', 'Shortfall / Deficit');
    if (columns.suggestedOrder) headers.push('Suggested Reorder Qty');
    if (columns.sentOut) headers.push('Sent Out to Branches');
    if (columns.compatiblePrinters) headers.push('Compatible Printers');
    if (columns.supplierAndCost) headers.push('Supplier', 'Unit Cost ($)', 'Est. Reorder Cost ($)');
    if (columns.notesAndSpecs) headers.push('Specification / Notes');

    const csvRows = filteredRows.map(({ cart, meta, sentOut }) => {
      const row: Array<string | number> = [
        cart.sku,
        cart.isBestSeller ? `${cart.model} (Best Seller)` : cart.model,
        cart.brand,
      ];
      if (columns.typeAndColor) row.push(cart.type, cart.color);
      if (columns.quantityLeft) row.push(cart.centralStock);
      if (columns.restockStatus) row.push(meta.threshold, meta.label, meta.deficit);
      if (columns.suggestedOrder) row.push(meta.suggestedOrder);
      if (columns.sentOut) row.push(sentOut);
      if (columns.compatiblePrinters) row.push(cart.compatiblePrinters.join(' | '));
      if (columns.supplierAndCost) {
        row.push(
          cart.supplier || '',
          cart.unitCost > 0 ? cart.unitCost.toFixed(2) : 'Unset',
          cart.unitCost > 0 ? (meta.suggestedOrder * cart.unitCost).toFixed(2) : 'Unset'
        );
      }
      if (columns.notesAndSpecs) row.push([cart.specification, cart.notes].filter(Boolean).join(' — '));
      return row.map(escapeCsv).join(',');
    });

    const lines = [
      escapeCsv(reportTitle),
      `Company,Anointed Engineering Services Limited (IT Department)`,
      `Generated,${escapeCsv(activeDateStr)}`,
      `Prepared By,${escapeCsv(preparedBy)}`,
      `Included SKUs,${summaryStats.totalSkus} of ${cartridges.length}`,
      `Total Units Left in Office,${summaryStats.totalUnitsLeft}`,
      `SKUs Needing Restock,${summaryStats.needingRestockCount}`,
      '',
      headers.map(escapeCsv).join(','),
      ...csvRows,
    ];

    if (includeBranchSummary && branchSummaryRows.length > 0) {
      lines.push('', 'BRANCH ALLOCATION SUMMARY', 'Code,Branch / Office,Delivered,In Transit,Used,On-Site Reserve');
      branchSummaryRows.forEach((b) => {
        lines.push(
          [b.branch.code, b.branch.name, b.received, b.transit, b.used, b.onHand]
            .map(escapeCsv)
            .join(',')
        );
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `AESL_Toner_Report_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const lines = [
      `${reportTitle}`,
      `Generated: ${activeDateStr} | Prepared by: ${preparedBy}`,
      `Summary: ${summaryStats.totalSkus} SKUs | ${summaryStats.totalUnitsLeft} units left | ${summaryStats.needingRestockCount} need restock (${summaryStats.outOfStockCount} out of stock)`,
      '',
      ...filteredRows.map(({ cart, meta }) => {
        const tag = cart.isBestSeller ? ' [BEST SELLER]' : '';
        const typeStr = columns.typeAndColor ? ` (${cart.type})` : '';
        const qtyStr = columns.quantityLeft ? ` — Left: ${cart.centralStock}` : '';
        const restockStr = columns.restockStatus
          ? ` | Restock: ${meta.shortLabel}${meta.suggestedOrder > 0 ? ` (Suggest +${meta.suggestedOrder})` : ''}`
          : '';
        return `• ${cart.sku}${tag}${typeStr}${qtyStr}${restockStr}`;
      }),
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const excludedCount = cartridges.length - filteredRows.length;

  return (
    <div className="space-y-6">
      {/* Modern Blue / Moving Dark Gradient Header (Hidden when printing) */}
      <section className="no-print bg-blue-hero rounded-3xl p-6 sm:p-8 border border-blue-200/70 dark:border-blue-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-[#0B0F17] dark:text-white">Custom Report Builder</span>
            <span aria-hidden="true">·</span>
            <span>Include / Exclude Filters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1.5">
            Toner Inventory & Restock Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Filter which toners and details to include or exclude, then export to Excel (CSV) or print as PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleCopySummary}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            {copiedToast ? (
              <>
                <Check className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span className="text-blue-700 dark:text-sky-300">Copied Summary</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </section>

      {/* Filter & Column Controls Panel (Hidden when printing) */}
      <div className="no-print bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-[#0B0F17] dark:text-white">
              Report Filters — Choose What to Include or Exclude
            </h2>
            {excludedCount > 0 && (
              <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                · {excludedCount} excluded
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={includeOnlyLowStockSkus}
              className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 border border-amber-200 dark:border-amber-500/30 px-3 py-1 rounded-full transition-colors cursor-pointer"
            >
              Restock Needed Only
            </button>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white px-3 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                1. Filter by Restock Need
              </label>
              <select
                value={restockFilter}
                onChange={(e) => setRestockFilter(e.target.value as RestockFilter)}
                className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              >
                <option value="ALL">All Toners & Cartridges ({cartridges.length})</option>
                <option value="NEEDS_RESTOCK">Only Items Needing Restock (&lt; Gauge)</option>
                <option value="OUT_OF_STOCK">Out of Stock Only (0 Left)</option>
                <option value="CRITICAL">Critical Only (≤5 Units Left)</option>
                <option value="HEALTHY">Adequate Stock Only (Exclude Restock Needed)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                2. Sort Report Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              >
                <option value="STOCK_ASC">Lowest Quantity Left First (Urgent Top)</option>
                <option value="DEFICIT_DESC">Largest Restock Deficit First</option>
                <option value="STOCK_DESC">Highest Quantity Left First</option>
                <option value="SKU_ASC">SKU Code (A → Z)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Include Types
                </span>
                <div className="space-y-1.5">
                  {availableTypes.map((type) => {
                    const included = !excludedTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => toggleType(type)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={included ? 'font-medium' : 'line-through text-slate-400 dark:text-slate-600'}>
                          {type}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Include Brands
                </span>
                <div className="space-y-1.5">
                  {availableBrands.map((brand) => {
                    const included = !excludedBrands.includes(brand);
                    return (
                      <label
                        key={brand}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => toggleBrand(brand)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={included ? 'font-medium' : 'line-through text-slate-400 dark:text-slate-600'}>
                          {brand}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Report Heading
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Middle Column: Individual SKU Include / Exclude Checklist */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Include / Exclude Specific SKUs
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  onClick={() => setExcludedSkuIds([])}
                  className="text-blue-700 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  All
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  onClick={() => setExcludedSkuIds(cartridges.map((c) => c.id))}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:underline font-medium cursor-pointer"
                >
                  None
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5 bg-slate-50/40 dark:bg-white/[0.02]">
              {cartridges.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">No SKUs in inventory</div>
              ) : (
                cartridges.map((cart) => {
                  const isIncluded = !excludedSkuIds.includes(cart.id);
                  return (
                    <label
                      key={cart.id}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isIncluded
                          ? 'bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                          : 'bg-slate-100/70 dark:bg-white/[0.01] text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => toggleSkuInclusion(cart.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className={`font-mono font-bold block truncate ${isIncluded ? 'text-[#0B0F17] dark:text-white' : 'line-through text-slate-400 dark:text-slate-600'}`}>
                            {cart.sku}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {cart.type} · {cart.color}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-bold shrink-0 ml-2 ${
                          cart.centralStock === 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : cart.centralStock <= Math.max(1, Math.floor((cart.minThreshold || 15) / 3))
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cart.centralStock} left
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Report Fields */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              4. Details to Include in Report
            </span>

            <div className="space-y-2">
              {(
                [
                  ['typeAndColor', 'Type of Toner & Color'],
                  ['quantityLeft', 'Quantity Left (In Office)'],
                  ['restockStatus', 'Need of Restock & Deficit'],
                  ['suggestedOrder', 'Suggested Order Quantity'],
                  ['sentOut', 'Sent Out to Branches'],
                  ['compatiblePrinters', 'Compatible Printers'],
                  ['supplierAndCost', 'Supplier & Unit Cost'],
                  ['notesAndSpecs', 'Specifications & Notes'],
                ] as Array<[keyof ReportColumns, string]>
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/5 text-xs cursor-pointer select-none"
                >
                  <span className={columns[key] ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}>
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={columns[key]}
                    onChange={() => toggleColumn(key)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>Include Branch Allocation Summary</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeBranchSummary}
                  onChange={(e) => setIncludeBranchSummary(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
              </label>

              {includeBranchSummary && (
                <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 pl-5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyActiveBranches}
                    onChange={(e) => setOnlyActiveBranches(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Exclude branches with zero dispatch/usage activity</span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Printable Report Sheet */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden print:border-0 print:bg-white print:text-slate-900">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.03] print:bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400 print:text-blue-800">
                <span>Anointed Engineering Services Limited</span>
                <span aria-hidden="true">·</span>
                <span>IT Department</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-white print:text-slate-900 mt-1">
                {reportTitle || 'Printer Toner & Warehouse Inventory Report'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
                Showing <strong>{summaryStats.totalSkus}</strong> of {cartridges.length} total SKUs
                {restockFilter !== 'ALL' && (
                  <> · Filter: <span className="font-semibold text-slate-700 dark:text-slate-200">{restockFilter.replace(/_/g, ' ')}</span></>
                )}
              </p>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-700 sm:text-right font-mono space-y-0.5">
              <div>Generated: <strong className="text-[#0B0F17] dark:text-white print:text-slate-900">{activeDateStr}</strong></div>
              <div>Prepared By: <strong className="text-[#0B0F17] dark:text-white print:text-slate-900">{preparedBy || 'IT Department'}</strong></div>
              <div>Gauge Standard: <strong className="text-[#0B0F17] dark:text-white print:text-slate-900">15 units / SKU</strong></div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Included SKUs</span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#0B0F17] dark:text-white print:text-slate-900">
                {summaryStats.totalSkus}
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Qty Left (In Office)</span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#0B0F17] dark:text-white print:text-slate-900">
                {summaryStats.totalUnitsLeft} <span className="text-xs font-normal text-slate-500">units</span>
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Need Restock</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${summaryStats.needingRestockCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-sky-400'}`}>
                {summaryStats.needingRestockCount} <span className="text-xs font-normal text-slate-500">SKUs</span>
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Out of Stock (0)</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${summaryStats.outOfStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {summaryStats.outOfStockCount} <span className="text-xs font-normal text-slate-500">SKUs</span>
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Suggested Order</span>
              <span className="text-lg font-bold font-mono tabular-nums text-blue-700 dark:text-sky-400">
                +{summaryStats.totalSuggestedOrder} <span className="text-xs font-normal text-slate-500">units</span>
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No items match your active report filters.</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Adjust the restock filter, type/brand toggles, or re-enable excluded SKUs above.
              </p>
              <button
                onClick={resetAllFilters}
                className="no-print px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 uppercase font-semibold print:bg-slate-50 print:text-slate-700">
                <tr>
                  <th className="py-3 px-4">SKU & Toner Model</th>
                  {columns.typeAndColor && <th className="py-3 px-4">Type & Color</th>}
                  {columns.quantityLeft && <th className="py-3 px-4 text-center">Quantity Left</th>}
                  {columns.restockStatus && <th className="py-3 px-4">Need of Restock</th>}
                  {columns.suggestedOrder && <th className="py-3 px-4 text-center">Suggested Reorder</th>}
                  {columns.sentOut && <th className="py-3 px-4 text-center">Sent Out</th>}
                  {columns.compatiblePrinters && <th className="py-3 px-4">Compatible Printers</th>}
                  {columns.supplierAndCost && <th className="py-3 px-4 text-right">Supplier & Cost</th>}
                  {columns.notesAndSpecs && <th className="py-3 px-4">Important Details / Notes</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 print:divide-slate-200">
                {filteredRows.map(({ cart, meta, sentOut }) => (
                  <tr key={cart.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] align-top">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[#0B0F17] dark:text-white print:text-slate-900 text-xs">{cart.sku}</span>
                        {cart.isBestSeller && (
                          <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-400">
                            · Best Seller
                          </span>
                        )}
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 print:text-slate-800 font-medium block mt-0.5">{cart.model}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {cart.brand} · {cart.pageYield ? `${cart.pageYield.toLocaleString()} pgs` : 'Std Yield'}
                      </span>
                    </td>

                    {columns.typeAndColor && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-slate-800 block">{cart.type}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{cart.color}</span>
                      </td>
                    )}

                    {columns.quantityLeft && (
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-sm font-bold font-mono tabular-nums ${
                            cart.centralStock === 0
                              ? 'text-rose-700 dark:text-rose-400'
                              : cart.centralStock <= Math.max(1, Math.floor((cart.minThreshold || 15) / 3))
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-[#0B0F17] dark:text-white print:text-slate-900'
                          }`}
                        >
                          {cart.centralStock}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          / {meta.threshold} min
                        </span>
                      </td>
                    )}

                    {columns.restockStatus && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {meta.severity === 'OUT_OF_STOCK' ? (
                          <div className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-mono font-bold text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>YES · OUT OF STOCK</span>
                          </div>
                        ) : meta.severity === 'CRITICAL' ? (
                          <div className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-mono font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>YES · CRITICAL</span>
                          </div>
                        ) : meta.severity === 'LOW' ? (
                          <div className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 font-mono font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>YES · BELOW GAUGE</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-blue-700 dark:text-sky-400 font-mono font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>NO · ADEQUATE</span>
                          </div>
                        )}
                        {meta.deficit > 0 && (
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Shortfall: -{meta.deficit} units
                          </span>
                        )}
                      </td>
                    )}

                    {columns.suggestedOrder && (
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums whitespace-nowrap">
                        {meta.suggestedOrder > 0 ? (
                          <div>
                            <span className="font-bold text-blue-700 dark:text-sky-400 text-xs">
                              +{meta.suggestedOrder} units
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                              Pack of {cart.reorderPackSize || 1}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                    )}

                    {columns.sentOut && (
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {sentOut} units
                      </td>
                    )}

                    {columns.compatiblePrinters && (
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {cart.compatiblePrinters.length > 0 ? (
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed block">
                            {cart.compatiblePrinters.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                    )}

                    {columns.supplierAndCost && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-slate-800 dark:text-slate-200 font-medium block">{cart.supplier || '—'}</span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {cart.unitCost > 0
                            ? `$${cart.unitCost.toFixed(2)} / unit`
                            : 'Unit price unset'}
                        </span>
                      </td>
                    )}

                    {columns.notesAndSpecs && (
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed block">
                          {[cart.specification, cart.notes].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {includeBranchSummary && (
          <div className="border-t border-slate-200 dark:border-white/10 p-6">
            <h3 className="text-sm font-bold text-[#0B0F17] dark:text-white print:text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700 dark:text-sky-400" />
              <span>Branch & Headquarters Allocation Summary</span>
            </h3>

            {branchSummaryRows.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No branch dispatch or usage records logged yet. Uncheck &ldquo;Exclude branches with zero activity&rdquo; above to list all {branches.length} AESL locations.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Location / Office</th>
                      <th className="py-2.5 px-4 text-right">Delivered</th>
                      <th className="py-2.5 px-4 text-right">In Transit</th>
                      <th className="py-2.5 px-4 text-right">Used</th>
                      <th className="py-2.5 px-4 text-right">On-Site Reserve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {branchSummaryRows.map((row) => (
                      <tr key={row.branch.id}>
                        <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">{row.branch.code}</td>
                        <td className="py-2.5 px-4 font-semibold text-[#0B0F17] dark:text-white">{row.branch.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.received}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.transit}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.used}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">{row.onHand}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
