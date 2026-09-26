import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Warehouse,
  Boxes,
  X,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockTransfer } from '../../types';

export const TransferOperations: React.FC = () => {
  const {
    transfers,
    createStockTransfer,
    completeStockTransfer,
    items,
    warehouses,
  } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [qty, setQty] = useState(10);
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [fromBin, setFromBin] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [toBin, setToBin] = useState('B02-R01-S01');
  const [reason, setReason] = useState('High velocity replenishment to front pick face');

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleOpenModal = () => {
    if (selectedItem) {
      setFromWarehouseId(selectedItem.warehouseId);
      setFromBin(selectedItem.binLocation);
    }
    setIsModalOpen(true);
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || qty <= 0) return;

    createStockTransfer({
      itemId: selectedItemId,
      qty: Number(qty),
      fromWarehouseId,
      fromBin: fromBin.toUpperCase(),
      toWarehouseId,
      toBin: toBin.toUpperCase(),
      reason,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bin & Inter-Warehouse Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Relocate inventory between storage bins, replenishing pick faces, or moving pallets between warehouse hubs.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Initiate Stock Relocation</span>
        </button>
      </div>

      {/* Transfers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {transfers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            No stock transfers currently on record.
          </div>
        ) : (
          transfers.map((trf) => {
            const isPending = trf.status === 'pending';
            const fromWh = warehouses.find((w) => w.id === trf.fromWarehouseId);
            const toWh = warehouses.find((w) => w.id === trf.toWarehouseId);

            return (
              <div
                key={trf.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-700">
                          {trf.sku}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {trf.transferNumber}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1 line-clamp-1">
                        {trf.name}
                      </h3>
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {trf.qty} units
                    </span>
                  </div>

                  {/* Route Visualizer */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">From</div>
                      <div className="font-mono font-bold text-slate-900 truncate">
                        {trf.fromBin}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{fromWh?.code}</div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                    <div className="space-y-0.5 text-right min-w-0">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">To</div>
                      <div className="font-mono font-bold text-emerald-700 truncate">
                        {trf.toBin}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{toWh?.code}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                    Reason: {trf.reason}
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 border-t border-slate-100">
                  {isPending ? (
                    <button
                      onClick={() => completeStockTransfer(trf.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Stock Moved</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-medium text-emerald-700 bg-emerald-50 py-1.5 rounded flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Transfer Completed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Initiate Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                Initiate Internal Stock Relocation
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Select Item to Relocate</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    const itm = items.find((i) => i.id === e.target.value);
                    if (itm) {
                      setFromWarehouseId(itm.warehouseId);
                      setFromBin(itm.binLocation);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-medium"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.sku} - {i.name} (Current: {i.binLocation}, On Hand: {i.stockOnHand} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Quantity to Move</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItem?.stockOnHand || 100}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Current Origin Bin</label>
                  <input
                    type="text"
                    value={fromBin || selectedItem?.binLocation || 'A01-R01-S01'}
                    onChange={(e) => setFromBin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Destination Hub</label>
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
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
                  <label className="font-medium text-slate-700">Destination Bin Coordinate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B03-R02-S01"
                    value={toBin}
                    onChange={(e) => setToBin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Operational Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moving fast-moving SKU to ground pick level"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Create Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
