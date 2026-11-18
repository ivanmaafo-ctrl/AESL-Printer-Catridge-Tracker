import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActiveTab } from './Navbar';
import { BrandLogo } from './BrandLogo';
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
  FileSpreadsheet,
  BookOpen,
  Sun,
  Moon,
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
  const { isAuthenticated, currentUser, isSuperAdmin, isAdmin, logout } = useAdminAuth();
  const { isDark, toggleTheme } = useTheme();
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
      label: '15-Gauge Alerts',
      icon: AlertTriangle,
      alertCount: lowStockAlerts.length,
      critical: criticalCount > 0,
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Master Admin',
      icon: isSuperAdmin ? ShieldCheck : Shield,
      isAuth: isAuthenticated,
      role: isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Staff',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#F8FAFD] dark:bg-[#090E17]/95 dark:backdrop-blur-xl text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-white/10">
      {/* 1. Brand Workspace Header + Theme Switch */}
      <div className="px-5 py-4 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-2">
        <button
          onClick={() => handleTabClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer min-w-0"
        >
          <BrandLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
          <div className="min-w-0">
            <span className="text-sm font-bold text-[#0B0F17] dark:text-white block leading-tight tracking-tight truncate">
              Anointed Engineering
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block leading-tight mt-0.5 truncate">
              IT Fleet & Site Logistics
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:text-[#0B0F17] dark:hover:text-white bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-sky-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Operations Task Bar */}
      <div className="p-4 border-b border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Actions
          </span>
          <button
            onClick={toggleTheme}
            className="text-[10px] font-mono font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer"
          >
            {isDark ? 'Dark Theme' : 'Light Theme'}
          </button>
        </div>

        {/* Primary Obsidian / Blue Pill Dispatch Action */}
        <button
          onClick={() => {
            onOpenDispatch();
            setMobileMenuOpen(false);
          }}
          className="w-full mb-2.5 flex items-center justify-between px-4 py-2.5 bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-[#06090F] rounded-full text-xs font-semibold transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-400 dark:text-[#06090F]" />
            <span>Dispatch to Branch</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#06090F]/70 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Secondary Quick Action Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onOpenRestock();
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold transition border border-slate-200/90 dark:border-white/10 cursor-pointer"
            title="Top up in-office stock"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>Top Up</span>
          </button>

          <button
            onClick={() => {
              onOpenLogUsage();
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold transition border border-slate-200/90 dark:border-white/10 cursor-pointer"
            title="Log cartridge swap"
          >
            <Send className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Log Swap</span>
          </button>
        </div>

        {/* Report Quick Button */}
        <button
          onClick={() => handleTabClick('reports')}
          className={`w-full mt-2 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#E8F1FF] dark:bg-blue-500/20 text-[#0B0F17] dark:text-sky-300 border-blue-200 dark:border-blue-500/30'
              : 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600 dark:text-sky-400" />
            <span>Generate Report</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        </button>

        {/* Prominent Beginner Guide Button */}
        <button
          onClick={() => {
            onOpenGuide();
            setMobileMenuOpen(false);
          }}
          className="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-[#EFF6FF] hover:bg-[#DBEAFE] dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-950 dark:text-sky-300 border border-blue-200/80 dark:border-blue-500/30 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-700 dark:text-sky-400" />
            <span>Beginner Guide</span>
          </div>
          <span className="text-[10px] font-mono text-blue-700 dark:text-sky-300 font-semibold">
            7 Steps
          </span>
        </button>
      </div>

      {/* 3. Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Section A: Fleet & Logistics */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Fleet Operations
          </div>
          <nav className="space-y-0.5">
            {navFleet.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 min-h-[44px] lg:min-h-0 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#E8F1FF] dark:bg-blue-500/20 text-[#0B0F17] dark:text-sky-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-[#0B0F17] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== null && item.count > 0 && (
                    <span className={`text-[11px] font-mono tabular-nums ${isActive ? 'text-blue-800 dark:text-sky-300 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
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
          <div className="px-3 mb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Controls & Access
          </div>
          <nav className="space-y-0.5">
            {navControls.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 min-h-[44px] lg:min-h-0 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#E8F1FF] dark:bg-blue-500/20 text-[#0B0F17] dark:text-sky-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-[#0B0F17] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.id === 'reorder' && item.alertCount !== undefined && item.alertCount > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold tabular-nums ${
                        item.critical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {item.alertCount}
                    </span>
                  )}

                  {item.id === 'admin' && (
                    item.isAuth ? (
                      <span className={`text-[10px] font-mono font-semibold ${
                        isSuperAdmin
                          ? 'text-amber-700 dark:text-amber-400'
                          : isAdmin
                          ? 'text-blue-700 dark:text-sky-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {isSuperAdmin ? 'Super' : isAdmin ? 'Admin' : 'Staff'}
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-[#0B0F17] dark:hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-4 h-4 shrink-0 text-blue-600 dark:text-sky-400" />
                <span className="truncate">Beginner Guide</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Tour</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 4. Bottom User Profile & Auth Gateway */}
      <div className="p-3 pb-safe lg:pb-3 border-t border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/[0.02]">
        {isAuthenticated && currentUser ? (
          <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSuperAdmin
                    ? 'bg-[#0B0F17] dark:bg-amber-400 text-amber-300 dark:text-[#06090F]'
                    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-sky-300'
                }`}
              >
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B0F17] dark:text-white block truncate">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                  {currentUser.email || currentUser.username} · {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'IT Staff'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out of AESL Portal"
              aria-label="Sign out of AESL Portal"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleTabClick('admin')}
            className="w-full p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0 group-hover:text-[#0B0F17] dark:group-hover:text-white transition">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#0B0F17] dark:text-white block">
                  Admin Sign In
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Operations & Master Controls
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent, Left Column) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:z-40 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header Strip (Compact 56px sticky bar <= 15% cap) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#090E17]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-[#0B0F17] dark:text-white flex items-center justify-between px-3 sm:px-4 h-14 print:hidden">
        <button
          onClick={() => handleTabClick('dashboard')}
          className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
        >
          <BrandLogo className="w-8 h-8 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#0B0F17] dark:text-white block leading-tight truncate">
              Anointed Engineering
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight truncate">
              Print Fleet Logistics
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-600 dark:text-sky-400 bg-slate-100 dark:bg-white/10 transition cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenDispatch}
            className="min-h-[40px] px-3 text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Dispatch to branch"
          >
            <Truck className="w-3.5 h-3.5 text-sky-400 dark:text-[#06090F]" />
            <span>Dispatch</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#F8FAFD] dark:bg-[#090E17] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
