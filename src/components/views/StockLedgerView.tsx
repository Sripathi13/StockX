// StockX Enterprise Immutable Stock Ledger View
import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Sliders,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { MovementType, StockLedgerEntry } from '../../types';

export const StockLedgerView: React.FC = () => {
  const { stockLedger, warehouses, exportStockLedgerCSV } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');

  const filteredEntries = stockLedger.filter((entry) => {
    const matchesSearch =
      entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedMovementType === 'ALL' || entry.movementType === selectedMovementType;
    const matchesWarehouse =
      selectedWarehouse === 'ALL' || entry.warehouseId === selectedWarehouse;

    return matchesSearch && matchesType && matchesWarehouse;
  });

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'RECEIPT':
        return {
          label: 'Receipt Inbound',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ArrowDownLeft,
        };
      case 'DELIVERY':
        return {
          label: 'Delivery Outbound',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: ArrowUpRight,
        };
      case 'TRANSFER_IN':
        return {
          label: 'Transfer In',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ArrowRightLeft,
        };
      case 'TRANSFER_OUT':
        return {
          label: 'Transfer Out',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: ArrowRightLeft,
        };
      case 'ADJUSTMENT_POSITIVE':
        return {
          label: 'Adjustment (+)',
          color: 'bg-teal-100 text-teal-800 border-teal-200',
          icon: Sliders,
        };
      case 'ADJUSTMENT_NEGATIVE':
        return {
          label: 'Adjustment (-)',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Sliders,
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 uppercase">
              Audited Core
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Immutable Stock Movement Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cryptographically chronological records of all physical movements, receipts, dispatches, and warehouse rebalances
          </p>
        </div>

        <button
          onClick={exportStockLedgerCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, Product Name, Reference #, or Operator..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedMovementType}
            onChange={(e) => setSelectedMovementType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Movement Types</option>
            <option value="RECEIPT">Inbound Receipts</option>
            <option value="DELIVERY">Outbound Deliveries</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="ADJUSTMENT_POSITIVE">Positive Adjustments</option>
            <option value="ADJUSTMENT_NEGATIVE">Negative Adjustments</option>
          </select>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Facilities</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Warehouse & Bin</th>
                <th className="py-3 px-4 text-right">Delta (Change)</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Operational Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No ledger entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const badge = getMovementBadge(entry.movementType);
                  const Icon = badge.icon;
                  const isPositive = entry.quantityChange > 0;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">
                        {entry.referenceId}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{entry.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{entry.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="text-slate-800 font-medium">{entry.warehouseName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{entry.locationCode || 'Warehouse Floor'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-sm">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${entry.quantityChange}` : entry.quantityChange}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                        {entry.balanceAfter}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-medium text-slate-900">{entry.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{entry.userRole}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 max-w-xs truncate">
                        {entry.notes || '—'}
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
