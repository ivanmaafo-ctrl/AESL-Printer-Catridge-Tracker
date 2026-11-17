import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ActiveTab } from './Navbar';
import {
  Package,
  Send,
  Building2,
  Truck,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Shield,
  Plus,
  Lock,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDispatch: () => void;
  onOpenRestock: () => void;
  onOpenLogUsage: () => void;
  onOpenGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDispatch,
  onOpenRestock,
  onOpenLogUsage,
  onOpenGuide,
}) => {
  const { cartridges, branches, dispatches, usages, lowStockAlerts, criticalCount } = useInventory();
  const { isAuthenticated, currentUser, isSuperAdmin, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navFleet = [
    { id: 'dashboard' as ActiveTab, label: 'Overview', icon: Activity, count: null },
    { id: 'inventory' as ActiveTab, label: 'In-Office Stock', icon: Package, count: cartridges.length },
    { id: 'branches' as ActiveTab, label: 'Offices & Branches', icon: Building2, count: branches.length },
    { id: 'dispatches' as ActiveTab, label: 'Sent to Branches', icon: Truck, count: dispatches.length },
    { id: 'usage' as ActiveTab, label: 'Usage Log', icon: Send, count: usages.length },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: FileSpreadsheet, count: null },
  ];

  const navControls = [
    {
      id: 'reorder' as ActiveTab,
      label: '50-Gauge Alerts',
      icon: AlertTriangle,
      alertCount: lowStockAlerts.length,
      critical: criticalCount > 0,
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Master Admin',
      icon: isSuperAdmin ? ShieldCheck : Shield,
      isAuth: isAuthenticated,
      role: isSuperAdmin ? 'Super Admin' : 'Admin',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800/80">
      
      {/* 1. Brand Workspace Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => handleTabClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs tracking-wider shadow-sm transition-transform group-hover:scale-105 shrink-0">
            AESL
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-white block leading-tight tracking-tight truncate">
              Anointed Engineering
            </span>
            <span className="text-[11px] font-medium text-slate-400 block leading-tight mt-0.5">
              IT Fleet & Site Logistics
            </span>
          </div>
        </button>

        {/* Close button on mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Operations Task Bar (Fast Action Triggers) */}
      <div className="p-4 border-b border-slate-800/90 bg-slate-950/40">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Task Operations</span>
          <span className="text-[10px] text-slate-400">Direct Actions</span>
        </div>

        {/* Primary Dispatch Action */}
        <button
          onClick={() => {
            onOpenDispatch();
            setMobileMenuOpen(false);
          }}
          className="w-full mb-2 flex items-center justify-between px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-100" />
            <span>Dispatch to Branch</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-blue-200 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Secondary Quick Action Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onOpenRestock();
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700/60"
            title="Top up in-office stock"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Top Up Stock</span>
          </button>

          <button
            onClick={() => {
              onOpenLogUsage();
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700/60"
            title="Log cartridge swap"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Swap</span>
          </button>
        </div>

        {/* Report Quick Button */}
        <button
          onClick={() => handleTabClick('reports')}
          className={`w-full mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition border cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Report</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* 3. Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Section A: Fleet & Logistics */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Fleet Operations
          </div>
          <nav className="space-y-1">
            {navFleet.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== null && item.count > 0 && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section B: Controls & Security */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Controls & Security
          </div>
          <nav className="space-y-1">
            {navControls.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Badges for alert or auth */}
                  {item.id === 'reorder' && item.alertCount && item.alertCount > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        item.critical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.alertCount}
                    </span>
                  )}

                  {item.id === 'admin' && (
                    item.isAuth ? (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        isSuperAdmin
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {isSuperAdmin ? 'Super' : 'Admin'}
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                onOpenGuide();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="truncate">Beginner Guide</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Tour</span>
            </button>
          </nav>
        </div>

      </div>

      {/* 4. Bottom User Profile & Auth Gateway */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {isAuthenticated && currentUser ? (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSuperAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}
              >
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block truncate">
                  @{currentUser.username} · {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out of Admin Portal"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleTabClick('admin')}
            className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 group-hover:text-blue-400 transition">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-200 block">
                  Admin Sign In
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Secure Operations Access
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-0.5 transition" />
          </button>
        )}

        <div className="mt-2.5 px-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>AESL IT v2.4</span>
          <span>Central Warehouse</span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent, Left Column) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:z-40 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header Strip */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 h-15 shadow-sm print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
            AESL
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">
              Anointed Engineering
            </span>
            <span className="text-[10px] text-slate-400 block leading-tight">
              Print Fleet Logistics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Dispatch on mobile header */}
          <button
            onClick={onOpenDispatch}
            className="p-2 text-white bg-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1"
            title="Dispatch to branch"
          >
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Dispatch</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-over Drawer Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
