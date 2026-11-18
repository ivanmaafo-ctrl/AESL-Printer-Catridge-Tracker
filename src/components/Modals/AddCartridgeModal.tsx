import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { X, Plus, AlertCircle } from 'lucide-react';
import { CartridgeColor, CartridgeType } from '../../types/inventory';

interface AddCartridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCartridgeModal: React.FC<AddCartridgeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addCartridge } = useInventory();

  const [sku, setSku] = useState('');
  const [model, setModel] = useState('');
  const [specification, setSpecification] = useState('');
  const [brand, setBrand] = useState('HP');
  const [type, setType] = useState<CartridgeType>('Toner');
  const [color, setColor] = useState<CartridgeColor>('Black');
  const [printersText, setPrintersText] = useState('');
  const [centralStock, setCentralStock] = useState<number>(15);
  const [minThreshold, setMinThreshold] = useState<number>(15);
  const [unitCost, setUnitCost] = useState<number>(65.0);
  const [supplier, setSupplier] = useState('Office Supply Wholesale');
  const [pageYield, setPageYield] = useState<number>(2500);
  const [reorderPackSize, setReorderPackSize] = useState<number>(5);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !model.trim()) {
      setError('Please provide SKU code and Model name.');
      return;
    }

    const compatiblePrinters = printersText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    addCartridge({
      sku: sku.trim(),
      model: model.trim(),
      specification: specification.trim(),
      brand: brand.trim(),
      type,
      color,
      compatiblePrinters: compatiblePrinters.length > 0 ? compatiblePrinters : ['Universal Printer'],
      centralStock: Math.max(0, centralStock),
      minThreshold: Math.max(1, minThreshold || 15),
      unitCost: Math.max(0, unitCost),
      supplier: supplier.trim() || 'General Vendor',
      pageYield: Math.max(100, pageYield),
      reorderPackSize: Math.max(1, reorderPackSize),
      isBestSeller,
      notes: notes.trim(),
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
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Add New Cartridge SKU
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                Register a new toner or ink model into central inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add cartridge modal"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. HP LaserJet 05A"
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU / Part Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CE505A"
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Specification / Cartridge Details
            </label>
            <input
              type="text"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. CE505A Black, High Yield 2,300 pages, standard duty"
              className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="HP">HP</option>
                <option value="Brother">Brother</option>
                <option value="Canon">Canon</option>
                <option value="Epson">Epson</option>
                <option value="Xerox">Xerox</option>
                <option value="Lexmark">Lexmark</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as CartridgeColor)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Black">Black</option>
                <option value="Cyan">Cyan</option>
                <option value="Magenta">Magenta</option>
                <option value="Yellow">Yellow</option>
                <option value="Tri-Color">Tri-Color</option>
                <option value="Drum Unit">Drum Unit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CartridgeType)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Toner">Toner</option>
                <option value="Ink Cartridge">Ink Cartridge</option>
                <option value="Ink Tank">Ink Tank</option>
                <option value="Drum Unit">Drum Unit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Compatible Printers (comma-separated)
            </label>
            <input
              type="text"
              value={printersText}
              onChange={(e) => setPrintersText(e.target.value)}
              placeholder="e.g. HP LaserJet Pro M404n, HP MFP M428fdw"
              className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Initial Stock & Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock in Office (Warehouse) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={centralStock}
                onChange={(e) => setCentralStock(parseInt(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Current count on shelves in central IT store
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alert Gauge Threshold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 1)}
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Default 15. Alerts trigger below this count.
              </p>
            </div>
          </div>

          {/* Unit Cost, Supplier, Yield */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Page Yield
              </label>
              <input
                type="number"
                value={pageYield}
                onChange={(e) => setPageYield(parseInt(e.target.value) || 1000)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reorder Pack Size
              </label>
              <input
                type="number"
                min={1}
                value={reorderPackSize}
                onChange={(e) => setReorderPackSize(parseInt(e.target.value) || 1)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier / Distributor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. High-demand unit"
                className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 min-h-[44px] p-3 rounded-xl bg-[#F6F8FC] dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="w-4 h-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Mark as <strong className="text-[#0B0F17] dark:text-white">Best Seller / High-Demand SKU</strong> (suggests 40-unit reorder when below gauge)
            </span>
          </label>

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
              Save SKU
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
