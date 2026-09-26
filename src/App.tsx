// StockX Enterprise Modular Inventory Management System - Main Entry Point
import React, { useState } from 'react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onNavigateTab={setActiveTab}
      />

      {/* Main Workspace with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/60 pb-16">
          {renderActiveTab()}
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
