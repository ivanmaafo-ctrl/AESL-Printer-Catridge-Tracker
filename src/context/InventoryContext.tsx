import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  CartridgeSKU,
  Branch,
  DispatchRecord,
  UsageRecord,
  RestockRecord,
  LowStockAlert,
  DispatchStatus,
} from '../types/inventory';
import {
  INITIAL_CARTRIDGES,
  INITIAL_BRANCHES,
  INITIAL_DISPATCHES,
  INITIAL_USAGES,
  INITIAL_RESTOCKS,
} from '../data/initialData';
import { AESL_LOCATIONS } from '../data/aeslLocations';
import {
  SAMPLE_TEMPLATE_CARTRIDGES,
  SAMPLE_TEMPLATE_BRANCHES,
  SAMPLE_TEMPLATE_DISPATCHES,
  SAMPLE_TEMPLATE_USAGES,
  SAMPLE_TEMPLATE_RESTOCKS,
} from '../data/sampleTemplate';

export interface BranchInventoryItem {
  cartridgeId: string;
  cartridgeModel: string;
  cartridgeColor: string;
  totalReceived: number;
  totalUsed: number;
  onHandCount: number;
  inTransitCount: number;
}

interface InventoryContextType {
  cartridges: CartridgeSKU[];
  branches: Branch[];
  dispatches: DispatchRecord[];
  usages: UsageRecord[];
  restocks: RestockRecord[];

  // Admin Mode
  adminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (enabled: boolean) => void;

  // Computed metrics
  lowStockAlerts: LowStockAlert[];
  criticalCount: number;
  warningCount: number;
  totalCentralStockUnits: number; // In Office / Central Warehouse stock
  totalDispatchedUnits: number;   // Sent out to other offices & branches
  totalUsedUnits: number;

  // Actions
  dispatchCartridges: (data: {
    branchId: string;
    cartridgeId: string;
    quantity: number;
    carrier: string;
    trackingNumber: string;
    dispatchedBy: string;
    notes?: string;
  }) => { success: boolean; message: string };

  markDispatchDelivered: (dispatchId: string, receivedBy: string) => void;

  logUsage: (data: {
    branchId: string;
    cartridgeId: string;
    printerName: string;
    quantity: number;
    installedBy: string;
    reason: any;
    estimatedPagesPrinted?: number;
    notes?: string;
  }) => { success: boolean; message: string };

  topUpRestock: (data: {
    cartridgeId: string;
    quantityReceived: number;
    poNumber: string;
    unitCost: number;
    supplier: string;
    receivedBy: string;
    notes?: string;
  }) => void;

  batchTopUpAlerts: (items: Array<{ cartridgeId: string; quantity: number }>, poNumber: string) => void;

  addCartridge: (cartridge: Omit<CartridgeSKU, 'id'>) => void;
  updateCartridge: (id: string, updates: Partial<CartridgeSKU>) => void;
  deleteCartridge: (id: string) => void;

  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;

  // Unrestricted Master Admin Controls
  directUpdateStock: (cartridgeId: string, inOfficeStock: number, minThreshold?: number) => void;
  directAdjustBranchDispatched: (dispatchId: string, quantity: number, status: DispatchStatus) => void;
  deleteDispatch: (dispatchId: string) => void;
  getSentOutCountForCartridge: (cartridgeId: string) => number;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => { success: boolean; message: string };

  getBranchStockDetails: (branchId: string) => BranchInventoryItem[];
  resetToDefaultData: () => void;
  clearAllData: () => void;
  loadSampleTemplateData: () => void;
  loadAESLBranches: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CARTRIDGES: 'aesl_printflow_v2_cartridges',
  BRANCHES: 'aesl_printflow_v2_branches',
  DISPATCHES: 'aesl_printflow_clean_v1_dispatches',
  USAGES: 'aesl_printflow_clean_v1_usages',
  RESTOCKS: 'aesl_printflow_clean_v1_restocks',
  ADMIN_MODE: 'aesl_printflow_clean_v1_admin',
  SYNC_V3_EXV: 'aesl_printflow_sync_v3_exv_adenta',
  SYNC_V4_GAUGE15_1500A: 'aesl_printflow_sync_v4_gauge15_1500a',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const needsV3Sync = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SYNC_V3_EXV) !== 'done';
    } catch {
      return false;
    }
  })();

  const needsV4Sync = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SYNC_V4_GAUGE15_1500A) !== 'done';
    } catch {
      return false;
    }
  })();

  const [cartridges, setCartridges] = useState<CartridgeSKU[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARTRIDGES);
      const base: CartridgeSKU[] = saved ? JSON.parse(saved) : INITIAL_CARTRIDGES;
      if (!Array.isArray(base)) return INITIAL_CARTRIDGES;

      let updated = base;
      if (needsV4Sync) {
        // Reduce universal 50-unit gauge to 15 across existing saved SKUs
        updated = updated.map((c) =>
          c.minThreshold === 50 || c.minThreshold === undefined
            ? { ...c, minThreshold: 15 }
            : c
        );
      }

      if (needsV3Sync || needsV4Sync) {
        const existingSkus = new Set(updated.map((c) => c.sku.toUpperCase()));
        const missing = INITIAL_CARTRIDGES.filter((c) => !existingSkus.has(c.sku.toUpperCase()));
        if (missing.length > 0) {
          updated = [...updated, ...missing];
        }
      }

      return updated;
    } catch {
      return INITIAL_CARTRIDGES;
    }
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES);
      if (saved) {
        const parsed: Branch[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!needsV3Sync) return parsed;
          const existingIds = new Set(parsed.map((b) => b.id));
          const missing = INITIAL_BRANCHES.filter((b) => !existingIds.has(b.id));
          return missing.length > 0 ? [...parsed, ...missing] : parsed;
        }
      }
      return INITIAL_BRANCHES;
    } catch {
      return INITIAL_BRANCHES;
    }
  });

  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISPATCHES);
      const base: DispatchRecord[] = saved ? JSON.parse(saved) : INITIAL_DISPATCHES;
      if (!needsV3Sync || !Array.isArray(base)) return base;

      const existingIds = new Set(base.map((d) => d.id));
      const missing = INITIAL_DISPATCHES.filter((d) => !existingIds.has(d.id));
      return missing.length > 0 ? [...missing, ...base] : base;
    } catch {
      return INITIAL_DISPATCHES;
    }
  });

  useEffect(() => {
    try {
      if (needsV3Sync) {
        localStorage.setItem(STORAGE_KEYS.SYNC_V3_EXV, 'done');
      }
      if (needsV4Sync) {
        localStorage.setItem(STORAGE_KEYS.SYNC_V4_GAUGE15_1500A, 'done');
      }
    } catch {
      // ignore storage errors
    }
  }, [needsV3Sync, needsV4Sync]);

  const [usages, setUsages] = useState<UsageRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USAGES);
      return saved ? JSON.parse(saved) : INITIAL_USAGES;
    } catch {
      return INITIAL_USAGES;
    }
  });

  const [restocks, setRestocks] = useState<RestockRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESTOCKS);
      return saved ? JSON.parse(saved) : INITIAL_RESTOCKS;
    } catch {
      return INITIAL_RESTOCKS;
    }
  });

  // Default to unrestricted admin mode
  const [adminMode, setAdminModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_MODE);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAdminMode = () => {
    setAdminModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const setAdminMode = (enabled: boolean) => {
    setAdminModeState(enabled);
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, JSON.stringify(enabled));
    } catch (e) {
      console.error(e);
    }
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARTRIDGES, JSON.stringify(cartridges));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [cartridges]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [branches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISPATCHES, JSON.stringify(dispatches));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [dispatches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USAGES, JSON.stringify(usages));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [usages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESTOCKS, JSON.stringify(restocks));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }, [restocks]);

  // Low stock calculation: triggers whenever stock drops below threshold (default 15)
  const lowStockAlerts = useMemo<LowStockAlert[]>(() => {
    const alerts: LowStockAlert[] = [];
    cartridges.forEach((cart) => {
      const threshold = cart.minThreshold !== undefined ? cart.minThreshold : 15;
      if (cart.centralStock < threshold) {
        const deficit = Math.max(0, threshold - cart.centralStock);
        const packMultiple = cart.reorderPackSize || 1;
        // round suggested up to multiple of pack size to bring back above threshold
        const suggestedReorder = Math.max(packMultiple, Math.ceil(deficit / packMultiple) * packMultiple);
        const criticalCutoff = Math.max(1, Math.floor(threshold / 3));

        alerts.push({
          cartridge: cart,
          currentStock: cart.centralStock,
          minThreshold: threshold,
          deficit: threshold - cart.centralStock,
          suggestedReorder,
          severity: cart.centralStock <= criticalCutoff ? 'CRITICAL' : 'WARNING',
        });
      }
    });

    // Sort: critical first, then out-of-stock / best sellers, then lowest stock
    return alerts.sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;
      if (a.cartridge.isBestSeller && !b.cartridge.isBestSeller) return -1;
      if (b.cartridge.isBestSeller && !a.cartridge.isBestSeller) return 1;
      return a.currentStock - b.currentStock;
    });
  }, [cartridges]);

  const criticalCount = useMemo(
    () => lowStockAlerts.filter((a) => a.severity === 'CRITICAL').length,
    [lowStockAlerts]
  );

  const warningCount = useMemo(
    () => lowStockAlerts.filter((a) => a.severity === 'WARNING').length,
    [lowStockAlerts]
  );

  // In Office stock total
  const totalCentralStockUnits = useMemo(
    () => cartridges.reduce((sum, c) => sum + (Number(c.centralStock) || 0), 0),
    [cartridges]
  );

  // Sent out to other offices & branches total
  const totalDispatchedUnits = useMemo(
    () => dispatches.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0),
    [dispatches]
  );

  const totalUsedUnits = useMemo(
    () => usages.reduce((sum, u) => sum + (Number(u.quantity) || 0), 0),
    [usages]
  );

  // Calculate how many of a specific cartridge SKU were sent out across all branches/offices
  const getSentOutCountForCartridge = (cartridgeId: string): number => {
    return dispatches
      .filter((d) => d.cartridgeId === cartridgeId)
      .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  };

  // Helper to compute on-site stock breakdown per branch
  const getBranchStockDetails = (branchId: string): BranchInventoryItem[] => {
    const map = new Map<string, BranchInventoryItem>();

    dispatches
      .filter((d) => d.branchId === branchId)
      .forEach((d) => {
        if (!map.has(d.cartridgeId)) {
          map.set(d.cartridgeId, {
            cartridgeId: d.cartridgeId,
            cartridgeModel: d.cartridgeModel,
            cartridgeColor: d.cartridgeColor,
            totalReceived: 0,
            totalUsed: 0,
            onHandCount: 0,
            inTransitCount: 0,
          });
        }
        const item = map.get(d.cartridgeId)!;
        if (d.status === 'Delivered') {
          item.totalReceived += d.quantity;
        } else if (d.status === 'In Transit' || d.status === 'Pending') {
          item.inTransitCount += d.quantity;
        }
      });

    usages
      .filter((u) => u.branchId === branchId)
      .forEach((u) => {
        if (!map.has(u.cartridgeId)) {
          map.set(u.cartridgeId, {
            cartridgeId: u.cartridgeId,
            cartridgeModel: u.cartridgeModel,
            cartridgeColor: u.cartridgeColor,
            totalReceived: 0,
            totalUsed: 0,
            onHandCount: 0,
            inTransitCount: 0,
          });
        }
        const item = map.get(u.cartridgeId)!;
        item.totalUsed += u.quantity;
      });

    // Compute on-hand: delivered minus used (never negative)
    map.forEach((item) => {
      item.onHandCount = Math.max(0, item.totalReceived - item.totalUsed);
    });

    return Array.from(map.values());
  };

  // Dispatch cartridges to a branch
  const dispatchCartridges = (data: {
    branchId: string;
    cartridgeId: string;
    quantity: number;
    carrier: string;
    trackingNumber: string;
    dispatchedBy: string;
    notes?: string;
  }) => {
    const targetCartridge = cartridges.find((c) => c.id === data.cartridgeId);
    if (!targetCartridge) {
      return { success: false, message: 'Cartridge SKU not found.' };
    }

    if (targetCartridge.centralStock < data.quantity) {
      return {
        success: false,
        message: `Insufficient inventory in central office! Requested ${data.quantity}, but only ${targetCartridge.centralStock} available in office.`,
      };
    }

    const branch = branches.find((b) => b.id === data.branchId);
    const branchName = branch ? branch.name : 'Unknown Branch';

    // Decrement central office inventory
    setCartridges((prev) =>
      prev.map((c) =>
        c.id === data.cartridgeId
          ? { ...c, centralStock: c.centralStock - data.quantity }
          : c
      )
    );

    // Create dispatch record
    const newDispatch: DispatchRecord = {
      id: `dsp-${Date.now()}`,
      dispatchCode: `DSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      branchId: data.branchId,
      branchName,
      cartridgeId: targetCartridge.id,
      cartridgeModel: targetCartridge.model,
      cartridgeColor: targetCartridge.color,
      quantity: data.quantity,
      dispatchDate: new Date().toISOString().split('T')[0],
      carrier: data.carrier,
      trackingNumber: data.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      dispatchedBy: data.dispatchedBy,
      status: 'In Transit',
      notes: data.notes || '',
    };

    setDispatches((prev) => [newDispatch, ...prev]);

    return {
      success: true,
      message: `Successfully dispatched ${data.quantity} units to ${branchName}.`,
    };
  };

  // Mark dispatch as received / delivered
  const markDispatchDelivered = (dispatchId: string, receivedBy: string) => {
    setDispatches((prev) =>
      prev.map((d) =>
        d.id === dispatchId
          ? {
              ...d,
              status: 'Delivered',
              receivedBy: receivedBy || 'Branch Staff',
              receivedDate: new Date().toISOString().split('T')[0],
            }
          : d
      )
    );
  };

  // Log cartridge consumption / installation at a branch
  const logUsage = (data: {
    branchId: string;
    cartridgeId: string;
    printerName: string;
    quantity: number;
    installedBy: string;
    reason: any;
    estimatedPagesPrinted?: number;
    notes?: string;
  }) => {
    const branch = branches.find((b) => b.id === data.branchId);
    const cartridge = cartridges.find((c) => c.id === data.cartridgeId);

    const newUsage: UsageRecord = {
      id: `usg-${Date.now()}`,
      usageCode: `USG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      branchId: data.branchId,
      branchName: branch ? branch.name : 'Branch',
      cartridgeId: data.cartridgeId,
      cartridgeModel: cartridge ? cartridge.model : 'Printer Cartridge',
      cartridgeColor: cartridge ? cartridge.color : 'Black',
      printerName: data.printerName,
      quantity: data.quantity,
      installedDate: new Date().toISOString().split('T')[0],
      installedBy: data.installedBy,
      reason: data.reason,
      estimatedPagesPrinted: data.estimatedPagesPrinted,
      notes: data.notes || '',
    };

    setUsages((prev) => [newUsage, ...prev]);

    return {
      success: true,
      message: `Usage logged: ${data.quantity} installed into ${data.printerName}.`,
    };
  };

  // Restock / top up warehouse inventory
  const topUpRestock = (data: {
    cartridgeId: string;
    quantityReceived: number;
    poNumber: string;
    unitCost: number;
    supplier: string;
    receivedBy: string;
    notes?: string;
  }) => {
    const target = cartridges.find((c) => c.id === data.cartridgeId);
    if (!target) return;

    setCartridges((prev) =>
      prev.map((c) =>
        c.id === data.cartridgeId
          ? { ...c, centralStock: c.centralStock + data.quantityReceived }
          : c
      )
    );

    const newRecord: RestockRecord = {
      id: `rst-${Date.now()}`,
      poNumber: data.poNumber || `PO-AESL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      cartridgeId: target.id,
      cartridgeModel: target.model,
      quantityReceived: data.quantityReceived,
      unitCost: data.unitCost || target.unitCost,
      supplier: data.supplier || target.supplier,
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: data.receivedBy,
      notes: data.notes || '',
    };

    setRestocks((prev) => [newRecord, ...prev]);
  };

  // Batch replenishment for all alert items
  const batchTopUpAlerts = (items: Array<{ cartridgeId: string; quantity: number }>, poNumber: string) => {
    const today = new Date().toISOString().split('T')[0];

    setCartridges((prev) => {
      const map = new Map(items.map((i) => [i.cartridgeId, i.quantity]));
      return prev.map((c) => {
        if (map.has(c.id)) {
          return { ...c, centralStock: c.centralStock + (map.get(c.id) || 0) };
        }
        return c;
      });
    });

    const newRestocks: RestockRecord[] = items.map((item, idx) => {
      const cart = cartridges.find((c) => c.id === item.cartridgeId);
      return {
        id: `rst-${Date.now()}-${idx}`,
        poNumber: poNumber || `PO-AESL-BATCH-${Date.now().toString().slice(-4)}`,
        cartridgeId: item.cartridgeId,
        cartridgeModel: cart ? cart.model : 'Cartridge',
        quantityReceived: item.quantity,
        unitCost: cart ? cart.unitCost : 50,
        supplier: cart ? cart.supplier : 'Preferred Supplier',
        receivedDate: today,
        receivedBy: 'AESL IT Stores Lead',
        notes: 'Replenished via automated low-stock reorder wizard.',
      };
    });

    setRestocks((prev) => [...newRestocks, ...prev]);
  };

  // Add / Edit / Delete Cartridge SKU
  const addCartridge = (cartridge: Omit<CartridgeSKU, 'id'>) => {
    const newCart: CartridgeSKU = {
      ...cartridge,
      minThreshold: cartridge.minThreshold !== undefined ? cartridge.minThreshold : 15, // default 15 gauge!
      id: `cart-${Date.now()}`,
    };
    setCartridges((prev) => [...prev, newCart]);
  };

  const updateCartridge = (id: string, updates: Partial<CartridgeSKU>) => {
    setCartridges((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCartridge = (id: string) => {
    setCartridges((prev) => prev.filter((c) => c.id !== id));
  };

  // Add / Edit / Delete Branch
  const addBranch = (branch: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branch,
      id: `branch-${Date.now()}`,
    };
    setBranches((prev) => [...prev, newBranch]);
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  // 150% Unrestricted Admin Powers
  const directUpdateStock = (cartridgeId: string, inOfficeStock: number, minThreshold?: number) => {
    setCartridges((prev) =>
      prev.map((c) =>
        c.id === cartridgeId
          ? {
              ...c,
              centralStock: Math.max(0, inOfficeStock),
              minThreshold: minThreshold !== undefined ? Math.max(1, minThreshold) : c.minThreshold,
            }
          : c
      )
    );
  };

  const directAdjustBranchDispatched = (dispatchId: string, quantity: number, status: DispatchStatus) => {
    setDispatches((prev) =>
      prev.map((d) => (d.id === dispatchId ? { ...d, quantity, status } : d))
    );
  };

  const deleteDispatch = (dispatchId: string) => {
    setDispatches((prev) => prev.filter((d) => d.id !== dispatchId));
  };

  // Export full JSON database for backup/hosting migration
  const exportDatabaseJSON = () => {
    const backup = {
      company: 'Anointed Engineering Services Limited',
      department: 'IT Department',
      app: 'PrintFlow Cartridge Logistics',
      exportedAt: new Date().toISOString(),
      cartridges,
      branches,
      dispatches,
      usages,
      restocks,
    };
    return JSON.stringify(backup, null, 2);
  };

  // Import JSON database
  const importDatabaseJSON = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.cartridges) || !Array.isArray(data.branches)) {
        return { success: false, message: 'Invalid backup file: cartridges or branches arrays missing.' };
      }
      setCartridges(data.cartridges || []);
      setBranches(data.branches || []);
      setDispatches(data.dispatches || []);
      setUsages(data.usages || []);
      setRestocks(data.restocks || []);
      return {
        success: true,
        message: `Import successful: Restored ${data.cartridges.length} cartridge SKUs and ${data.branches.length} branches/offices.`,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to parse JSON file: ${e.message}` };
    }
  };

  const resetToDefaultData = () => {
    setCartridges(INITIAL_CARTRIDGES);
    setBranches(INITIAL_BRANCHES);
    setDispatches(INITIAL_DISPATCHES);
    setUsages(INITIAL_USAGES);
    setRestocks(INITIAL_RESTOCKS);
    localStorage.removeItem(STORAGE_KEYS.CARTRIDGES);
    localStorage.removeItem(STORAGE_KEYS.BRANCHES);
    localStorage.removeItem(STORAGE_KEYS.DISPATCHES);
    localStorage.removeItem(STORAGE_KEYS.USAGES);
    localStorage.removeItem(STORAGE_KEYS.RESTOCKS);
  };

  const clearAllData = () => {
    setCartridges([]);
    setBranches([]);
    setDispatches([]);
    setUsages([]);
    setRestocks([]);
    localStorage.removeItem(STORAGE_KEYS.CARTRIDGES);
    localStorage.removeItem(STORAGE_KEYS.BRANCHES);
    localStorage.removeItem(STORAGE_KEYS.DISPATCHES);
    localStorage.removeItem(STORAGE_KEYS.USAGES);
    localStorage.removeItem(STORAGE_KEYS.RESTOCKS);
  };

  const loadSampleTemplateData = () => {
    setCartridges(SAMPLE_TEMPLATE_CARTRIDGES);
    setBranches(SAMPLE_TEMPLATE_BRANCHES);
    setDispatches(SAMPLE_TEMPLATE_DISPATCHES);
    setUsages(SAMPLE_TEMPLATE_USAGES);
    setRestocks(SAMPLE_TEMPLATE_RESTOCKS);
  };

  const loadAESLBranches = () => {
    setBranches(AESL_LOCATIONS);
    try {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(AESL_LOCATIONS));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        cartridges,
        branches,
        dispatches,
        usages,
        restocks,
        adminMode,
        toggleAdminMode,
        setAdminMode,
        lowStockAlerts,
        criticalCount,
        warningCount,
        totalCentralStockUnits,
        totalDispatchedUnits,
        totalUsedUnits,
        dispatchCartridges,
        markDispatchDelivered,
        logUsage,
        topUpRestock,
        batchTopUpAlerts,
        addCartridge,
        updateCartridge,
        deleteCartridge,
        addBranch,
        updateBranch,
        deleteBranch,
        directUpdateStock,
        directAdjustBranchDispatched,
        deleteDispatch,
        getSentOutCountForCartridge,
        exportDatabaseJSON,
        importDatabaseJSON,
        getBranchStockDetails,
        resetToDefaultData,
        clearAllData,
        loadSampleTemplateData,
        loadAESLBranches,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
