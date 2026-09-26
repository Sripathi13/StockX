// StockX Enterprise Inventory Management System Types

export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  warehouseId: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type UnitOfMeasure = 'kg' | 'Units' | 'Liters' | 'Pieces';

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount?: number;
  totalValue?: number;
  createdAt: string;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  locationCode: string; // e.g. "WH-A-Z1-R01-S02-B04"
  locationName: string;
  zone: string;         // e.g. "Zone A"
  rack: string;         // e.g. "Rack A-01"
  shelf: string;        // e.g. "Shelf A-01-03"
  bin: string;          // e.g. "Bin B-02"
  capacity: number;
  occupancyCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  capacity: number;
  managerId?: string;
  managerName: string;
  isActive: boolean;
  locations?: WarehouseLocation[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string;
  unit: UnitOfMeasure;
  warehouseId: string;
  locationId?: string;
  binLocation: string; // e.g. "Zone A / Rack A-01 / Shelf A-01-03"
  stockOnHand: number;
  stockReserved: number;
  stockAvailable: number; // stockOnHand - stockReserved
  minThreshold: number; // Reorder Point
  reorderQuantity: number;
  unitCost: number; // wholesale purchase cost
  unitPrice: number; // selling price
  supplierId: string;
  supplierName: string;
  barcode: string;
  lastCountedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastUpdated: string;
}

// Receipts (Incoming Goods)
export type ReceiptStatus = 'Draft' | 'Waiting' | 'Received' | 'Done' | 'Cancelled';

export interface ReceiptItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  expectedDate: string;
  receivedDate?: string;
  status: ReceiptStatus;
  items: ReceiptItem[];
  totalCost: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Deliveries (Outgoing Goods)
export type DeliveryStatus =
  | 'Draft'
  | 'Picking'
  | 'Packed'
  | 'Ready'
  | 'Shipped'
  | 'Done'
  | 'Cancelled';

export interface DeliveryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  binLocation: string;
  orderedQty: number;
  pickedQty: number;
  packedQty: number;
  shippedQty: number;
  unitPrice: number;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  customerName: string;
  warehouseId: string;
  deliveryDate: string;
  priority: 'urgent' | 'standard' | 'low';
  status: DeliveryStatus;
  items: DeliveryItem[];
  totalAmount: number;
  notes?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
}

// Internal Transfers
export type TransferStatus =
  | 'Draft'
  | 'Waiting'
  | 'In Transit'
  | 'Received'
  | 'Done'
  | 'Cancelled';

export interface TransferItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface InternalTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromLocationId?: string;
  fromBin: string;
  toWarehouseId: string;
  toLocationId?: string;
  toBin: string;
  items: TransferItem[];
  reason: string;
  status: TransferStatus;
  requestedBy: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Stock Adjustments
export type AdjustmentReason = 'Damage' | 'Loss' | 'Recount' | 'Correction' | 'Expired';
export type AdjustmentStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Done' | 'Cancelled';

export interface AdjustmentItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  recordedQty: number;
  physicalQty: number;
  varianceQty: number; // physical - recorded
  unitCost: number;
  varianceValue: number;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  locationId?: string;
  binLocation?: string;
  reason: AdjustmentReason;
  status: AdjustmentStatus;
  items: AdjustmentItem[];
  totalVarianceValue: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Stock Ledger (Immutable History)
export type MovementType =
  | 'RECEIPT'
  | 'DELIVERY'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT_POSITIVE'
  | 'ADJUSTMENT_NEGATIVE';

export type ReferenceType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT' | 'COUNT';

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  locationCode?: string;
  movementType: MovementType;
  quantityChange: number; // + or -
  balanceAfter: number;
  referenceType: ReferenceType;
  referenceId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  notes?: string;
}

// Suppliers
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  rating: number; // 1-5
  categories: string[];
}

// Audit Logs
export interface SystemAuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress: string;
  createdAt: string;
}

// System Settings
export interface CompanySettings {
  companyName: string;
  address: string;
  taxId: string;
  currency: string;
  timezone: string;
  lowStockThreshold: number;
  autoReserveStock: boolean;
  requireAdjustmentApproval: boolean;
  notificationEmail: string;
}

// Notifications
export interface SystemNotification {
  id: string;
  type: 'LOW_STOCK' | 'RECEIPT_PENDING' | 'DELIVERY_READY' | 'ADJUSTMENT_PENDING' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  targetTab?: string;
}

// Shelving Tasks (Floor Put-away)
export interface ShelvingTask {
  id: string;
  taskNumber: string;
  sourcePoNumber: string;
  itemId: string;
  sku: string;
  name: string;
  qtyToShelve: number;
  targetWarehouseId: string;
  targetBin: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  completedAt?: string;
  createdAt: string;
}

// Cycle Counting
export interface CycleCountItem {
  itemId: string;
  sku: string;
  name: string;
  binLocation: string;
  systemQty: number;
  countedQty: number | null;
  discrepancy: number;
  countedBy?: string;
  note?: string;
}

export interface CycleCountSession {
  id: string;
  sessionNumber: string;
  warehouseId: string;
  aisle: string;
  status: 'open' | 'in_progress' | 'submitted' | 'reconciled';
  items: CycleCountItem[];
  assignedStaffName: string;
  createdAt: string;
  completedAt?: string;
  reconciledAt?: string;
}
