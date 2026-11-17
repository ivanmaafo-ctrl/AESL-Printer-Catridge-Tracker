import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LogUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBranchId?: string;
  preselectedCartridgeId?: string;
}

export const LogUsageModal: React.FC<LogUsageModalProps> = ({
  isOpen,
  onClose,
  preselectedBranchId,
  preselectedCartridgeId,
}) => {
  const { branches, cartridges, logUsage, getBranchStockDetails } = useInventory();

  const [branchId, setBranchId] = useState(preselectedBranchId || (branches[0]?.id || ''));
  const [printerName, setPrinterName] = useState('');
  const [cartridgeId, setCartridgeId] = useState(preselectedCartridgeId || (cartridges[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(1);
  const [installedBy, setInstalledBy] = useState('AESL IT Support Officer');
  const [reason, setReason] = useState<any>('Depleted');
  const [estimatedPages, setEstimatedPages] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBranch = branches.find((b) => b.id === branchId);
  const currentBranchStock = branchId ? getBranchStockDetails(branchId) : [];
  const selectedCartridgeOnBranch = currentBranchStock.find((s) => s.cartridgeId === cartridgeId);

  // When branch changes, auto-set default printer
  const handleBranchChange = (newBranchId: string) => {
    setBranchId(newBranchId);
    const branch = branches.find((b) => b.id === newBranchId);
    if (branch && branch.printers.length > 0) {
      setPrinterName(`${branch.printers[0].name} (${branch.printers[0].model})`);
      if (branch.printers[0].cartridgeSkuId) {
        setCartridgeId(branch.printers[0].cartridgeSkuId);
      }
    }
  };

  const handlePrinterSelect = (printerDisplayName: string, defaultCartId?: string) => {
    setPrinterName(printerDisplayName);
    if (defaultCartId) {
      setCartridgeId(defaultCartId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!branchId) {
      setError('Please select a branch.');
      return;
    }
    if (!cartridgeId) {
      setError('Please select the cartridge model installed.');
      return;
    }
    if (!printerName.trim()) {
      setError('Please enter or select which printer this was installed into.');
      return;
    }

    const result = logUsage({
      branchId,
      cartridgeId,
      printerName: printerName.trim(),
      quantity,
      installedBy: installedBy.trim() || 'Branch Staff',
      reason,
      estimatedPagesPrinted: estimatedPages ? parseInt(estimatedPages, 10) : undefined,
      notes,
    });

    if (!result.success) {
      setError(result.message);
    } else {
      setSuccessMessage(result.message);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Log Cartridge Installation / Usage
              </h2>
              <p className="text-xs text-slate-500">
                Record consumed toner/ink at a branch printer
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
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Branch Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>Select location / branch</option>
              {branches.some((b) => b.category === 'Headquarters' || b.code.startsWith('HQ')) && (
                <optgroup label="🏢 Headquarters Offices (Anointed House)">
                  {branches
                    .filter((b) => b.category === 'Headquarters' || b.code.startsWith('HQ'))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="📍 Regional Branches (Across Ghana)">
                {branches
                  .filter((b) => b.category !== 'Headquarters' && !b.code.startsWith('HQ'))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Target Printer suggestions if available */}
          {currentBranch && currentBranch.printers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Installed Printer at {currentBranch.code}
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
                {currentBranch.printers.map((pr) => {
                  const display = `${pr.name} (${pr.model})`;
                  const isSelected = printerName === display;
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => handlePrinterSelect(display, pr.cartridgeSkuId)}
                      className={`text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <span className="truncate">{display}</span>
                      <span className={`text-[10px] shrink-0 ml-2 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {pr.location}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual Printer Name input fallback */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Printer Device Name / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="e.g. Front Desk Teller #2 (HP LaserJet P2055)"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Cartridge SKU */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Cartridge Model Installed <span className="text-rose-500">*</span>
              </label>
              {selectedCartridgeOnBranch && (
                <span className="text-xs font-mono text-slate-500">
                  Branch On-Hand: <strong className="text-slate-800">{selectedCartridgeOnBranch.onHandCount}</strong>
                </span>
              )}
            </div>
            <select
              value={cartridgeId}
              onChange={(e) => setCartridgeId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>Select cartridge</option>
              {cartridges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.model} — {c.color} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Installed <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Replacement Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="Depleted">Depleted / Toner Empty</option>
                <option value="Streaks or Print Defect">Streaks or Print Defect</option>
                <option value="Routine Scheduled Swap">Routine Scheduled Swap</option>
                <option value="Printer Service">Printer Service / Maintenance</option>
              </select>
            </div>
          </div>

          {/* Installed By & Estimated Pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician / Staff Member
              </label>
              <input
                type="text"
                value={installedBy}
                onChange={(e) => setInstalledBy(e.target.value)}
                required
                placeholder="e.g. Liam Davis, IT Lead"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pages Printed on Old Cartridge (Optional)
              </label>
              <input
                type="number"
                value={estimatedPages}
                onChange={(e) => setEstimatedPages(e.target.value)}
                placeholder="e.g. 2450"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Old toner sent to green recycling bin"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Footer */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs"
            >
              Record Usage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
