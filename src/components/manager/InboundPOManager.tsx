import React, { useState } from 'react';
import {
  Plus,
  ArrowDownToDot,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  Package,
  Boxes,
  X,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseOrder } from '../../types';

export const InboundPOManager: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    items,
    warehouses,
    createPurchaseOrder,
    receivePurchaseOrder,
    activeWarehouseId,
  } = useInventory();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  // Receiving form state
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [targetBins, setTargetBins] = useState<Record<string, string>>({});
  const [qualityChecked, setQualityChecked] = useState(true);

  // Create PO form state
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [poLines, setPoLines] = useState<{ itemId: string; orderedQty: number; unitCost: number }[]>([
    { itemId: items[0]?.id || '', orderedQty: 25, unitCost: items[0]?.unitCost || 10 },
  ]);
  const [poNotes, setPoNotes] = useState('');

  // Filtered list
  const filteredPOs = purchaseOrders.filter((po) => {
    if (activeWarehouseId !== 'all' && po.warehouseId !== activeWarehouseId) return false;
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    return true;
  });

  const handleOpenReceive = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const initialMap: Record<string, number> = {};
    const binMap: Record<string, string> = {};
    po.items.forEach((pi) => {
      const remaining = Math.max(0, pi.orderedQty - pi.receivedQty);
      initialMap[pi.itemId] = remaining;
      const itm = items.find((i) => i.id === pi.itemId);
      binMap[pi.itemId] = itm?.binLocation || 'A01-R01-S01';
    });
    setReceivedQtys(initialMap);
    setTargetBins(binMap);
  };

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPO) return;
    receivePurchaseOrder(receivingPO.id, receivedQtys, targetBins);
    setReceivingPO(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (poLines.length === 0) return;
    createPurchaseOrder({
      supplierId: selectedSupplierId,
      warehouseId: targetWarehouseId,
      items: poLines,
      expectedDate,
      notes: poNotes,
    });
    setIsCreateModalOpen(false);
  };

  const addPOLine = () => {
    if (items.length === 0) return;
    setPoLines([...poLines, { itemId: items[0].id, orderedQty: 20, unitCost: items[0].unitCost }]);
  };

  const removePOLine = (index: number) => {
    setPoLines(poLines.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Inbound Stock & Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procure stock from approved vendors, track inbound freight, and process dock receipts with put-away.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Issue New Purchase Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit text-xs">
        {['all', 'ordered', 'shipped', 'received'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 font-medium rounded-md capitalize transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st === 'all' ? 'All Orders' : st}
          </button>
        ))}
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items / SKUs</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase orders in this view.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  const isReceived = po.status === 'received';
                  const totalUnits = po.items.reduce((s, i) => s + i.orderedQty, 0);
                  const receivedUnits = po.items.reduce((s, i) => s + i.receivedQty, 0);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {po.poNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{po.supplierName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Created by: {po.createdBy}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">
                          {po.items.length} line item{po.items.length > 1 ? 's' : ''} ({totalUnits} units total)
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs font-mono">
                          {po.items.map((i) => `${i.sku} (${i.orderedQty})`).join(', ')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {po.orderDate}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {po.expectedDate}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        ${po.totalCost.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Received ({receivedUnits}/{totalUnits})
                          </span>
                        ) : po.status === 'shipped' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            <Truck className="w-3 h-3" />
                            Shipped / In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            Ordered
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isReceived ? (
                          <button
                            onClick={() => handleOpenReceive(po)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-2xs cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <ArrowDownToDot className="w-3 h-3" />
                            Receive Dock
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Logged to Catalog
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dock Receiving Modal */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ArrowDownToDot className="w-4 h-4 text-blue-600" />
                  Process Inbound Freight Receiving: {receivingPO.poNumber}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supplier: <strong>{receivingPO.supplierName}</strong> · Verify delivery counts & designate storage bins.
                </p>
              </div>
              <button
                onClick={() => setReceivingPO(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                Upon receiving confirmation, catalog quantities will update immediately and <strong>Shelving Tasks</strong> will be generated for warehouse staff floor put-away.
              </div>

              <div className="space-y-3">
                <div className="font-semibold text-slate-900">Line Items to Receive</div>
                {receivingPO.items.map((pi) => {
                  const itm = items.find((i) => i.id === pi.itemId);
                  return (
                    <div
                      key={pi.itemId}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{pi.sku}</div>
                        <div className="text-slate-600 truncate">{pi.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Ordered: <strong className="font-mono">{pi.orderedQty}</strong> · Prev Rec: <strong className="font-mono">{pi.receivedQty}</strong>
                        </div>
                      </div>

                      <div>
                        <label className="font-medium text-slate-700 block mb-1">
                          Received Qty Today
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={pi.orderedQty * 2}
                          value={receivedQtys[pi.itemId] ?? 0}
                          onChange={(e) =>
                            setReceivedQtys({
                              ...receivedQtys,
                              [pi.itemId]: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-slate-700 block mb-1">
                          Destination Bin Coordinate
                        </label>
                        <input
                          type="text"
                          value={targetBins[pi.itemId] ?? itm?.binLocation ?? 'A01-R01-S01'}
                          onChange={(e) =>
                            setTargetBins({
                              ...targetBins,
                              [pi.itemId]: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono uppercase"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="qc_check"
                  checked={qualityChecked}
                  onChange={(e) => setQualityChecked(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="qc_check" className="text-slate-700 font-medium">
                  Physical packaging inspected & passed initial QA standards
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!qualityChecked}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  Confirm Receipt & Dispatch Shelving
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                Draft New Purchase Order
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Vendor / Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {s.leadTimeDays}d lead
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Order Line Items</span>
                  <button
                    type="button"
                    onClick={addPOLine}
                    className="text-blue-600 hover:underline flex items-center gap-1 font-normal text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another SKU
                  </button>
                </div>

                {poLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-6 space-y-1">
                      <label className="text-[11px] text-slate-500">Item</label>
                      <select
                        value={line.itemId}
                        onChange={(e) => {
                          const chosen = items.find((i) => i.id === e.target.value);
                          const updated = [...poLines];
                          updated[idx] = {
                            ...updated[idx],
                            itemId: e.target.value,
                            unitCost: chosen?.unitCost || 10,
                          };
                          setPoLines(updated);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                      >
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.sku} - {i.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3 space-y-1">
                      <label className="text-[11px] text-slate-500">Order Quantity</label>
                      <input
                        type="number"
                        min={1}
                        value={line.orderedQty}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].orderedQty = Number(e.target.value);
                          setPoLines(updated);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] text-slate-500">Unit Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitCost}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].unitCost = Number(e.target.value);
                          setPoLines(updated);
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div className="col-span-1 pt-4 text-right">
                      {poLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePOLine(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-medium text-slate-700">Logistics & Receiving Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Carrier instructions, dock gate priority, packaging tags..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Total Order Estimate:{' '}
                  <strong className="text-slate-900 font-mono text-sm">
                    $
                    {poLines
                      .reduce((sum, l) => sum + l.orderedQty * l.unitCost, 0)
                      .toFixed(2)}
                  </strong>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
