import React, { useState, useEffect } from 'react';
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
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

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

  // Show branded AESL loading icon while Firebase session initializes
  if (isBooting || !authReady) {
    return <BrandLoaderScreen label="Verifying AESL Fleet Session..." />;
  }

  // Full-App Login Gate: only signed-in, verified AESL IT team members can enter
  if (!isAuthenticated) {
    return <AdminLoginView fullScreen />;
  }

  if (inventoryLoading) {
    return <BrandLoaderScreen label="Syncing Live AESL Warehouse & 27 Branches..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#06090F] text-[#0B0F17] dark:text-slate-100 font-sans flex flex-col relative isolate">
      {/* Moving Dark Mode Atmospheric Color Gradient Layer */}
      <div
        aria-hidden="true"
        className="hidden dark:block fixed inset-0 -z-10 overflow-hidden pointer-events-none print:hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#040814] via-[#071226] to-[#080F20]" />
        <div
          className="dark-ambient-orb-a absolute -top-40 -left-24 w-[680px] h-[680px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(37,99,235,0.32) 0%, rgba(14,165,233,0.14) 45%, rgba(6,9,15,0) 72%)',
          }}
        />
        <div
          className="dark-ambient-orb-b absolute -bottom-48 -right-24 w-[760px] h-[760px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(56,189,248,0.24) 0%, rgba(30,58,138,0.22) 45%, rgba(6,9,15,0) 72%)',
          }}
        />
      </div>

      {/* Side Navigation Bar with Integrated Task Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDispatch={() => handleOpenDispatch()}
        onOpenRestock={() => handleOpenRestock()}
        onOpenLogUsage={() => handleOpenLogUsage()}
        onOpenGuide={() => setWalkthroughModalOpen(true)}
      />

      {/* Main Content Area offset by fixed desktop sidebar */}
      <div className="lg:pl-64 xl:pl-72 print:pl-0 flex-1 flex flex-col min-w-0">
        {/* Mobile 1-Tap Scrollable View Switcher (non-sticky to keep sticky chrome under 15%) */}
        <nav
          aria-label="Mobile view navigation"
          className="lg:hidden print:hidden border-b border-slate-200/80 dark:border-white/10 bg-[#F8FAFD] dark:bg-[#090E17]/75 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        >
          {(
            [
              { id: 'dashboard', label: 'Overview', icon: Activity },
              { id: 'inventory', label: 'Stock', icon: Package },
              { id: 'branches', label: 'Branches', icon: Building2 },
              { id: 'dispatches', label: 'Dispatches', icon: Truck },
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
                className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0B0F17] dark:bg-sky-400 text-white dark:text-[#06090F] shadow-2xs'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    active
                      ? 'text-sky-400 dark:text-[#06090F]'
                      : item.id === 'reorder' && lowStockAlerts.length > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 print:p-0 print:max-w-none">
          {/* View Switcher */}
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
        <footer className="border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#070B12]/80 backdrop-blur-sm py-4 pb-safe mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <BrandLogo className="w-6 h-6 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-100">Anointed Engineering Services Limited</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="hidden sm:inline">IT Department · Multi-Branch Printer Cartridge Logistics</span>
            </div>
            <div>
              <span>Cloud-Synced IT Warehouse & Site Operations Portal</span>
            </div>
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
