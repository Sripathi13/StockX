// StockX Enterprise Inventory Management System - Context & State Engine
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Category,
  Warehouse,
  WarehouseLocation,
  Supplier,
  InventoryItem,
  Receipt,
  ReceiptStatus,
  Delivery,
  DeliveryStatus,
  InternalTransfer,
  TransferStatus,
  StockAdjustment,
  AdjustmentReason,
  StockLedgerEntry,
  SystemAuditLog,
  CompanySettings,
  SystemNotification,
  ShelvingTask,
  CycleCountSession,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_WAREHOUSES,
  INITIAL_LOCATIONS,
  INITIAL_SUPPLIERS,
  INITIAL_ITEMS,
  INITIAL_RECEIPTS,
  INITIAL_DELIVERIES,
  INITIAL_TRANSFERS,
  INITIAL_ADJUSTMENTS,
  INITIAL_STOCK_LEDGER,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SHELVING_TASKS,
  INITIAL_CYCLE_COUNTS,
} from '../data/initialData';
import { soundService } from '../utils/audio';

interface InventoryContextType {
  // Authentication & Users
  currentUser: User | null;
  users: User[];
  login: (email: string, role?: UserRole) => boolean;
  register: (data: { name: string; email: string; role: UserRole; title?: string; warehouseId?: string }) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  requestPasswordResetOTP: (email: string) => { success: boolean; code?: string; error?: string };
  verifyPasswordResetOTP: (email: string, code: string) => boolean;
  resetPassword: (email: string, newPass: string) => boolean;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  toggleUserStatus: (userId: string) => void;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;

  // Active Workspace
  activeWarehouseId: string;
  setActiveWarehouseId: (id: string) => void;
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  notifications: SystemNotification[];
  markNotificationRead: (id: string) => void;

  // Master Data
  categories: Category[];
  addCategory: (data: { name: string; description: string }) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  warehouses: Warehouse[];
  addWarehouse: (data: Omit<Warehouse, 'id' | 'createdAt' | 'locations'>) => void;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;

  locations: WarehouseLocation[];
  addLocation: (data: Omit<WarehouseLocation, 'id' | 'createdAt' | 'occupancyCount'>) => void;
  updateLocation: (id: string, updates: Partial<WarehouseLocation>) => void;

  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;

  // Products
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastCountedAt' | 'stockAvailable'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;

  // Receipts
  receipts: Receipt[];
  createReceipt: (data: {
    supplierId: string;
    warehouseId: string;
    expectedDate: string;
    notes?: string;
    items: { productId: string; orderedQty: number; unitCost: number }[];
  }) => void;
  updateReceiptStatus: (receiptId: string, status: ReceiptStatus, receivedQtyMap?: Record<string, number>) => void;

  // Deliveries
  deliveries: Delivery[];
  createDelivery: (data: {
    customerName: string;
    warehouseId: string;
    deliveryDate: string;
    priority: 'urgent' | 'standard' | 'low';
    notes?: string;
    items: { productId: string; orderedQty: number; unitPrice: number }[];
  }) => void;
  updateDeliveryStatus: (deliveryId: string, status: DeliveryStatus) => void;
  pickDeliveryItem: (deliveryId: string, productId: string, qtyPicked: number) => void;
  packDeliveryItem: (deliveryId: string, productId: string, qtyPacked: number) => void;

  // Internal Transfers
  transfers: InternalTransfer[];
  createTransfer: (data: {
    fromWarehouseId: string;
    fromBin: string;
    toWarehouseId: string;
    toBin: string;
    reason: string;
    items: { productId: string; quantity: number }[];
  }) => void;
  updateTransferStatus: (transferId: string, status: TransferStatus) => void;

  // Stock Adjustments
  adjustments: StockAdjustment[];
  createAdjustment: (data: {
    warehouseId: string;
    locationId?: string;
    binLocation?: string;
    reason: AdjustmentReason;
    notes?: string;
    items: { productId: string; recordedQty: number; physicalQty: number; notes?: string }[];
  }) => void;
  approveAdjustment: (adjustmentId: string) => void;
  rejectAdjustment: (adjustmentId: string) => void;

  // Stock Ledger & Auditing
  stockLedger: StockLedgerEntry[];
  auditLogs: SystemAuditLog[];
  logAudit: (action: string, entityType: string, entityId?: string, details?: string) => void;

  // Warehouse Floor Ops
  shelvingTasks: ShelvingTask[];
  completeShelvingTask: (taskId: string, finalBin: string) => void;
  cycleCounts: CycleCountSession[];
  createCycleCountSession: (warehouseId: string, aisle: string) => void;
  recordCycleCountItem: (sessionId: string, itemId: string, countedQty: number, note?: string) => void;
  reconcileCycleCount: (sessionId: string) => void;

  // System Utilities
  resetDatabase: () => void;
  exportDataAsJSON: () => void;
  importDataFromJSON: (jsonData: string) => boolean;
  exportProductsCSV: () => void;
  exportStockLedgerCSV: () => void;
}

const STORAGE_PREFIX = 'stockx_ims_prod_v1_';
const LEGACY_STORAGE_PREFIX = 'stockvault_ims_prod_v1_';

function getStored<T>(key: string, fallback: T): T {
  try {
    let item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) {
      item = localStorage.getItem(LEGACY_STORAGE_PREFIX + key);
    }
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {
    // localStorage quota limit
  }
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users & Session
  const [users, setUsers] = useState<User[]>(() =>
    getStored<User[]>('users', INITIAL_USERS)
  );
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStored<User | null>('currentUser', INITIAL_USERS[0])
  );
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() =>
    getStored<string>('activeWarehouseId', 'wh_alpha')
  );

  // Entities
  const [categories, setCategories] = useState<Category[]>(() =>
    getStored<Category[]>('categories', INITIAL_CATEGORIES)
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() =>
    getStored<Warehouse[]>('warehouses', INITIAL_WAREHOUSES)
  );
  const [locations, setLocations] = useState<WarehouseLocation[]>(() =>
    getStored<WarehouseLocation[]>('locations', INITIAL_LOCATIONS)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    getStored<Supplier[]>('suppliers', INITIAL_SUPPLIERS)
  );
  const [items, setItems] = useState<InventoryItem[]>(() =>
    getStored<InventoryItem[]>('items', INITIAL_ITEMS)
  );
  const [receipts, setReceipts] = useState<Receipt[]>(() =>
    getStored<Receipt[]>('receipts', INITIAL_RECEIPTS)
  );
  const [deliveries, setDeliveries] = useState<Delivery[]>(() =>
    getStored<Delivery[]>('deliveries', INITIAL_DELIVERIES)
  );
  const [transfers, setTransfers] = useState<InternalTransfer[]>(() =>
    getStored<InternalTransfer[]>('transfers', INITIAL_TRANSFERS)
  );
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() =>
    getStored<StockAdjustment[]>('adjustments', INITIAL_ADJUSTMENTS)
  );
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>(() =>
    getStored<StockLedgerEntry[]>('stockLedger', INITIAL_STOCK_LEDGER)
  );
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() =>
    getStored<SystemAuditLog[]>('auditLogs', INITIAL_AUDIT_LOGS)
  );
  const [settings, setSettings] = useState<CompanySettings>(() =>
    getStored<CompanySettings>('settings', INITIAL_SETTINGS)
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    getStored<SystemNotification[]>('notifications', INITIAL_NOTIFICATIONS)
  );
  const [shelvingTasks, setShelvingTasks] = useState<ShelvingTask[]>(() =>
    getStored<ShelvingTask[]>('shelvingTasks', INITIAL_SHELVING_TASKS)
  );
  const [cycleCounts, setCycleCounts] = useState<CycleCountSession[]>(() =>
    getStored<CycleCountSession[]>('cycleCounts', INITIAL_CYCLE_COUNTS)
  );

  // Persistence hooks
  useEffect(() => setStored('users', users), [users]);
  useEffect(() => setStored('currentUser', currentUser), [currentUser]);
  useEffect(() => setStored('activeWarehouseId', activeWarehouseId), [activeWarehouseId]);
  useEffect(() => setStored('categories', categories), [categories]);
  useEffect(() => setStored('warehouses', warehouses), [warehouses]);
  useEffect(() => setStored('locations', locations), [locations]);
  useEffect(() => setStored('suppliers', suppliers), [suppliers]);
  useEffect(() => setStored('items', items), [items]);
  useEffect(() => setStored('receipts', receipts), [receipts]);
  useEffect(() => setStored('deliveries', deliveries), [deliveries]);
  useEffect(() => setStored('transfers', transfers), [transfers]);
  useEffect(() => setStored('adjustments', adjustments), [adjustments]);
  useEffect(() => setStored('stockLedger', stockLedger), [stockLedger]);
  useEffect(() => setStored('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => setStored('settings', settings), [settings]);
  useEffect(() => setStored('notifications', notifications), [notifications]);
  useEffect(() => setStored('shelvingTasks', shelvingTasks), [shelvingTasks]);
  useEffect(() => setStored('cycleCounts', cycleCounts), [cycleCounts]);

  // System Audit Logger
  const logAudit = (action: string, entityType: string, entityId?: string, details?: string) => {
    const entry: SystemAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUser?.id || 'sys_auto',
      userName: currentUser?.name || 'System Worker',
      userEmail: currentUser?.email || 'system@stockx.corp',
      userRole: currentUser?.role || 'ADMIN',
      action,
      entityType,
      entityId,
      details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 199)]);
  };

  // Auth Operations
  const login = (email: string, explicitRole?: UserRole): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    let found = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      // Find matching user by role if provided
      if (explicitRole) {
        found = users.find((u) => u.role === explicitRole);
      }
    }
    if (!found) {
      // Create new user profile if authenticating for first time
      found = {
        id: `usr_${Date.now().toString(36)}`,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: cleanEmail,
        role: explicitRole || 'INVENTORY_MANAGER',
        title: 'Operations Specialist',
        warehouseId: activeWarehouseId || 'wh_alpha',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, found!]);
    }

    const updatedUser = { ...found, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    logAudit('USER_LOGIN', 'AUTH', updatedUser.id, `${updatedUser.name} signed in as ${updatedUser.role}`);
    soundService.playSuccessChime();
    return true;
  };

  const register = (data: { name: string; email: string; role: UserRole; title?: string; warehouseId?: string }): { success: boolean; error?: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this workplace email already exists.' };
    }
    const newUser: User = {
      id: `usr_${Date.now().toString(36)}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role,
      title: data.title || (data.role === 'ADMIN' ? 'System Administrator' : data.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Warehouse Specialist'),
      warehouseId: data.warehouseId || activeWarehouseId,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    logAudit('USER_REGISTERED', 'AUTH', newUser.id, `New account registered for ${newUser.name} with role ${newUser.role}`);
    soundService.playSuccessChime();
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      logAudit('USER_LOGOUT', 'AUTH', currentUser.id, `${currentUser.name} signed out`);
    }
    setCurrentUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      logAudit('ROLE_SWITCHED', 'AUTH', currentUser.id, `Switched active role to ${newRole}`);
    }
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated = { ...target, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      logAudit('USER_SWITCHED', 'AUTH', target.id, `Active operator switched to ${target.name} (${target.role})`);
      soundService.playSuccessChime();
    }
  };

  // Password Reset Simulation
  const [resetOTPStore, setResetOTPStore] = useState<Record<string, string>>({});

  const requestPasswordResetOTP = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, error: 'No account registered with this email.' };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setResetOTPStore((prev) => ({ ...prev, [cleanEmail]: otp }));
    logAudit('PASSWORD_RESET_REQUESTED', 'AUTH', user.id, `Verification OTP generated for ${cleanEmail}`);
    return { success: true, code: otp };
  };

  const verifyPasswordResetOTP = (email: string, code: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const stored = resetOTPStore[cleanEmail];
    return !!stored && stored === code.trim();
  };

  const resetPassword = (email: string, _newPass: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    logAudit('PASSWORD_RESET_SUCCESS', 'AUTH', undefined, `Password reset completed for ${cleanEmail}`);
    setResetOTPStore((prev) => {
      const next = { ...prev };
      delete next[cleanEmail];
      return next;
    });
    return true;
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
    logAudit('USER_ROLE_UPDATED', 'USER', userId, `Updated user role to ${newRole}`);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
    logAudit('USER_STATUS_TOGGLED', 'USER', userId, `Toggled active state`);
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('USER_CREATED', 'USER', newUser.id, `Created user ${newUser.name} (${newUser.role})`);
  };

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('SETTINGS_UPDATED', 'SETTINGS', undefined, `Updated company configuration`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Master Categories
  const addCategory = (data: { name: string; description: string }) => {
    const newCat: Category = {
      id: `cat_${Date.now().toString(36)}`,
      name: data.name.trim(),
      description: data.description.trim(),
      itemCount: 0,
      totalValue: 0,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    logAudit('CATEGORY_CREATED', 'CATEGORY', newCat.id, `Created category "${newCat.name}"`);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logAudit('CATEGORY_UPDATED', 'CATEGORY', id, `Updated category details`);
  };

  const deleteCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    logAudit('CATEGORY_DELETED', 'CATEGORY', id, `Deleted category "${target?.name}"`);
  };

  // Master Warehouses & Locations
  const addWarehouse = (data: Omit<Warehouse, 'id' | 'createdAt' | 'locations'>) => {
    const newWh: Warehouse = {
      ...data,
      id: `wh_${Date.now().toString(36)}`,
      locations: [],
      createdAt: new Date().toISOString(),
    };
    setWarehouses((prev) => [...prev, newWh]);
    logAudit('WAREHOUSE_CREATED', 'WAREHOUSE', newWh.id, `Created warehouse "${newWh.name}"`);
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
    logAudit('WAREHOUSE_UPDATED', 'WAREHOUSE', id, `Updated warehouse settings`);
  };

  const addLocation = (data: Omit<WarehouseLocation, 'id' | 'createdAt' | 'occupancyCount'>) => {
    const newLoc: WarehouseLocation = {
      ...data,
      id: `loc_${Date.now().toString(36)}`,
      occupancyCount: 0,
      createdAt: new Date().toISOString(),
    };
    setLocations((prev) => [...prev, newLoc]);
    // Also attach to warehouse list
    setWarehouses((prev) =>
      prev.map((w) =>
        w.id === data.warehouseId
          ? { ...w, locations: [...(w.locations || []), newLoc] }
          : w
      )
    );
    logAudit('LOCATION_CREATED', 'LOCATION', newLoc.id, `Created bin location "${newLoc.locationCode}" in ${newLoc.zone}`);
  };

  const updateLocation = (id: string, updates: Partial<WarehouseLocation>) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    logAudit('LOCATION_UPDATED', 'LOCATION', id, `Updated location`);
  };

  // Suppliers
  const addSupplier = (data: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      ...data,
      id: `sup_${Date.now().toString(36)}`,
    };
    setSuppliers((prev) => [...prev, newSup]);
    logAudit('SUPPLIER_CREATED', 'SUPPLIER', newSup.id, `Added supplier "${newSup.name}"`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    logAudit('SUPPLIER_UPDATED', 'SUPPLIER', id, `Updated supplier info`);
  };

  // Products (Inventory Items)
  const addItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastCountedAt' | 'stockAvailable'>) => {
    const now = new Date().toISOString();
    const stockAvailable = itemData.stockOnHand - itemData.stockReserved;
    const newItem: InventoryItem = {
      ...itemData,
      id: `itm_${Date.now().toString(36)}`,
      stockAvailable: Math.max(0, stockAvailable),
      createdAt: now,
      updatedAt: now,
      lastCountedAt: now.split('T')[0],
    };
    setItems((prev) => [newItem, ...prev]);

    // Initial stock ledger entry if starting with stock > 0
    if (newItem.stockOnHand > 0) {
      const wh = warehouses.find((w) => w.id === newItem.warehouseId);
      const ledgerEntry: StockLedgerEntry = {
        id: `ledg_${Date.now().toString(36)}`,
        timestamp: now,
        productId: newItem.id,
        sku: newItem.sku,
        productName: newItem.name,
        warehouseId: newItem.warehouseId,
        warehouseName: wh?.name || 'Primary Warehouse',
        locationCode: newItem.binLocation,
        movementType: 'RECEIPT',
        quantityChange: newItem.stockOnHand,
        balanceAfter: newItem.stockOnHand,
        referenceType: 'RECEIPT',
        referenceId: 'INITIAL_STOCK',
        userId: currentUser?.id || 'usr_admin_01',
        userName: currentUser?.name || 'Administrator',
        userRole: currentUser?.role || 'ADMIN',
        notes: 'Initial product stock on boarding.',
      };
      setStockLedger((prev) => [ledgerEntry, ...prev]);
    }

    logAudit('PRODUCT_CREATED', 'PRODUCT', newItem.id, `Created product "${newItem.name}" (${newItem.sku})`);
    soundService.playSuccessChime();
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates, updatedAt: new Date().toISOString() };
          updated.stockAvailable = Math.max(0, updated.stockOnHand - updated.stockReserved);
          return updated;
        }
        return item;
      })
    );
    logAudit('PRODUCT_UPDATED', 'PRODUCT', id, `Updated product parameters`);
  };

  const deleteItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    logAudit('PRODUCT_DELETED', 'PRODUCT', id, `Deleted product "${target?.name}" (${target?.sku})`);
  };

  // Receipts (Incoming Goods)
  const createReceipt = (data: {
    supplierId: string;
    warehouseId: string;
    expectedDate: string;
    notes?: string;
    items: { productId: string; orderedQty: number; unitCost: number }[];
  }) => {
    const sup = suppliers.find((s) => s.id === data.supplierId);
    const receiptItems = data.items.map((i, idx) => {
      const prod = items.find((p) => p.id === i.productId);
      return {
        id: `ri_${Date.now()}_${idx}`,
        productId: i.productId,
        sku: prod?.sku || 'SKU-UNKNOWN',
        name: prod?.name || 'Product',
        orderedQty: i.orderedQty,
        receivedQty: 0,
        unitCost: i.unitCost,
      };
    });

    const totalCost = receiptItems.reduce((acc, curr) => acc + curr.orderedQty * curr.unitCost, 0);
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReceipt: Receipt = {
      id: `rec_${Date.now().toString(36)}`,
      receiptNumber,
      supplierId: data.supplierId,
      supplierName: sup?.name || 'Authorized Supplier',
      warehouseId: data.warehouseId,
      expectedDate: data.expectedDate,
      status: 'Draft',
      items: receiptItems,
      totalCost,
      notes: data.notes,
      createdBy: currentUser?.name || 'Sarah Vance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    logAudit('RECEIPT_CREATED', 'RECEIPT', newReceipt.id, `Created receipt ${receiptNumber} from ${newReceipt.supplierName}`);
    soundService.playSuccessChime();
  };

  const updateReceiptStatus = (
    receiptId: string,
    newStatus: ReceiptStatus,
    receivedQtyMap?: Record<string, number>
  ) => {
    setReceipts((prev) =>
      prev.map((rec) => {
        if (rec.id !== receiptId) return rec;

        const updatedItems = rec.items.map((item) => {
          if (receivedQtyMap && receivedQtyMap[item.productId] !== undefined) {
            return { ...item, receivedQty: receivedQtyMap[item.productId] };
          }
          if (newStatus === 'Received' && item.receivedQty === 0) {
            return { ...item, receivedQty: item.orderedQty };
          }
          return item;
        });

        return {
          ...rec,
          status: newStatus,
          items: updatedItems,
          approvedBy: newStatus === 'Done' ? currentUser?.name : rec.approvedBy,
          receivedDate: newStatus === 'Received' || newStatus === 'Done' ? new Date().toISOString() : rec.receivedDate,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const targetReceipt = receipts.find((r) => r.id === receiptId);
    if (!targetReceipt) return;

    // When status changes to Done: Stock on Hand increases & Stock Ledger entry is written!
    if (newStatus === 'Done') {
      const wh = warehouses.find((w) => w.id === targetReceipt.warehouseId);
      targetReceipt.items.forEach((rItem) => {
        const qtyToAdd = receivedQtyMap && receivedQtyMap[rItem.productId] !== undefined
          ? receivedQtyMap[rItem.productId]
          : (rItem.receivedQty > 0 ? rItem.receivedQty : rItem.orderedQty);

        if (qtyToAdd > 0) {
          setItems((prevItems) =>
            prevItems.map((prod) => {
              if (prod.id === rItem.productId) {
                const newOnHand = prod.stockOnHand + qtyToAdd;
                const newAvailable = newOnHand - prod.stockReserved;
                return {
                  ...prod,
                  stockOnHand: newOnHand,
                  stockAvailable: Math.max(0, newAvailable),
                  updatedAt: new Date().toISOString(),
                };
              }
              return prod;
            })
          );

          // Write immutable Stock Ledger Record
          const prodObj = items.find((p) => p.id === rItem.productId);
          const balanceAfter = (prodObj?.stockOnHand || 0) + qtyToAdd;
          const ledgerEntry: StockLedgerEntry = {
            id: `ledg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            productId: rItem.productId,
            sku: rItem.sku,
            productName: rItem.name,
            warehouseId: targetReceipt.warehouseId,
            warehouseName: wh?.name || 'Warehouse',
            locationCode: prodObj?.binLocation || 'Dock Staging',
            movementType: 'RECEIPT',
            quantityChange: qtyToAdd,
            balanceAfter,
            referenceType: 'RECEIPT',
            referenceId: targetReceipt.receiptNumber,
            userId: currentUser?.id || 'usr_admin',
            userName: currentUser?.name || 'Administrator',
            userRole: currentUser?.role || 'ADMIN',
            notes: `Goods received and stocked from PO ${targetReceipt.receiptNumber}`,
          };
          setStockLedger((prev) => [ledgerEntry, ...prev]);

          // Create Shelving task for warehouse floor staff
          const shelvingTask: ShelvingTask = {
            id: `shv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
            taskNumber: `SHV-${Math.floor(1000 + Math.random() * 9000)}`,
            sourcePoNumber: targetReceipt.receiptNumber,
            itemId: rItem.productId,
            sku: rItem.sku,
            name: rItem.name,
            qtyToShelve: qtyToAdd,
            targetWarehouseId: targetReceipt.warehouseId,
            targetBin: prodObj?.binLocation || 'Zone A / Rack A-01 / Shelf A-01-01',
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          setShelvingTasks((prev) => [shelvingTask, ...prev]);
        }
      });
      soundService.playSuccessChime();
    }

    logAudit('RECEIPT_STATUS_CHANGED', 'RECEIPT', receiptId, `Receipt ${targetReceipt.receiptNumber} status changed to ${newStatus}`);
  };

  // Deliveries (Outgoing Goods)
  const createDelivery = (data: {
    customerName: string;
    warehouseId: string;
    deliveryDate: string;
    priority: 'urgent' | 'standard' | 'low';
    notes?: string;
    items: { productId: string; orderedQty: number; unitPrice: number }[];
  }) => {
    const deliveryItems = data.items.map((i, idx) => {
      const prod = items.find((p) => p.id === i.productId);
      return {
        id: `di_${Date.now()}_${idx}`,
        productId: i.productId,
        sku: prod?.sku || 'SKU',
        name: prod?.name || 'Item',
        binLocation: prod?.binLocation || 'Aisle 01',
        orderedQty: i.orderedQty,
        pickedQty: 0,
        packedQty: 0,
        shippedQty: 0,
        unitPrice: i.unitPrice,
      };
    });

    const totalAmount = deliveryItems.reduce((acc, curr) => acc + curr.orderedQty * curr.unitPrice, 0);
    const deliveryNumber = `DEL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDelivery: Delivery = {
      id: `del_${Date.now().toString(36)}`,
      deliveryNumber,
      customerName: data.customerName,
      warehouseId: data.warehouseId,
      deliveryDate: data.deliveryDate,
      priority: data.priority,
      status: 'Draft',
      items: deliveryItems,
      totalAmount,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDeliveries((prev) => [newDelivery, ...prev]);

    // Reserve stock if autoReserveStock enabled
    if (settings.autoReserveStock) {
      data.items.forEach((di) => {
        setItems((prevItems) =>
          prevItems.map((prod) => {
            if (prod.id === di.productId) {
              const newReserved = prod.stockReserved + di.orderedQty;
              return {
                ...prod,
                stockReserved: newReserved,
                stockAvailable: Math.max(0, prod.stockOnHand - newReserved),
              };
            }
            return prod;
          })
        );
      });
    }

    logAudit('DELIVERY_CREATED', 'DELIVERY', newDelivery.id, `Created delivery ${deliveryNumber} for ${newDelivery.customerName}`);
    soundService.playSuccessChime();
  };

  const updateDeliveryStatus = (deliveryId: string, newStatus: DeliveryStatus) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, status: newStatus, updatedAt: new Date().toISOString() } : d))
    );

    const deliv = deliveries.find((d) => d.id === deliveryId);
    if (!deliv) return;

    // When status changes to Done: Deduct Stock on Hand, Release Reserve, Write Stock Ledger!
    if (newStatus === 'Done') {
      const wh = warehouses.find((w) => w.id === deliv.warehouseId);
      deliv.items.forEach((dItem) => {
        const qtyShipped = dItem.shippedQty > 0 ? dItem.shippedQty : (dItem.packedQty > 0 ? dItem.packedQty : dItem.orderedQty);

        setItems((prevItems) =>
          prevItems.map((prod) => {
            if (prod.id === dItem.productId) {
              const newOnHand = Math.max(0, prod.stockOnHand - qtyShipped);
              const newReserved = Math.max(0, prod.stockReserved - qtyShipped);
              return {
                ...prod,
                stockOnHand: newOnHand,
                stockReserved: newReserved,
                stockAvailable: Math.max(0, newOnHand - newReserved),
                updatedAt: new Date().toISOString(),
              };
            }
            return prod;
          })
        );

        // Write immutable Stock Ledger Record
        const prodObj = items.find((p) => p.id === dItem.productId);
        const balanceAfter = Math.max(0, (prodObj?.stockOnHand || 0) - qtyShipped);
        const ledgerEntry: StockLedgerEntry = {
          id: `ledg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          productId: dItem.productId,
          sku: dItem.sku,
          productName: dItem.name,
          warehouseId: deliv.warehouseId,
          warehouseName: wh?.name || 'Warehouse',
          locationCode: dItem.binLocation,
          movementType: 'DELIVERY',
          quantityChange: -qtyShipped,
          balanceAfter,
          referenceType: 'DELIVERY',
          referenceId: deliv.deliveryNumber,
          userId: currentUser?.id || 'usr_staff',
          userName: currentUser?.name || 'Fulfillment Staff',
          userRole: currentUser?.role || 'WAREHOUSE_STAFF',
          notes: `Customer dispatch fulfilled for ${deliv.customerName}`,
        };
        setStockLedger((prev) => [ledgerEntry, ...prev]);
      });
      soundService.playSuccessChime();
    } else if (newStatus === 'Cancelled') {
      // Release reserved stock on cancel
      deliv.items.forEach((dItem) => {
        setItems((prevItems) =>
          prevItems.map((prod) => {
            if (prod.id === dItem.productId) {
              const newReserved = Math.max(0, prod.stockReserved - dItem.orderedQty);
              return {
                ...prod,
                stockReserved: newReserved,
                stockAvailable: Math.max(0, prod.stockOnHand - newReserved),
              };
            }
            return prod;
          })
        );
      });
    }

    logAudit('DELIVERY_STATUS_CHANGED', 'DELIVERY', deliveryId, `Delivery ${deliv.deliveryNumber} status moved to ${newStatus}`);
  };

  const pickDeliveryItem = (deliveryId: string, productId: string, qtyPicked: number) => {
    setDeliveries((prev) =>
      prev.map((del) => {
        if (del.id !== deliveryId) return del;
        const updatedItems = del.items.map((item) =>
          item.productId === productId ? { ...item, pickedQty: qtyPicked } : item
        );
        const allPicked = updatedItems.every((i) => i.pickedQty >= i.orderedQty);
        return {
          ...del,
          items: updatedItems,
          status: allPicked ? 'Packed' : 'Picking',
          updatedAt: new Date().toISOString(),
        };
      })
    );
    soundService.playScanSuccessBeep();
    logAudit('DELIVERY_ITEM_PICKED', 'DELIVERY', deliveryId, `Picked ${qtyPicked} units of product ${productId}`);
  };

  const packDeliveryItem = (deliveryId: string, productId: string, qtyPacked: number) => {
    setDeliveries((prev) =>
      prev.map((del) => {
        if (del.id !== deliveryId) return del;
        const updatedItems = del.items.map((item) =>
          item.productId === productId ? { ...item, packedQty: qtyPacked } : item
        );
        return { ...del, items: updatedItems, updatedAt: new Date().toISOString() };
      })
    );
  };

  // Internal Transfers
  const createTransfer = (data: {
    fromWarehouseId: string;
    fromBin: string;
    toWarehouseId: string;
    toBin: string;
    reason: string;
    items: { productId: string; quantity: number }[];
  }) => {
    const transferItems = data.items.map((i, idx) => {
      const prod = items.find((p) => p.id === i.productId);
      return {
        id: `ti_${Date.now()}_${idx}`,
        productId: i.productId,
        sku: prod?.sku || 'SKU',
        name: prod?.name || 'Item',
        quantity: i.quantity,
      };
    });

    const transferNumber = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransfer: InternalTransfer = {
      id: `trf_${Date.now().toString(36)}`,
      transferNumber,
      fromWarehouseId: data.fromWarehouseId,
      fromBin: data.fromBin,
      toWarehouseId: data.toWarehouseId,
      toBin: data.toBin,
      items: transferItems,
      reason: data.reason,
      status: 'Draft',
      requestedBy: currentUser?.name || 'Sarah Vance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    logAudit('TRANSFER_CREATED', 'TRANSFER', newTransfer.id, `Created transfer ${transferNumber}`);
    soundService.playSuccessChime();
  };

  const updateTransferStatus = (transferId: string, newStatus: TransferStatus) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'Done' ? new Date().toISOString() : t.completedAt,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );

    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    if (newStatus === 'Done') {
      const fromWh = warehouses.find((w) => w.id === trf.fromWarehouseId);
      const toWh = warehouses.find((w) => w.id === trf.toWarehouseId);

      trf.items.forEach((ti) => {
        const prod = items.find((p) => p.id === ti.productId);
        // Write TRANSFER_OUT from origin
        const outLedger: StockLedgerEntry = {
          id: `ledg_${Date.now().toString(36)}_out`,
          timestamp: new Date().toISOString(),
          productId: ti.productId,
          sku: ti.sku,
          productName: ti.name,
          warehouseId: trf.fromWarehouseId,
          warehouseName: fromWh?.name || 'Origin Hub',
          locationCode: trf.fromBin,
          movementType: 'TRANSFER_OUT',
          quantityChange: -ti.quantity,
          balanceAfter: Math.max(0, (prod?.stockOnHand || 0) - ti.quantity),
          referenceType: 'TRANSFER',
          referenceId: trf.transferNumber,
          userId: currentUser?.id || 'usr_staff',
          userName: currentUser?.name || 'Operator',
          userRole: currentUser?.role || 'WAREHOUSE_STAFF',
          notes: `Transferred out to ${toWh?.name || 'Dest Hub'}: ${trf.reason}`,
        };

        // Write TRANSFER_IN to destination
        const inLedger: StockLedgerEntry = {
          id: `ledg_${Date.now().toString(36)}_in`,
          timestamp: new Date().toISOString(),
          productId: ti.productId,
          sku: ti.sku,
          productName: ti.name,
          warehouseId: trf.toWarehouseId,
          warehouseName: toWh?.name || 'Destination Hub',
          locationCode: trf.toBin,
          movementType: 'TRANSFER_IN',
          quantityChange: ti.quantity,
          balanceAfter: (prod?.stockOnHand || 0),
          referenceType: 'TRANSFER',
          referenceId: trf.transferNumber,
          userId: currentUser?.id || 'usr_staff',
          userName: currentUser?.name || 'Operator',
          userRole: currentUser?.role || 'WAREHOUSE_STAFF',
          notes: `Shelved at destination bin ${trf.toBin}`,
        };

        setStockLedger((prev) => [inLedger, outLedger, ...prev]);

        // If warehouse changed, update item warehouseId or bin location
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === ti.productId
              ? {
                  ...item,
                  warehouseId: trf.toWarehouseId,
                  binLocation: trf.toBin,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
      });
      soundService.playSuccessChime();
    }

    logAudit('TRANSFER_STATUS_CHANGED', 'TRANSFER', transferId, `Transfer ${trf.transferNumber} status changed to ${newStatus}`);
  };

  // Stock Adjustments
  const createAdjustment = (data: {
    warehouseId: string;
    locationId?: string;
    binLocation?: string;
    reason: AdjustmentReason;
    notes?: string;
    items: { productId: string; recordedQty: number; physicalQty: number; notes?: string }[];
  }) => {
    const adjItems = data.items.map((i, idx) => {
      const prod = items.find((p) => p.id === i.productId);
      const varianceQty = i.physicalQty - i.recordedQty;
      const unitCost = prod?.unitCost || 0;
      return {
        id: `ai_${Date.now()}_${idx}`,
        productId: i.productId,
        sku: prod?.sku || 'SKU',
        name: prod?.name || 'Item',
        recordedQty: i.recordedQty,
        physicalQty: i.physicalQty,
        varianceQty,
        unitCost,
        varianceValue: varianceQty * unitCost,
        notes: i.notes,
      };
    });

    const totalVarianceValue = adjItems.reduce((acc, curr) => acc + curr.varianceValue, 0);
    const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdj: StockAdjustment = {
      id: `adj_${Date.now().toString(36)}`,
      adjustmentNumber,
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      binLocation: data.binLocation,
      reason: data.reason,
      status: 'Pending Approval',
      items: adjItems,
      totalVarianceValue,
      notes: data.notes,
      createdBy: currentUser?.name || 'Operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAdjustments((prev) => [newAdj, ...prev]);
    logAudit('STOCK_ADJUSTMENT_CREATED', 'STOCK_ADJUSTMENT', newAdj.id, `Created adjustment ${adjustmentNumber} for reason: ${data.reason}`);
    soundService.playSuccessChime();
  };

  const approveAdjustment = (adjustmentId: string) => {
    const adj = adjustments.find((a) => a.id === adjustmentId);
    if (!adj) return;

    const wh = warehouses.find((w) => w.id === adj.warehouseId);

    // Apply variance to stock on hand and create stock ledger entries
    adj.items.forEach((ai) => {
      setItems((prevItems) =>
        prevItems.map((prod) => {
          if (prod.id === ai.productId) {
            const newOnHand = Math.max(0, prod.stockOnHand + ai.varianceQty);
            const newAvailable = Math.max(0, newOnHand - prod.stockReserved);
            return {
              ...prod,
              stockOnHand: newOnHand,
              stockAvailable: newAvailable,
              updatedAt: new Date().toISOString(),
            };
          }
          return prod;
        })
      );

      const prodObj = items.find((p) => p.id === ai.productId);
      const balanceAfter = Math.max(0, (prodObj?.stockOnHand || 0) + ai.varianceQty);

      const ledgerEntry: StockLedgerEntry = {
        id: `ledg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        productId: ai.productId,
        sku: ai.sku,
        productName: ai.name,
        warehouseId: adj.warehouseId,
        warehouseName: wh?.name || 'Warehouse',
        locationCode: adj.binLocation || prodObj?.binLocation || 'Warehouse Floor',
        movementType: ai.varianceQty >= 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE',
        quantityChange: ai.varianceQty,
        balanceAfter,
        referenceType: 'ADJUSTMENT',
        referenceId: adj.adjustmentNumber,
        userId: currentUser?.id || 'usr_mgr_01',
        userName: currentUser?.name || 'Inventory Manager',
        userRole: currentUser?.role || 'INVENTORY_MANAGER',
        notes: `Adjustment approved for reason ${adj.reason}: ${ai.notes || adj.notes || 'Reconciliation'}`,
      };
      setStockLedger((prev) => [ledgerEntry, ...prev]);
    });

    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjustmentId
          ? {
              ...a,
              status: 'Done',
              approvedBy: currentUser?.name || 'Manager',
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );

    logAudit('STOCK_ADJUSTMENT_APPROVED', 'STOCK_ADJUSTMENT', adjustmentId, `Approved adjustment ${adj.adjustmentNumber}`);
    soundService.playSuccessChime();
  };

  const rejectAdjustment = (adjustmentId: string) => {
    setAdjustments((prev) =>
      prev.map((a) => (a.id === adjustmentId ? { ...a, status: 'Cancelled', updatedAt: new Date().toISOString() } : a))
    );
    logAudit('STOCK_ADJUSTMENT_REJECTED', 'STOCK_ADJUSTMENT', adjustmentId, `Rejected adjustment`);
  };

  // Shelving Operations
  const completeShelvingTask = (taskId: string, finalBin: string) => {
    setShelvingTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', targetBin: finalBin, completedAt: new Date().toISOString() } : t))
    );
    const task = shelvingTasks.find((t) => t.id === taskId);
    if (task) {
      setItems((prev) =>
        prev.map((i) => (i.id === task.itemId ? { ...i, binLocation: finalBin } : i))
      );
    }
    soundService.playSuccessChime();
    logAudit('SHELVING_COMPLETED', 'SHELVING', taskId, `Put away completed at bin ${finalBin}`);
  };

  // Cycle Counts
  const createCycleCountSession = (warehouseId: string, aisle: string) => {
    const aisleItems = items.filter((i) => i.warehouseId === warehouseId);
    const countItems = aisleItems.map((item) => ({
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      binLocation: item.binLocation,
      systemQty: item.stockOnHand,
      countedQty: null,
      discrepancy: 0,
    }));

    const sessionNumber = `CC-${new Date().getFullYear()}-W${Math.floor(Math.random() * 50 + 1)}`;
    const newSession: CycleCountSession = {
      id: `cc_${Date.now().toString(36)}`,
      sessionNumber,
      warehouseId,
      aisle,
      status: 'open',
      items: countItems,
      assignedStaffName: currentUser?.name || 'Marcus Chen',
      createdAt: new Date().toISOString(),
    };

    setCycleCounts((prev) => [newSession, ...prev]);
    logAudit('CYCLE_COUNT_CREATED', 'CYCLE_COUNT', newSession.id, `Created cycle count session ${sessionNumber} for ${aisle}`);
    soundService.playSuccessChime();
  };

  const recordCycleCountItem = (sessionId: string, itemId: string, countedQty: number, note?: string) => {
    setCycleCounts((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const updated = sess.items.map((i) => {
          if (i.itemId === itemId) {
            return {
              ...i,
              countedQty,
              discrepancy: countedQty - i.systemQty,
              note,
            };
          }
          return i;
        });
        return { ...sess, items: updated, status: 'in_progress' };
      })
    );
    soundService.playScanSuccessBeep();
  };

  const reconcileCycleCount = (sessionId: string) => {
    const sess = cycleCounts.find((s) => s.id === sessionId);
    if (!sess) return;

    sess.items.forEach((ci) => {
      if (ci.countedQty !== null && ci.discrepancy !== 0) {
        // Adjust product stock
        setItems((prev) =>
          prev.map((p) => {
            if (p.id === ci.itemId) {
              const newOnHand = ci.countedQty!;
              const newAvail = Math.max(0, newOnHand - p.stockReserved);
              return { ...p, stockOnHand: newOnHand, stockAvailable: newAvail, lastCountedAt: new Date().toISOString().split('T')[0] };
            }
            return p;
          })
        );

        // Ledger record
        const prod = items.find((p) => p.id === ci.itemId);
        const wh = warehouses.find((w) => w.id === sess.warehouseId);
        const ledgerEntry: StockLedgerEntry = {
          id: `ledg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          productId: ci.itemId,
          sku: ci.sku,
          productName: ci.name,
          warehouseId: sess.warehouseId,
          warehouseName: wh?.name || 'Warehouse',
          locationCode: ci.binLocation,
          movementType: ci.discrepancy > 0 ? 'ADJUSTMENT_POSITIVE' : 'ADJUSTMENT_NEGATIVE',
          quantityChange: ci.discrepancy,
          balanceAfter: ci.countedQty,
          referenceType: 'COUNT',
          referenceId: sess.sessionNumber,
          userId: currentUser?.id || 'usr_staff',
          userName: currentUser?.name || 'Marcus Chen',
          userRole: currentUser?.role || 'WAREHOUSE_STAFF',
          notes: `Reconciled physical cycle count: ${ci.note || 'Regular count'}`,
        };
        setStockLedger((prev) => [ledgerEntry, ...prev]);
      }
    });

    setCycleCounts((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'reconciled', reconciledAt: new Date().toISOString() } : s))
    );
    logAudit('CYCLE_COUNT_RECONCILED', 'CYCLE_COUNT', sessionId, `Cycle count ${sess.sessionNumber} reconciled`);
    soundService.playSuccessChime();
  };

  // Utilities: Reset, Backups, CSV Exports
  const resetDatabase = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setActiveWarehouseId('wh_alpha');
    setCategories(INITIAL_CATEGORIES);
    setWarehouses(INITIAL_WAREHOUSES);
    setLocations(INITIAL_LOCATIONS);
    setSuppliers(INITIAL_SUPPLIERS);
    setItems(INITIAL_ITEMS);
    setReceipts(INITIAL_RECEIPTS);
    setDeliveries(INITIAL_DELIVERIES);
    setTransfers(INITIAL_TRANSFERS);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setStockLedger(INITIAL_STOCK_LEDGER);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSettings(INITIAL_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setShelvingTasks(INITIAL_SHELVING_TASKS);
    setCycleCounts(INITIAL_CYCLE_COUNTS);

    // Clear local storage
    const keysToRemove = [
      'users', 'currentUser', 'activeWarehouseId', 'categories', 'warehouses', 'locations',
      'suppliers', 'items', 'receipts', 'deliveries', 'transfers', 'adjustments',
      'stockLedger', 'auditLogs', 'settings', 'notifications', 'shelvingTasks', 'cycleCounts'
    ];
    keysToRemove.forEach((k) => {
      localStorage.removeItem(STORAGE_PREFIX + k);
      localStorage.removeItem(LEGACY_STORAGE_PREFIX + k);
    });

    soundService.playSuccessChime();
  };

  const exportDataAsJSON = () => {
    const backup = {
      appName: 'StockX Enterprise IMS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      company: settings.companyName,
      users,
      categories,
      warehouses,
      locations,
      suppliers,
      items,
      receipts,
      deliveries,
      transfers,
      adjustments,
      stockLedger,
      auditLogs,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockx_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit('DATABASE_BACKUP_EXPORTED', 'SYSTEM', undefined, 'Full database JSON backup downloaded');
  };

  const importDataFromJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.items && Array.isArray(parsed.items)) setItems(parsed.items);
      if (parsed.categories && Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (parsed.warehouses && Array.isArray(parsed.warehouses)) setWarehouses(parsed.warehouses);
      if (parsed.locations && Array.isArray(parsed.locations)) setLocations(parsed.locations);
      if (parsed.receipts && Array.isArray(parsed.receipts)) setReceipts(parsed.receipts);
      if (parsed.deliveries && Array.isArray(parsed.deliveries)) setDeliveries(parsed.deliveries);
      if (parsed.transfers && Array.isArray(parsed.transfers)) setTransfers(parsed.transfers);
      if (parsed.adjustments && Array.isArray(parsed.adjustments)) setAdjustments(parsed.adjustments);
      if (parsed.stockLedger && Array.isArray(parsed.stockLedger)) setStockLedger(parsed.stockLedger);
      if (parsed.settings) setSettings(parsed.settings);
      logAudit('DATABASE_BACKUP_RESTORED', 'SYSTEM', undefined, 'Restored database from JSON archive');
      soundService.playSuccessChime();
      return true;
    } catch {
      return false;
    }
  };

  const exportProductsCSV = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Unit of Measure',
      'Stock on Hand',
      'Stock Reserved',
      'Stock Available',
      'Reorder Point',
      'Reorder Quantity',
      'Unit Cost (USD)',
      'Selling Price (USD)',
      'Total Asset Valuation',
      'Supplier',
      'Bin Location',
      'Barcode',
    ];
    const rows = items.map((i) => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.stockOnHand,
      i.stockReserved,
      i.stockAvailable,
      i.minThreshold,
      i.reorderQuantity,
      i.unitCost.toFixed(2),
      i.unitPrice.toFixed(2),
      (i.stockOnHand * i.unitCost).toFixed(2),
      `"${i.supplierName}"`,
      `"${i.binLocation}"`,
      `"${i.barcode}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockx_catalog_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    logAudit('CATALOG_CSV_EXPORTED', 'PRODUCT', undefined, 'Master catalog exported to CSV spreadsheet');
  };

  const exportStockLedgerCSV = () => {
    const headers = [
      'Timestamp',
      'Reference ID',
      'Reference Type',
      'Movement Type',
      'SKU',
      'Product Name',
      'Warehouse',
      'Location / Bin',
      'Quantity Change',
      'Balance After',
      'Authorized Operator',
      'Role',
      'Notes',
    ];
    const rows = stockLedger.map((l) => [
      `"${l.timestamp}"`,
      `"${l.referenceId}"`,
      `"${l.referenceType}"`,
      `"${l.movementType}"`,
      `"${l.sku}"`,
      `"${l.productName.replace(/"/g, '""')}"`,
      `"${l.warehouseName}"`,
      `"${l.locationCode || ''}"`,
      l.quantityChange > 0 ? `+${l.quantityChange}` : l.quantityChange,
      l.balanceAfter,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockx_stock_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    logAudit('LEDGER_CSV_EXPORTED', 'STOCK_LEDGER', undefined, 'Stock ledger audit trail exported to CSV');
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        users,
        login,
        register,
        logout,
        switchRole,
        switchUser,
        requestPasswordResetOTP,
        verifyPasswordResetOTP,
        resetPassword,
        updateUserRole,
        toggleUserStatus,
        createUser,

        activeWarehouseId,
        setActiveWarehouseId,
        settings,
        updateSettings,
        notifications,
        markNotificationRead,

        categories,
        addCategory,
        updateCategory,
        deleteCategory,

        warehouses,
        addWarehouse,
        updateWarehouse,

        locations,
        addLocation,
        updateLocation,

        suppliers,
        addSupplier,
        updateSupplier,

        items,
        addItem,
        updateItem,
        deleteItem,

        receipts,
        createReceipt,
        updateReceiptStatus,

        deliveries,
        createDelivery,
        updateDeliveryStatus,
        pickDeliveryItem,
        packDeliveryItem,

        transfers,
        createTransfer,
        updateTransferStatus,

        adjustments,
        createAdjustment,
        approveAdjustment,
        rejectAdjustment,

        stockLedger,
        auditLogs,
        logAudit,

        shelvingTasks,
        completeShelvingTask,
        cycleCounts,
        createCycleCountSession,
        recordCycleCountItem,
        reconcileCycleCount,

        resetDatabase,
        exportDataAsJSON,
        importDataFromJSON,
        exportProductsCSV,
        exportStockLedgerCSV,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
