// StockX Enterprise Collapsible Navigation Sidebar
import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Building2,
  MapPin,
  ArrowDownToDot,
  ArrowUpFromDot,
  ArrowLeftRight,
  SlidersHorizontal,
  ScrollText,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ScanLine,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export type TabKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'warehouses'
  | 'locations'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'stock_ledger'
  | 'reports'
  | 'users'
  | 'audit_logs'
  | 'settings';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenScanner?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser, items, receipts, deliveries, adjustments } = useInventory();
  const menuListRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScrollState = () => {
    if (!menuListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = menuListRef.current;
    setCanScrollUp(scrollTop > 10);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10);
  };

  useEffect(() => {
    checkScrollState();
    const el = menuListRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollState, { passive: true });
      window.addEventListener('resize', checkScrollState);
      return () => {
        el.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, []);

  const handleScrollDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuListRef.current) {
      menuListRef.current.scrollBy({ top: 180, behavior: 'smooth' });
    }
  };

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuListRef.current) {
      menuListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Badges
  const lowStockCount = items.filter((i) => i.stockOnHand <= i.minThreshold).length;
  const waitingReceipts = receipts.filter((r) => r.status === 'Waiting').length;
  const activeDeliveries = deliveries.filter(
    (d) => d.status === 'Picking' || d.status === 'Packed'
  ).length;
  const pendingAdjustments = adjustments.filter((a) => a.status === 'Pending Approval').length;

  const menuItems: {
    id: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    allowedRoles?: ('ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF')[];
    section?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      section: 'Core Overview',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
      section: 'Inventory Operations',
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Layers,
    },
    {
      id: 'warehouses',
      label: 'Warehouses',
      icon: Building2,
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: MapPin,
    },
    {
      id: 'receipts',
      label: 'Receipts',
      icon: ArrowDownToDot,
      badge: waitingReceipts > 0 ? waitingReceipts : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
      section: 'Stock Flow & Logistics',
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: ArrowUpFromDot,
      badge: activeDeliveries > 0 ? activeDeliveries : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    },
    {
      id: 'transfers',
      label: 'Internal Transfers',
      icon: ArrowLeftRight,
    },
    {
      id: 'adjustments',
      label: 'Stock Adjustments',
      icon: SlidersHorizontal,
      badge: pendingAdjustments > 0 ? pendingAdjustments : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40',
    },
    {
      id: 'stock_ledger',
      label: 'Stock Ledger',
      icon: ScrollText,
      section: 'Traceability & Analytics',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      section: 'Administration',
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      icon: ShieldAlert,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Header / Collapser */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="px-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Workspace Menu
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu List (Independent Left Blue Scroll Container) */}
      <div
        ref={menuListRef}
        onWheel={(e) => e.stopPropagation()}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-2 space-y-1 sidebar-scroll relative"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <React.Fragment key={item.id}>
              {item.section && !isCollapsed && (
                <div className="pt-3 pb-1 px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {item.section}
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${item.badgeColor || 'bg-blue-500/20 text-blue-300'}`}
                  >
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Blue Left Side Scroll Down Control */}
      {!isCollapsed ? (
        <div className="px-2 py-1.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleScrollDown}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-xs border border-blue-400/30 transition-all cursor-pointer group"
            title="Scroll blue left menu down"
          >
            <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            <span>Scroll Menu Down</span>
          </button>
          {canScrollUp && (
            <button
              type="button"
              onClick={handleScrollToTop}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Scroll blue left menu to top"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="px-2 py-1.5 border-t border-slate-800 bg-slate-900/95 shrink-0 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleScrollDown}
            className="w-10 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
            title="Scroll blue left menu down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Barcode Quick Launch */}
      {onOpenScanner && (
        <div className="p-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onOpenScanner}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Scan Barcode"
          >
            <ScanLine className="w-4 h-4 text-blue-400 shrink-0" />
            {!isCollapsed && <span>Scan Barcode</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
