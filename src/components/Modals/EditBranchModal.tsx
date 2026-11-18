import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { X, Building2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Branch } from '../../types/inventory';

interface EditBranchModalProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditBranchModal: React.FC<EditBranchModalProps> = ({
  branch,
  isOpen,
  onClose,
}) => {
  const { updateBranch, deleteBranch } = useInventory();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Headquarters' | 'Regional Branch'>('Regional Branch');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (branch) {
      setCode(branch.code);
      setName(branch.name);
      setCategory(branch.category || (branch.code.startsWith('HQ') ? 'Headquarters' : 'Regional Branch'));
      setCity(branch.city);
      setAddress(branch.address);
      setManagerName(branch.managerName);
      setContactPhone(branch.contactPhone);
      setEmail(branch.email);
      setConfirmDelete(false);
    }
  }, [branch]);

  if (!isOpen || !branch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateBranch(branch.id, {
      code: code.trim() || branch.code,
      name: name.trim(),
      category,
      city: city.trim(),
      address: address.trim(),
      managerName: managerName.trim(),
      contactPhone: contactPhone.trim(),
      email: email.trim(),
    });

    onClose();
  };

  const handleDelete = () => {
    deleteBranch(branch.id);
    setConfirmDelete(false);
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
                Edit Office / Branch Details
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                Update name, code, contact info, and physical location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close edit branch modal"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delete Confirmation Banner */}
        {confirmDelete && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/15 border-b border-rose-200 dark:border-rose-500/30 flex items-start gap-3 shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">Confirm Deletion</h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Are you sure you want to remove <strong>{branch.name}</strong> ({branch.code}) from your directory?
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="min-h-[40px] px-3.5 py-1.5 bg-rose-600 text-white rounded-full text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Yes, Delete Location
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[40px] px-3.5 py-1.5 bg-white dark:bg-white/[0.08] border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-200 rounded-full text-xs font-semibold hover:bg-rose-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
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
              required
              className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-bold bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch / Office Lead
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physical Location / Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 pb-safe sm:pb-0 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Location</span>
            </button>

            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
