import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { X, Send, AlertCircle, CheckCircle2, Camera, QrCode, Upload } from 'lucide-react';

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
  const { currentUser } = useAdminAuth();

  const defaultActor = currentUser?.displayName || currentUser?.email || 'AESL IT Support Officer';
  const [branchId, setBranchId] = useState(preselectedBranchId || (branches[0]?.id || ''));
  const [printerName, setPrinterName] = useState('');
  const [cartridgeId, setCartridgeId] = useState(preselectedCartridgeId || (cartridges[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(1);
  const [installedBy, setInstalledBy] = useState(defaultActor);
  const [reason, setReason] = useState<any>('Depleted');
  const [estimatedPages, setEstimatedPages] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Camera QR Code Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const currentBranch = branches.find((b) => b.id === branchId);
  const currentBranchStock = branchId ? getBranchStockDetails(branchId) : [];
  const selectedCartridgeOnBranch = currentBranchStock.find((s) => s.cartridgeId === cartridgeId);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsScanning(false);
    setScanStatus(null);
  };

  const startCamera = async () => {
    setError(null);
    setScanStatus('Starting camera stream...');
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanStatus('Point camera at printer cartridge QR code or label');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsScanning(false);
      setScanStatus(null);
      setError('Camera access denied or unavailable on this device. Please select manually or upload label photo.');
    }
  };

  // Simulated / Real BarcodeDetector frame checking loop
  useEffect(() => {
    if (!isScanning) return;

    let animationFrameId: number;
    let detector: any = null;

    try {
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
      }
    } catch {
      detector = null;
    }

    const checkFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(checkFrame);
        return;
      }

      if (detector) {
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0) {
            const rawVal = codes[0].rawValue || '';
            handleScannedResult(rawVal);
            return;
          }
        } catch {
          // continue scanning
        }
      }

      animationFrameId = requestAnimationFrame(checkFrame);
    };

    animationFrameId = requestAnimationFrame(checkFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, cartridges, branches]);

  const handleScannedResult = (codeText: string) => {
    const trimmed = codeText.trim().toUpperCase();
    // Try matching cartridge model or SKU
    const foundCartridge = cartridges.find(
      (c) =>
        c.id.toUpperCase() === trimmed ||
        c.model.toUpperCase().includes(trimmed) ||
        trimmed.includes(c.model.toUpperCase())
    );

    if (foundCartridge) {
      setCartridgeId(foundCartridge.id);
      setSuccessMessage(`Successfully scanned cartridge: ${foundCartridge.model} (${foundCartridge.color})`);
      stopCamera();
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    // Try matching branch code or name
    const foundBranch = branches.find(
      (b) => b.code.toUpperCase() === trimmed || b.name.toUpperCase().includes(trimmed)
    );
    if (foundBranch) {
      setBranchId(foundBranch.id);
      setSuccessMessage(`Successfully matched branch: ${foundBranch.name}`);
      stopCamera();
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    // If generic code, put it in notes or printer name
    setNotes((prev) => (prev ? `${prev}; Scanned QR: ${codeText}` : `Scanned QR Code: ${codeText}`));
    setSuccessMessage(`Scanned code: ${codeText}`);
    stopCamera();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFileUploadScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          if ('BarcodeDetector' in window) {
            // @ts-ignore
            const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
            const codes = await detector.detect(img);
            if (codes && codes.length > 0) {
              handleScannedResult(codes[0].rawValue);
              return;
            }
          }
        } catch {
          // fallback
        }
        // Fallback demo match if barcode detector cannot decode image directly
        setNotes('Scanned via uploaded label photo');
        setSuccessMessage('Label photo uploaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    stopCamera();

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#0D1420] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/15 w-full max-w-lg max-h-[95dvh] flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="sm:hidden pt-2.5 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-blue-900/10 dark:border-white/10 bg-blue-hero shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-600 dark:bg-sky-400 text-white dark:text-[#06090F] rounded-2xl shadow-xs shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                Log Cartridge Installation / Usage
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                Record consumed toner/ink at a branch printer
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Close usage log modal"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 text-xl font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Scanner Viewfinder Modal or Section */}
        {isScanning && (
          <div className="bg-slate-900 p-4 border-b border-slate-700 relative shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>Camera QR Code & Barcode Scanner</span>
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full cursor-pointer"
              >
                Close Camera
              </button>
            </div>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-0 border-2 border-dashed border-sky-400/70 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="bg-black/70 text-sky-300 text-xs px-3 py-1 rounded-full font-medium">
                  {scanStatus || 'Align cartridge QR code inside frame'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[#E8F1FF] dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-sky-300 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-600 dark:text-sky-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Camera Scan / Upload Action Bar for Mobile Users & Senior Staff */}
          <div className="p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 dark:bg-sky-400 text-white dark:text-[#06090F]">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  Scan Printer Cartridge Label
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block">
                  Quickly populate model & branch using device camera
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isScanning && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold text-white dark:text-[#06090F] bg-blue-600 dark:bg-sky-400 hover:bg-blue-700 dark:hover:bg-sky-300 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan QR / Barcode</span>
                </button>
              )}
              <label className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-300 dark:border-white/15 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" onChange={handleFileUploadScan} className="hidden" />
              </label>
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Branch Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              required
              className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-medium"
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
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Select Installed Printer at {currentBranch.code}
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-2 bg-[#F6F8FC] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl">
                {currentBranch.printers.map((pr) => {
                  const display = `${pr.name} (${pr.model})`;
                  const isSelected = printerName === display;
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => handlePrinterSelect(display, pr.cartridgeSkuId)}
                      className={`text-left min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] font-bold'
                          : 'bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-white/10 font-medium'
                      }`}
                    >
                      <span className="truncate">{display}</span>
                      <span className={`text-xs shrink-0 ml-2 ${isSelected ? 'text-sky-200 dark:text-[#06090F]/80' : 'text-slate-500 dark:text-slate-400'}`}>
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
            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Printer Device Name / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              placeholder="e.g. Front Desk Teller #2 (HP LaserJet P2055)"
              required
              className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-medium"
            />
          </div>

          {/* Cartridge SKU */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Cartridge Model Installed <span className="text-rose-500">*</span>
              </label>
              {selectedCartridgeOnBranch && (
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-semibold">
                  Branch On-Hand: <strong className="text-slate-900 dark:text-white">{selectedCartridgeOnBranch.onHandCount}</strong>
                </span>
              )}
            </div>
            <select
              value={cartridgeId}
              onChange={(e) => setCartridgeId(e.target.value)}
              required
              className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-medium"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Units Installed <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Replacement Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-medium"
              >
                <option value="Depleted">Depleted / Toner Empty</option>
                <option value="Streaks or Print Defect">Streaks or Print Defect</option>
                <option value="Routine Scheduled Swap">Routine Scheduled Swap</option>
                <option value="Printer Service">Printer Service / Maintenance</option>
              </select>
            </div>
          </div>

          {/* Installed By & Estimated Pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Technician / Staff Member
              </label>
              <input
                type="text"
                value={installedBy}
                onChange={(e) => setInstalledBy(e.target.value)}
                required
                placeholder="e.g. Kwame Asante, IT Lead"
                className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Pages Printed (Optional)
              </label>
              <input
                type="number"
                value={estimatedPages}
                onChange={(e) => setEstimatedPages(e.target.value)}
                placeholder="e.g. 2450"
                className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm font-mono bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-semibold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Old toner sent to recycling bin"
              className="w-full min-h-[48px] px-4 py-2.5 text-base sm:text-sm bg-white dark:bg-[#070B12] text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-colors font-medium"
            />
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 sm:flex items-center justify-end gap-3 pt-4 pb-safe sm:pb-0 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="min-h-[48px] px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/[0.06] border border-slate-300 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-[#06090F] bg-blue-600 dark:bg-sky-400 rounded-full hover:bg-blue-700 dark:hover:bg-sky-300 transition-colors shadow-sm cursor-pointer"
            >
              Record Usage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
