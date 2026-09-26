import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  InventoryItem,
  Warehouse,
  Supplier,
  PurchaseOrder,
  OutboundDispatch,
  PickItem,
  ShelvingTask,
  StockTransfer,
  CycleCountSession,
  StockMovement,
  POStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_SUPPLIERS,
  INITIAL_ITEMS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_DISPATCH_ORDERS,
  INITIAL_SHELVING_TASKS,
  INITIAL_TRANSFERS,
  INITIAL_CYCLE_COUNTS,
  INITIAL_MOVEMENTS,
} from '../data/mockData';
import { soundService } from '../utils/audio';

interface InventoryContextType {
  currentUser: User | null;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  activeWarehouseId: string;
  setActiveWarehouseId: (id: string) => void;

  items: InventoryItem[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  dispatchOrders: OutboundDispatch[];
  shelvingTasks: ShelvingTask[];
  transfers: StockTransfer[];
  cycleCounts: CycleCountSession[];
  movements: StockMovement[];

  // Item Management
  addItem: (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'lastCountedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;

  // Inbound / PO
  createPurchaseOrder: (poData: {
    supplierId: string;
    warehouseId: string;
    items: { itemId: string; orderedQty: number; unitCost: number }[];
    expectedDate: string;
    notes?: string;
  }) => void;
  updatePOStatus: (id: string, status: POStatus) => void;
  receivePurchaseOrder: (
    poId: string,
    receivedQtyMap: Record<string, number>,
    targetBinMap?: Record<string, string>
  ) => void;

  // Outbound / Dispatch / Picking
  createDispatchOrder: (orderData: {
    customerName: string;
    warehouseId: string;
    priority: 'urgent' | 'standard' | 'low';
    items: { itemId: string; requestedQty: number }[];
    notes?: string;
  }) => void;
  pickItemInOrder: (orderId: string, itemId: string, qtyPicked: number) => void;
  completePickOrder: (orderId: string) => void;

  // Warehouse Shelving
  completeShelvingTask: (taskId: string, finalBin: string) => void;

  // Warehouse Transfers
  createStockTransfer: (transferData: {
    itemId: string;
    qty: number;
    fromWarehouseId: string;
    fromBin: string;
    toWarehouseId: string;
    toBin: string;
    reason: string;
  }) => void;
  completeStockTransfer: (transferId: string) => void;

  // Cycle Counts
  createCycleCountSession: (warehouseId: string, aisle: string) => void;
  recordCycleCountItem: (sessionId: string, itemId: string, countedQty: number, note?: string) => void;
  reconcileCycleCount: (sessionId: string) => void;

  // Adjustments & Audit
  manualStockAdjust: (itemId: string, qtyDelta: number, reason: string, isWriteOff: boolean) => void;
  resetDatabase: () => void;
  exportDataAsJSON: () => void;
  importDataFromJSON: (jsonData: string) => boolean;
  exportItemsCSV: () => void;
}

const STORAGE_PREFIX = 'stockx_ims_v1_';

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {
    // localStorage full or disabled
  }
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStored<User | null>('currentUser', INITIAL_USERS[0])
  );
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() =>
    getStored<string>('activeWarehouseId', 'wh_alpha')
  );

  const [items, setItems] = useState<InventoryItem[]>(() =>
    getStored<InventoryItem[]>('items', INITIAL_ITEMS)
  );
  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    getStored<PurchaseOrder[]>('purchaseOrders', INITIAL_PURCHASE_ORDERS)
  );
  const [dispatchOrders, setDispatchOrders] = useState<OutboundDispatch[]>(() =>
    getStored<OutboundDispatch[]>('dispatchOrders', INITIAL_DISPATCH_ORDERS)
  );
  const [shelvingTasks, setShelvingTasks] = useState<ShelvingTask[]>(() =>
    getStored<ShelvingTask[]>('shelvingTasks', INITIAL_SHELVING_TASKS)
  );
  const [transfers, setTransfers] = useState<StockTransfer[]>(() =>
    getStored<StockTransfer[]>('transfers', INITIAL_TRANSFERS)
  );
  const [cycleCounts, setCycleCounts] = useState<CycleCountSession[]>(() =>
    getStored<CycleCountSession[]>('cycleCounts', INITIAL_CYCLE_COUNTS)
  );
  const [movements, setMovements] = useState<StockMovement[]>(() =>
    getStored<StockMovement[]>('movements', INITIAL_MOVEMENTS)
  );

  // Sync state to localStorage
  useEffect(() => {
    setStored('currentUser', currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStored('activeWarehouseId', activeWarehouseId);
  }, [activeWarehouseId]);

  useEffect(() => {
    setStored('items', items);
  }, [items]);

  useEffect(() => {
    setStored('purchaseOrders', purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    setStored('dispatchOrders', dispatchOrders);
  }, [dispatchOrders]);

  useEffect(() => {
    setStored('shelvingTasks', shelvingTasks);
  }, [shelvingTasks]);

  useEffect(() => {
    setStored('transfers', transfers);
  }, [transfers]);

  useEffect(() => {
    setStored('cycleCounts', cycleCounts);
  }, [cycleCounts]);

  useEffect(() => {
    setStored('movements', movements);
  }, [movements]);

  // Auth functions
  const login = (email: string, role?: UserRole): boolean => {
    const trimmed = email.trim().toLowerCase();
    const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === trimmed);
    if (matched) {
      setCurrentUser(matched);
      soundService.playSuccessChime();
      return true;
    }
    // Allow custom login with chosen role
    const fallbackUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0] || 'Operations Lead',
      email: trimmed,
      role: role || (trimmed.includes('staff') || trimmed.includes('warehouse') ? 'warehouse_staff' : 'manager'),
      title: (role || 'manager') === 'manager' ? 'Inventory Operations Manager' : 'Warehouse Logistics Specialist',
      warehouseId: 'wh_alpha',
    };
    setCurrentUser(fallbackUser);
    soundService.playSuccessChime();
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;
    const matched = INITIAL_USERS.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
    } else {
      setCurrentUser({
        ...currentUser,
        role,
        title: role === 'manager' ? 'Inventory Operations Manager' : 'Fulfillment Specialist',
      });
    }
    soundService.playScanBeep();
  };

  // Item Management
  const addItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'lastCountedAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `itm_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastCountedAt: new Date().toISOString().split('T')[0],
    };
    setItems((prev) => [newItem, ...prev]);

    // Record movement
    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: newItem.id,
      sku: newItem.sku,
      itemName: newItem.name,
      warehouseId: newItem.warehouseId,
      movementType: 'MANUAL_RESTOCK',
      qtyDelta: newItem.stockOnHand,
      stockAfter: newItem.stockOnHand,
      referenceId: 'INITIAL_STOCK',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'manager',
      reason: 'Initial SKU registration into catalog',
    };
    setMovements((prev) => [movement, ...prev]);
    soundService.playSuccessChime();
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Inbound Purchase Orders
  const createPurchaseOrder = ({
    supplierId,
    warehouseId,
    items: poItemsList,
    expectedDate,
    notes,
  }: {
    supplierId: string;
    warehouseId: string;
    items: { itemId: string; orderedQty: number; unitCost: number }[];
    expectedDate: string;
    notes?: string;
  }) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const enrichedItems = poItemsList.map((pi) => {
      const itm = items.find((i) => i.id === pi.itemId);
      return {
        itemId: pi.itemId,
        sku: itm?.sku || 'UNKNOWN',
        name: itm?.name || 'Item',
        orderedQty: pi.orderedQty,
        receivedQty: 0,
        unitCost: pi.unitCost,
      };
    });

    const totalCost = enrichedItems.reduce((acc, curr) => acc + curr.orderedQty * curr.unitCost, 0);

    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierId,
      supplierName: supplier?.name || 'Supplier',
      warehouseId,
      status: 'ordered',
      items: enrichedItems,
      totalCost,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate,
      notes,
      createdBy: currentUser?.name || 'Inventory Manager',
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    soundService.playSuccessChime();
  };

  const updatePOStatus = (id: string, status: POStatus) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === id ? { ...po, status } : po))
    );
  };

  const receivePurchaseOrder = (
    poId: string,
    receivedQtyMap: Record<string, number>,
    targetBinMap?: Record<string, string>
  ) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const newShelvingTasksList: ShelvingTask[] = [];
    const newMovements: StockMovement[] = [];

    // Update PO items
    const updatedPoItems = po.items.map((pi) => {
      const incoming = receivedQtyMap[pi.itemId] || 0;
      const totalRec = pi.receivedQty + incoming;
      return {
        ...pi,
        receivedQty: totalRec,
      };
    });

    const allFulfilled = updatedPoItems.every((pi) => pi.receivedQty >= pi.orderedQty);

    // Update stock levels & create shelving tasks for warehouse staff
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const receivedCount = receivedQtyMap[itm.id] || 0;
        if (receivedCount > 0) {
          const newOnHand = itm.stockOnHand + receivedCount;
          const assignedBin = targetBinMap?.[itm.id] || itm.binLocation;

          // Create Shelving Task for warehouse staff
          newShelvingTasksList.push({
            id: `shl_${Date.now()}_${itm.id}`,
            taskNumber: `PUT-2026-${Math.floor(100 + Math.random() * 900)}`,
            sourcePoNumber: po.poNumber,
            itemId: itm.id,
            sku: itm.sku,
            name: itm.name,
            qtyToShelve: receivedCount,
            targetWarehouseId: po.warehouseId,
            targetBin: assignedBin,
            status: 'pending',
            assignedTo: 'Marcus Chen',
            createdAt: new Date().toISOString(),
          });

          // Log movement
          newMovements.push({
            id: `mov_${Date.now()}_${itm.id}`,
            timestamp: new Date().toISOString(),
            itemId: itm.id,
            sku: itm.sku,
            itemName: itm.name,
            warehouseId: po.warehouseId,
            movementType: 'INBOUND_PO',
            qtyDelta: receivedCount,
            stockAfter: newOnHand,
            referenceId: po.poNumber,
            userName: currentUser?.name || 'Inventory Manager',
            userRole: currentUser?.role || 'manager',
            reason: `Received inbound PO from ${po.supplierName}`,
          });

          return {
            ...itm,
            stockOnHand: newOnHand,
          };
        }
        return itm;
      });
    });

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              items: updatedPoItems,
              status: allFulfilled ? 'received' : 'partially_received',
              receivedDate: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );

    if (newShelvingTasksList.length > 0) {
      setShelvingTasks((prev) => [...newShelvingTasksList, ...prev]);
    }
    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
    }

    soundService.playSuccessChime();
  };

  // Outbound Dispatch / Picking
  const createDispatchOrder = ({
    customerName,
    warehouseId,
    priority,
    items: requestedItemsList,
    notes,
  }: {
    customerName: string;
    warehouseId: string;
    priority: 'urgent' | 'standard' | 'low';
    items: { itemId: string; requestedQty: number }[];
    notes?: string;
  }) => {
    const enrichedPickItems: PickItem[] = requestedItemsList.map((ri) => {
      const itm = items.find((i) => i.id === ri.itemId);
      return {
        itemId: ri.itemId,
        sku: itm?.sku || 'UNKNOWN',
        name: itm?.name || 'Item',
        binLocation: itm?.binLocation || 'A01-R01-S01',
        requestedQty: ri.requestedQty,
        pickedQty: 0,
        isCompleted: false,
      };
    });

    const newDispatch: OutboundDispatch = {
      id: `dsp_${Date.now()}`,
      orderNumber: `DSP-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      warehouseId,
      priority,
      status: 'pending_picking',
      assignedToStaffId: 'usr_staff_01',
      assignedToStaffName: 'Marcus Chen',
      items: enrichedPickItems,
      createdAt: new Date().toISOString(),
      notes,
    };

    // Reserve stock on items
    setItems((prev) =>
      prev.map((itm) => {
        const req = requestedItemsList.find((r) => r.itemId === itm.id);
        if (req) {
          return {
            ...itm,
            stockReserved: itm.stockReserved + req.requestedQty,
          };
        }
        return itm;
      })
    );

    setDispatchOrders((prev) => [newDispatch, ...prev]);
    soundService.playSuccessChime();
  };

  const pickItemInOrder = (orderId: string, itemId: string, qtyPicked: number) => {
    const order = dispatchOrders.find((d) => d.id === orderId);
    if (!order) return;

    soundService.playScanBeep();

    setDispatchOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const updatedItems = ord.items.map((pi) => {
          if (pi.itemId !== itemId) return pi;
          const newPicked = Math.min(pi.requestedQty, pi.pickedQty + qtyPicked);
          return {
            ...pi,
            pickedQty: newPicked,
            isCompleted: newPicked >= pi.requestedQty,
          };
        });

        const allItemsDone = updatedItems.every((i) => i.isCompleted);
        const anyStarted = updatedItems.some((i) => i.pickedQty > 0);

        return {
          ...ord,
          items: updatedItems,
          status: allItemsDone ? 'picked' : anyStarted ? 'picking_in_progress' : ord.status,
        };
      })
    );

    // Deduct stockOnHand and stockReserved
    setItems((prev) =>
      prev.map((itm) => {
        if (itm.id === itemId) {
          const newOnHand = Math.max(0, itm.stockOnHand - qtyPicked);
          const newReserved = Math.max(0, itm.stockReserved - qtyPicked);

          // Log movement
          const mov: StockMovement = {
            id: `mov_${Date.now()}_${itemId}`,
            timestamp: new Date().toISOString(),
            itemId: itm.id,
            sku: itm.sku,
            itemName: itm.name,
            warehouseId: order.warehouseId,
            movementType: 'OUTBOUND_DISPATCH',
            qtyDelta: -qtyPicked,
            stockAfter: newOnHand,
            referenceId: order.orderNumber,
            userName: currentUser?.name || 'Warehouse Staff',
            userRole: currentUser?.role || 'warehouse_staff',
            reason: `Picked for ${order.customerName}`,
          };
          setMovements((mPrev) => [mov, ...mPrev]);

          return {
            ...itm,
            stockOnHand: newOnHand,
            stockReserved: newReserved,
          };
        }
        return itm;
      })
    );
  };

  const completePickOrder = (orderId: string) => {
    soundService.playSuccessChime();
    setDispatchOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'staged',
              completedAt: new Date().toISOString(),
            }
          : ord
      )
    );
  };

  // Shelving
  const completeShelvingTask = (taskId: string, finalBin: string) => {
    const task = shelvingTasks.find((t) => t.id === taskId);
    if (!task) return;

    soundService.playSuccessChime();

    setShelvingTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              targetBin: finalBin,
              status: 'completed',
              completedAt: new Date().toISOString(),
            }
          : t
      )
    );

    // Update item bin location
    setItems((prev) =>
      prev.map((itm) =>
        itm.id === task.itemId
          ? {
              ...itm,
              binLocation: finalBin,
            }
          : itm
      )
    );

    // Log movement
    const mov: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: task.itemId,
      sku: task.sku,
      itemName: task.name,
      warehouseId: task.targetWarehouseId,
      movementType: 'INTERNAL_TRANSFER',
      qtyDelta: 0,
      stockAfter: items.find((i) => i.id === task.itemId)?.stockOnHand || 0,
      referenceId: task.taskNumber,
      userName: currentUser?.name || 'Warehouse Staff',
      userRole: currentUser?.role || 'warehouse_staff',
      reason: `Shelved into bin ${finalBin}`,
    };
    setMovements((prev) => [mov, ...prev]);
  };

  // Transfers
  const createStockTransfer = ({
    itemId,
    qty,
    fromWarehouseId,
    fromBin,
    toWarehouseId,
    toBin,
    reason,
  }: {
    itemId: string;
    qty: number;
    fromWarehouseId: string;
    fromBin: string;
    toWarehouseId: string;
    toBin: string;
    reason: string;
  }) => {
    const itm = items.find((i) => i.id === itemId);
    if (!itm) return;

    const newTransfer: StockTransfer = {
      id: `trf_${Date.now()}`,
      transferNumber: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
      itemId,
      sku: itm.sku,
      name: itm.name,
      qty,
      fromWarehouseId,
      fromBin,
      toWarehouseId,
      toBin,
      status: 'pending',
      reason,
      requestedBy: currentUser?.name || 'Operations Lead',
      createdAt: new Date().toISOString(),
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    soundService.playSuccessChime();
  };

  const completeStockTransfer = (transferId: string) => {
    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    soundService.playSuccessChime();

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'completed',
              completedAt: new Date().toISOString(),
            }
          : t
      )
    );

    // Update item location
    setItems((prev) =>
      prev.map((itm) =>
        itm.id === trf.itemId
          ? {
              ...itm,
              warehouseId: trf.toWarehouseId,
              binLocation: trf.toBin,
            }
          : itm
      )
    );

    // Log movement
    const itm = items.find((i) => i.id === trf.itemId);
    const mov: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: trf.itemId,
      sku: trf.sku,
      itemName: trf.name,
      warehouseId: trf.toWarehouseId,
      movementType: 'INTERNAL_TRANSFER',
      qtyDelta: trf.qty,
      stockAfter: itm?.stockOnHand || trf.qty,
      referenceId: trf.transferNumber,
      userName: currentUser?.name || 'Marcus Chen',
      userRole: currentUser?.role || 'warehouse_staff',
      reason: `Relocated from ${trf.fromBin} to ${trf.toBin} (${trf.reason})`,
    };
    setMovements((prev) => [mov, ...prev]);
  };

  // Cycle Counts
  const createCycleCountSession = (warehouseId: string, aisle: string) => {
    const sessionItems = items
      .filter((i) => i.warehouseId === warehouseId)
      .map((i) => ({
        itemId: i.id,
        sku: i.sku,
        name: i.name,
        binLocation: i.binLocation,
        systemQty: i.stockOnHand,
        countedQty: null,
        discrepancy: 0,
      }));

    const newSession: CycleCountSession = {
      id: `cyc_${Date.now()}`,
      sessionNumber: `CNT-2026-W${Math.floor(10 + Math.random() * 40)}`,
      warehouseId,
      aisle,
      status: 'open',
      assignedStaffName: 'Marcus Chen',
      createdAt: new Date().toISOString(),
      items: sessionItems,
    };

    setCycleCounts((prev) => [newSession, ...prev]);
    soundService.playSuccessChime();
  };

  const recordCycleCountItem = (
    sessionId: string,
    itemId: string,
    countedQty: number,
    note?: string
  ) => {
    soundService.playScanBeep();

    setCycleCounts((prev) =>
      prev.map((sess) => {
        if (sess.id !== sessionId) return sess;
        const updated = sess.items.map((ci) => {
          if (ci.itemId !== itemId) return ci;
          const discrepancy = countedQty - ci.systemQty;
          return {
            ...ci,
            countedQty,
            discrepancy,
            countedBy: currentUser?.name || 'Warehouse Staff',
            note: note || ci.note,
          };
        });

        const allCounted = updated.every((i) => i.countedQty !== null);

        return {
          ...sess,
          status: allCounted ? 'submitted' : 'in_progress',
          items: updated,
        };
      })
    );
  };

  const reconcileCycleCount = (sessionId: string) => {
    const session = cycleCounts.find((s) => s.id === sessionId);
    if (!session) return;

    soundService.playSuccessChime();

    const movementsToAdd: StockMovement[] = [];

    // Adjust items where discrepancy != 0
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const countRow = session.items.find((ci) => ci.itemId === itm.id);
        if (countRow && countRow.countedQty !== null && countRow.discrepancy !== 0) {
          const newQty = countRow.countedQty;
          movementsToAdd.push({
            id: `mov_${Date.now()}_${itm.id}`,
            timestamp: new Date().toISOString(),
            itemId: itm.id,
            sku: itm.sku,
            itemName: itm.name,
            warehouseId: session.warehouseId,
            movementType: 'CYCLE_COUNT_ADJUST',
            qtyDelta: countRow.discrepancy,
            stockAfter: newQty,
            referenceId: session.sessionNumber,
            userName: currentUser?.name || 'Inventory Manager',
            userRole: currentUser?.role || 'manager',
            reason: `Cycle Count reconciliation discrepancy (${countRow.discrepancy > 0 ? '+' : ''}${countRow.discrepancy}): ${countRow.note || 'Audited'}`,
          });

          return {
            ...itm,
            stockOnHand: newQty,
            lastCountedAt: new Date().toISOString().split('T')[0],
          };
        }
        return itm;
      });
    });

    setCycleCounts((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'reconciled',
              reconciledAt: new Date().toISOString(),
            }
          : s
      )
    );

    if (movementsToAdd.length > 0) {
      setMovements((prev) => [...movementsToAdd, ...prev]);
    }
  };

  // Manual Adjustments
  const manualStockAdjust = (
    itemId: string,
    qtyDelta: number,
    reason: string,
    isWriteOff: boolean
  ) => {
    const itm = items.find((i) => i.id === itemId);
    if (!itm) return;

    const newStock = Math.max(0, itm.stockOnHand + qtyDelta);

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, stockOnHand: newStock } : i))
    );

    const mov: StockMovement = {
      id: `mov_${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemId: itm.id,
      sku: itm.sku,
      itemName: itm.name,
      warehouseId: itm.warehouseId,
      movementType: isWriteOff ? 'MANUAL_WRITE_OFF' : 'MANUAL_RESTOCK',
      qtyDelta,
      stockAfter: newStock,
      referenceId: `ADJ-2026-${Math.floor(100 + Math.random() * 900)}`,
      userName: currentUser?.name || 'Inventory Manager',
      userRole: currentUser?.role || 'manager',
      reason,
    };
    setMovements((prev) => [mov, ...prev]);
    soundService.playSuccessChime();
  };

  const resetDatabase = () => {
    setItems(INITIAL_ITEMS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setDispatchOrders(INITIAL_DISPATCH_ORDERS);
    setShelvingTasks(INITIAL_SHELVING_TASKS);
    setTransfers(INITIAL_TRANSFERS);
    setCycleCounts(INITIAL_CYCLE_COUNTS);
    setMovements(INITIAL_MOVEMENTS);
    soundService.playSuccessChime();
  };

  const exportDataAsJSON = () => {
    const data = {
      version: 'stockx_ims_1.0',
      exportedAt: new Date().toISOString(),
      items,
      purchaseOrders,
      dispatchOrders,
      shelvingTasks,
      transfers,
      cycleCounts,
      movements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockx_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataFromJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.items && Array.isArray(parsed.items)) {
        setItems(parsed.items);
        if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
        if (parsed.dispatchOrders) setDispatchOrders(parsed.dispatchOrders);
        if (parsed.shelvingTasks) setShelvingTasks(parsed.shelvingTasks);
        if (parsed.transfers) setTransfers(parsed.transfers);
        if (parsed.cycleCounts) setCycleCounts(parsed.cycleCounts);
        if (parsed.movements) setMovements(parsed.movements);
        soundService.playSuccessChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const exportItemsCSV = () => {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Unit',
      'Warehouse',
      'Bin Location',
      'Stock On Hand',
      'Reserved',
      'Available',
      'Min Threshold',
      'Unit Cost',
      'Unit Price',
      'Supplier',
      'Barcode',
    ];
    const rows = items.map((i) => [
      i.sku,
      `"${i.name.replace(/"/g, '""')}"`,
      i.category,
      i.unit,
      i.warehouseId,
      i.binLocation,
      i.stockOnHand,
      i.stockReserved,
      i.stockOnHand - i.stockReserved,
      i.minThreshold,
      i.unitCost.toFixed(2),
      i.unitPrice.toFixed(2),
      `"${i.supplierName}"`,
      i.barcode,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_catalog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchRole,
        activeWarehouseId,
        setActiveWarehouseId,
        items,
        warehouses,
        suppliers,
        purchaseOrders,
        dispatchOrders,
        shelvingTasks,
        transfers,
        cycleCounts,
        movements,
        addItem,
        updateItem,
        deleteItem,
        createPurchaseOrder,
        updatePOStatus,
        receivePurchaseOrder,
        createDispatchOrder,
        pickItemInOrder,
        completePickOrder,
        completeShelvingTask,
        createStockTransfer,
        completeStockTransfer,
        createCycleCountSession,
        recordCycleCountItem,
        reconcileCycleCount,
        manualStockAdjust,
        resetDatabase,
        exportDataAsJSON,
        importDataFromJSON,
        exportItemsCSV,
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
