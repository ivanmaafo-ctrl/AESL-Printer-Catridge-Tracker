import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Package,
  Plus,
  Search,
  Truck,
  Trash2,
} from 'lucide-react';
import { GaugeIndicator } from './GaugeIndicator';

interface CentralInventoryViewProps {
  onOpenAddCartridge: () => void;
  onOpenRestock: (cartridgeId?: string) => void;
  onOpenDispatch: (cartridgeId?: string) => void;
  onOpenReports: () => void;
}

export const CentralInventoryView: React.FC<CentralInventoryViewProps> = ({
  onOpenAddCartridge,
  onOpenRestock,
  onOpenDispatch,
}) => {
  const { cartridges, deleteCartridge, getSentOutCountForCartridge } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [colorFilter, setColorFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'HEALTHY'>('ALL');
  const [confirmDeleteSkuId, setConfirmDeleteSkuId] = useState<string | null>(null);

  const brands = useMemo(() => {
    const list = Array.from(new Set(cartridges.map((c) => c.brand)));
    return ['ALL', ...list];
  }, [cartridges]);

  const colors = useMemo(() => {
    const list = Array.from(new Set(cartridges.map((c) => c.color)));
    return ['ALL', ...list];
  }, [cartridges]);

  const hasUnitCosts = useMemo(
    () => cartridges.some((c) => c.unitCost > 0),
    [cartridges]
  );

  const filteredCartridges = useMemo(() => {
    return cartridges.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.model.toLowerCase().includes(q) ||
        c.sku.toLowerCase().includes(q) ||
        c.compatiblePrinters.some((p) => p.toLowerCase().includes(q)) ||
        c.supplier.toLowerCase().includes(q);

      const matchesBrand = brandFilter === 'ALL' || c.brand === brandFilter;
      const matchesColor = colorFilter === 'ALL' || c.color === colorFilter;

      let matchesStock = true;
      if (stockStatusFilter === 'LOW') {
        matchesStock = c.centralStock < (c.minThreshold || 15);
      } else if (stockStatusFilter === 'HEALTHY') {
        matchesStock = c.centralStock >= (c.minThreshold || 15);
      }

      return matchesSearch && matchesBrand && matchesColor && matchesStock;
    });
  }, [cartridges, searchQuery, brandFilter, colorFilter, stockStatusFilter]);

  const totalUnitsInOffice = useMemo(
    () => cartridges.reduce((sum, c) => sum + c.centralStock, 0),
    [cartridges]
  );

  const belowGaugeCount = useMemo(
    () => cartridges.filter((c) => c.centralStock < (c.minThreshold || 15)).length,
    [cartridges]
  );

  const totalSentOut = useMemo(
    () => cartridges.reduce((sum, c) => sum + getSentOutCountForCartridge(c.id), 0),
    [cartridges, getSentOutCountForCartridge]
  );

  const handleDelete = (id: string) => {
    deleteCartridge(id);
    setConfirmDeleteSkuId(null);
  };

  return (
    <div className="space-y-7">
      {/* Clean Flat Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Toner Stock (Central Store)
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5">
            {cartridges.length} toner models tracked · {totalUnitsInOffice} units currently in office
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onOpenRestock()}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <span>Top Up Stock</span>
          </button>

          <button
            onClick={onOpenAddCartridge}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Toner</span>
          </button>
        </div>
      </header>

      {/* 3 Calm Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0D131F] rounded-2xl p-5 border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">In Office Now</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalUnitsInOffice}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">units on shelf</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D131F] rounded-2xl p-5 border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Low Stock</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-display font-bold tracking-tight tabular-nums ${
                belowGaugeCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-sky-400'
              }`}
            >
              {belowGaugeCount}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">of {cartridges.length} below target</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D131F] rounded-2xl p-5 border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sent to Branches</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalSentOut}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">units total</span>
          </div>
        </div>
      </div>

      {/* Simple Search & Filter Bar */}
      <div className="bg-white dark:bg-[#0D131F] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search toner code, model, or printer..."
              className="w-full min-h-[46px] pl-11 pr-4 py-2.5 text-base bg-slate-50 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-3 sm:inline-flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-sm font-semibold shrink-0">
            <button
              onClick={() => setStockStatusFilter('ALL')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                stockStatusFilter === 'ALL'
                  ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              All ({cartridges.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('LOW')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                stockStatusFilter === 'LOW'
                  ? 'bg-white dark:bg-amber-400 text-amber-900 dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockStatusFilter('HEALTHY')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                stockStatusFilter === 'HEALTHY'
                  ? 'bg-white dark:bg-sky-400 text-blue-900 dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
              }`}
            >
              In Stock
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Brand:</span>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-slate-100 border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b === 'ALL' ? 'All Brands' : b}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Color:</span>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-slate-100 border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
            >
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Colors' : c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Inventory Table & Mobile List */}
      <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-white/10">
          {filteredCartridges.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-600 dark:text-slate-300 text-sm">
              <Package className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-[#0B0F17] dark:text-white">No toners match your search.</p>
              <p className="mt-1">Try clearing the search box or switching to &ldquo;All&rdquo;.</p>
            </div>
          ) : (
            filteredCartridges.map((cart) => {
              const sentOutCount = getSentOutCountForCartridge(cart.id);

              return (
                <div key={cart.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-base text-[#0B0F17] dark:text-white">
                        {cart.model}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                        <span className="font-mono font-semibold">{cart.sku}</span> · {cart.brand} · {cart.color}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-bold font-mono tabular-nums text-[#0B0F17] dark:text-white block leading-tight">
                        {cart.centralStock}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">in office</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <GaugeIndicator
                        currentStock={cart.centralStock}
                        gaugeTarget={cart.minThreshold || 15}
                        compact={true}
                        showText={false}
                      />
                    </div>
                    <div className="text-right text-sm text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                      {sentOutCount} sent out
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                    <button
                      onClick={() => onOpenDispatch(cart.id)}
                      disabled={cart.centralStock === 0}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-[#0B0F17] dark:text-slate-100 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl disabled:opacity-40 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Send</span>
                    </button>

                    <button
                      onClick={() => onOpenRestock(cart.id)}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Top Up</span>
                    </button>

                    {confirmDeleteSkuId === cart.id ? (
                      <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/15 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-500/30">
                        <button
                          onClick={() => handleDelete(cart.id)}
                          className="min-h-[36px] px-3 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteSkuId(null)}
                          className="min-w-[32px] min-h-[36px] text-slate-600 dark:text-slate-300 text-sm cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteSkuId(cart.id)}
                        title="Delete toner"
                        aria-label={`Delete ${cart.sku}`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-5">Toner Model & Code</th>
                <th className="py-3.5 px-5 text-center">In Office</th>
                <th className="py-3.5 px-5">Stock Status</th>
                <th className="py-3.5 px-5 text-center">Sent Out</th>
                {hasUnitCosts && <th className="py-3.5 px-5 text-right">Unit Cost</th>}
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
              {filteredCartridges.length === 0 ? (
                <tr>
                  <td colSpan={hasUnitCosts ? 6 : 5} className="py-12 text-center text-slate-600 dark:text-slate-300">
                    <Package className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-[#0B0F17] dark:text-white">No toners match your search.</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Try clearing the search box or switching filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCartridges.map((cart) => {
                  const sentOutCount = getSentOutCountForCartridge(cart.id);

                  return (
                    <tr key={cart.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#0B0F17] dark:text-white text-base">
                            {cart.model}
                          </span>
                          {cart.isBestSeller && (
                            <span className="text-xs font-semibold text-blue-700 dark:text-sky-400">
                              · High Demand
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{cart.sku}</span>
                          {' · '}
                          {cart.brand} · {cart.color} · {cart.type}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <span className="text-lg font-bold font-mono tabular-nums text-[#0B0F17] dark:text-white">
                          {cart.centralStock}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <GaugeIndicator
                          currentStock={cart.centralStock}
                          gaugeTarget={cart.minThreshold || 15}
                          compact={true}
                          showText={false}
                        />
                      </td>

                      <td className="py-4 px-5 text-center font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                        {sentOutCount}
                      </td>

                      {hasUnitCosts && (
                        <td className="py-4 px-5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                          {cart.unitCost > 0 ? `$${cart.unitCost.toFixed(2)}` : '—'}
                        </td>
                      )}

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenDispatch(cart.id)}
                            disabled={cart.centralStock === 0}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl border border-slate-300 dark:border-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Send</span>
                          </button>

                          <button
                            onClick={() => onOpenRestock(cart.id)}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-xl transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Top Up</span>
                          </button>

                          {confirmDeleteSkuId === cart.id ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-500/15 px-2 py-1 rounded-xl border border-rose-200 dark:border-rose-500/30">
                              <button
                                onClick={() => handleDelete(cart.id)}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteSkuId(null)}
                                className="px-1.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteSkuId(cart.id)}
                              title="Delete toner"
                              aria-label={`Delete ${cart.sku}`}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
