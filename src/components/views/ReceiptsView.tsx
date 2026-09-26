// StockX Enterprise Inbound Receipts View
import React, { useState } from 'react';
import {
  ArrowDownToDot,
  Plus,
  Search,
  CheckCircle,
  Clock,
  CheckSquare,
  XCircle,
  Truck,
  Eye,
  X,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Receipt, ReceiptStatus } from '../../types';

export const ReceiptsView: React.FC = () => {
  const {
    receipts,
    suppliers,
    warehouses,
    items,
    createReceipt,
    updateReceiptStatus,
    currentUser,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [receivingReceipt, setReceivingReceipt] = useState<Receipt | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    { productId: string; orderedQty: number; unitCost: number }[]
  >([{ productId: items[0]?.id || '', orderedQty: 50, unitCost: items[0]?.unitCost || 20.0 }]);

  // Receiving state map (productId -> receivedQty)
  const [receivedMap, setReceivedMap] = useState<Record<string, number>>({});

  const handleAddItemRow = () => {
    setOrderItems((prev) => [
      ...prev,
      { productId: items[0]?.id || '', orderedQty: 25, unitCost: items[0]?.unitCost || 15.0 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) return;

    createReceipt({
      supplierId,
      warehouseId,
      expectedDate,
      notes,
      items: orderItems,
    });

    setIsCreateModalOpen(false);
    setOrderItems([
      { productId: items[0]?.id || '', orderedQty: 50, unitCost: items[0]?.unitCost || 20.0 },
    ]);
    setNotes('');
  };

  const openReceiveModal = (rec: Receipt) => {
    setReceivingReceipt(rec);
    const initialMap: Record<string, number> = {};
    rec.items.forEach((i) => {
      initialMap[i.productId] = i.receivedQty > 0 ? i.receivedQty : i.orderedQty;
    });
    setReceivedMap(initialMap);
  };

  const handleConfirmDockArrival = (receiptId: string) => {
    updateReceiptStatus(receiptId, 'Received', receivedMap);
    setReceivingReceipt(null);
  };

  const handleFinalStockApproval = (receiptId: string) => {
    updateReceiptStatus(receiptId, 'Done');
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case 'Draft':
        return { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'Waiting':
        return { label: 'Waiting Inbound', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'Received':
        return { label: 'Dock Received', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'Done':
        return { label: 'Stocked & Done', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'Cancelled':
        return { label: 'Cancelled', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inbound Receipts</h1>
          <p className="text-xs text-slate-500">
            Track vendor purchase receipts, inspect physical dock shipments, and stock directly into the master ledger
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Inbound Receipt</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Receipt # or Supplier Name..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer w-full md:w-auto"
        >
          <option value="ALL">All Receipt Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Waiting">Waiting</option>
          <option value="Received">Received (Docked)</option>
          <option value="Done">Done (Stocked)</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Destination Hub</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No receipts found matching filters.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rec) => {
                  const badge = getStatusBadge(rec.status);
                  const wh = warehouses.find((w) => w.id === rec.warehouseId);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {rec.receiptNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{rec.supplierName}</div>
                        <div className="text-[10px] text-slate-400">Created by: {rec.createdBy}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {wh?.name || wh?.code}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {rec.expectedDate}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {rec.items.length} SKUs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${rec.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingReceipt(rec)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Receipt Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {rec.status === 'Draft' && (
                            <button
                              onClick={() => updateReceiptStatus(rec.id, 'Waiting')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                            >
                              Dispatch Order
                            </button>
                          )}

                          {rec.status === 'Waiting' && (
                            <button
                              onClick={() => openReceiveModal(rec)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dock Arrival</span>
                            </button>
                          )}

                          {rec.status === 'Received' && (
                            <button
                              onClick={() => handleFinalStockApproval(rec.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve & Put Away</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RECEIPT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Inbound Purchase Receipt</h2>
                <p className="text-xs text-slate-500">Generate purchase order and supplier delivery schedule</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Authorized Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Hub</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Items Table Form */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Procurement Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {orderItems.map((oi, index) => {
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={oi.productId}
                          onChange={(e) => {
                            const newProdId = e.target.value;
                            const prd = items.find((p) => p.id === newProdId);
                            setOrderItems((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, productId: newProdId, unitCost: prd?.unitCost || 10 }
                                  : item
                              )
                            );
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                        >
                          {items.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.sku} - {prod.name}
                            </option>
                          ))}
                        </select>

                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={oi.orderedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setOrderItems((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, orderedQty: val } : item))
                              );
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                            placeholder="Qty"
                          />
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            value={oi.unitCost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setOrderItems((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, unitCost: val } : item))
                              );
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                            placeholder="Unit Cost"
                          />
                        </div>

                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="PO tracking numbers, freight carrier instructions, invoice references..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Inbound Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK ARRIVAL INSPECTION MODAL */}
      {receivingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Inspect Dock Delivery: {receivingReceipt.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Verify physical carton counts and sign off shipment arrival
                </p>
              </div>
              <button onClick={() => setReceivingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {receivingReceipt.items.map((item) => (
                  <div key={item.productId} className="p-3 bg-white flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{item.sku} &bull; Ordered: {item.orderedQty}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Physically Arrived:</span>
                      <input
                        type="number"
                        min="0"
                        value={receivedMap[item.productId] ?? item.orderedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setReceivedMap((prev) => ({ ...prev, [item.productId]: val }));
                        }}
                        className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Confirming physical arrival moves receipt to Dock Received state. Final manager approval will stock goods into inventory.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReceivingReceipt(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDockArrival(receivingReceipt.id)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Confirm Goods Received</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT DETAILS MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Receipt Document #{viewingReceipt.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">Supplier: {viewingReceipt.supplierName}</p>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>Status: <strong className="text-slate-900">{viewingReceipt.status}</strong></div>
                <div>Expected Date: <strong className="text-slate-900">{viewingReceipt.expectedDate}</strong></div>
                <div>Created By: <strong className="text-slate-900">{viewingReceipt.createdBy}</strong></div>
                <div>Approved By: <strong className="text-slate-900">{viewingReceipt.approvedBy || 'Pending'}</strong></div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Ordered</th>
                    <th className="py-2 text-right">Received</th>
                    <th className="py-2 text-right">Unit Cost</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {viewingReceipt.items.map((i) => (
                    <tr key={i.productId}>
                      <td className="py-2.5 font-sans font-medium text-slate-900">{i.name} ({i.sku})</td>
                      <td className="py-2.5 text-right text-slate-600">{i.orderedQty}</td>
                      <td className="py-2.5 text-right text-emerald-600 font-bold">{i.receivedQty}</td>
                      <td className="py-2.5 text-right text-slate-600">${i.unitCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">${(i.orderedQty * i.unitCost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {viewingReceipt.notes && (
                <div className="text-[11px] text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <strong>Notes:</strong> {viewingReceipt.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
