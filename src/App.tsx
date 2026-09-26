import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar, TabKey } from './components/layout/Sidebar';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { InventoryCatalog } from './components/manager/InventoryCatalog';
import { InboundPOManager } from './components/manager/InboundPOManager';
import { OutboundDispatchManager } from './components/manager/OutboundDispatchManager';
import { SuppliersView } from './components/manager/SuppliersView';
import { StockLedgerView } from './components/manager/StockLedgerView';
import { WarehouseDashboard } from './components/warehouse/WarehouseDashboard';
import { PickingOperations } from './components/warehouse/PickingOperations';
import { ShelvingOperations } from './components/warehouse/ShelvingOperations';
import { TransferOperations } from './components/warehouse/TransferOperations';
import { CycleCounting } from './components/warehouse/CycleCounting';
import { BarcodeScannerModal } from './components/warehouse/BarcodeScannerModal';

const AppContent: React.FC = () => {
  const { currentUser } = useInventory();
  const [activeTab, setActiveTab] = useState<TabKey>('manager_overview');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Automatically adjust default active tab when role changes
  useEffect(() => {
    if (currentUser?.role === 'manager') {
      if (!activeTab.startsWith('manager_')) {
        setActiveTab('manager_overview');
      }
    } else if (currentUser?.role === 'warehouse_staff') {
      if (!activeTab.startsWith('staff_')) {
        setActiveTab('staff_overview');
      }
    }
  }, [currentUser?.role]);

  // Unauthenticated screen
  if (!currentUser) {
    return <LoginPage />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      // Manager Views
      case 'manager_overview':
        return <ManagerDashboard onNavigateTab={setActiveTab} />;
      case 'manager_catalog':
        return <InventoryCatalog />;
      case 'manager_inbound':
        return <InboundPOManager />;
      case 'manager_outbound':
        return <OutboundDispatchManager />;
      case 'manager_suppliers':
        return <SuppliersView />;
      case 'manager_ledger':
        return <StockLedgerView />;

      // Warehouse Staff Views
      case 'staff_overview':
        return (
          <WarehouseDashboard
            onNavigateTab={setActiveTab}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
      case 'staff_picking':
        return <PickingOperations />;
      case 'staff_shelving':
        return <ShelvingOperations />;
      case 'staff_transfers':
        return <TransferOperations />;
      case 'staff_cycle_counts':
        return <CycleCounting />;

      default:
        return <ManagerDashboard onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header onOpenScanner={() => setIsScannerOpen(true)} />

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
