import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Truck,
  Edit2,
  Trash2,
  Check,
  ShieldAlert,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { CartridgeSKU } from '../types/inventory';
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
  const { cartridges, updateCartridge, deleteCartridge, getSentOutCountForCartridge } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [colorFilter, setColorFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'HEALTHY'>('ALL');
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(5);
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

  const handleSaveThreshold = (id: string) => {
    updateCartridge(id, { minThreshold: Math.max(1, tempThreshold) });
    setEditingThresholdId(null);
  };

  const handleDelete = (id: string) => {
    deleteCartridge(id);
    setConfirmDeleteSkuId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Central Warehouse Stockroom
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage central supplies, minimum replenish thresholds, and warehouse dispatches
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenReports}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Report</span>
          </button>

          <button
            onClick={() => onOpenRestock()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>Top Up Inventory</span>
          </button>

          <button
            onClick={onOpenAddCartridge}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model, SKU, compatible printer, or supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Filter segment */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Brand:</span>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-medium">Color:</span>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmented control for Stock state */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setStockStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  stockStatusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({cartridges.length})
              </button>
              <button
                onClick={() => setStockStatusFilter('LOW')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  stockStatusFilter === 'LOW'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Low / Reorder
              </button>
              <button
                onClick={() => setStockStatusFilter('HEALTHY')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  stockStatusFilter === 'HEALTHY'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Healthy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Cartridge SKU & Specification</th>
                <th className="py-3 px-4">Brand & Color</th>
                <th className="py-3 px-4 text-center">In Office at the Moment</th>
                <th className="py-3 px-4 text-center">50-Unit Gauge Status</th>
                <th className="py-3 px-4 text-center">Sent Out to Branches</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCartridges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No cartridges match your filter.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCartridges.map((cart) => {
                  const sentOutCount = getSentOutCountForCartridge(cart.id);

                  return (
                    <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Model & SKU */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {cart.model}
                            </span>
                            {cart.isBestSeller && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-blue-50 text-blue-700 border border-blue-200">
                                Best Seller
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {cart.sku} {cart.specification ? `· ${cart.specification}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Brand & Color */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{cart.brand}</span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span>{cart.color}</span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="text-slate-500 text-[11px]">{cart.type}</span>
                        </div>
                      </td>

                      {/* In Office (Warehouse) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                            {cart.centralStock} units
                          </span>
                          <span className="text-[10px] text-slate-400">In Central Store</span>
                        </div>
                      </td>

                      {/* Visual 50-Unit Gauge Status */}
                      <td className="py-3.5 px-4 text-center">
                        <GaugeIndicator
                          currentStock={cart.centralStock}
                          gaugeTarget={cart.minThreshold || 50}
                          compact={true}
                        />
                      </td>

                      {/* Sent Out to Other Offices */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums text-slate-800 text-xs">
                        {sentOutCount} units sent
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800">
                        {cart.unitCost > 0 ? `$${cart.unitCost.toFixed(2)}` : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDispatch(cart.id)}
                            disabled={cart.centralStock === 0}
                            title="Dispatch to branch"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>

                          <button
                            onClick={() => onOpenRestock(cart.id)}
                            title="Top up stock"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Top Up</span>
                          </button>

                          {confirmDeleteSkuId === cart.id ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                              <button
                                onClick={() => handleDelete(cart.id)}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteSkuId(null)}
                                className="px-1 py-0.5 text-slate-500 hover:text-slate-700 text-[10px]"
                              >
                                ×
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteSkuId(cart.id)}
                              title="Delete SKU"
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
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
