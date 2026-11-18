import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { ActiveTab } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { DashboardView } from './components/DashboardView';
import { CentralInventoryView } from './components/CentralInventoryView';
import { BranchesView } from './components/BranchesView';
import { DispatchesView } from './components/DispatchesView';
import { UsageView } from './components/UsageView';
import { ReorderCenterView } from './components/ReorderCenterView';
import { ReportsView } from './components/ReportsView';
import { AdminConsoleView } from './components/AdminConsoleView';

import { DispatchModal } from './components/Modals/DispatchModal';
import { RestockModal } from './components/Modals/RestockModal';
import { LogUsageModal } from './components/Modals/LogUsageModal';
import { AddCartridgeModal } from './components/Modals/AddCartridgeModal';
import { AddBranchModal } from './components/Modals/AddBranchModal';
import { WalkthroughModal } from './components/Modals/WalkthroughModal';

const AppContent: React.FC = () => {
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:max-w-none">
          
          {/* Low Stock Alert notification banner across views (except when already in reorder or reports tab) */}
          {activeTab !== 'reorder' && activeTab !== 'reports' && (
            <div className="print:hidden">
              <AlertBanner
                onNavigateToReorder={() => setActiveTab('reorder')}
                onOpenRestock={() => handleOpenRestock()}
              />
            </div>
          )}

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
        <footer className="border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#070B12]/80 backdrop-blur-sm py-4 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100">Anointed Engineering Services Limited</span>
              <span aria-hidden="true">·</span>
              <span>IT Department · Multi-Branch Printer Cartridge Logistics</span>
            </div>
            <div>
              <span>Central IT Warehouse & Site Operations Portal</span>
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
    <ThemeProvider>
      <AdminAuthProvider>
        <InventoryProvider>
          <AppContent />
        </InventoryProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
