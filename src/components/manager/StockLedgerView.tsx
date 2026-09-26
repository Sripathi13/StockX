import React, { useState } from 'react';
import { History, Filter, Download, ArrowUpRight, ArrowDownLeft, RefreshCw, FileText } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { MovementType } from '../../types';

export const StockLedgerView: React.FC = () => {
  const { movements, items } = useInventory();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = movements.filter((m) => {
    if (typeFilter !== 'all' && m.movementType !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        m.sku.toLowerCase().includes(q) ||
        m.itemName.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q) ||
        m.userName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const exportLedgerCSV = () => {
    const headers = ['Timestamp', 'SKU', 'Item Name', 'Movement Type', 'Delta', 'Stock After', 'Reference ID', 'User', 'Role', 'Reason'];
    const rows = filteredMovements.map((m) => [
      m.timestamp,
      m.sku,
      `"${m.itemName.replace(/"/g, '""')}"`,
      m.movementType,
      m.qtyDelta,
      m.stockAfter,
      m.referenceId,
      `"${m.userName}"`,
      m.userRole,
      `"${m.reason.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_movement_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Stock Movement Audit Trail & Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all inventory additions, customer dispatch deductions, aisle put-away, and physical cycle reconciliations.
          </p>
        </div>

        <button
          onClick={exportLedgerCSV}
          className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <input
            type="text"
            placeholder="Search by SKU, item, ref ID, or staff name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-72 focus:outline-hidden"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Movement Types</option>
            <option value="INBOUND_PO">Inbound PO Receipts</option>
            <option value="OUTBOUND_DISPATCH">Outbound Picks</option>
            <option value="INTERNAL_TRANSFER">Internal Relocations</option>
            <option value="CYCLE_COUNT_ADJUST">Cycle Count Adjustments</option>
            <option value="MANUAL_WRITE_OFF">Scrap / Write-offs</option>
            <option value="MANUAL_RESTOCK">Manual Adjustments</option>
          </select>
        </div>

        <span className="text-slate-500 font-mono text-[11px]">
          {filteredMovements.length} logged events
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4 text-right">Delta</th>
                <th className="py-3 px-4 text-right">Stock After</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No movements recorded for this filter.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isPositive = mov.qtyDelta > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {mov.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{mov.sku}</div>
                        <div className="text-[11px] text-slate-500 max-w-xs truncate">{mov.itemName}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {mov.movementType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600'
                              : mov.qtyDelta < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }
                        >
                          {isPositive ? `+${mov.qtyDelta}` : mov.qtyDelta}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap tabular-nums">
                        {mov.stockAfter}
                      </td>

                      <td className="py-3 px-4 font-mono text-blue-700 whitespace-nowrap text-[11px]">
                        {mov.referenceId}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-900 font-medium">{mov.userName}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{mov.userRole.replace('_', ' ')}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate text-[11px]">
                        {mov.reason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
