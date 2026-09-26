// StockX Enterprise Dashboard View
import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowDownToDot,
  ArrowUpFromDot,
  DollarSign,
  Package,
  Layers,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { TabKey } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenScanner?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenScanner,
}) => {
  const {
    items,
    receipts,
    deliveries,
    warehouses,
    locations,
    categories,
    stockLedger,
    currentUser,
    settings,
  } = useInventory();

  // Metrics
  const totalValuationCost = items.reduce((acc, i) => acc + i.stockOnHand * i.unitCost, 0);
  const totalValuationSelling = items.reduce((acc, i) => acc + i.stockOnHand * i.unitPrice, 0);
  const totalUnitsOnHand = items.reduce((acc, i) => acc + i.stockOnHand, 0);
  const totalUnitsReserved = items.reduce((acc, i) => acc + i.stockReserved, 0);

  const lowStockItems = items.filter((i) => i.stockOnHand <= i.minThreshold);
  const waitingReceipts = receipts.filter((r) => r.status === 'Waiting');
  const activeDeliveries = deliveries.filter(
    (d) => d.status === 'Picking' || d.status === 'Packed' || d.status === 'Draft'
  );

  // Category Breakdown
  const categoryStats = categories.map((cat) => {
    const catItems = items.filter((i) => i.category === cat.name);
    const value = catItems.reduce((acc, i) => acc + i.stockOnHand * i.unitCost, 0);
    const units = catItems.reduce((acc, i) => acc + i.stockOnHand, 0);
    return {
      name: cat.name,
      value,
      units,
      percent: totalValuationCost > 0 ? (value / totalValuationCost) * 100 : 0,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold uppercase">
              Production IMS
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Cluster: Chicago Central Alpha
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Welcome back, {currentUser?.name || 'Operator'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock ledger synchronization active. All operations are audited with immutable tracking.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-blue-400" />
              <span>Barcode Terminal</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('receipts')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ArrowDownToDot className="w-4 h-4" />
            <span>New Receipt</span>
          </button>

          <button
            onClick={() => onNavigateTab('deliveries')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
          >
            <ArrowUpFromDot className="w-4 h-4" />
            <span>New Delivery</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Valuation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Stock Valuation (Cost)
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              ${totalValuationCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Selling Est:</span>
              <strong className="text-slate-700 font-mono">
                ${totalValuationSelling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

        {/* Total Physical Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Units on Hand
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {totalUnitsOnHand.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>{items.length} Unique SKUs</span>
              <span>&bull;</span>
              <span className="text-slate-600 font-mono">{totalUnitsReserved} Reserved</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold tracking-tight font-mono ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockItems.length} <span className="text-xs font-normal text-slate-500">triggers</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Below safety reorder point</span>
              <span className="text-blue-600 font-medium text-[11px] flex items-center">
                Review <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Pending Operations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Open Logistical Orders
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {waitingReceipts.length + activeDeliveries.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-blue-600 font-medium">{waitingReceipts.length} Inbound</span>
              <span>&bull;</span>
              <span className="text-emerald-600 font-medium">{activeDeliveries.length} Outbound</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Breakdown & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Valuation Breakdown & Warehouse Utilization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Distribution Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Inventory Valuation by Category</h2>
                <p className="text-xs text-slate-500">Asset capital allocation across industrial segments</p>
              </div>
              <button
                onClick={() => onNavigateTab('categories')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Categories</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">{cat.units} units</span>
                      <span className="font-bold text-slate-900">
                        ${cat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, cat.percent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Warehouse Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Multi-Warehouse Network</h2>
                <p className="text-xs text-slate-500">Real-time capacity and active bin occupancy</p>
              </div>
              <button
                onClick={() => onNavigateTab('warehouses')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View Warehouses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((wh) => {
                const whItems = items.filter((i) => i.warehouseId === wh.id);
                const whUnits = whItems.reduce((acc, i) => acc + i.stockOnHand, 0);
                const occupancyPercent = wh.capacity > 0 ? (whUnits / wh.capacity) * 100 : 0;

                return (
                  <div
                    key={wh.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-mono text-slate-500">{wh.code}</div>
                        <div className="text-sm font-bold text-slate-900">{wh.name}</div>
                        <div className="text-xs text-slate-500">{wh.location}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Capacity Occupancy</span>
                        <span className="font-mono font-semibold">
                          {whUnits.toLocaleString()} / {wh.capacity.toLocaleString()} ({occupancyPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupancyPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span>Manager: {wh.managerName}</span>
                      <span>{wh.locations?.length || 0} Defined Bins</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Critical Reorders & Recent Ledger Activity */}
        <div className="space-y-6">
          {/* Critical Reorder Triggers */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Reorder Alerts</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800">
                {lowStockItems.length}
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span>All inventory items are currently above safety stock thresholds.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 line-clamp-1">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.sku} &bull; On Hand: <strong className="text-amber-600">{item.stockOnHand}</strong> / Reorder: {item.minThreshold}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateTab('receipts')}
                      className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium shrink-0 cursor-pointer"
                    >
                      PO +{item.reorderQuantity}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Immutable Stock Ledger Activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Stock Ledger Feed</h2>
              <button
                onClick={() => onNavigateTab('stock_ledger')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Ledger
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {stockLedger.slice(0, 5).map((entry) => (
                <div key={entry.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{entry.sku}</span>
                    <span
                      className={`font-mono font-bold ${
                        entry.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 line-clamp-1">
                    {entry.productName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{entry.movementType} &bull; {entry.referenceId}</span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
