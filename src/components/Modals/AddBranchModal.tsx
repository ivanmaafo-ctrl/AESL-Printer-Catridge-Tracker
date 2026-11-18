import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { X, Building2, Plus, Trash2 } from 'lucide-react';
import { PrinterDevice } from '../../types/inventory';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBranchModal: React.FC<AddBranchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addBranch, cartridges } = useInventory();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Headquarters' | 'Regional Branch'>('Regional Branch');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');

  const [printers, setPrinters] = useState<PrinterDevice[]>([
    {
      id: `pr-${Date.now()}-1`,
      name: 'Main Office Printer',
      model: 'HP LaserJet Pro M404n',
      location: 'Front Reception',
      cartridgeSkuId: cartridges[0]?.id || '',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setName('');
      setCategory('Regional Branch');
      setCity('');
      setAddress('');
      setManagerName('');
      setContactPhone('');
      setEmail('');
      setPrinters([
        {
          id: `pr-${Date.now()}-1`,
          name: 'Main Office Printer',
          model: 'HP LaserJet Pro M404n',
          location: 'Front Reception',
          cartridgeSkuId: cartridges[0]?.id || '',
        },
      ]);
    }
  }, [isOpen, cartridges]);

  if (!isOpen) return null;

  const handleAddPrinter = () => {
    setPrinters((prev) => [
      ...prev,
      {
        id: `pr-${Date.now()}-${prev.length + 1}`,
        name: `Printer #${prev.length + 1}`,
        model: 'Standard Workgroup Printer',
        location: 'Branch Floor',
        cartridgeSkuId: cartridges[0]?.id || '',
      },
    ]);
  };

  const handleRemovePrinter = (id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePrinter = (id: string, field: keyof PrinterDevice, val: string) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addBranch({
      code: code.trim(),
      name: name.trim(),
      category,
      city: city.trim(),
      address: address.trim(),
      managerName: managerName.trim() || 'Branch Lead',
      contactPhone: contactPhone.trim(),
      email: email.trim(),
      printers,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#0D1420] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/15 w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="sm:hidden pt-2.5 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-blue-900/10 dark:border-white/10 bg-blue-hero shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] rounded-2xl shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Add New Location / Branch
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                Register an office, workshop, or branch to receive cartridges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add branch modal"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch / Office Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BR-BOL or HQ-HR"
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Classification / Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              >
                <option value="Headquarters">Headquarters (Anointed House)</option>
                <option value="Regional Branch">Regional Branch (Across Ghana)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / Office Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bolgatanga Branch or HR Office"
              required
              className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-bold bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Accra"
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch Manager
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Branch Operations Lead"
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Adenta Barrier Road, Greater Accra"
              className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+233 30 250 0000"
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="branch@aesl-ghana.com"
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Configured Printers */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Printers Deployed at this Branch ({printers.length})
              </label>
              <button
                type="button"
                onClick={handleAddPrinter}
                className="inline-flex items-center gap-1 min-h-[40px] px-2 text-xs font-semibold text-blue-700 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Printer</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {printers.map((printer, idx) => (
                <div
                  key={printer.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-[#F6F8FC] dark:bg-white/[0.04] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Printer #{idx + 1}</span>
                    {printers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePrinter(printer.id)}
                        aria-label={`Remove printer ${idx + 1}`}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name / Station"
                      value={printer.name}
                      onChange={(e) => handleUpdatePrinter(printer.id, 'name', e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-base sm:text-xs bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Printer Model"
                      value={printer.model}
                      onChange={(e) => handleUpdatePrinter(printer.id, 'model', e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-base sm:text-xs bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Room / Location"
                      value={printer.location}
                      onChange={(e) => handleUpdatePrinter(printer.id, 'location', e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-base sm:text-xs bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-lg"
                    />
                    <select
                      value={printer.cartridgeSkuId}
                      onChange={(e) => handleUpdatePrinter(printer.id, 'cartridgeSkuId', e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 text-base sm:text-xs bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-lg"
                    >
                      {cartridges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="grid grid-cols-2 sm:flex items-center justify-end gap-2 pt-3 pb-safe sm:pb-0 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors shadow-xs cursor-pointer"
            >
              Save Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
