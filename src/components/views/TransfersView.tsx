// StockX Enterprise Internal Transfers View
import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle,
  Truck,
  Building2,
  Calendar,
  X,
  Eye,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InternalTransfer, TransferStatus } from '../../types';

export const TransfersView: React.FC = () => {
  const {
    transfers,
    warehouses,
    locations,
    items,
    createTransfer,
    updateTransferStatus,
    currentUser,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<InternalTransfer | null>(null);

  // Form State
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [fromBin, setFromBin] = useState('Zone A / Rack A-01 / Shelf A-01-01');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [toBin, setToBin] = useState('Zone A / Rack A-01 / Shelf A-01-02');
  const [reason, setReason] = useState('Stock consolidation for regional fulfillment');
  const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: items[0]?.id || '', quantity: 10 },
  ]);

  const handleAddItemRow = () => {
    setTransferItems((prev) => [...prev, { productId: items[0]?.id || '', quantity: 5 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setTransferItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferItems.length === 0) return;

    createTransfer({
      fromWarehouseId,
      fromBin,
      toWarehouseId,
      toBin,
      reason,
      items: transferItems,
    });

    setIsCreateModalOpen(false);
    setTransferItems([{ productId: items[0]?.id || '', quantity: 10 }]);
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'Draft':
        return { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'Waiting':
        return { label: 'Waiting Dispatch', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'In Transit':
        return { label: 'In Transit', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'Received':
        return { label: 'Arrived at Destination', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'Done':
        return { label: 'Shelved & Settled', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'Cancelled':
        return { label: 'Cancelled', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internal Stock Transfers</h1>
          <p className="text-xs text-slate-500">
            Relocate stock across multiple facilities or re-slot bins within the same warehouse with full dual-ledger recording
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
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
            placeholder="Search transfers by transfer # or operational reason..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer w-full md:w-auto"
        >
          <option value="ALL">All Transfer Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Waiting">Waiting</option>
          <option value="In Transit">In Transit</option>
          <option value="Received">Received</option>
          <option value="Done">Done (Settled)</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Transfer #</th>
                <th className="py-3 px-4">Origin (From)</th>
                <th className="py-3 px-4">Destination (To)</th>
                <th className="py-3 px-4">Items / Qty</th>
                <th className="py-3 px-4">Operational Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No stock transfers match the current filter selection.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((trf) => {
                  const badge = getStatusBadge(trf.status);
                  const fromWh = warehouses.find((w) => w.id === trf.fromWarehouseId);
                  const toWh = warehouses.find((w) => w.id === trf.toWarehouseId);
                  const totalUnits = trf.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={trf.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {trf.transferNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{fromWh?.name || 'Origin'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{trf.fromBin}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{toWh?.name || 'Destination'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{trf.toBin}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-900">{totalUnits} units</div>
                        <div className="text-[10px] text-slate-400">{trf.items.length} unique SKUs</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {trf.reason}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingTransfer(trf)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Transfer Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {trf.status === 'Draft' && (
                            <button
                              onClick={() => updateTransferStatus(trf.id, 'Waiting')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                            >
                              Dispatch Order
                            </button>
                          )}

                          {trf.status === 'Waiting' && (
                            <button
                              onClick={() => updateTransferStatus(trf.id, 'In Transit')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Set In Transit</span>
                            </button>
                          )}

                          {trf.status === 'In Transit' && (
                            <button
                              onClick={() => updateTransferStatus(trf.id, 'Received')}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Arrived at Dest
                            </button>
                          )}

                          {trf.status === 'Received' && (
                            <button
                              onClick={() => updateTransferStatus(trf.id, 'Done')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Complete Put Away</span>
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

      {/* CREATE TRANSFER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Initiate Internal Stock Transfer</h2>
                <p className="text-xs text-slate-500">Relocate parts between storage hubs or internal bins</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origin Warehouse</label>
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={fromBin}
                    onChange={(e) => setFromBin(e.target.value)}
                    placeholder="Origin Bin Coordinates"
                    className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Warehouse</label>
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={toBin}
                    onChange={(e) => setToBin(e.target.value)}
                    placeholder="Target Bin Coordinates"
                    className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Purpose / Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Production line replenishment, re-slotting..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Inventory Items to Move</span>
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
                  {transferItems.map((ti, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={ti.productId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTransferItems((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, productId: val } : item))
                          );
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {items.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.sku} - {prod.name} (Stock: {prod.stockOnHand})
                          </option>
                        ))}
                      </select>

                      <div className="w-28">
                        <input
                          type="number"
                          min="1"
                          value={ti.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setTransferItems((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, quantity: val } : item))
                            );
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                          placeholder="Quantity"
                        />
                      </div>

                      {transferItems.length > 1 && (
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
                  Schedule Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TRANSFER MODAL */}
      {viewingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transfer Order #{viewingTransfer.transferNumber}
                </h3>
                <p className="text-xs text-slate-500">Initiated by {viewingTransfer.requestedBy}</p>
              </div>
              <button onClick={() => setViewingTransfer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>From: <strong className="text-slate-900">{viewingTransfer.fromBin}</strong></div>
                <div>To: <strong className="text-slate-900">{viewingTransfer.toBin}</strong></div>
                <div>Status: <strong className="text-slate-900">{viewingTransfer.status}</strong></div>
                <div>Date: <strong className="text-slate-900">{viewingTransfer.createdAt.split('T')[0]}</strong></div>
              </div>

              <div className="font-sans text-slate-600 text-xs p-2.5 bg-slate-50 rounded-lg">
                <strong>Reason:</strong> {viewingTransfer.reason}
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Transfer Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingTransfer.items.map((i) => (
                    <tr key={i.productId}>
                      <td className="py-2 font-sans font-medium text-slate-900">{i.name} ({i.sku})</td>
                      <td className="py-2 text-right font-bold text-blue-600">{i.quantity} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setViewingTransfer(null)}
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
