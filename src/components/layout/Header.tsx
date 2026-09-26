import React, { useState } from 'react';
import {
  Barcode,
  LogOut,
  Warehouse,
  ChevronDown,
  User as UserIcon,
  RefreshCw,
  Bell,
  Download,
  Upload,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface HeaderProps {
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScanner }) => {
  const {
    currentUser,
    logout,
    switchRole,
    activeWarehouseId,
    setActiveWarehouseId,
    warehouses,
    items,
    shelvingTasks,
    dispatchOrders,
    exportDataAsJSON,
    resetToDemoData,
  } = useInventory();

  const [profileOpen, setProfileOpen] = useState(false);

  // Compute pending notification counts
  const lowStockCount = items.filter((i) => i.stockOnHand <= i.minThreshold).length;
  const pendingShelvingCount = shelvingTasks.filter((t) => t.status === 'pending').length;
  const pendingPickCount = dispatchOrders.filter(
    (d) => d.status === 'pending_picking' || d.status === 'picking_in_progress'
  ).length;

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId) || warehouses[0];

  return (
    <header className="h-16 px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold font-mono text-xs tracking-wider shadow-2xs group-hover:bg-emerald-500 transition-colors">
            SX
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
            Stock<span className="text-emerald-600">X</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={activeWarehouseId}
            onChange={(e) => setActiveWarehouseId(e.target.value)}
            className="bg-transparent font-medium text-slate-700 hover:text-slate-900 focus:outline-hidden cursor-pointer"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} - {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 2: Navigation status breadcrumbs / summary */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime Sync</span>
        </div>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>
          Low Stock Alerts: <strong className={`font-semibold ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{lowStockCount}</strong>
        </span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>
          Pending Floor Tasks:{' '}
          <strong className="font-semibold text-slate-700">
            {pendingShelvingCount + pendingPickCount}
          </strong>
        </span>
      </div>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        {/* Optical Scanner Button */}
        <button
          onClick={onOpenScanner}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Barcode className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Barcode Scanner</span>
        </button>

        {/* User profile & fast role switcher dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors cursor-pointer"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                currentUser?.role === 'manager' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-slate-500 capitalize">
                {currentUser?.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{currentUser?.name}</div>
                <div className="text-slate-500 font-mono text-[11px] truncate">{currentUser?.email}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{currentUser?.title}</div>
              </div>

              {/* Fast switch roles in 1 click */}
              <div className="p-2 border-b border-slate-100 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5">
                  Switch Active Persona
                </div>
                <button
                  type="button"
                  onClick={() => switchRole('manager')}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                    currentUser?.role === 'manager'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Inventory Manager</span>
                  {currentUser?.role === 'manager' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('warehouse_staff')}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                    currentUser?.role === 'warehouse_staff'
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Warehouse Staff</span>
                  {currentUser?.role === 'warehouse_staff' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              </div>

              {/* Data Utilities */}
              <div className="p-2 border-b border-slate-100 space-y-1">
                <button
                  type="button"
                  onClick={exportDataAsJSON}
                  className="w-full text-left px-2 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Database JSON</span>
                </button>
                <button
                  type="button"
                  onClick={resetToDemoData}
                  className="w-full text-left px-2 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Demo Data</span>
                </button>
              </div>

              {/* Logout */}
              <div className="pt-1 px-1">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
