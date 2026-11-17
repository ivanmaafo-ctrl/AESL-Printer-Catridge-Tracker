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
  const [centralStock, setCentralStock] = useState<number>(50);
  const [minThreshold, setMinThreshold] = useState<number>(50); // Default 50 gauge
  const [unitCost, setUnitCost] = useState<number>(65.0);
  const [supplier, setSupplier] = useState('Office Supply Wholesale');
  const [pageYield, setPageYield] = useState<number>(2500);
  const [reorderPackSize, setReorderPackSize] = useState<number>(5);
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
      minThreshold: Math.max(1, minThreshold || 50),
      unitCost: Math.max(0, unitCost),
      supplier: supplier.trim() || 'General Vendor',
      pageYield: Math.max(100, pageYield),
      reorderPackSize: Math.max(1, reorderPackSize),
      notes: notes.trim(),
    });

    onClose();
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
                Add New Cartridge SKU
              </h2>
              <p className="text-xs text-slate-500">
                Register a new toner or ink model into central inventory
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
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. HP LaserJet 05A"
                required
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Part Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CE505A"
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Specification / Cartridge Details
            </label>
            <input
              type="text"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. CE505A Black, High Yield 2,300 pages, standard duty"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as CartridgeColor)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CartridgeType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Toner">Toner</option>
                <option value="Ink Cartridge">Ink Cartridge</option>
                <option value="Ink Tank">Ink Tank</option>
                <option value="Drum Unit">Drum Unit</option>
              </select>
            </div>
          </div>

          {/* Compatible printers comma separated */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Compatible Printers (comma-separated)
            </label>
            <input
              type="text"
              value={printersText}
              onChange={(e) => setPrintersText(e.target.value)}
              placeholder="e.g. HP LaserJet Pro M404n, HP MFP M428fdw"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Initial Stock & Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock in Office at the Moment (Warehouse) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={centralStock}
                onChange={(e) => setCentralStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Current count on shelves in the central IT office
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alert Gauge Threshold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 1)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Default 50. Alerts trigger when office stock drops below 50 units.
              </p>
            </div>
          </div>

          {/* Unit Cost, Supplier, Yield */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Page Yield
              </label>
              <input
                type="number"
                value={pageYield}
                onChange={(e) => setPageYield(parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reorder Pack Size
              </label>
              <input
                type="number"
                min={1}
                value={reorderPackSize}
                onChange={(e) => setReorderPackSize(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier / Distributor
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

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
              Save SKU to Catalogue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
