import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToDot,
  ArrowUpFromDot,
  Truck,
  History,
  CheckSquare,
  ArrowLeftRight,
  ClipboardList,
  ScanLine,
  SlidersHorizontal,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export type TabKey =
  // Manager tabs
  | 'manager_overview'
  | 'manager_catalog'
  | 'manager_inbound'
  | 'manager_outbound'
  | 'manager_suppliers'
  | 'manager_ledger'
  // Staff tabs
  | 'staff_overview'
  | 'staff_picking'
  | 'staff_shelving'
  | 'staff_transfers'
  | 'staff_cycle_counts';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
}) => {
  const { currentUser, switchRole, shelvingTasks, dispatchOrders, cycleCounts, items } =
    useInventory();

  const isManager = currentUser?.role === 'manager';

  const pendingShelvingCount = shelvingTasks.filter((t) => t.status === 'pending').length;
  const pendingPickCount = dispatchOrders.filter(
    (d) => d.status === 'pending_picking' || d.status === 'picking_in_progress'
  ).length;
  const lowStockCount = items.filter((i) => i.stockOnHand <= i.minThreshold).length;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        {/* Role badge with quick-switch hint */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Active Workspace
            </div>
            <div className="text-xs font-semibold text-white">
              {isManager ? 'Stock Strategy & In/Out' : 'Warehouse Floor Ops'}
            </div>
          </div>
          <button
            onClick={() => switchRole(isManager ? 'warehouse_staff' : 'manager')}
            title="Switch Persona"
            className="p-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        {isManager ? (
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 pb-1">
              Inventory Management
            </div>

            <button
              onClick={() => onSelectTab('manager_overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'manager_overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => onSelectTab('manager_catalog')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'manager_catalog'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Stock Catalog & Bins</span>
              </div>
              {lowStockCount > 0 && (
                <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {lowStockCount} low
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('manager_inbound')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'manager_inbound'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowDownToDot className="w-4 h-4 shrink-0" />
              <span>Inbound Stock & POs</span>
            </button>

            <button
              onClick={() => onSelectTab('manager_outbound')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'manager_outbound'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowUpFromDot className="w-4 h-4 shrink-0" />
              <span>Outbound Dispatches</span>
            </button>

            <button
              onClick={() => onSelectTab('manager_suppliers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'manager_suppliers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Suppliers & Procurement</span>
            </button>

            <button
              onClick={() => onSelectTab('manager_ledger')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'manager_ledger'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Audit Ledger & History</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 pb-1">
              Floor Tasks & Execution
            </div>

            <button
              onClick={() => onSelectTab('staff_overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'staff_overview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Floor Tasks Hub</span>
            </button>

            <button
              onClick={() => onSelectTab('staff_picking')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'staff_picking'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span>Picking Operations</span>
              </div>
              {pendingPickCount > 0 && (
                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  {pendingPickCount} orders
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('staff_shelving')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'staff_shelving'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Put-away & Shelving</span>
              </div>
              {pendingShelvingCount > 0 && (
                <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {pendingShelvingCount} tasks
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('staff_transfers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'staff_transfers'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>Bin & Hub Transfers</span>
            </button>

            <button
              onClick={() => onSelectTab('staff_cycle_counts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'staff_cycle_counts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Physical Cycle Counting</span>
            </button>
          </div>
        )}

        {/* Floor Quick Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            onClick={onOpenScanner}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <ScanLine className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Barcode Terminal</span>
          </button>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center justify-between">
          <span>Terminal Hub</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
        <div className="text-slate-400 mt-1 truncate">
          Role: {isManager ? 'Inventory Manager' : 'Warehouse Staff'}
        </div>
      </div>
    </aside>
  );
};
