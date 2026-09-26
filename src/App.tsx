// StockX Enterprise Modular Inventory Management System - Main Entry Point
import React, { useState, useRef, useEffect } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar, TabKey } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { ProductsView } from './components/views/ProductsView';
import { CategoriesView } from './components/views/CategoriesView';
import { WarehousesView } from './components/views/WarehousesView';
import { LocationsView } from './components/views/LocationsView';
import { ReceiptsView } from './components/views/ReceiptsView';
import { DeliveriesView } from './components/views/DeliveriesView';
import { TransfersView } from './components/views/TransfersView';
import { AdjustmentsView } from './components/views/AdjustmentsView';
import { StockLedgerView } from './components/views/StockLedgerView';
import { ReportsView } from './components/views/ReportsView';
import { UsersView } from './components/views/UsersView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SettingsView } from './components/views/SettingsView';
import { BarcodeScannerModal } from './components/warehouse/BarcodeScannerModal';

const AppContent: React.FC = () => {
  const { currentUser } = useInventory();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const [canMainScrollUp, setCanMainScrollUp] = useState(false);
  const [canMainScrollDown, setCanMainScrollDown] = useState(false);

  const checkMainScrollState = () => {
    if (!mainScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainScrollRef.current;
    setCanMainScrollUp(scrollTop > 20);
    setCanMainScrollDown(scrollTop + clientHeight < scrollHeight - 20);
  };

  useEffect(() => {
    checkMainScrollState();
    const el = mainScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkMainScrollState, { passive: true });
      window.addEventListener('resize', checkMainScrollState);
      return () => {
        el.removeEventListener('scroll', checkMainScrollState);
        window.removeEventListener('resize', checkMainScrollState);
      };
    }
  }, [activeTab]);

  const handleMainScrollDown = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollBy({ top: 380, behavior: 'smooth' });
    }
  };

  const handleMainScrollToTop = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Unauthenticated screen
  if (!currentUser) {
    return <LoginPage />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateTab={setActiveTab}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
      case 'products':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'warehouses':
        return <WarehousesView />;
      case 'locations':
        return <LocationsView />;
      case 'receipts':
        return <ReceiptsView />;
      case 'deliveries':
        return <DeliveriesView />;
      case 'transfers':
        return <TransfersView />;
      case 'adjustments':
        return <AdjustmentsView />;
      case 'stock_ledger':
        return <StockLedgerView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigateTab={setActiveTab}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onNavigateTab={setActiveTab}
      />

      {/* Main Workspace with Collapsible Sidebar */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left Side: Blue / Dark Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        {/* Right Side: White Main Content Workspace */}
        <main
          ref={mainScrollRef}
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain bg-slate-50/60 pb-20 main-scroll relative"
        >
          {renderActiveTab()}

          {/* White Right Side Floating Scroll Controls */}
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 drop-shadow-lg">
            <button
              type="button"
              onClick={handleMainScrollDown}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 shadow-xl border border-slate-200/90 hover:border-blue-400 hover:text-blue-600 transition-all text-xs font-semibold cursor-pointer group"
              title="Scroll white workspace down"
            >
              <ArrowDown className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
              <span>Scroll Down</span>
            </button>
            {canMainScrollUp && (
              <button
                type="button"
                onClick={handleMainScrollToTop}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 shadow-xl border border-slate-200/90 hover:border-slate-300 transition-all text-xs font-semibold cursor-pointer group"
                title="Scroll white workspace to top"
              >
                <ArrowUp className="w-3.5 h-3.5 text-slate-600 group-hover:-translate-y-0.5 transition-transform" />
                <span className="hidden sm:inline">Top</span>
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
