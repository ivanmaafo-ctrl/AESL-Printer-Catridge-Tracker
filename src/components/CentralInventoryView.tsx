import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  Truck,
  Trash2,
  FileSpreadsheet,
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
  onOpenReports,
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

  const filteredCartridges = useMemo(() => {
    return cartridges.filter((c) => {
      const matchesSearch =
        c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.compatiblePrinters.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand = brandFilter === 'ALL' || c.brand === brandFilter;
      const matchesColor = colorFilter === 'ALL' || c.color === colorFilter;

      let matchesStock = true;
      if (stockStatusFilter === 'LOW') {
        matchesStock = c.centralStock <= c.minThreshold;
      } else if (stockStatusFilter === 'HEALTHY') {
        matchesStock = c.centralStock > c.minThreshold;
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
    <div className="space-y-6">
      {/* Modern Blue / Moving Dark Gradient Header */}
      <section className="bg-blue-hero rounded-3xl p-4 sm:p-8 border border-blue-200/70 dark:border-blue-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div>
          <div className="text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-[#0B0F17] dark:text-white">Central Store</span>
            <span aria-hidden="true">·</span>
            <span>{cartridges.length} Registered SKUs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1.5">
            Central Warehouse Stockroom
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Manage central supplies, monitor 15-unit safety gauges, and dispatch toner cartridges to branches.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 sm:flex-wrap shrink-0">
          <button
            onClick={onOpenReports}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <span>Report</span>
          </button>

          <button
            onClick={() => onOpenRestock()}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <span>Top Up</span>
          </button>

          <button
            onClick={onOpenAddCartridge}
            className="col-span-2 sm:col-span-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New SKU</span>
          </button>
        </div>
      </section>

      {/* Bento KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Office at the Moment</span>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalUnitsInOffice}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">units on shelf</span>
          </div>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Below Gauge</span>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums ${belowGaugeCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-sky-400'}`}>
              {belowGaugeCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">of {cartridges.length}</span>
          </div>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sent Out</span>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums text-[#0B0F17] dark:text-white">
              {totalSentOut}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">units</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model, SKU, printer, or supplier..."
              className="w-full pl-10 pr-3 py-2.5 text-base sm:text-sm bg-white dark:bg-[#0B111B] border border-slate-200 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Brand:</span>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-white dark:bg-[#0B111B] text-[#0B0F17] dark:text-slate-100 border border-slate-200 dark:border-white/15 rounded-xl focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Color:</span>
                <select
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                  className="w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-white dark:bg-[#0B111B] text-[#0B0F17] dark:text-slate-100 border border-slate-200 dark:border-white/15 rounded-xl focus:outline-none"
                >
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center bg-slate-200/70 dark:bg-white/5 p-0.5 rounded-full text-xs font-semibold">
              <button
                onClick={() => setStockStatusFilter('ALL')}
                className={`min-h-[36px] sm:min-h-0 px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'ALL'
                    ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                All ({cartridges.length})
              </button>
              <button
                onClick={() => setStockStatusFilter('LOW')}
                className={`min-h-[36px] sm:min-h-0 px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'LOW'
                    ? 'bg-white dark:bg-amber-400 text-amber-900 dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setStockStatusFilter('HEALTHY')}
                className={`min-h-[36px] sm:min-h-0 px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  stockStatusFilter === 'HEALTHY'
                    ? 'bg-white dark:bg-sky-400 text-blue-900 dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                Healthy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory List (Mobile Cards + Desktop Table) */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
          {filteredCartridges.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No cartridges match your filter.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try resetting the search terms or filters.</p>
            </div>
          ) : (
            filteredCartridges.map((cart) => {
              const sentOutCount = getSentOutCountForCartridge(cart.id);

              return (
                <div key={cart.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-[#0B0F17] dark:text-white">
                          {cart.model}
                        </span>
                        {cart.isBestSeller && (
                          <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-400">
                            · Best Seller
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {cart.sku} · {cart.brand} · {cart.color} · {cart.type}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono tabular-nums text-[#0B0F17] dark:text-white block leading-tight">
                        {cart.centralStock}
                      </span>
                      <span className="text-[10px] text-slate-400">in office</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex-1 min-w-0">
                      <GaugeIndicator
                        currentStock={cart.centralStock}
                        gaugeTarget={cart.minThreshold || 15}
                        compact={true}
                      />
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      <div>{sentOutCount} sent out</div>
                      {cart.unitCost > 0 && <div>${cart.unitCost.toFixed(2)}/ea</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => onOpenDispatch(cart.id)}
                      disabled={cart.centralStock === 0}
                      className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#F8FAFD] dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-full disabled:opacity-40 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch</span>
                    </button>

                    <button
                      onClick={() => onOpenRestock(cart.id)}
                      className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Top Up</span>
                    </button>

                    {confirmDeleteSkuId === cart.id ? (
                      <div className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-500/15 px-2 py-1 rounded-full border border-rose-200 dark:border-rose-500/30">
                        <button
                          onClick={() => handleDelete(cart.id)}
                          className="min-h-[34px] px-2.5 bg-rose-600 text-white rounded-full text-[11px] font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteSkuId(null)}
                          className="min-w-[30px] min-h-[34px] text-slate-500 dark:text-slate-300 text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteSkuId(cart.id)}
                        title="Delete SKU"
                        aria-label={`Delete ${cart.sku}`}
                        className="min-w-[42px] min-h-[42px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full border border-slate-200/70 dark:border-white/10 cursor-pointer"
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
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFD] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Cartridge SKU & Specification</th>
                <th className="py-3 px-4">Brand & Color</th>
                <th className="py-3 px-4 text-center">In Office at the Moment</th>
                <th className="py-3 px-4 text-center">15-Unit Gauge Status</th>
                <th className="py-3 px-4 text-center">Sent Out to Branches</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredCartridges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No cartridges match your filter.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try resetting the search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCartridges.map((cart) => {
                  const sentOutCount = getSentOutCountForCartridge(cart.id);

                  return (
                    <tr key={cart.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#0B0F17] dark:text-white text-xs sm:text-sm">
                              {cart.model}
                            </span>
                            {cart.isBestSeller && (
                              <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-400">
                                · Best Seller
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {cart.sku} {cart.specification ? `· ${cart.specification}` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{cart.brand}</span>
                          <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                          <span>{cart.color}</span>
                          <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{cart.type}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold font-mono tabular-nums text-[#0B0F17] dark:text-white">
                            {cart.centralStock} units
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">In Central Store</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <GaugeIndicator
                          currentStock={cart.centralStock}
                          gaugeTarget={cart.minThreshold || 15}
                          compact={true}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200 text-xs">
                        {sentOutCount} units sent
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {cart.unitCost > 0 ? `$${cart.unitCost.toFixed(2)}` : <span className="text-slate-400 dark:text-slate-600">—</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDispatch(cart.id)}
                            disabled={cart.centralStock === 0}
                            title="Dispatch to branch"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0B0F17] dark:hover:text-sky-300 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-full border border-slate-200 dark:border-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>

                          <button
                            onClick={() => onOpenRestock(cart.id)}
                            title="Top up stock"
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Top Up</span>
                          </button>

                          {confirmDeleteSkuId === cart.id ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-500/15 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                              <button
                                onClick={() => handleDelete(cart.id)}
                                className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteSkuId(null)}
                                className="px-1 py-0.5 text-slate-500 dark:text-slate-300 hover:text-slate-700 text-[10px] cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteSkuId(cart.id)}
                              title="Delete SKU"
                              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
