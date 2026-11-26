import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { CartridgeSKU, CartridgeType } from '../types/inventory';
import { BrandLogo } from './BrandLogo';
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
  ChevronDown,
  ChevronUp,
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
  compatiblePrinters: false,
  supplierAndCost: false,
  notesAndSpecs: false,
};

const getRestockMeta = (cart: CartridgeSKU) => {
  const threshold = cart.minThreshold !== undefined ? cart.minThreshold : 15;
  const stock = cart.centralStock;
  const deficit = Math.max(0, threshold - stock);
  const pack = cart.reorderPackSize || 1;
  const suggestedOrder =
    deficit > 0
      ? cart.isBestSeller
        ? 40
        : Math.max(pack, Math.ceil(deficit / pack) * pack)
      : 0;
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
      shortLabel: 'Very Low',
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
    shortLabel: 'In Stock',
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  const filteredRows = useMemo(() => {
    const rows = cartridges
      .filter((c) => {
        if (excludedSkuIds.includes(c.id)) return false;
        if (excludedTypes.includes(c.type)) return false;
        if (excludedBrands.includes(c.brand)) return false;

        const meta = getRestockMeta(c);
        if (restockFilter === 'NEEDS_RESTOCK') return meta.needsRestock;
        if (restockFilter === 'OUT_OF_STOCK') return c.centralStock === 0;
        if (restockFilter === 'CRITICAL')
          return c.centralStock <= Math.max(1, Math.floor((c.minThreshold || 15) / 3));
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
  }, [
    cartridges,
    excludedSkuIds,
    excludedTypes,
    excludedBrands,
    restockFilter,
    sortBy,
    getSentOutCountForCartridge,
  ]);

  const summaryStats = useMemo(() => {
    const totalUnitsLeft = filteredRows.reduce((s, r) => s + r.cart.centralStock, 0);
    const needingRestockCount = filteredRows.filter((r) => r.meta.needsRestock).length;
    const outOfStockCount = filteredRows.filter((r) => r.cart.centralStock === 0).length;
    const totalSuggestedOrder = filteredRows.reduce((s, r) => s + r.meta.suggestedOrder, 0);
    return {
      totalSkus: filteredRows.length,
      totalUnitsLeft,
      needingRestockCount,
      outOfStockCount,
      totalSuggestedOrder,
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
    <div className="space-y-7">
      {/* Clean Flat Header (Hidden when printing) */}
      <header className="no-print flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Inventory Reports
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Print a clean PDF sheet or download an Excel (CSV) copy of your current toner stock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopySummary}
            disabled={filteredRows.length === 0}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/15 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            {copiedToast ? (
              <>
                <Check className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span className="text-blue-700 dark:text-sky-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRows.length === 0}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/15 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span>Download Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={filteredRows.length === 0}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-xl transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </header>

      {/* Simple Quick Filter Bar + Collapsible Advanced Options */}
      <div className="no-print bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'ALL', label: `All Toners (${cartridges.length})` },
                { id: 'NEEDS_RESTOCK', label: 'Needs Restock' },
                { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
                { id: 'HEALTHY', label: 'In Stock' },
              ] as Array<{ id: RestockFilter; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setRestockFilter(opt.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  restockFilter === opt.id
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {excludedCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="min-h-[42px] inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>Customize Report</span>
              {showAdvancedFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters & Columns */}
        {showAdvancedFilters && (
          <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Title, Sort, Types, Brands */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
                >
                  <option value="STOCK_ASC">Lowest Stock First</option>
                  <option value="DEFICIT_DESC">Largest Shortage First</option>
                  <option value="STOCK_DESC">Highest Stock First</option>
                  <option value="SKU_ASC">Code (A to Z)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Report Heading
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-[#070B12] text-[#0B0F17] dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Types
                  </span>
                  <div className="space-y-2">
                    {availableTypes.map((type) => {
                      const included = !excludedTypes.includes(type);
                      return (
                        <label key={type} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={() => toggleType(type)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                          />
                          <span className={included ? '' : 'line-through text-slate-400'}>{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Brands
                  </span>
                  <div className="space-y-2">
                    {availableBrands.map((brand) => {
                      const included = !excludedBrands.includes(brand);
                      return (
                        <label key={brand} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={() => toggleBrand(brand)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                          />
                          <span className={included ? '' : 'line-through text-slate-400'}>{brand}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Individual SKU Checklist */}
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Include Specific Toners
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setExcludedSkuIds([])}
                    className="text-blue-700 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setExcludedSkuIds(cartridges.map((c) => c.id))}
                    className="text-slate-600 dark:text-slate-400 hover:underline font-medium cursor-pointer"
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-200/80 dark:divide-white/5 bg-white dark:bg-[#070B12]">
                {cartridges.map((cart) => {
                  const isIncluded = !excludedSkuIds.includes(cart.id);
                  return (
                    <label
                      key={cart.id}
                      className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => toggleSkuInclusion(cart.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 shrink-0"
                        />
                        <span className={`font-mono font-semibold truncate ${isIncluded ? 'text-[#0B0F17] dark:text-white' : 'line-through text-slate-400'}`}>
                          {cart.sku}
                        </span>
                      </div>
                      <span className="tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                        {cart.centralStock} left
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Columns to Show */}
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6 space-y-3">
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Columns to Include
              </span>

              <div className="space-y-2">
                {(
                  [
                    ['typeAndColor', 'Type & Color'],
                    ['quantityLeft', 'Quantity In Office'],
                    ['restockStatus', 'Restock Status'],
                    ['suggestedOrder', 'Suggested Order'],
                    ['sentOut', 'Sent to Branches'],
                    ['compatiblePrinters', 'Compatible Printers'],
                    ['supplierAndCost', 'Supplier & Price'],
                    ['notesAndSpecs', 'Notes & Specs'],
                  ] as Array<[keyof ReportColumns, string]>
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070B12] text-sm cursor-pointer"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={columns[key]}
                      onChange={() => toggleColumn(key)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2">
                <label className="flex items-center justify-between text-sm cursor-pointer">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Include Branch Summary
                  </span>
                  <input
                    type="checkbox"
                    checked={includeBranchSummary}
                    onChange={(e) => setIncludeBranchSummary(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                </label>

                {includeBranchSummary && (
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyActiveBranches}
                      onChange={(e) => setOnlyActiveBranches(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>Hide offices with zero activity</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Preview */}
      <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden print:border-0 print:bg-white print:text-slate-900">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] print:bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <BrandLogo className="w-11 h-11 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-blue-700 dark:text-sky-400 print:text-blue-800">
                  Anointed Engineering Services Limited · IT Department
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0B0F17] dark:text-white print:text-slate-900 mt-1">
                  {reportTitle || 'Printer Toner & Warehouse Inventory Report'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 print:text-slate-600 mt-1">
                  Showing <strong>{summaryStats.totalSkus}</strong> of {cartridges.length} toners
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 print:text-slate-700 sm:text-right tabular-nums space-y-0.5">
              <div>
                Date: <strong className="text-[#0B0F17] dark:text-white print:text-slate-900">{activeDateStr}</strong>
              </div>
              <div>
                Prepared By: <strong className="text-[#0B0F17] dark:text-white print:text-slate-900">{preparedBy || 'IT Department'}</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">In Office</span>
              <span className="text-xl font-display font-bold tabular-nums text-[#0B0F17] dark:text-white print:text-slate-900">
                {summaryStats.totalUnitsLeft} units
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Needs Restock</span>
              <span className={`text-xl font-display font-bold tabular-nums ${summaryStats.needingRestockCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-sky-400'}`}>
                {summaryStats.needingRestockCount} items
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Out of Stock</span>
              <span className={`text-xl font-display font-bold tabular-nums ${summaryStats.outOfStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {summaryStats.outOfStockCount} items
              </span>
            </div>
            <div className="bg-white dark:bg-[#070B12] print:bg-white p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Suggested Order</span>
              <span className="text-xl font-display font-bold tabular-nums text-blue-700 dark:text-sky-400">
                +{summaryStats.totalSuggestedOrder} units
              </span>
            </div>
          </div>
        </div>

        <div>
          {filteredRows.length === 0 ? (
            <div className="p-10 text-center text-slate-600 dark:text-slate-300">
              <Filter className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-base font-bold text-[#0B0F17] dark:text-white">No toners match these filters.</p>
              <button
                onClick={resetAllFilters}
                className="no-print mt-4 min-h-[44px] px-5 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl cursor-pointer"
              >
                Show All Toners
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Preview Cards */}
              <div className="md:hidden print:hidden divide-y divide-slate-200 dark:divide-white/10">
                {filteredRows.map(({ cart, meta, sentOut }) => (
                  <div key={cart.id} className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-base text-[#0B0F17] dark:text-white block">
                          {cart.model}
                        </span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                          {cart.sku}
                          {columns.typeAndColor && ` · ${cart.brand} · ${cart.color}`}
                        </span>
                      </div>
                      {columns.quantityLeft && (
                        <div className="text-right shrink-0">
                          <span className="text-lg font-display font-bold tabular-nums text-[#0B0F17] dark:text-white block">
                            {cart.centralStock}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            / {meta.threshold} min
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                      {columns.restockStatus && (
                        <span
                          className={`font-bold ${
                            meta.severity === 'OUT_OF_STOCK' || meta.severity === 'CRITICAL'
                              ? 'text-rose-700 dark:text-rose-400'
                              : meta.severity === 'LOW'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-blue-700 dark:text-sky-400'
                          }`}
                        >
                          {meta.shortLabel}
                        </span>
                      )}
                      {columns.suggestedOrder && meta.suggestedOrder > 0 && (
                        <span className="font-semibold text-blue-700 dark:text-sky-400">
                          Order +{meta.suggestedOrder}
                        </span>
                      )}
                      {columns.sentOut && <span>Sent: {sentOut}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop & Print Table */}
              <div className="hidden md:block print:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold print:bg-slate-50 print:text-slate-700">
                    <tr>
                      <th className="py-3.5 px-5">Toner Model & Code</th>
                      {columns.typeAndColor && <th className="py-3.5 px-5">Type & Color</th>}
                      {columns.quantityLeft && <th className="py-3.5 px-5 text-center">In Office</th>}
                      {columns.restockStatus && <th className="py-3.5 px-5">Status</th>}
                      {columns.suggestedOrder && <th className="py-3.5 px-5 text-center">Order Qty</th>}
                      {columns.sentOut && <th className="py-3.5 px-5 text-center">Sent Out</th>}
                      {columns.compatiblePrinters && <th className="py-3.5 px-5">Printers</th>}
                      {columns.supplierAndCost && <th className="py-3.5 px-5 text-right">Supplier & Price</th>}
                      {columns.notesAndSpecs && <th className="py-3.5 px-5">Notes</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 print:divide-slate-200">
                    {filteredRows.map(({ cart, meta, sentOut }) => (
                      <tr key={cart.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                        <td className="py-4 px-5">
                          <span className="font-bold text-[#0B0F17] dark:text-white print:text-slate-900 block">
                            {cart.model}
                          </span>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 print:text-slate-600">
                            {cart.sku}
                          </span>
                        </td>

                        {columns.typeAndColor && (
                          <td className="py-4 px-5 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {cart.brand} · {cart.color}
                          </td>
                        )}

                        {columns.quantityLeft && (
                          <td className="py-4 px-5 text-center whitespace-nowrap">
                            <span
                              className={`text-base font-display font-bold tabular-nums ${
                                cart.centralStock === 0
                                  ? 'text-rose-700 dark:text-rose-400'
                                  : cart.centralStock <= Math.max(1, Math.floor((cart.minThreshold || 15) / 3))
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-[#0B0F17] dark:text-white print:text-slate-900'
                              }`}
                            >
                              {cart.centralStock}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                              / {meta.threshold}
                            </span>
                          </td>
                        )}

                        {columns.restockStatus && (
                          <td className="py-4 px-5 whitespace-nowrap">
                            {meta.severity === 'OUT_OF_STOCK' ? (
                              <div className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                                <ShieldAlert className="w-4 h-4" />
                                <span>Out of Stock</span>
                              </div>
                            ) : meta.severity === 'CRITICAL' ? (
                              <div className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Very Low</span>
                              </div>
                            ) : meta.severity === 'LOW' ? (
                              <div className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-semibold">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Low Stock</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-blue-700 dark:text-sky-400 font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>In Stock</span>
                              </div>
                            )}
                          </td>
                        )}

                        {columns.suggestedOrder && (
                          <td className="py-4 px-5 text-center font-mono tabular-nums whitespace-nowrap">
                            {meta.suggestedOrder > 0 ? (
                              <span className="font-bold text-blue-700 dark:text-sky-400">
                                +{meta.suggestedOrder}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        )}

                        {columns.sentOut && (
                          <td className="py-4 px-5 text-center font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {sentOut}
                          </td>
                        )}

                        {columns.compatiblePrinters && (
                          <td className="py-4 px-5 max-w-[220px] text-xs text-slate-600 dark:text-slate-300">
                            {cart.compatiblePrinters.join(', ') || '—'}
                          </td>
                        )}

                        {columns.supplierAndCost && (
                          <td className="py-4 px-5 text-right whitespace-nowrap text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {cart.supplier || '—'}
                            </span>
                            <span className="font-mono text-slate-500">
                              {cart.unitCost > 0 ? `$${cart.unitCost.toFixed(2)}` : 'Unset'}
                            </span>
                          </td>
                        )}

                        {columns.notesAndSpecs && (
                          <td className="py-4 px-5 max-w-[220px] text-xs text-slate-600 dark:text-slate-300">
                            {[cart.specification, cart.notes].filter(Boolean).join(' · ') || '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {includeBranchSummary && (
          <div className="border-t border-slate-200 dark:border-white/10 p-5 sm:p-6">
            <h3 className="text-base font-bold text-[#0B0F17] dark:text-white print:text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700 dark:text-sky-400" />
              <span>Branch Allocation Summary</span>
            </h3>

            {branchSummaryRows.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No branch activity logged yet. Uncheck &ldquo;Hide offices with zero activity&rdquo; in Customize Report to list all {branches.length} locations.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Office / Branch</th>
                      <th className="py-3 px-4 text-right">Delivered</th>
                      <th className="py-3 px-4 text-right">In Transit</th>
                      <th className="py-3 px-4 text-right">Used</th>
                      <th className="py-3 px-4 text-right">On Site</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                    {branchSummaryRows.map((row) => (
                      <tr key={row.branch.id}>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{row.branch.code}</td>
                        <td className="py-3 px-4 font-semibold text-[#0B0F17] dark:text-white">{row.branch.name}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{row.received}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{row.transit}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{row.used}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">{row.onHand}</td>
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
