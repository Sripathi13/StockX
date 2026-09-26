import React from 'react';
import {
  CheckSquare,
  Boxes,
  ArrowLeftRight,
  ClipboardList,
  Barcode,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { TabKey } from '../layout/Sidebar';

interface WarehouseDashboardProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenScanner: () => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({
  onNavigateTab,
  onOpenScanner,
}) => {
  const { dispatchOrders, shelvingTasks, transfers, cycleCounts, currentUser } = useInventory();

  const pendingPicks = dispatchOrders.filter(
    (d) => d.status === 'pending_picking' || d.status === 'picking_in_progress'
  );
  const pendingShelving = shelvingTasks.filter((t) => t.status === 'pending');
  const pendingTransfers = transfers.filter((t) => t.status === 'pending');
  const activeCycleCounts = cycleCounts.filter(
    (c) => c.status === 'open' || c.status === 'in_progress'
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
            Warehouse Floor Operations
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Floor Workstation · {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-300">
            Assigned to Central Logistics Alpha Hub. Select your active queue to begin fulfillment.
          </p>
        </div>

        <button
          onClick={onOpenScanner}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Barcode className="w-4 h-4 text-slate-950" />
          <span>Launch Barcode Scanner</span>
        </button>
      </div>

      {/* 4 Core Warehouse Workstations Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workstation 1: Picking */}
        <div
          onClick={() => onNavigateTab('staff_picking')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {pendingPicks.length}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Order Picking Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Retrieve customer order items from designated bins with barcode scan verification.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Enter Picking Mode</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Workstation 2: Put-away & Shelving */}
        <div
          onClick={() => onNavigateTab('staff_shelving')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {pendingShelving.length}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Put-away & Shelving
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stow received freight into warehouse aisles, racks, and designated shelf coordinates.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-medium">
            <span>Enter Shelving Tasks</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Workstation 3: Bin Transfers */}
        <div
          onClick={() => onNavigateTab('staff_transfers')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {pendingTransfers.length}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Bin & Hub Transfers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reorganize stock between bins or transfer overflow batches to regional hubs.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-700 font-medium">
            <span>Transfer Inventory</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Workstation 4: Physical Cycle Counting */}
        <div
          onClick={() => onNavigateTab('staff_cycle_counts')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {activeCycleCounts.length}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                Physical Cycle Counts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan rack barcodes, verify actual physical shelf counts, and record discrepancies.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>Audit Racks & Bins</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Immediate Tasks Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Orders for Picking */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Immediate Picking Queue
            </h2>
            <button
              onClick={() => onNavigateTab('staff_picking')}
              className="text-xs text-emerald-700 hover:underline font-medium"
            >
              Open Picker View
            </button>
          </div>

          {pendingPicks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              No orders pending picking right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingPicks.slice(0, 3).map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onNavigateTab('staff_picking')}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                      {ord.priority === 'urgent' && (
                        <span className="text-[10px] text-rose-700 font-semibold uppercase">Urgent</span>
                      )}
                    </div>
                    <div className="text-slate-600 mt-0.5">{ord.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-800">
                      {ord.items.length} items
                    </div>
                    <div className="text-[10px] text-blue-600 font-medium capitalize">
                      {ord.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Shelving Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Pending Put-away & Shelving
            </h2>
            <button
              onClick={() => onNavigateTab('staff_shelving')}
              className="text-xs text-blue-700 hover:underline font-medium"
            >
              Open Shelving View
            </button>
          </div>

          {pendingShelving.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              Dock staging area clear. No items waiting for shelving.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingShelving.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onNavigateTab('staff_shelving')}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{task.sku}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-mono text-[11px]">{task.taskNumber}</span>
                    </div>
                    <div className="text-slate-700 mt-0.5 truncate max-w-xs">{task.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {task.qtyToShelve} units
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {task.targetBin}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
