export type CartridgeColor = 'Black' | 'Cyan' | 'Magenta' | 'Yellow' | 'Tri-Color' | 'Drum Unit' | 'Waste Box';

export type CartridgeType = 'Toner' | 'Ink Tank' | 'Ink Cartridge' | 'Drum Unit' | 'Maintenance Box';

export interface CartridgeSKU {
  id: string;
  sku: string;
  model: string;
  specification?: string;
  brand: string;
  type: CartridgeType;
  color: CartridgeColor;
  compatiblePrinters: string[];
  centralStock: number; // In Office Stock at the moment (Warehouse)
  minThreshold: number; // Gauge threshold (default 15)
  unitCost: number;
  supplier: string;
  pageYield: number;
  reorderPackSize: number;
  isBestSeller?: boolean;
  notes?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  model: string;
  location: string;
  cartridgeSkuId: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  category?: 'Headquarters' | 'Regional Branch';
  city: string;
  address: string;
  managerName: string;
  contactPhone: string;
  email: string;
  printers: PrinterDevice[];
}

export type DispatchStatus = 'Pending' | 'In Transit' | 'Delivered';

export interface DispatchRecord {
  id: string;
  dispatchCode: string;
  branchId: string;
  branchName: string;
  cartridgeId: string;
  cartridgeModel: string;
  cartridgeColor: CartridgeColor;
  quantity: number;
  dispatchDate: string;
  carrier: string;
  trackingNumber: string;
  dispatchedBy: string;
  receivedBy?: string;
  receivedDate?: string;
  status: DispatchStatus;
  notes?: string;
}

export type UsageReason = 'Depleted' | 'Streaks or Print Defect' | 'Routine Scheduled Swap' | 'Printer Service';

export interface UsageRecord {
  id: string;
  usageCode: string;
  branchId: string;
  branchName: string;
  cartridgeId: string;
  cartridgeModel: string;
  cartridgeColor: CartridgeColor;
  printerName: string;
  quantity: number;
  installedDate: string;
  installedBy: string;
  reason: UsageReason;
  estimatedPagesPrinted?: number;
  notes?: string;
}

export interface RestockRecord {
  id: string;
  poNumber: string;
  cartridgeId: string;
  cartridgeModel: string;
  quantityReceived: number;
  unitCost: number;
  supplier: string;
  receivedDate: string;
  receivedBy: string;
  notes?: string;
}

export interface LowStockAlert {
  cartridge: CartridgeSKU;
  currentStock: number;
  minThreshold: number;
  deficit: number;
  suggestedReorder: number;
  severity: 'CRITICAL' | 'WARNING'; // CRITICAL: stock <= 5 (1/3 of threshold), WARNING: stock < threshold
}
