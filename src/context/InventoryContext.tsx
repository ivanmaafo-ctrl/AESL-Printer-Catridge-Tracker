import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
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
} from '../data/initialData';
import { AESL_LOCATIONS } from '../data/aeslLocations';
import {
  SAMPLE_TEMPLATE_CARTRIDGES,
  SAMPLE_TEMPLATE_BRANCHES,
  SAMPLE_TEMPLATE_DISPATCHES,
  SAMPLE_TEMPLATE_USAGES,
  SAMPLE_TEMPLATE_RESTOCKS,
} from '../data/sampleTemplate';
import { auth, db, OperationType, handleFirestoreError, clampStr } from '../firebase';
import { useAdminAuth } from './AdminAuthContext';

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
  inventoryLoading: boolean;

  // Admin Mode
  adminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (enabled: boolean) => void;

  // Computed metrics
  lowStockAlerts: LowStockAlert[];
  criticalCount: number;
  warningCount: number;
  totalCentralStockUnits: number;
  totalDispatchedUnits: number;
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

  // Master Admin Controls
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

const ADMIN_MODE_KEY = 'aesl_printflow_clean_v1_admin';

function sanitizeId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}-${Date.now()}`;
}

function buildCartridgeDoc(
  cart: CartridgeSKU,
  uid: string,
  createdAtVal?: unknown
): Record<string, unknown> {
  return {
    id: sanitizeId(cart.id, 'cart'),
    orgId: 'aesl',
    sku: clampStr(cart.sku || 'SKU', 40) || 'SKU',
    model: clampStr(cart.model || 'Cartridge Model', 160) || 'Cartridge Model',
    specification: clampStr(cart.specification || '', 160),
    brand: clampStr(cart.brand || 'HP', 60) || 'HP',
    type: cart.type || 'Toner',
    color: cart.color || 'Black',
    compatiblePrinters: Array.isArray(cart.compatiblePrinters)
      ? cart.compatiblePrinters.map((p) => clampStr(p, 120)).filter(Boolean).slice(0, 25)
      : [],
    centralStock: Math.min(100000, Math.max(0, Number(cart.centralStock) || 0)),
    minThreshold: Math.min(10000, Math.max(0, Number(cart.minThreshold ?? 15))),
    unitCost: Math.min(1000000, Math.max(0, Number(cart.unitCost) || 0)),
    supplier: clampStr(cart.supplier || 'Primary IT Supplies', 120),
    pageYield: Math.min(500000, Math.max(0, Number(cart.pageYield) || 0)),
    reorderPackSize: Math.min(10000, Math.max(1, Number(cart.reorderPackSize) || 5)),
    isBestSeller: Boolean(cart.isBestSeller),
    notes: clampStr(cart.notes || '', 500),
    updatedByUid: uid,
    createdAt: createdAtVal || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildBranchDoc(
  branch: Branch,
  uid: string,
  createdAtVal?: unknown
): Record<string, unknown> {
  return {
    id: sanitizeId(branch.id, 'branch'),
    orgId: 'aesl',
    code: clampStr(branch.code || 'BR', 32) || 'BR',
    name: clampStr(branch.name || 'Branch Office', 120) || 'Branch Office',
    category: branch.category === 'Headquarters' ? 'Headquarters' : 'Regional Branch',
    city: clampStr(branch.city || '', 100),
    address: clampStr(branch.address || '', 240),
    managerName: clampStr(branch.managerName || '', 120),
    contactPhone: clampStr(branch.contactPhone || '', 40),
    email: clampStr(branch.email || '', 160),
    printers: Array.isArray(branch.printers)
      ? branch.printers.slice(0, 30).map((p) => ({
          id: sanitizeId(p.id || `pr-${Date.now()}`, 'pr'),
          name: clampStr(p.name || 'Office Printer', 120),
          model: clampStr(p.model || 'LaserJet', 120),
          location: clampStr(p.location || 'Office', 120),
          cartridgeSkuId: clampStr(p.cartridgeSkuId || '', 128),
        }))
      : [],
    updatedByUid: uid,
    createdAt: createdAtVal || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildDispatchDoc(
  dsp: DispatchRecord,
  uid: string,
  createdAtVal?: unknown
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: sanitizeId(dsp.id, 'dsp'),
    orgId: 'aesl',
    dispatchCode: clampStr(dsp.dispatchCode || `DSP-${Date.now()}`, 64) || 'DSP',
    branchId: sanitizeId(dsp.branchId, 'branch'),
    branchName: clampStr(dsp.branchName || 'Branch', 120) || 'Branch',
    cartridgeId: sanitizeId(dsp.cartridgeId, 'cart'),
    cartridgeModel: clampStr(dsp.cartridgeModel || 'Cartridge', 160) || 'Cartridge',
    cartridgeColor: dsp.cartridgeColor || 'Black',
    quantity: Math.min(10000, Math.max(1, Number(dsp.quantity) || 1)),
    dispatchDate: clampStr(dsp.dispatchDate || new Date().toISOString().split('T')[0], 40),
    carrier: clampStr(dsp.carrier || 'Internal Courier', 120) || 'Internal Courier',
    trackingNumber: clampStr(dsp.trackingNumber || '', 120),
    dispatchedBy: clampStr(dsp.dispatchedBy || 'AESL IT Team', 120) || 'AESL IT Team',
    status: dsp.status || 'In Transit',
    notes: clampStr(dsp.notes || '', 500),
    createdByUid: uid,
    createdAt: createdAtVal || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (dsp.receivedBy) payload.receivedBy = clampStr(dsp.receivedBy, 120);
  if (dsp.receivedDate) payload.receivedDate = clampStr(dsp.receivedDate, 40);
  return payload;
}

function buildUsageDoc(
  usg: UsageRecord,
  uid: string,
  createdAtVal?: unknown
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: sanitizeId(usg.id, 'usg'),
    orgId: 'aesl',
    usageCode: clampStr(usg.usageCode || `USG-${Date.now()}`, 64) || 'USG',
    branchId: sanitizeId(usg.branchId, 'branch'),
    branchName: clampStr(usg.branchName || 'Branch', 120) || 'Branch',
    cartridgeId: sanitizeId(usg.cartridgeId, 'cart'),
    cartridgeModel: clampStr(usg.cartridgeModel || 'Cartridge', 160) || 'Cartridge',
    cartridgeColor: usg.cartridgeColor || 'Black',
    printerName: clampStr(usg.printerName || 'Printer', 120) || 'Printer',
    quantity: Math.min(1000, Math.max(1, Number(usg.quantity) || 1)),
    installedDate: clampStr(usg.installedDate || new Date().toISOString().split('T')[0], 40),
    installedBy: clampStr(usg.installedBy || 'AESL IT Team', 120) || 'AESL IT Team',
    reason: usg.reason || 'Depleted',
    notes: clampStr(usg.notes || '', 500),
    createdByUid: uid,
    createdAt: createdAtVal || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (typeof usg.estimatedPagesPrinted === 'number') {
    payload.estimatedPagesPrinted = Math.min(10000000, Math.max(0, usg.estimatedPagesPrinted));
  }
  return payload;
}

function buildRestockDoc(
  rst: RestockRecord,
  uid: string,
  createdAtVal?: unknown
): Record<string, unknown> {
  return {
    id: sanitizeId(rst.id, 'rst'),
    orgId: 'aesl',
    poNumber: clampStr(rst.poNumber || `PO-${Date.now()}`, 64) || 'PO',
    cartridgeId: sanitizeId(rst.cartridgeId, 'cart'),
    cartridgeModel: clampStr(rst.cartridgeModel || 'Cartridge', 160) || 'Cartridge',
    quantityReceived: Math.min(100000, Math.max(1, Number(rst.quantityReceived) || 1)),
    unitCost: Math.min(1000000, Math.max(0, Number(rst.unitCost) || 0)),
    supplier: clampStr(rst.supplier || 'Preferred Supplier', 120) || 'Preferred Supplier',
    receivedDate: clampStr(rst.receivedDate || new Date().toISOString().split('T')[0], 40),
    receivedBy: clampStr(rst.receivedBy || 'AESL IT Team', 120) || 'AESL IT Team',
    notes: clampStr(rst.notes || '', 500),
    createdByUid: uid,
    createdAt: createdAtVal || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function toIsoDateOrder(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'string') return Date.parse(val) || 0;
  return 0;
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authReady, isAuthenticated, isAdmin, currentUser } = useAdminAuth();

  const [cartridges, setCartridges] = useState<CartridgeSKU[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [usages, setUsages] = useState<UsageRecord[]>([]);
  const [restocks, setRestocks] = useState<RestockRecord[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(true);

  const createdAtCacheRef = useRef<Record<string, unknown>>({});
  const seededRef = useRef<boolean>(false);

  const [adminMode, setAdminModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_MODE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAdminMode = () => {
    setAdminModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ADMIN_MODE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const setAdminMode = (enabled: boolean) => {
    setAdminModeState(enabled);
    try {
      localStorage.setItem(ADMIN_MODE_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.error(e);
    }
  };

  // Subscribe to live inventory collections and seed/sync once from server snapshots (zero duplicate getDocs)
  useEffect(() => {
    if (!authReady || !isAuthenticated || !auth.currentUser) {
      setInventoryLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    setInventoryLoading(true);

    let latestCartServerEmpty: boolean | null = null;
    let latestBranchServerEmpty: boolean | null = null;

    const trySeedWhenBothEmpty = async () => {
      if (seededRef.current) return;
      if (latestCartServerEmpty !== true || latestBranchServerEmpty !== true) return;
      seededRef.current = true;

      try {
        const batch1 = writeBatch(db);
        INITIAL_CARTRIDGES.forEach((c) => {
          batch1.set(doc(db, 'cartridges', sanitizeId(c.id, 'cart')), buildCartridgeDoc(c, uid));
        });
        INITIAL_BRANCHES.forEach((b) => {
          batch1.set(doc(db, 'branches', sanitizeId(b.id, 'branch')), buildBranchDoc(b, uid));
        });
        await batch1.commit();

        const batch2 = writeBatch(db);
        INITIAL_DISPATCHES.forEach((d) => {
          batch2.set(doc(db, 'dispatches', sanitizeId(d.id, 'dsp')), buildDispatchDoc(d, uid));
        });
        await batch2.commit();
        try {
          localStorage.setItem('aesl_catalog_v2_synced', 'true');
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        console.warn('Initial seed check skipped or handled:', err);
      }
    };

    const runCatalogV2SyncIfNeeded = async (docsMap: Map<string, any>) => {
      if (!isAdmin || seededRef.current) return;
      let alreadySynced = false;
      try {
        alreadySynced = localStorage.getItem('aesl_catalog_v2_synced') === 'true';
      } catch {
        alreadySynced = false;
      }
      if (alreadySynced) return;
      seededRef.current = true;

      try {
        const batchSync = writeBatch(db);
        let opCount = 0;

        const sku285a = INITIAL_CARTRIDGES.find((c) => c.id === 'cart-285a');
        const sku1107a = INITIAL_CARTRIDGES.find((c) => c.id === 'cart-1107a');
        const sku1500a = INITIAL_CARTRIDGES.find((c) => c.id === 'cart-1500a');
        const skuExv14 = INITIAL_CARTRIDGES.find((c) => c.id === 'cart-exv14');

        if (sku285a && !docsMap.has('cart-285a')) {
          batchSync.set(doc(db, 'cartridges', 'cart-285a'), buildCartridgeDoc(sku285a, uid));
          opCount += 1;
        }
        if (sku1107a && docsMap.has('cart-1107a')) {
          const d1107 = docsMap.get('cart-1107a');
          if (d1107.minThreshold === 15) {
            batchSync.update(doc(db, 'cartridges', 'cart-1107a'), {
              minThreshold: 20,
              isBestSeller: true,
              specification: sku1107a.specification,
              notes: sku1107a.notes,
              updatedByUid: uid,
              updatedAt: serverTimestamp(),
            });
            opCount += 1;
          }
        }
        if (sku1500a && docsMap.has('cart-1500a')) {
          const d1500 = docsMap.get('cart-1500a');
          if (d1500.minThreshold === 15 || !d1500.isBestSeller) {
            batchSync.update(doc(db, 'cartridges', 'cart-1500a'), {
              minThreshold: 20,
              isBestSeller: true,
              specification: sku1500a.specification,
              notes: sku1500a.notes,
              updatedByUid: uid,
              updatedAt: serverTimestamp(),
            });
            opCount += 1;
          }
        }
        if (skuExv14 && docsMap.has('cart-exv14')) {
          const dExv14 = docsMap.get('cart-exv14');
          if (dExv14.minThreshold === 15) {
            batchSync.update(doc(db, 'cartridges', 'cart-exv14'), {
              minThreshold: 5,
              notes: skuExv14.notes,
              updatedByUid: uid,
              updatedAt: serverTimestamp(),
            });
            opCount += 1;
          }
        }

        if (opCount > 0) {
          await batchSync.commit();
        }
        try {
          localStorage.setItem('aesl_catalog_v2_synced', 'true');
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        console.warn('Catalog sync skipped or handled:', err);
      }
    };

    const qCart = query(collection(db, 'cartridges'), where('orgId', '==', 'aesl'));
    const qBranch = query(collection(db, 'branches'), where('orgId', '==', 'aesl'));
    const qDispatch = query(collection(db, 'dispatches'), where('orgId', '==', 'aesl'));
    const qUsage = query(collection(db, 'usages'), where('orgId', '==', 'aesl'));
    const qRestock = query(collection(db, 'restocks'), where('orgId', '==', 'aesl'));

    const unsubCart = onSnapshot(
      qCart,
      (snap) => {
        const docsMap = new Map<string, any>();
        const items: CartridgeSKU[] = snap.docs.map((d) => {
          const data = d.data() as any;
          docsMap.set(d.id, data);
          createdAtCacheRef.current[`cartridges/${d.id}`] = data.createdAt;
          return {
            id: d.id,
            sku: data.sku || '',
            model: data.model || '',
            specification: data.specification || '',
            brand: data.brand || '',
            type: data.type || 'Toner',
            color: data.color || 'Black',
            compatiblePrinters: Array.isArray(data.compatiblePrinters) ? data.compatiblePrinters : [],
            centralStock: Number(data.centralStock) || 0,
            minThreshold: data.minThreshold !== undefined ? Number(data.minThreshold) : 15,
            unitCost: Number(data.unitCost) || 0,
            supplier: data.supplier || '',
            pageYield: Number(data.pageYield) || 0,
            reorderPackSize: Number(data.reorderPackSize) || 5,
            isBestSeller: Boolean(data.isBestSeller),
            notes: data.notes || '',
          };
        });
        items.sort((a, b) => a.sku.localeCompare(b.sku));
        setCartridges(items);
        setInventoryLoading(false);

        if (!snap.metadata.fromCache) {
          latestCartServerEmpty = snap.empty;
          if (snap.empty) {
            void trySeedWhenBothEmpty();
          } else {
            void runCatalogV2SyncIfNeeded(docsMap);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'cartridges');
      }
    );

    const unsubBranch = onSnapshot(
      qBranch,
      (snap) => {
        const items: Branch[] = snap.docs.map((d) => {
          const data = d.data() as any;
          createdAtCacheRef.current[`branches/${d.id}`] = data.createdAt;
          return {
            id: d.id,
            code: data.code || '',
            name: data.name || '',
            category: data.category || 'Regional Branch',
            city: data.city || '',
            address: data.address || '',
            managerName: data.managerName || '',
            contactPhone: data.contactPhone || '',
            email: data.email || '',
            printers: Array.isArray(data.printers) ? data.printers : [],
          };
        });
        items.sort((a, b) => {
          if (a.category === 'Headquarters' && b.category !== 'Headquarters') return -1;
          if (b.category === 'Headquarters' && a.category !== 'Headquarters') return 1;
          return a.name.localeCompare(b.name);
        });
        setBranches(items);

        if (!snap.metadata.fromCache) {
          latestBranchServerEmpty = snap.empty;
          if (snap.empty) {
            void trySeedWhenBothEmpty();
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'branches');
      }
    );

    const unsubDispatch = onSnapshot(
      qDispatch,
      (snap) => {
        const items: DispatchRecord[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            createdAtCacheRef.current[`dispatches/${d.id}`] = data.createdAt;
            return {
              id: d.id,
              dispatchCode: data.dispatchCode || '',
              branchId: data.branchId || '',
              branchName: data.branchName || '',
              cartridgeId: data.cartridgeId || '',
              cartridgeModel: data.cartridgeModel || '',
              cartridgeColor: data.cartridgeColor || 'Black',
              quantity: Number(data.quantity) || 1,
              dispatchDate: data.dispatchDate || '',
              carrier: data.carrier || '',
              trackingNumber: data.trackingNumber || '',
              dispatchedBy: data.dispatchedBy || '',
              receivedBy: data.receivedBy,
              receivedDate: data.receivedDate,
              status: data.status || 'In Transit',
              notes: data.notes || '',
              _ts: toIsoDateOrder(data.createdAt),
            };
          })
          .sort((a, b) => b._ts - a._ts)
          .map(({ _ts, ...rest }) => rest);
        setDispatches(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'dispatches');
      }
    );

    const unsubUsage = onSnapshot(
      qUsage,
      (snap) => {
        const items: UsageRecord[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            createdAtCacheRef.current[`usages/${d.id}`] = data.createdAt;
            return {
              id: d.id,
              usageCode: data.usageCode || '',
              branchId: data.branchId || '',
              branchName: data.branchName || '',
              cartridgeId: data.cartridgeId || '',
              cartridgeModel: data.cartridgeModel || '',
              cartridgeColor: data.cartridgeColor || 'Black',
              printerName: data.printerName || '',
              quantity: Number(data.quantity) || 1,
              installedDate: data.installedDate || '',
              installedBy: data.installedBy || '',
              reason: data.reason || 'Depleted',
              estimatedPagesPrinted: data.estimatedPagesPrinted,
              notes: data.notes || '',
              _ts: toIsoDateOrder(data.createdAt),
            };
          })
          .sort((a, b) => b._ts - a._ts)
          .map(({ _ts, ...rest }) => rest);
        setUsages(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'usages');
      }
    );

    const unsubRestock = onSnapshot(
      qRestock,
      (snap) => {
        const items: RestockRecord[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            createdAtCacheRef.current[`restocks/${d.id}`] = data.createdAt;
            return {
              id: d.id,
              poNumber: data.poNumber || '',
              cartridgeId: data.cartridgeId || '',
              cartridgeModel: data.cartridgeModel || '',
              quantityReceived: Number(data.quantityReceived) || 1,
              unitCost: Number(data.unitCost) || 0,
              supplier: data.supplier || '',
              receivedDate: data.receivedDate || '',
              receivedBy: data.receivedBy || '',
              notes: data.notes || '',
              _ts: toIsoDateOrder(data.createdAt),
            };
          })
          .sort((a, b) => b._ts - a._ts)
          .map(({ _ts, ...rest }) => rest);
        setRestocks(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'restocks');
      }
    );

    return () => {
      unsubCart();
      unsubBranch();
      unsubDispatch();
      unsubUsage();
      unsubRestock();
    };
  }, [authReady, isAuthenticated]);

  const lowStockAlerts = useMemo<LowStockAlert[]>(() => {
    const alerts: LowStockAlert[] = [];
    cartridges.forEach((cart) => {
      const threshold = cart.minThreshold !== undefined ? cart.minThreshold : 15;
      if (cart.centralStock < threshold) {
        const deficit = Math.max(0, threshold - cart.centralStock);
        const packMultiple = cart.reorderPackSize || 1;
        const suggestedReorder = cart.isBestSeller
          ? 40
          : Math.max(packMultiple, Math.ceil(deficit / packMultiple) * packMultiple);
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

  const totalCentralStockUnits = useMemo(
    () => cartridges.reduce((sum, c) => sum + (Number(c.centralStock) || 0), 0),
    [cartridges]
  );

  const totalDispatchedUnits = useMemo(
    () => dispatches.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0),
    [dispatches]
  );

  const totalUsedUnits = useMemo(
    () => usages.reduce((sum, u) => sum + (Number(u.quantity) || 0), 0),
    [usages]
  );

  const sentOutByCartridgeMap = useMemo(() => {
    const counts = new Map<string, number>();
    dispatches.forEach((d) => {
      counts.set(d.cartridgeId, (counts.get(d.cartridgeId) || 0) + (Number(d.quantity) || 0));
    });
    return counts;
  }, [dispatches]);

  const getSentOutCountForCartridge = (cartridgeId: string): number => {
    return sentOutByCartridgeMap.get(cartridgeId) || 0;
  };

  const branchStockMap = useMemo(() => {
    const byBranch = new Map<string, Map<string, BranchInventoryItem>>();

    const ensureBranchMap = (branchId: string) => {
      let m = byBranch.get(branchId);
      if (!m) {
        m = new Map<string, BranchInventoryItem>();
        byBranch.set(branchId, m);
      }
      return m;
    };

    dispatches.forEach((d) => {
      const m = ensureBranchMap(d.branchId);
      let item = m.get(d.cartridgeId);
      if (!item) {
        item = {
          cartridgeId: d.cartridgeId,
          cartridgeModel: d.cartridgeModel,
          cartridgeColor: d.cartridgeColor,
          totalReceived: 0,
          totalUsed: 0,
          onHandCount: 0,
          inTransitCount: 0,
        };
        m.set(d.cartridgeId, item);
      }
      if (d.status === 'Delivered') {
        item.totalReceived += d.quantity;
      } else if (d.status === 'In Transit' || d.status === 'Pending') {
        item.inTransitCount += d.quantity;
      }
    });

    usages.forEach((u) => {
      const m = ensureBranchMap(u.branchId);
      let item = m.get(u.cartridgeId);
      if (!item) {
        item = {
          cartridgeId: u.cartridgeId,
          cartridgeModel: u.cartridgeModel,
          cartridgeColor: u.cartridgeColor,
          totalReceived: 0,
          totalUsed: 0,
          onHandCount: 0,
          inTransitCount: 0,
        };
        m.set(u.cartridgeId, item);
      }
      item.totalUsed += u.quantity;
    });

    const result = new Map<string, BranchInventoryItem[]>();
    byBranch.forEach((m, branchId) => {
      const arr = Array.from(m.values());
      arr.forEach((item) => {
        item.onHandCount = Math.max(0, item.totalReceived - item.totalUsed);
      });
      result.set(branchId, arr);
    });
    return result;
  }, [dispatches, usages]);

  const getBranchStockDetails = (branchId: string): BranchInventoryItem[] => {
    return branchStockMap.get(branchId) || [];
  };

  const getActorName = (fallback?: string) => {
    if (fallback && fallback.trim()) return fallback.trim();
    return currentUser?.displayName || currentUser?.email || 'AESL IT Staff';
  };

  const dispatchCartridges = (data: {
    branchId: string;
    cartridgeId: string;
    quantity: number;
    carrier: string;
    trackingNumber: string;
    dispatchedBy: string;
    notes?: string;
  }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Sign in required.' };

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
    if (!branch) {
      return { success: false, message: 'Destination branch not found.' };
    }

    const dispatchId = `dsp-${Date.now()}`;
    const newDispatch: DispatchRecord = {
      id: dispatchId,
      dispatchCode: `DSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      branchId: branch.id,
      branchName: branch.name,
      cartridgeId: targetCartridge.id,
      cartridgeModel: targetCartridge.model,
      cartridgeColor: targetCartridge.color,
      quantity: data.quantity,
      dispatchDate: new Date().toISOString().split('T')[0],
      carrier: data.carrier,
      trackingNumber: data.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      dispatchedBy: getActorName(data.dispatchedBy),
      status: 'In Transit',
      notes: data.notes || '',
    };

    const batch = writeBatch(db);
    batch.update(doc(db, 'cartridges', targetCartridge.id), {
      centralStock: Math.max(0, targetCartridge.centralStock - data.quantity),
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'dispatches', dispatchId), buildDispatchDoc(newDispatch, uid));

    batch.commit().catch((err) => handleFirestoreError(err, OperationType.WRITE, `dispatches/${dispatchId}`));

    return {
      success: true,
      message: `Successfully dispatched ${data.quantity} units to ${branch.name}.`,
    };
  };

  const markDispatchDelivered = (dispatchId: string, receivedBy: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    updateDoc(doc(db, 'dispatches', dispatchId), {
      status: 'Delivered',
      receivedBy: clampStr(receivedBy || getActorName(), 120) || 'Branch Staff',
      receivedDate: new Date().toISOString().split('T')[0],
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `dispatches/${dispatchId}`));
  };

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
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Sign in required.' };

    const branch = branches.find((b) => b.id === data.branchId);
    const cartridge = cartridges.find((c) => c.id === data.cartridgeId);
    if (!branch || !cartridge) {
      return { success: false, message: 'Branch or cartridge SKU not found.' };
    }

    const usageId = `usg-${Date.now()}`;
    const newUsage: UsageRecord = {
      id: usageId,
      usageCode: `USG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      branchId: branch.id,
      branchName: branch.name,
      cartridgeId: cartridge.id,
      cartridgeModel: cartridge.model,
      cartridgeColor: cartridge.color,
      printerName: data.printerName,
      quantity: data.quantity,
      installedDate: new Date().toISOString().split('T')[0],
      installedBy: getActorName(data.installedBy),
      reason: data.reason,
      estimatedPagesPrinted: data.estimatedPagesPrinted,
      notes: data.notes || '',
    };

    setDoc(doc(db, 'usages', usageId), buildUsageDoc(newUsage, uid)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `usages/${usageId}`)
    );

    return {
      success: true,
      message: `Usage logged: ${data.quantity} installed into ${data.printerName}.`,
    };
  };

  const topUpRestock = (data: {
    cartridgeId: string;
    quantityReceived: number;
    poNumber: string;
    unitCost: number;
    supplier: string;
    receivedBy: string;
    notes?: string;
  }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const target = cartridges.find((c) => c.id === data.cartridgeId);
    if (!target) return;

    const restockId = `rst-${Date.now()}`;
    const newRecord: RestockRecord = {
      id: restockId,
      poNumber: data.poNumber || `PO-AESL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      cartridgeId: target.id,
      cartridgeModel: target.model,
      quantityReceived: data.quantityReceived,
      unitCost: data.unitCost || target.unitCost,
      supplier: data.supplier || target.supplier || 'Preferred Supplier',
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: getActorName(data.receivedBy),
      notes: data.notes || '',
    };

    const batch = writeBatch(db);
    batch.update(doc(db, 'cartridges', target.id), {
      centralStock: target.centralStock + data.quantityReceived,
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'restocks', restockId), buildRestockDoc(newRecord, uid));
    batch.commit().catch((err) => handleFirestoreError(err, OperationType.WRITE, `restocks/${restockId}`));
  };

  const batchTopUpAlerts = (items: Array<{ cartridgeId: string; quantity: number }>, poNumber: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid || items.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    const batch = writeBatch(db);
    items.forEach((item, idx) => {
      const cart = cartridges.find((c) => c.id === item.cartridgeId);
      if (!cart) return;

      batch.update(doc(db, 'cartridges', cart.id), {
        centralStock: cart.centralStock + item.quantity,
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });

      const restockId = `rst-${Date.now()}-${idx}`;
      const rec: RestockRecord = {
        id: restockId,
        poNumber: poNumber || `PO-AESL-BATCH-${Date.now().toString().slice(-4)}`,
        cartridgeId: item.cartridgeId,
        cartridgeModel: cart.model,
        quantityReceived: item.quantity,
        unitCost: cart.unitCost || 0,
        supplier: cart.supplier || 'Preferred Supplier',
        receivedDate: today,
        receivedBy: getActorName(),
        notes: 'Replenished via automated low-stock reorder wizard.',
      };
      batch.set(doc(db, 'restocks', restockId), buildRestockDoc(rec, uid));
    });

    batch.commit().catch((err) => handleFirestoreError(err, OperationType.WRITE, 'restocks/batch'));
  };

  const addCartridge = (cartridge: Omit<CartridgeSKU, 'id'>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const newId = `cart-${Date.now()}`;
    const newCart: CartridgeSKU = {
      ...cartridge,
      minThreshold: cartridge.minThreshold !== undefined ? cartridge.minThreshold : 15,
      id: newId,
    };
    setDoc(doc(db, 'cartridges', newId), buildCartridgeDoc(newCart, uid)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `cartridges/${newId}`)
    );
  };

  const updateCartridge = (id: string, updates: Partial<CartridgeSKU>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const current = cartridges.find((c) => c.id === id);
    if (!current) return;
    const merged: CartridgeSKU = { ...current, ...updates, id };
    const createdAtVal = createdAtCacheRef.current[`cartridges/${id}`] || serverTimestamp();
    setDoc(doc(db, 'cartridges', id), buildCartridgeDoc(merged, uid, createdAtVal)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `cartridges/${id}`)
    );
  };

  const deleteCartridge = (id: string) => {
    deleteDoc(doc(db, 'cartridges', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `cartridges/${id}`)
    );
  };

  const addBranch = (branch: Omit<Branch, 'id'>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const newId = `branch-${Date.now()}`;
    const newBranch: Branch = {
      ...branch,
      id: newId,
    };
    setDoc(doc(db, 'branches', newId), buildBranchDoc(newBranch, uid)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `branches/${newId}`)
    );
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const current = branches.find((b) => b.id === id);
    if (!current) return;
    const merged: Branch = { ...current, ...updates, id };
    const createdAtVal = createdAtCacheRef.current[`branches/${id}`] || serverTimestamp();
    setDoc(doc(db, 'branches', id), buildBranchDoc(merged, uid, createdAtVal)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `branches/${id}`)
    );
  };

  const deleteBranch = (id: string) => {
    deleteDoc(doc(db, 'branches', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `branches/${id}`)
    );
  };

  const directUpdateStock = (cartridgeId: string, inOfficeStock: number, minThreshold?: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const target = cartridges.find((c) => c.id === cartridgeId);
    if (!target) return;
    updateDoc(doc(db, 'cartridges', cartridgeId), {
      centralStock: Math.max(0, inOfficeStock),
      minThreshold: minThreshold !== undefined ? Math.max(1, minThreshold) : target.minThreshold,
      updatedByUid: uid,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `cartridges/${cartridgeId}`));
  };

  const directAdjustBranchDispatched = (dispatchId: string, quantity: number, status: DispatchStatus) => {
    updateDoc(doc(db, 'dispatches', dispatchId), {
      quantity: Math.max(1, quantity),
      status,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `dispatches/${dispatchId}`));
  };

  const deleteDispatch = (dispatchId: string) => {
    deleteDoc(doc(db, 'dispatches', dispatchId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `dispatches/${dispatchId}`)
    );
  };

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

  const importDatabaseJSON = (jsonString: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, message: 'Authentication required.' };
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.cartridges) || !Array.isArray(data.branches)) {
        return { success: false, message: 'Invalid backup file: cartridges or branches arrays missing.' };
      }

      const runRestore = async () => {
        const batch1 = writeBatch(db);
        (data.cartridges as CartridgeSKU[]).forEach((c) => {
          batch1.set(doc(db, 'cartridges', sanitizeId(c.id, 'cart')), buildCartridgeDoc(c, uid));
        });
        (data.branches as Branch[]).forEach((b) => {
          batch1.set(doc(db, 'branches', sanitizeId(b.id, 'branch')), buildBranchDoc(b, uid));
        });
        await batch1.commit();

        const batch2 = writeBatch(db);
        (data.dispatches || []).forEach((d: DispatchRecord) => {
          batch2.set(doc(db, 'dispatches', sanitizeId(d.id, 'dsp')), buildDispatchDoc(d, uid));
        });
        (data.usages || []).forEach((u: UsageRecord) => {
          batch2.set(doc(db, 'usages', sanitizeId(u.id, 'usg')), buildUsageDoc(u, uid));
        });
        (data.restocks || []).forEach((r: RestockRecord) => {
          batch2.set(doc(db, 'restocks', sanitizeId(r.id, 'rst')), buildRestockDoc(r, uid));
        });
        await batch2.commit();
      };

      runRestore().catch((err) => handleFirestoreError(err, OperationType.WRITE, 'backup/restore'));

      return {
        success: true,
        message: `Import successful: Restoring ${data.cartridges.length} cartridge SKUs and ${data.branches.length} branches/offices to shared cloud database.`,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to parse JSON file: ${e.message}` };
    }
  };

  const wipeCollection = async (colName: string) => {
    const snap = await getDocs(query(collection(db, colName), where('orgId', '==', 'aesl')));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  const resetToDefaultData = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const run = async () => {
      await Promise.all([
        wipeCollection('dispatches'),
        wipeCollection('usages'),
        wipeCollection('restocks'),
      ]);
      const batch1 = writeBatch(db);
      INITIAL_CARTRIDGES.forEach((c) => {
        batch1.set(doc(db, 'cartridges', sanitizeId(c.id, 'cart')), buildCartridgeDoc(c, uid));
      });
      INITIAL_BRANCHES.forEach((b) => {
        batch1.set(doc(db, 'branches', sanitizeId(b.id, 'branch')), buildBranchDoc(b, uid));
      });
      await batch1.commit();

      const batch2 = writeBatch(db);
      INITIAL_DISPATCHES.forEach((d) => {
        batch2.set(doc(db, 'dispatches', sanitizeId(d.id, 'dsp')), buildDispatchDoc(d, uid));
      });
      await batch2.commit();
    };
    run().catch((err) => handleFirestoreError(err, OperationType.WRITE, 'resetToDefaultData'));
  };

  const clearAllData = () => {
    const run = async () => {
      await Promise.all([
        wipeCollection('dispatches'),
        wipeCollection('usages'),
        wipeCollection('restocks'),
      ]);
      await Promise.all([wipeCollection('cartridges'), wipeCollection('branches')]);
    };
    run().catch((err) => handleFirestoreError(err, OperationType.DELETE, 'clearAllData'));
  };

  const loadSampleTemplateData = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const run = async () => {
      const batch1 = writeBatch(db);
      SAMPLE_TEMPLATE_CARTRIDGES.forEach((c) => {
        batch1.set(doc(db, 'cartridges', sanitizeId(c.id, 'cart')), buildCartridgeDoc(c, uid));
      });
      SAMPLE_TEMPLATE_BRANCHES.forEach((b) => {
        batch1.set(doc(db, 'branches', sanitizeId(b.id, 'branch')), buildBranchDoc(b, uid));
      });
      await batch1.commit();

      const batch2 = writeBatch(db);
      SAMPLE_TEMPLATE_DISPATCHES.forEach((d) => {
        batch2.set(doc(db, 'dispatches', sanitizeId(d.id, 'dsp')), buildDispatchDoc(d, uid));
      });
      SAMPLE_TEMPLATE_USAGES.forEach((u) => {
        batch2.set(doc(db, 'usages', sanitizeId(u.id, 'usg')), buildUsageDoc(u, uid));
      });
      SAMPLE_TEMPLATE_RESTOCKS.forEach((r) => {
        batch2.set(doc(db, 'restocks', sanitizeId(r.id, 'rst')), buildRestockDoc(r, uid));
      });
      await batch2.commit();
    };
    run().catch((err) => handleFirestoreError(err, OperationType.WRITE, 'loadSampleTemplateData'));
  };

  const loadAESLBranches = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const batch = writeBatch(db);
    AESL_LOCATIONS.forEach((b) => {
      batch.set(doc(db, 'branches', sanitizeId(b.id, 'branch')), buildBranchDoc(b, uid));
    });
    batch.commit().catch((err) => handleFirestoreError(err, OperationType.WRITE, 'branches/aesl'));
  };

  return (
    <InventoryContext.Provider
      value={{
        cartridges,
        branches,
        dispatches,
        usages,
        restocks,
        inventoryLoading,
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
