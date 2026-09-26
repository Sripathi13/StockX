// StockX Enterprise Header
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
  Shield,
  Layers,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenScanner: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScanner, onNavigateTab }) => {
  const {
    currentUser,
    users,
    switchUser,
    switchRole,
    logout,
    activeWarehouseId,
    setActiveWarehouseId,
    warehouses,
    items,
    receipts,
    deliveries,
    adjustments,
    notifications,
    markNotificationRead,
    exportDataAsJSON,
    resetDatabase,
  } = useInventory();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Compute live indicators
  const lowStockCount = items.filter((i) => i.stockOnHand <= i.minThreshold).length;
  const pendingReceipts = receipts.filter((r) => r.status === 'Waiting').length;
  const pendingDeliveries = deliveries.filter((d) => d.status === 'Picking' || d.status === 'Packed').length;
  const pendingAdjustments = adjustments.filter((a) => a.status === 'Pending Approval').length;
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId) || warehouses[0];

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'INVENTORY_MANAGER':
        return { label: 'Inventory Manager', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'WAREHOUSE_STAFF':
        return { label: 'Warehouse Staff', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Staff', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="h-16 px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
      {/* Brand & Warehouse Select */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold font-mono text-sm tracking-wider shadow-2xs group-hover:bg-blue-500 transition-colors">
            SX
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Stock<span className="text-blue-600">X</span>
            </span>
            <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
              Enterprise
            </span>
          </div>
        </a>

        {/* Warehouse Selector */}
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

      {/* Central Status Indicators */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 font-medium">PostgreSQL Live</span>
        </div>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <button
          onClick={() => onNavigateTab && onNavigateTab('products')}
          className="hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>Low Stock:</span>
          <span className={`font-semibold ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {lowStockCount}
          </span>
        </button>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <button
          onClick={() => onNavigateTab && onNavigateTab('receipts')}
          className="hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>Pending Receipts:</span>
          <span className="font-semibold text-slate-700">{pendingReceipts}</span>
        </button>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <button
          onClick={() => onNavigateTab && onNavigateTab('deliveries')}
          className="hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>Active Deliveries:</span>
          <span className="font-semibold text-slate-700">{pendingDeliveries}</span>
        </button>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Optical Barcode Scanner */}
        <button
          onClick={onOpenScanner}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Open Barcode & Optical Terminal"
        >
          <Barcode className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Scan Barcode</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-900">System Notifications</span>
                <span className="text-[11px] text-slate-400 font-mono">{notifications.length} alerts</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.targetTab && onNavigateTab) {
                        onNavigateTab(n.targetTab);
                        setNotifOpen(false);
                      }
                    }}
                    className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      !n.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-medium text-slate-900 leading-tight">{n.title}</span>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors cursor-pointer"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-purple-600'
                  : currentUser?.role === 'INVENTORY_MANAGER'
                  ? 'bg-blue-600'
                  : 'bg-emerald-600'
              }`}
            >
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser?.name || 'Authorized Operator'}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <span>{badge.label}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs"
              onClick={() => setProfileOpen(false)}
            >
              {/* Profile Card */}
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{currentUser?.name}</div>
                <div className="text-slate-500 font-mono text-[11px] truncate">{currentUser?.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-slate-400">&bull; {currentUser?.title}</span>
                </div>
              </div>

              {/* Fast Switch Operator Account */}
              <div className="p-2 border-b border-slate-100 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 pb-0.5">
                  Switch Active Operator
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => switchUser(u.id)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                      currentUser?.id === u.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.role}</div>
                    </div>
                    {currentUser?.id === u.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Quick Role Toggle */}
              <div className="p-2 border-b border-slate-100 space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 pb-0.5">
                  Change Role Permissions
                </div>
                <div className="grid grid-cols-3 gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => switchRole('ADMIN')}
                    className={`py-1 text-[10px] font-medium rounded text-center border ${
                      currentUser?.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => switchRole('INVENTORY_MANAGER')}
                    className={`py-1 text-[10px] font-medium rounded text-center border ${
                      currentUser?.role === 'INVENTORY_MANAGER'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => switchRole('WAREHOUSE_STAFF')}
                    className={`py-1 text-[10px] font-medium rounded text-center border ${
                      currentUser?.role === 'WAREHOUSE_STAFF'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>

              {/* Data Utilities */}
              <div className="p-2 border-b border-slate-100 space-y-0.5">
                <button
                  type="button"
                  onClick={exportDataAsJSON}
                  className="w-full text-left px-2 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Backup Database (JSON)</span>
                </button>
                <button
                  type="button"
                  onClick={resetDatabase}
                  className="w-full text-left px-2 py-1.5 rounded text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset to Enterprise Seed Data</span>
                </button>
              </div>

              {/* Sign Out */}
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
