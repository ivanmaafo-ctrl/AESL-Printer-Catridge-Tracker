import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
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
        <footer className="border-t border-slate-200 bg-white py-4 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Anointed Engineering Services Limited</span>
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
    <AdminAuthProvider>
      <InventoryProvider>
        <AppContent />
      </InventoryProvider>
    </AdminAuthProvider>
  );
}
