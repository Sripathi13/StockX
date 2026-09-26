import React, { useState } from 'react';
import {
  Plus,
  ArrowUpFromDot,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  X,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { OutboundDispatch } from '../../types';

export const OutboundDispatchManager: React.FC = () => {
  const {
    dispatchOrders,
    items,
    warehouses,
    createDispatchOrder,
    activeWarehouseId,
  } = useInventory();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New order form state
  const [customerName, setCustomerName] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [priority, setPriority] = useState<'urgent' | 'standard' | 'low'>('standard');
  const [orderLines, setOrderLines] = useState<{ itemId: string; requestedQty: number }[]>([
    { itemId: items[0]?.id || '', requestedQty: 5 },
  ]);
  const [orderNotes, setOrderNotes] = useState('');

  // Filtered orders
  const filteredOrders = dispatchOrders.filter((ord) => {
    if (activeWarehouseId !== 'all' && ord.warehouseId !== activeWarehouseId) return false;
    if (statusFilter !== 'all' && ord.status !== statusFilter) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || orderLines.length === 0) return;

    createDispatchOrder({
      customerName,
      warehouseId,
      priority,
      items: orderLines,
      notes: orderNotes,
    });

    setIsCreateModalOpen(false);
    setCustomerName('');
    setOrderNotes('');
  };

  const addLine = () => {
    if (items.length === 0) return;
    setOrderLines([...orderLines, { itemId: items[0].id, requestedQty: 2 }]);
  };

  const removeLine = (idx: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Outbound Customer Orders & Fulfillment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize customer order dispatching, lock stock reservations, and monitor warehouse floor picking progress.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Authorize Dispatch Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit text-xs">
        {['all', 'pending_picking', 'picking_in_progress', 'picked', 'staged'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 font-medium rounded-md capitalize transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st === 'all'
              ? 'All Orders'
              : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            No outbound orders in this state.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const totalItems = order.items.reduce((s, i) => s + i.requestedQty, 0);
            const pickedItems = order.items.reduce((s, i) => s + i.pickedQty, 0);
            const progress = totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0;
            const isFinished = order.status === 'picked' || order.status === 'staged';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {order.orderNumber}
                        </span>
                        {order.priority === 'urgent' && (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase">
                            Urgent Air
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        {order.customerName}
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-400">
                      {order.createdAt.split('T')[0]}
                    </div>
                  </div>

                  {/* Pick Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Warehouse Picking Progress</span>
                      <span className="font-mono font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFinished ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Line Items Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-[11px] text-slate-400 font-medium">Assigned Floor Pick Items:</div>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-slate-700 bg-slate-50 px-2 py-1 rounded"
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <span className="font-mono text-blue-700 font-semibold">{item.sku}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-500 text-[10px]">{item.binLocation}</span>
                        </div>
                        <div className="font-mono text-xs tabular-nums font-semibold">
                          {item.pickedQty} / {item.requestedQty}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="text-[11px] text-slate-500 bg-amber-50/60 border border-amber-200/60 p-2 rounded">
                      Note: {order.notes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 text-[11px]">
                    Assignee: <strong className="text-slate-800">{order.assignedToStaffName}</strong>
                  </div>

                  {isFinished ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Staged for Carrier
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-blue-700 font-medium text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      Picking On Floor
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Outbound Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                Authorize Outbound Customer Order
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Customer / Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Robotics Labs, Global Defense Systems"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Fulfillment Warehouse Hub</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Dispatch Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'urgent' | 'standard' | 'low')}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                  >
                    <option value="urgent">Urgent Air Priority</option>
                    <option value="standard">Standard Freight</option>
                    <option value="low">Bulk Economy Ground</option>
                  </select>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Requested Inventory Items</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-blue-600 hover:underline flex items-center gap-1 font-normal text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {orderLines.map((line, idx) => {
                  const itm = items.find((i) => i.id === line.itemId);
                  const availableStock = itm ? itm.stockOnHand - itm.stockReserved : 0;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-8 space-y-1">
                        <select
                          value={line.itemId}
                          onChange={(e) => {
                            const updated = [...orderLines];
                            updated[idx].itemId = e.target.value;
                            setOrderLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                        >
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.sku} - {i.name} (Avail: {i.stockOnHand - i.stockReserved} {i.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3 space-y-1">
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, availableStock)}
                          value={line.requestedQty}
                          onChange={(e) => {
                            const updated = [...orderLines];
                            updated[idx].requestedQty = Number(e.target.value);
                            setOrderLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        {orderLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="font-medium text-slate-700">Special Handling Instructions</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Gate instructions, special packaging, temperature requirements..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
                  Confirm & Send Pick List to Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
