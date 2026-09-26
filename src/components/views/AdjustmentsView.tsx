// StockX Enterprise Stock Adjustments View
import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  X,
  Eye,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockAdjustment, AdjustmentReason, AdjustmentStatus } from '../../types';

export const AdjustmentsView: React.FC = () => {
  const {
    adjustments,
    items,
    warehouses,
    createAdjustment,
    approveAdjustment,
    rejectAdjustment,
    currentUser,
    formatCurrency,
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingAdj, setViewingAdj] = useState<StockAdjustment | null>(null);

  // Form
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [reason, setReason] = useState<AdjustmentReason>('Damage');
  const [notes, setNotes] = useState('');
  const [adjItems, setAdjItems] = useState<
    { productId: string; recordedQty: number; physicalQty: number; notes: string }[]
  >([
    {
      productId: items[0]?.id || '',
      recordedQty: items[0]?.stockOnHand || 50,
      physicalQty: Math.max(0, (items[0]?.stockOnHand || 50) - 2),
      notes: '',
    },
  ]);

  const handleAddItemRow = () => {
    const item = items[0];
    setAdjItems((prev) => [
      ...prev,
      {
        productId: item?.id || '',
        recordedQty: item?.stockOnHand || 50,
        physicalQty: Math.max(0, (item?.stockOnHand || 50) - 1),
        notes: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setAdjItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjItems.length === 0) return;

    createAdjustment({
      warehouseId,
      reason,
      notes,
      items: adjItems,
    });

    setIsCreateModalOpen(false);
    setNotes('');
  };

  const getReasonBadge = (r: AdjustmentReason) => {
    switch (r) {
      case 'Damage':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Loss':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Recount':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Correction':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getStatusBadge = (s: AdjustmentStatus) => {
    switch (s) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Pending Approval':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Approved':
      case 'Done':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const filteredAdjustments = adjustments.filter((a) => {
    const matchesSearch =
      a.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesReason = selectedReason === 'ALL' || a.reason === selectedReason;
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesReason && matchesStatus;
  });

  const isAuthorizedToApprove =
    currentUser?.role === 'ADMIN' || currentUser?.role === 'INVENTORY_MANAGER';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Adjustments</h1>
          <p className="text-xs text-slate-500">
            Reconcile physical inventory discrepancies, write-offs for damaged goods, loss, and count audits with managerial sign-off
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
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
            placeholder="Search by Adjustment # or notes..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Reasons</option>
            <option value="Damage">Damage</option>
            <option value="Loss">Loss</option>
            <option value="Recount">Recount</option>
            <option value="Correction">Correction</option>
            <option value="Expired">Expired</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Done">Done (Reconciled)</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Adjustment #</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Discrepancy SKUs</th>
                <th className="py-3 px-4 text-right">Net Variance Qty</th>
                <th className="py-3 px-4 text-right">Impact Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No stock adjustments match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((adj) => {
                  const wh = warehouses.find((w) => w.id === adj.warehouseId);
                  const netVariance = adj.items.reduce((acc, i) => acc + i.varianceQty, 0);

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {adj.adjustmentNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getReasonBadge(adj.reason)}`}>
                          {adj.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {wh?.name || wh?.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{adj.items[0]?.name || 'Item'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {adj.items.length > 1 ? `+${adj.items.length - 1} more items` : adj.items[0]?.sku}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          netVariance > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {netVariance > 0 ? `+${netVariance}` : netVariance}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(Math.abs(adj.totalVarianceValue))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(adj.status)}`}>
                          {adj.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingAdj(adj)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Adjustment Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {adj.status === 'Pending Approval' && isAuthorizedToApprove && (
                            <>
                              <button
                                onClick={() => approveAdjustment(adj.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Approve Variance & Post to Ledger"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => rejectAdjustment(adj.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Reject Adjustment"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Stock Adjustment Discrepancy</h2>
                <p className="text-xs text-slate-500">Submit variance between system counts and physical stock</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Warehouse</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Reason Category</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="Damage">Damage (Crushed carton, broken pins)</option>
                    <option value="Loss">Loss (Missing item, inventory shrinkage)</option>
                    <option value="Recount">Recount (Physical cycle count correction)</option>
                    <option value="Correction">Correction (Data entry adjustment)</option>
                    <option value="Expired">Expired (Batch shelf life exceeded)</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Discrepancy Items</span>
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
                  {adjItems.map((ai, index) => {
                    const itemObj = items.find((i) => i.id === ai.productId);
                    const variance = ai.physicalQty - ai.recordedQty;

                    return (
                      <div key={index} className="space-y-2 p-2 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                          <select
                            value={ai.productId}
                            onChange={(e) => {
                              const val = e.target.value;
                              const prod = items.find((p) => p.id === val);
                              setAdjItems((prev) =>
                                prev.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        productId: val,
                                        recordedQty: prod?.stockOnHand || 0,
                                        physicalQty: prod?.stockOnHand || 0,
                                      }
                                    : item
                                )
                              );
                            }}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                          >
                            {items.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.sku} - {prod.name} (Recorded: {prod.stockOnHand})
                              </option>
                            ))}
                          </select>

                          <div className="w-24">
                            <span className="text-[10px] text-slate-400 block">Recorded:</span>
                            <span className="font-mono font-bold text-slate-700">{ai.recordedQty}</span>
                          </div>

                          <div className="w-28">
                            <span className="text-[10px] text-slate-400 block">Physical Count:</span>
                            <input
                              type="number"
                              min="0"
                              value={ai.physicalQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setAdjItems((prev) =>
                                  prev.map((item, i) => (i === index ? { ...item, physicalQty: val } : item))
                                );
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-center font-mono font-bold"
                            />
                          </div>

                          <div className="w-20 text-right">
                            <span className="text-[10px] text-slate-400 block">Variance:</span>
                            <span className={`font-mono font-bold ${variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {variance > 0 ? `+${variance}` : variance}
                            </span>
                          </div>

                          {adjItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supervisor Incident Report / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail cause of damage, aisle location, investigation notes..."
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
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingAdj && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Adjustment #{viewingAdj.adjustmentNumber}
                </h3>
                <p className="text-xs text-slate-500">Reason: {viewingAdj.reason}</p>
              </div>
              <button onClick={() => setViewingAdj(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>Status: <strong className="text-slate-900">{viewingAdj.status}</strong></div>
                <div>Submitted By: <strong className="text-slate-900">{viewingAdj.createdBy}</strong></div>
                <div>Approved By: <strong className="text-slate-900">{viewingAdj.approvedBy || 'Pending'}</strong></div>
                <div>Total Impact: <strong className="text-slate-900 font-bold">{formatCurrency(Math.abs(viewingAdj.totalVarianceValue))}</strong></div>
              </div>

              {viewingAdj.notes && (
                <div className="font-sans text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <strong>Notes:</strong> {viewingAdj.notes}
                </div>
              )}

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Recorded</th>
                    <th className="py-2 text-right">Physical</th>
                    <th className="py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingAdj.items.map((i) => (
                    <tr key={i.productId}>
                      <td className="py-2.5 font-sans font-medium text-slate-900">{i.name} ({i.sku})</td>
                      <td className="py-2.5 text-right text-slate-600">{i.recordedQty}</td>
                      <td className="py-2.5 text-right text-slate-900 font-bold">{i.physicalQty}</td>
                      <td className={`py-2.5 text-right font-bold ${i.varianceQty < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {i.varianceQty > 0 ? `+${i.varianceQty}` : i.varianceQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setViewingAdj(null)}
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
