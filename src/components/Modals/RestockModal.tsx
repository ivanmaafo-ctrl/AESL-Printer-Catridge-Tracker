import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
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

  const [cartridgeId, setCartridgeId] = useState(preselectedCartridgeId || (cartridges[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(5);
  const [poNumber, setPoNumber] = useState(`PO-AESL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [supplier, setSupplier] = useState('');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [receivedBy, setReceivedBy] = useState('Kwame Asante (AESL IT Stores Lead)');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Top Up Central Warehouse Inventory
              </h2>
              <p className="text-xs text-slate-500">
                Receive new cartridge delivery from vendor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <PackageCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Stock topped up successfully! Warehouse inventory updated.</span>
            </div>
          )}

          {/* Cartridge Model */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Cartridge SKU to Restock <span className="text-rose-500">*</span>
              </label>
              {currentCartridge && (
                <span className="text-xs font-mono text-slate-500">
                  Current Stock: <strong>{currentCartridge.centralStock}</strong> / Min Threshold: <strong>{currentCartridge.minThreshold}</strong>
                </span>
              )}
            </div>
            <select
              value={cartridgeId}
              onChange={(e) => setCartridgeId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Received (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Purchase Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* PO Number & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PO / Invoice # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Received By */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Received By (Staff Member)
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intake Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received in original sealed factory packaging"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Total value display */}
          <div className="p-3 bg-slate-50 rounded-lg text-xs flex justify-between items-center text-slate-600 font-mono">
            <span>Total Intake Value:</span>
            <span className="font-bold text-slate-900 text-sm">
              ${(quantity * (unitCost || 0)).toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
