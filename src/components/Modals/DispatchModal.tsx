import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { X, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCartridgeId?: string;
  preselectedBranchId?: string;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  preselectedCartridgeId,
  preselectedBranchId,
}) => {
  const { cartridges, branches, dispatchCartridges } = useInventory();
  const { currentUser } = useAdminAuth();

  const defaultActor = currentUser?.displayName || currentUser?.email || 'AESL IT Staff';
  const [branchId, setBranchId] = useState(preselectedBranchId || (branches[0]?.id || ''));
  const [cartridgeId, setCartridgeId] = useState(preselectedCartridgeId || (cartridges[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(1);
  const [carrier, setCarrier] = useState('AESL Logistics Vehicle');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchedBy, setDispatchedBy] = useState(defaultActor);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && defaultActor) {
      setDispatchedBy((prev) => prev || defaultActor);
    }
  }, [isOpen, defaultActor]);

  if (!isOpen) return null;

  const currentCartridge = cartridges.find((c) => c.id === cartridgeId);
  const currentBranch = branches.find((b) => b.id === branchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!branchId) {
      setError('Please select a destination branch.');
      return;
    }
    if (!cartridgeId) {
      setError('Please select a cartridge model to dispatch.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }

    const result = dispatchCartridges({
      branchId,
      cartridgeId,
      quantity,
      carrier,
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      dispatchedBy,
      notes,
    });

    if (!result.success) {
      setError(result.message);
    } else {
      setSuccessMessage(result.message);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1420] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/15 w-full max-w-lg overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/10 dark:border-white/10 bg-blue-hero">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] rounded-2xl shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Dispatch Cartridges to Branch
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Allocate and ship stock from central warehouse
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

        {/* Modal Body / Empty Prerequisite Check */}
        {branches.length === 0 || cartridges.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Setup Required Before Dispatching</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {branches.length === 0 && cartridges.length === 0
                ? 'Please register your branches and add cartridge SKUs first before creating dispatches.'
                : branches.length === 0
                ? 'Please register at least one company branch first before dispatching.'
                : 'Please add cartridge SKUs into central inventory first before dispatching.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors shadow-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-[#E8F1FF] dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-sky-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-sky-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Destination Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Branch <span className="text-rose-500">*</span>
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="" disabled>Select target branch / office</option>
                {branches.some((b) => b.category === 'Headquarters' || b.code.startsWith('HQ')) && (
                  <optgroup label="Headquarters Offices (Anointed House)">
                    {branches
                      .filter((b) => b.category === 'Headquarters' || b.code.startsWith('HQ'))
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="Regional Branches (Across Ghana)">
                  {branches
                    .filter((b) => b.category !== 'Headquarters' && !b.code.startsWith('HQ'))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city}) — {b.code}
                      </option>
                    ))}
                </optgroup>
              </select>
              {currentBranch && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Delivering to: {currentBranch.address}
                </p>
              )}
            </div>

            {/* Cartridge SKU */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cartridge Model / SKU <span className="text-rose-500">*</span>
                </label>
                {currentCartridge && (
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    Central on-hand:{' '}
                    <strong className={currentCartridge.centralStock <= currentCartridge.minThreshold ? 'text-rose-600 dark:text-rose-400' : 'text-blue-700 dark:text-sky-400'}>
                      {currentCartridge.centralStock} units
                    </strong>
                  </span>
                )}
              </div>
              <select
                value={cartridgeId}
                onChange={(e) => setCartridgeId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="" disabled>Select cartridge SKU</option>
                {cartridges.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.centralStock === 0}>
                    {c.model} — {c.color} ({c.centralStock} in stock){c.centralStock === 0 ? ' [OUT OF STOCK]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Carrier Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity to Dispatch <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={currentCartridge ? currentCartridge.centralStock : 100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Carrier / Method
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="AESL Logistics Vehicle">AESL Logistics Vehicle</option>
                  <option value="Internal Courier Van">Internal Courier Van</option>
                  <option value="Direct Driver Delivery">Direct Driver Delivery</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="FedEx Ground">FedEx Ground</option>
                  <option value="Branch Staff Pickup">Branch Staff Pickup</option>
                </select>
              </div>
            </div>

            {/* Tracking & Dispatched By */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tracking / Waybill #
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatched By
                </label>
                <input
                  type="text"
                  value={dispatchedBy}
                  onChange={(e) => setDispatchedBy(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shipment Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Urgent replacement for teller printer; deliver before 2 PM"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Action buttons */}
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
                disabled={!currentCartridge || currentCartridge.centralStock === 0}
                className="px-5 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
              >
                Confirm & Dispatch Stock
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
