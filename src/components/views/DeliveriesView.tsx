// StockX Enterprise Outbound Deliveries View
import React, { useState } from 'react';
import {
  ArrowUpFromDot,
  Plus,
  Search,
  CheckCircle,
  Truck,
  Box,
  Eye,
  X,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  PackageCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Delivery, DeliveryStatus } from '../../types';

export const DeliveriesView: React.FC = () => {
  const {
    deliveries,
    warehouses,
    items,
    createDelivery,
    updateDeliveryStatus,
    pickDeliveryItem,
    packDeliveryItem,
    currentUser,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingDelivery, setViewingDelivery] = useState<Delivery | null>(null);
  const [pickingDelivery, setPickingDelivery] = useState<Delivery | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'urgent' | 'standard' | 'low'>('standard');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    { productId: string; orderedQty: number; unitPrice: number }[]
  >([{ productId: items[0]?.id || '', orderedQty: 5, unitPrice: items[0]?.unitPrice || 40.0 }]);

  const handleAddItemRow = () => {
    setOrderItems((prev) => [
      ...prev,
      { productId: items[0]?.id || '', orderedQty: 2, unitPrice: items[0]?.unitPrice || 35.0 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || orderItems.length === 0) return;

    createDelivery({
      customerName,
      warehouseId,
      deliveryDate,
      priority,
      notes,
      items: orderItems,
    });

    setIsCreateModalOpen(false);
    setCustomerName('');
    setNotes('');
    setOrderItems([{ productId: items[0]?.id || '', orderedQty: 5, unitPrice: items[0]?.unitPrice || 40.0 }]);
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'Draft':
        return { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'Picking':
        return { label: 'Picking in Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'Packed':
        return { label: 'Packed & Verified', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'Ready':
        return { label: 'Ready for Carrier', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'Shipped':
        return { label: 'Shipped (In Transit)', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'Done':
        return { label: 'Delivered & Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'Cancelled':
        return { label: 'Cancelled', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Outbound Customer Deliveries</h1>
          <p className="text-xs text-slate-500">
            End-to-end sales dispatch workflow from picking and bin allocation to carrier packing and stock deduction
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Outbound Delivery</span>
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
            placeholder="Search by Delivery # or Customer Name..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer w-full md:w-auto"
        >
          <option value="ALL">All Delivery Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Picking">Picking</option>
          <option value="Packed">Packed</option>
          <option value="Ready">Ready</option>
          <option value="Shipped">Shipped</option>
          <option value="Done">Done (Delivered)</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Delivery #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Dispatch Hub</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No outbound deliveries found matching filters.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => {
                  const badge = getStatusBadge(del.status);
                  const wh = warehouses.find((w) => w.id === del.warehouseId);

                  return (
                    <tr key={del.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {del.deliveryNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{del.customerName}</div>
                        {del.assignedStaffName && (
                          <div className="text-[10px] text-slate-400">Assigned: {del.assignedStaffName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {wh?.name || wh?.code}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {del.deliveryDate}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            del.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : del.priority === 'standard'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {del.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {del.items.length} SKUs
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${del.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingDelivery(del)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Delivery Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {del.status === 'Draft' && (
                            <button
                              onClick={() => updateDeliveryStatus(del.id, 'Picking')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                            >
                              Start Picking
                            </button>
                          )}

                          {del.status === 'Picking' && (
                            <button
                              onClick={() => setPickingDelivery(del)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <Box className="w-3.5 h-3.5" />
                              <span>Pick Items</span>
                            </button>
                          )}

                          {del.status === 'Packed' && (
                            <button
                              onClick={() => updateDeliveryStatus(del.id, 'Ready')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Ready for Carrier
                            </button>
                          )}

                          {del.status === 'Ready' && (
                            <button
                              onClick={() => updateDeliveryStatus(del.id, 'Shipped')}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {del.status === 'Shipped' && (
                            <button
                              onClick={() => updateDeliveryStatus(del.id, 'Done')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Delivered & Settle</span>
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

      {/* CREATE DELIVERY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Outbound Customer Delivery</h2>
                <p className="text-xs text-slate-500">Initiate sales fulfillment order and reserve inventory stock</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer / Client Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Apex Robotics Inc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fulfillment Hub</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Target Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dispatch Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="standard">Standard Fulfillment</option>
                    <option value="urgent">Urgent Priority (Next-Day)</option>
                    <option value="low">Low Priority (Buffer)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Special Handling Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Anti-static packaging required..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Requested Items for Fulfillment</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {orderItems.map((oi, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={oi.productId}
                        onChange={(e) => {
                          const newProdId = e.target.value;
                          const prd = items.find((p) => p.id === newProdId);
                          setOrderItems((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, productId: newProdId, unitPrice: prd?.unitPrice || 25 }
                                : item
                            )
                          );
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {items.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.sku} - {prod.name} (Avail: {prod.stockAvailable})
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
                          value={oi.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setOrderItems((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, unitPrice: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                          placeholder="Price"
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
                  ))}
                </div>
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
                  Create Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF PICKING MODAL */}
      {pickingDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Floor Picking List: {pickingDelivery.deliveryNumber}
                </h3>
                <p className="text-xs text-slate-500">Target customer: {pickingDelivery.customerName}</p>
              </div>
              <button onClick={() => setPickingDelivery(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {pickingDelivery.items.map((item) => {
                  const isDone = item.pickedQty >= item.orderedQty;
                  return (
                    <div key={item.productId} className="p-3 bg-white flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Bin: <strong className="text-blue-600">{item.binLocation}</strong> &bull; Ordered: {item.orderedQty}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQty}
                          value={item.pickedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            pickDeliveryItem(pickingDelivery.id, item.productId, val);
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => pickDeliveryItem(pickingDelivery.id, item.productId, item.orderedQty)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono text-[10px]"
                        >
                          All ({item.orderedQty})
                        </button>
                        {isDone && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] flex items-center gap-2">
                <PackageCheck className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  Once all items are picked from their bin locations, the order automatically transitions to Packed status.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPickingDelivery(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Pick List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delivery Document #{viewingDelivery.deliveryNumber}
                </h3>
                <p className="text-xs text-slate-500">Customer: {viewingDelivery.customerName}</p>
              </div>
              <button onClick={() => setViewingDelivery(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>Status: <strong className="text-slate-900">{viewingDelivery.status}</strong></div>
                <div>Target Date: <strong className="text-slate-900">{viewingDelivery.deliveryDate}</strong></div>
                <div>Priority: <strong className="text-slate-900 uppercase">{viewingDelivery.priority}</strong></div>
                <div>Total Amount: <strong className="text-slate-900 font-bold">${viewingDelivery.totalAmount.toFixed(2)}</strong></div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Item</th>
                    <th className="py-2">Bin Location</th>
                    <th className="py-2 text-right">Ordered</th>
                    <th className="py-2 text-right">Picked</th>
                    <th className="py-2 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {viewingDelivery.items.map((i) => (
                    <tr key={i.productId}>
                      <td className="py-2.5 font-sans font-medium text-slate-900">{i.name}</td>
                      <td className="py-2.5 text-blue-600">{i.binLocation}</td>
                      <td className="py-2.5 text-right text-slate-700">{i.orderedQty}</td>
                      <td className="py-2.5 text-right text-emerald-600 font-bold">{i.pickedQty}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">${i.unitPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {viewingDelivery.notes && (
                <div className="text-[11px] text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <strong>Notes:</strong> {viewingDelivery.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setViewingDelivery(null)}
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
