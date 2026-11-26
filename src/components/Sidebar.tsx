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
  Lock,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  BookOpen,
  Sun,
  Moon,
  Type,
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
  onOpenGuide,
}) => {
  const { lowStockAlerts, criticalCount } = useInventory();
  const { isAuthenticated, currentUser, isSuperAdmin, isAdmin, logout } = useAdminAuth();
  const { isDark, toggleTheme, isLargeText, toggleTextScale } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navPrimary = [
    { id: 'dashboard' as ActiveTab, label: 'Overview', icon: Activity },
    { id: 'inventory' as ActiveTab, label: 'Toner Stock', icon: Package },
    { id: 'branches' as ActiveTab, label: 'Offices & Branches', icon: Building2 },
    { id: 'dispatches' as ActiveTab, label: 'Deliveries', icon: Truck },
    { id: 'usage' as ActiveTab, label: 'Usage Log', icon: Send },
  ];

  const navSecondary = [
    {
      id: 'reorder' as ActiveTab,
      label: 'Low Stock Alerts',
      icon: AlertTriangle,
      alertCount: lowStockAlerts.length,
      critical: criticalCount > 0,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports',
      icon: FileSpreadsheet,
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Admin Settings',
      icon: isSuperAdmin ? ShieldCheck : Shield,
      isAuth: isAuthenticated,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#090E17] text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-white/10">
      {/* 1. Brand Header */}
      <div className="px-5 py-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
        <button
          onClick={() => handleTabClick('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer min-w-0"
        >
          <BrandLogo className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <span className="text-[15px] font-bold text-[#0B0F17] dark:text-white block leading-tight truncate">
              Anointed Engineering
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block leading-tight mt-0.5 truncate">
              Toner Inventory
            </span>
          </div>
        </button>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Single Clear Primary Action */}
      <div className="px-4 pt-5 pb-3">
        <button
          onClick={() => {
            onOpenDispatch();
            setMobileMenuOpen(false);
          }}
          className="w-full min-h-[46px] flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#0B0F17] hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-[#06090F] rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          <Truck className="w-4 h-4 text-sky-400 dark:text-[#06090F] shrink-0" />
          <span>Send Toner to Branch</span>
        </button>
      </div>

      {/* 3. Calm, Spacious Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        <nav aria-label="Main navigation" className="space-y-1">
          {navPrimary.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-950 dark:text-sky-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#0B0F17] dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? 'text-blue-700 dark:text-sky-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
          <nav aria-label="Tools and settings" className="space-y-1">
            {navSecondary.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-950 dark:text-sky-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#0B0F17] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive
                          ? 'text-blue-700 dark:text-sky-400'
                          : item.id === 'reorder' && item.alertCount && item.alertCount > 0
                          ? item.critical
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.id === 'reorder' && item.alertCount !== undefined && item.alertCount > 0 && (
                    <span
                      className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
                        item.critical
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.alertCount}
                    </span>
                  )}

                  {item.id === 'admin' && !item.isAuth && (
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                onOpenGuide();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#0B0F17] dark:hover:text-white transition-colors cursor-pointer"
            >
              <BookOpen className="w-5 h-5 shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate">Help Guide</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 4. Display Comfort Controls (Text Size + Theme) & User Profile */}
      <div className="p-3.5 pb-safe lg:pb-4 border-t border-slate-200/80 dark:border-white/10 space-y-3 bg-slate-50/70 dark:bg-white/[0.02]">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleTextScale}
            aria-pressed={isLargeText}
            title={isLargeText ? 'Switch to standard text size' : 'Make text larger and easier to read'}
            className={`min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isLargeText
                ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-sky-400/50 text-blue-900 dark:text-sky-300'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <Type className="w-4 h-4 shrink-0" />
            <span>{isLargeText ? 'Text: Large' : 'Larger Text'}</span>
          </button>

          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {isAuthenticated && currentUser ? (
          <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                  isSuperAdmin
                    ? 'bg-[#0B0F17] dark:bg-amber-400 text-amber-300 dark:text-[#06090F]'
                    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-sky-300'
                }`}
              >
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[#0B0F17] dark:text-white block truncate leading-tight">
                  {currentUser.displayName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                  {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'IT Staff'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleTabClick('admin')}
            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-sm font-semibold text-[#0B0F17] dark:text-white transition cursor-pointer"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Admin Sign In</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 xl:w-72 lg:fixed lg:inset-y-0 lg:z-40 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-[#090E17] border-b border-slate-200 dark:border-white/10 text-[#0B0F17] dark:text-white flex items-center justify-between px-4 h-16 print:hidden">
        <button
          onClick={() => handleTabClick('dashboard')}
          className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer"
        >
          <BrandLogo className="w-9 h-9 shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-bold text-[#0B0F17] dark:text-white block leading-tight truncate">
              Anointed Engineering
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block leading-tight truncate">
              Toner Inventory
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTextScale}
            aria-label={isLargeText ? 'Use standard text size' : 'Use larger text'}
            title={isLargeText ? 'Standard text' : 'Larger text'}
            className={`min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center rounded-xl text-xs font-bold border transition cursor-pointer ${
              isLargeText
                ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-sky-400/50 text-blue-900 dark:text-sky-300'
                : 'bg-slate-100 dark:bg-white/10 border-transparent text-slate-700 dark:text-slate-200'
            }`}
          >
            A+
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-[#090E17] shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
