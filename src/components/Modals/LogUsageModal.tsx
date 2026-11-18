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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1420] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/15 w-full max-w-lg overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/10 dark:border-white/10 bg-blue-hero">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 dark:bg-sky-400 text-white dark:text-[#06090F] rounded-2xl shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Log Cartridge Installation / Usage
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Record consumed toner/ink at a branch printer
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

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Branch Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>Select location / branch</option>
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
                      {b.name} ({b.city})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Target Printer suggestions if available */}
          {currentBranch && currentBranch.printers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Installed Printer at {currentBranch.code}
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-[#F6F8FC] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl">
                {currentBranch.printers.map((pr) => {
                  const display = `${pr.name} (${pr.model})`;
                  const isSelected = printerName === display;
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => handlePrinterSelect(display, pr.cartridgeSkuId)}
                      className={`text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] font-semibold'
                          : 'bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/10'
                      }`}
                    >
                      <span className="truncate">{display}</span>
                      <span className={`text-[10px] shrink-0 ml-2 ${isSelected ? 'text-sky-200 dark:text-[#06090F]/80' : 'text-slate-400 dark:text-slate-500'}`}>
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Printer Device Name / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="e.g. Front Desk Teller #2 (HP LaserJet P2055)"
              required
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Cartridge SKU */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cartridge Model Installed <span className="text-rose-500">*</span>
              </label>
              {selectedCartridgeOnBranch && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Branch On-Hand: <strong className="text-slate-900 dark:text-white">{selectedCartridgeOnBranch.onHandCount}</strong>
                </span>
              )}
            </div>
            <select
              value={cartridgeId}
              onChange={(e) => setCartridgeId(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Units Installed <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Replacement Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Technician / Staff Member
              </label>
              <input
                type="text"
                value={installedBy}
                onChange={(e) => setInstalledBy(e.target.value)}
                required
                placeholder="e.g. Kwame Asante, IT Lead"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pages Printed (Optional)
              </label>
              <input
                type="number"
                value={estimatedPages}
                onChange={(e) => setEstimatedPages(e.target.value)}
                placeholder="e.g. 2450"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Old toner sent to recycling bin"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Footer */}
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
              className="px-5 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-blue-600 dark:bg-sky-400 rounded-full hover:bg-blue-700 dark:hover:bg-sky-300 transition-colors shadow-xs cursor-pointer"
            >
              Record Usage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
