import React, { useState } from 'react';
import {
  CheckSquare,
  Barcode as BarcodeIcon,
  Check,
  MapPin,
  Clock,
  ArrowRight,
  Package,
  AlertCircle,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { OutboundDispatch, PickItem } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { soundService } from '../../utils/audio';

export const PickingOperations: React.FC = () => {
  const { dispatchOrders, pickItemInOrder, completePickOrder, items } = useInventory();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [scannerTargetSku, setScannerTargetSku] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Active orders
  const activeOrders = dispatchOrders.filter(
    (d) => d.status === 'pending_picking' || d.status === 'picking_in_progress' || d.status === 'picked'
  );

  const currentOrder = activeOrders.find((o) => o.id === selectedOrderId) || activeOrders[0] || null;

  const handlePickSingle = (orderId: string, itemId: string) => {
    pickItemInOrder(orderId, itemId, 1);
  };

  const handlePickAllForLine = (orderId: string, item: PickItem) => {
    const remaining = item.requestedQty - item.pickedQty;
    if (remaining > 0) {
      pickItemInOrder(orderId, item.itemId, remaining);
    }
  };

  const handleOpenScannerForItem = (sku: string) => {
    setScannerTargetSku(sku);
    setIsScannerOpen(true);
  };

  const handleScannedItem = (scanned: { id: string; sku: string }) => {
    if (currentOrder) {
      const match = currentOrder.items.find((i) => i.itemId === scanned.id || i.sku === scanned.sku);
      if (match) {
        handlePickSingle(currentOrder.id, match.itemId);
        setIsScannerOpen(false);
      } else {
        soundService.playAlertTone();
        alert(`Scanned item ${scanned.sku} is not part of active pick order ${currentOrder.orderNumber}!`);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Fulfillment Picking Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Floor order picking checklist with optical scan verification and bin routing.
          </p>
        </div>

        {currentOrder && (
          <button
            onClick={() => {
              setScannerTargetSku(null);
              setIsScannerOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>Launch Floor Barcode Terminal</span>
          </button>
        )}
      </div>

      {activeOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <CheckSquare className="w-10 h-10 text-emerald-500 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900">
            All Assigned Pick Lists Cleared
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Great job! No pending orders awaiting picking at this time. New customer dispatch orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Order Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
              Pick Orders Queue ({activeOrders.length})
            </div>

            <div className="space-y-2.5">
              {activeOrders.map((order) => {
                const isSelected = order.id === currentOrder?.id;
                const totalReq = order.items.reduce((s, i) => s + i.requestedQty, 0);
                const totalDone = order.items.reduce((s, i) => s + i.pickedQty, 0);
                const isFinished = order.items.every((i) => i.isCompleted);

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {order.orderNumber}
                      </span>
                      {order.priority === 'urgent' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-medium text-slate-800 truncate">
                      {order.customerName}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                      <span>{order.items.length} SKUs</span>
                      <span className={isFinished ? 'text-emerald-700 font-bold' : ''}>
                        {totalDone} / {totalReq} picked
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Order Pick Checklist (8 cols) */}
          {currentOrder && (
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-2xs">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-slate-900">
                      {currentOrder.orderNumber}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                      {currentOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Customer: <strong className="text-slate-900">{currentOrder.customerName}</strong>
                  </div>
                </div>

                {/* All items picked action */}
                {currentOrder.items.every((i) => i.isCompleted) ? (
                  <button
                    onClick={() => completePickOrder(currentOrder.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Stage for Dispatch</span>
                  </button>
                ) : (
                  <div className="text-right text-xs text-slate-500 font-mono">
                    Progress: {currentOrder.items.filter((i) => i.isCompleted).length} of {currentOrder.items.length} lines complete
                  </div>
                )}
              </div>

              {/* Items Pick Checklist organized by shelf route */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                  Bin Pick Route
                </div>

                <div className="space-y-3">
                  {currentOrder.items.map((item, idx) => {
                    const catalogItem = items.find((i) => i.id === item.itemId);
                    const isDone = item.isCompleted;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-slate-50/80 border-slate-200 opacity-80'
                            : 'bg-white border-emerald-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            {/* Bin Location Badge */}
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                                <MapPin className="w-3 h-3 text-emerald-400" />
                                {item.binLocation}
                              </span>
                              <span className="font-mono font-bold text-xs text-blue-700">
                                {item.sku}
                              </span>
                              {catalogItem && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Barcode: {catalogItem.barcode}
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-semibold text-slate-900">
                              {item.name}
                            </div>
                          </div>

                          {/* Pick controls */}
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right font-mono">
                              <div className="text-lg font-bold text-slate-900 tabular-nums">
                                {item.pickedQty} / {item.requestedQty}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isDone ? 'Complete' : 'Remaining: ' + (item.requestedQty - item.pickedQty)}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {!isDone && (
                                <>
                                  <button
                                    onClick={() => handleOpenScannerForItem(item.sku)}
                                    title="Scan Barcode to verify & pick"
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <BarcodeIcon className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Scan</span>
                                  </button>
                                  <button
                                    onClick={() => handlePickSingle(currentOrder.id, item.itemId)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    +1 Pick
                                  </button>
                                  <button
                                    onClick={() => handlePickAllForLine(currentOrder.id, item)}
                                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Pick All
                                  </button>
                                </>
                              )}

                              {isDone && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                  <Check className="w-3.5 h-3.5" />
                                  Line Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barcode Scanner Modal with Target SKU */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        targetSkuPrompt={scannerTargetSku || undefined}
        onItemScanned={handleScannedItem}
      />
    </div>
  );
};
