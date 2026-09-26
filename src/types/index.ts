export type UserRole = 'manager' | 'warehouse_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  warehouseId: string;
  avatarUrl?: string;
}

export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string; // 'pcs' | 'box' | 'kg' | 'roll' | 'pack'
  warehouseId: string;
  binLocation: string; // e.g. "A02-R03-S01"
  stockOnHand: number;
  stockReserved: number; // committed to pending pick lists
  minThreshold: number; // reorder trigger
  maxCapacity: number;
  unitCost: number; // wholesale purchase cost
  unitPrice: number; // selling/valuation price
  supplierId: string;
  supplierName: string;
  barcode: string; // e.g. "890100452311"
  lastCountedAt: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  totalBins: number;
  managerName: string;
}

export type POStatus = 'draft' | 'ordered' | 'shipped' | 'partially_received' | 'received' | 'cancelled';

export interface POItem {
  itemId: string;
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  status: POStatus;
  items: POItem[];
  totalCost: number;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  notes?: string;
  createdBy: string;
}

export type DispatchStatus = 'pending_picking' | 'picking_in_progress' | 'picked' | 'staged' | 'dispatched' | 'cancelled';

export interface PickItem {
  itemId: string;
  sku: string;
  name: string;
  binLocation: string;
  requestedQty: number;
  pickedQty: number;
  isCompleted: boolean;
}

export interface OutboundDispatch {
  id: string;
  orderNumber: string;
  customerName: string;
  warehouseId: string;
  priority: 'urgent' | 'standard' | 'low';
  status: DispatchStatus;
  items: PickItem[];
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

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

export interface StockTransfer {
  id: string;
  transferNumber: string;
  itemId: string;
  sku: string;
  name: string;
  qty: number;
  fromWarehouseId: string;
  fromBin: string;
  toWarehouseId: string;
  toBin: string;
  status: 'pending' | 'completed';
  reason: string;
  requestedBy: string;
  completedAt?: string;
  createdAt: string;
}

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

export type MovementType =
  | 'INBOUND_PO'
  | 'OUTBOUND_DISPATCH'
  | 'INTERNAL_TRANSFER'
  | 'CYCLE_COUNT_ADJUST'
  | 'MANUAL_WRITE_OFF'
  | 'MANUAL_RESTOCK';

export interface StockMovement {
  id: string;
  timestamp: string;
  itemId: string;
  sku: string;
  itemName: string;
  warehouseId: string;
  movementType: MovementType;
  qtyDelta: number; // positive for addition, negative for deduction
  stockAfter: number;
  referenceId: string; // e.g., PO#, Dispatch#, or Transfer#
  userName: string;
  userRole: UserRole;
  reason: string;
}

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
