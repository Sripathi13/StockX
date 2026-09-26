import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Boxes,
  ArrowDownToDot,
  ArrowUpFromDot,
  ArrowRight,
  Download,
  Plus,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { TabKey } from '../layout/Sidebar';

interface ManagerDashboardProps {
  onNavigateTab: (tab: TabKey) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateTab }) => {
  const {
    items,
    purchaseOrders,
    dispatchOrders,
    movements,
    exportItemsCSV,
    activeWarehouseId,
    warehouses,
  } = useInventory();

  // Compute metrics
  const activeItems = items.filter(
    (i) => activeWarehouseId === 'all' || i.warehouseId === activeWarehouseId
  );

  const totalSKUs = activeItems.length;
  const totalUnitsOnHand = activeItems.reduce((acc, i) => acc + i.stockOnHand, 0);
  const totalValuation = activeItems.reduce((acc, i) => acc + i.stockOnHand * i.unitCost, 0);
  const lowStockItems = activeItems.filter((i) => i.stockOnHand <= i.minThreshold);

  const pendingPOs = purchaseOrders.filter(
    (po) => po.status === 'ordered' || po.status === 'shipped'
  );
  const activeDispatches = dispatchOrders.filter(
    (d) => d.status === 'pending_picking' || d.status === 'picking_in_progress'
  );

  const recentMovements = movements.slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Inventory Strategy & Stock Health Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time warehouse telemetry, valuation, replenishment queues, and floor throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportItemsCSV}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Catalog CSV</span>
          </button>
          <button
            onClick={() => onNavigateTab('manager_inbound')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Single elevation, flat hairline border) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Asset Valuation</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span>{totalSKUs} active SKUs</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{totalUnitsOnHand.toLocaleString()} total units</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Reorder Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 tabular-nums ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStockItems.length}{' '}
            <span className="text-xs font-normal text-slate-500">SKUs below min</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Critical stock threshold</span>
            {lowStockItems.length > 0 && (
              <button
                onClick={() => onNavigateTab('manager_catalog')}
                className="text-blue-600 hover:underline font-medium"
              >
                Review Items
              </button>
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Inbound POs</span>
            <ArrowDownToDot className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {pendingPOs.length}{' '}
            <span className="text-xs font-normal text-slate-500">shipments incoming</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Awaiting delivery/dock receipt</span>
            <button
              onClick={() => onNavigateTab('manager_inbound')}
              className="text-blue-600 hover:underline font-medium"
            >
              Inbound Dock
            </button>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Customer Dispatches</span>
            <ArrowUpFromDot className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {activeDispatches.length}{' '}
            <span className="text-xs font-normal text-slate-500">in picking queue</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Fulfillment floor progress</span>
            <button
              onClick={() => onNavigateTab('manager_outbound')}
              className="text-blue-600 hover:underline font-medium"
            >
              Dispatch Board
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Critical Stock Alerts & Recent Ledger Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Urgent Reorder Stock Warning */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Replenishment & Low Stock Triggers
              </h2>
              <p className="text-xs text-slate-500">
                Items whose stock on hand has breached the designated safety threshold.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('manager_inbound')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              <span>Restock via PO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-100 text-slate-500 text-xs">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-semibold text-slate-700">All Stock Levels Nominal</div>
              <p className="mt-1">No items currently below minimum replenishment thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map((item) => {
                const deficit = item.minThreshold - item.stockOnHand;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-blue-700">{item.sku}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-500">{item.binLocation}</span>
                      </div>
                      <div className="font-medium text-slate-900 mt-0.5 truncate max-w-xs">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Supplier: {item.supplierName}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-rose-600 font-bold font-mono tabular-nums">
                        {item.stockOnHand} / {item.minThreshold} {item.unit}
                      </div>
                      <div className="text-[11px] text-amber-700 font-medium">
                        Deficit: -{deficit} {item.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Movement Ledger Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Live Stock Movement Stream
              </h2>
              <p className="text-xs text-slate-500">
                Audited stock changes recorded across receiving, picking, and floor adjustments.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('manager_ledger')}
              className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              <span>Full Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentMovements.map((mov) => {
              const isPositive = mov.qtyDelta > 0;
              return (
                <div
                  key={mov.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 text-xs flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-900">{mov.sku}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] font-mono text-slate-500 uppercase">{mov.movementType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-slate-700 truncate">{mov.reason}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Ref: {mov.referenceId}</span>
                      <span>·</span>
                      <span>By: {mov.userName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold text-sm tabular-nums ${
                        isPositive ? 'text-emerald-600' : mov.qtyDelta < 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {isPositive ? `+${mov.qtyDelta}` : mov.qtyDelta}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      After: {mov.stockAfter}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
