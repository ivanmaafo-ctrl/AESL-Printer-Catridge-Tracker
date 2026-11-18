import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { X, Plus, PackageCheck } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCartridgeId?: string;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  preselectedCartridgeId,
}) => {
  const { cartridges, topUpRestock } = useInventory();
  const { currentUser } = useAdminAuth();

  const defaultActor = currentUser?.displayName || currentUser?.email || 'AESL IT Staff';
  const [cartridgeId, setCartridgeId] = useState(preselectedCartridgeId || (cartridges[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(5);
  const [poNumber, setPoNumber] = useState(`PO-AESL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [supplier, setSupplier] = useState('');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [receivedBy, setReceivedBy] = useState(defaultActor);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync cartridge defaults
  React.useEffect(() => {
    const selected = cartridges.find((c) => c.id === cartridgeId);
    if (selected) {
      setSupplier(selected.supplier);
      setUnitCost(selected.unitCost);
      if (selected.reorderPackSize) {
        setQuantity(selected.reorderPackSize);
      }
    }
  }, [cartridgeId, cartridges]);

  if (!isOpen) return null;

  const currentCartridge = cartridges.find((c) => c.id === cartridgeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartridgeId || quantity <= 0) return;

    topUpRestock({
      cartridgeId,
      quantityReceived: quantity,
      poNumber,
      unitCost,
      supplier,
      receivedBy,
      notes,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1420] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/15 w-full max-w-lg overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/10 dark:border-white/10 bg-blue-hero">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] rounded-2xl shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Top Up Central Warehouse Inventory
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Receive new cartridge delivery from vendor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-3 rounded-2xl bg-[#E8F1FF] dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-sky-300 text-xs flex items-center gap-2">
              <PackageCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-sky-400" />
              <span>Stock topped up successfully! Warehouse inventory updated.</span>
            </div>
          )}

          {/* Cartridge Model */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cartridge SKU to Restock <span className="text-rose-500">*</span>
              </label>
              {currentCartridge && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Current Stock: <strong className="text-slate-900 dark:text-white">{currentCartridge.centralStock}</strong> · Min: <strong className="text-slate-900 dark:text-white">{currentCartridge.minThreshold}</strong>
                </span>
              )}
            </div>
            <select
              value={cartridgeId}
              onChange={(e) => setCartridgeId(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              {cartridges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.model} — {c.color} ({c.centralStock} on hand, min {c.minThreshold})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity Received (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Purchase Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* PO Number & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PO / Invoice # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Received By */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Received By (Staff Member)
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Intake Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received in original sealed factory packaging"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Total value display */}
          <div className="p-3.5 bg-[#F6F8FC] dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
            <span>Total Intake Value:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              ${(quantity * (unitCost || 0)).toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors shadow-xs cursor-pointer"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
