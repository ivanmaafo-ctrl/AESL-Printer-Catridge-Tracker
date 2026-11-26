import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CentralInventoryView } from './components/CentralInventoryView';
import { BranchesView } from './components/BranchesView';
import { DispatchesView } from './components/DispatchesView';
import { UsageView } from './components/UsageView';
import { ReorderCenterView } from './components/ReorderCenterView';
import { ReportsView } from './components/ReportsView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { AdminLoginView } from './components/AdminLoginView';
import { BrandLogo, BrandLoaderScreen } from './components/BrandLogo';
import {
  Activity,
  Package,
  Building2,
  Truck,
  Send,
  AlertTriangle,
  FileSpreadsheet,
  Shield,
} from 'lucide-react';

import { DispatchModal } from './components/Modals/DispatchModal';
import { RestockModal } from './components/Modals/RestockModal';
import { LogUsageModal } from './components/Modals/LogUsageModal';
import { AddCartridgeModal } from './components/Modals/AddCartridgeModal';
import { AddBranchModal } from './components/Modals/AddBranchModal';
import { WalkthroughModal } from './components/Modals/WalkthroughModal';

const AppContent: React.FC = () => {
  const { authReady, isAuthenticated } = useAdminAuth();
  const { inventoryLoading, lowStockAlerts } = useInventory();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchCartridgeId, setDispatchCartridgeId] = useState<string | undefined>(undefined);
  const [dispatchBranchId, setDispatchBranchId] = useState<string | undefined>(undefined);

  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockCartridgeId, setRestockCartridgeId] = useState<string | undefined>(undefined);

  const [logUsageModalOpen, setLogUsageModalOpen] = useState(false);
  const [logUsageBranchId, setLogUsageBranchId] = useState<string | undefined>(undefined);

  const [addCartridgeModalOpen, setAddCartridgeModalOpen] = useState(false);
  const [addBranchModalOpen, setAddBranchModalOpen] = useState(false);
  const [walkthroughModalOpen, setWalkthroughModalOpen] = useState(false);

  // Modal openers
  const handleOpenDispatch = (cartridgeId?: string, branchId?: string) => {
    setDispatchCartridgeId(cartridgeId);
    setDispatchBranchId(branchId);
    setDispatchModalOpen(true);
  };

  const handleOpenRestock = (cartridgeId?: string) => {
    setRestockCartridgeId(cartridgeId);
    setRestockModalOpen(true);
  };

  const handleOpenLogUsage = (branchId?: string) => {
    setLogUsageBranchId(branchId);
    setLogUsageModalOpen(true);
  };

  if (!authReady) {
    return <BrandLoaderScreen label="Verifying AESL Fleet Session..." />;
  }

  if (!isAuthenticated) {
    return <AdminLoginView fullScreen />;
  }

  if (inventoryLoading) {
    return <BrandLoaderScreen label="Loading AESL Warehouse & Branches..." />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#06090F] text-[#0B0F17] dark:text-slate-100 font-sans flex flex-col relative isolate">
      {/* Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDispatch={() => handleOpenDispatch()}
        onOpenRestock={() => handleOpenRestock()}
        onOpenLogUsage={() => handleOpenLogUsage()}
        onOpenGuide={() => setWalkthroughModalOpen(true)}
      />

      {/* Main Content Area offset by fixed desktop sidebar */}
      <div className="lg:pl-68 xl:pl-72 print:pl-0 flex-1 flex flex-col min-w-0">
        {/* Mobile View Switcher */}
        <nav
          aria-label="Mobile view navigation"
          className="lg:hidden print:hidden border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#090E17] px-3 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar"
        >
          {(
            [
              { id: 'dashboard', label: 'Overview', icon: Activity },
              { id: 'inventory', label: 'Stock', icon: Package },
              { id: 'branches', label: 'Branches', icon: Building2 },
              { id: 'dispatches', label: 'Deliveries', icon: Truck },
              { id: 'usage', label: 'Usage', icon: Send },
              {
                id: 'reorder',
                label: lowStockAlerts.length > 0 ? `Alerts (${lowStockAlerts.length})` : 'Alerts',
                icon: AlertTriangle,
              },
              { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
              { id: 'admin', label: 'Admin', icon: Shield },
            ] as Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }>
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active
                      ? 'text-sky-400 dark:text-[#06090F]'
                      : item.id === 'reorder' && lowStockAlerts.length > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-7 lg:px-10 py-6 sm:py-9 print:p-0 print:max-w-none">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenDispatch={() => handleOpenDispatch()}
              onOpenRestock={(cId) => handleOpenRestock(cId)}
              onOpenLogUsage={() => handleOpenLogUsage()}
              onOpenGuide={() => setWalkthroughModalOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <CentralInventoryView
              onOpenAddCartridge={() => setAddCartridgeModalOpen(true)}
              onOpenRestock={(cId) => handleOpenRestock(cId)}
              onOpenDispatch={(cId) => handleOpenDispatch(cId)}
              onOpenReports={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'branches' && (
            <BranchesView
              onOpenAddBranch={() => setAddBranchModalOpen(true)}
              onOpenDispatchForBranch={(bId) => handleOpenDispatch(undefined, bId)}
              onOpenLogUsageForBranch={(bId) => handleOpenLogUsage(bId)}
            />
          )}

          {activeTab === 'dispatches' && (
            <DispatchesView
              onOpenDispatch={() => handleOpenDispatch()}
            />
          )}

          {activeTab === 'usage' && (
            <UsageView
              onOpenLogUsage={() => handleOpenLogUsage()}
            />
          )}

          {activeTab === 'reorder' && (
            <ReorderCenterView
              onOpenRestock={(cId) => handleOpenRestock(cId)}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'admin' && (
            <AdminConsoleView
              onOpenAddCartridge={() => setAddCartridgeModalOpen(true)}
              onOpenAddBranch={() => setAddBranchModalOpen(true)}
            />
          )}
        </main>

        {/* Quiet Corporate Footer */}
        <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#070B12] py-5 pb-safe mt-auto print:hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-7 lg:px-10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <BrandLogo className="w-6 h-6 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-100">Anointed Engineering Services Limited</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="hidden sm:inline">IT Department</span>
            </div>
            <span>Printer Toner Inventory Portal</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <DispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        preselectedCartridgeId={dispatchCartridgeId}
        preselectedBranchId={dispatchBranchId}
      />

      <RestockModal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        preselectedCartridgeId={restockCartridgeId}
      />

      <LogUsageModal
        isOpen={logUsageModalOpen}
        onClose={() => setLogUsageModalOpen(false)}
        preselectedBranchId={logUsageBranchId}
      />

      <AddCartridgeModal
        isOpen={addCartridgeModalOpen}
        onClose={() => setAddCartridgeModalOpen(false)}
      />

      <AddBranchModal
        isOpen={addBranchModalOpen}
        onClose={() => setAddBranchModalOpen(false)}
      />

      <WalkthroughModal
        isOpen={walkthroughModalOpen}
        onClose={() => setWalkthroughModalOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AdminAuthProvider>
          <InventoryProvider>
            <AppContent />
          </InventoryProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
