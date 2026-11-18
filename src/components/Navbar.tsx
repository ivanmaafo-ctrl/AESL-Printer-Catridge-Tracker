import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { BrandLogo } from './BrandLogo';
import {
  Package,
  Send,
  Building2,
  Truck,
  Activity,
  AlertTriangle,
  RotateCcw,
  Plus,
  ShieldCheck,
  Shield,
  Lock,
  LogOut,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'inventory' | 'branches' | 'dispatches' | 'usage' | 'reorder' | 'reports' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDispatch: () => void;
  onOpenRestock: () => void;
  onOpenLogUsage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDispatch,
  onOpenRestock,
  onOpenLogUsage,
}) => {
  const { lowStockAlerts, criticalCount } = useInventory();
  const { isAuthenticated, currentUser, isSuperAdmin, logout } = useAdminAuth();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'inventory', label: 'In-Office Stock', icon: Package },
    { id: 'branches', label: 'Offices & Branches', icon: Building2 },
    { id: 'dispatches', label: 'Sent to Branches', icon: Truck },
    { id: 'usage', label: 'Usage Log', icon: Send },
    { id: 'reorder', label: '15-Gauge Alerts', icon: AlertTriangle },
    { id: 'admin', label: 'Master Admin', icon: isSuperAdmin ? ShieldCheck : Shield },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Universal Top Bar Contract: 3 zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Title (Single clean wordmark) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <BrandLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
              <div className="max-w-[240px] lg:max-w-xs">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 block leading-tight truncate">
                  Anointed Engineering Services Ltd
                </span>
                <span className="text-[11px] font-semibold text-blue-700 block leading-tight">
                  IT Department · Print Fleet Tracker
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean text tabs) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAlertTab = item.id === 'reorder';
              const alertCount = lowStockAlerts.length;
              const isAdminTab = item.id === 'admin';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>

                  {isAdminTab && (
                    isAuthenticated ? (
                      <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-mono font-bold rounded ${
                        isSuperAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isSuperAdmin ? 'Super' : 'Admin'}
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                    )
                  )}

                  {isAlertTab && alertCount > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[11px] font-mono font-semibold rounded ${
                        criticalCount > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions & Admin Session */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenDispatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch to Branch</span>
            </button>

            <button
              onClick={onOpenRestock}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Top Up Stock</span>
            </button>

            {/* Quick Admin Auth Status */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                    isSuperAdmin
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  }`}
                  title={`Logged in as ${currentUser?.displayName} (@${currentUser?.username})`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSuperAdmin ? 'bg-amber-500' : 'bg-blue-600'} animate-pulse`} />
                  <span className="font-mono text-[11px] truncate max-w-[85px]">{currentUser?.username}</span>
                </button>
                <button
                  onClick={logout}
                  title="Sign out of admin"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('admin')}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                title="Sign in to Master Admin"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAdminTab = item.id === 'admin';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isAdminTab && (
                  isAuthenticated ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
