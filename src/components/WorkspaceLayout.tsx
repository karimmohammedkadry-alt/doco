import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  ChefHat,
  ClipboardCheck,
  ConciergeBell,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Package,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import { ROLES, type RoleType } from '../types/doko';
import { DokoLogo } from './DokoLogo';

export interface WorkspaceTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface WorkspaceLayoutProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  tabs: WorkspaceTab[];
  children: React.ReactNode;
}

export const getTabsForRole = (role: RoleType): WorkspaceTab[] => {
  switch (role) {
    case 'manager':
      return [
        { id: 'overview', label: 'لوحة التحكم', icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: 'reports', label: 'تقارير الطلبات', icon: <BarChart3 className="h-4 w-4" /> },
        { id: 'inventory', label: 'المخزون اللحظي', icon: <Package className="h-4 w-4" /> },
        { id: 'menu-rbac', label: 'المنيو والصلاحيات', icon: <UtensilsCrossed className="h-4 w-4" /> },
        { id: 'cashier-view', label: 'نقطة الكاشير', icon: <CreditCard className="h-4 w-4" /> },
        { id: 'chef-view', label: 'شاشة المطبخ', icon: <ChefHat className="h-4 w-4" /> },
      ];
    case 'cashier':
      return [{ id: 'pos', label: 'نقطة البيع والتحصيل', icon: <CreditCard className="h-4 w-4" /> }];
    case 'chef':
      return [{ id: 'kds', label: 'شاشة المطبخ (KDS)', icon: <ChefHat className="h-4 w-4" /> }];
    case 'waiter':
      return [{ id: 'floor', label: 'الطاولات والخدمة', icon: <ClipboardCheck className="h-4 w-4" /> }];
    case 'reception':
      return [{ id: 'reception', label: 'الحجوزات والاستقبال', icon: <ConciergeBell className="h-4 w-4" /> }];
    default:
      return [];
  }
};

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  activeTab,
  onTabChange,
  tabs,
  children,
}) => {
  const { session, setViewMode, setAuthModalOpen, state } = useDoko();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const roleDef = ROLES.find((r) => r.id === session.role);
  const activeTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const lowStockCount =
    state?.inventory.filter((i) => i.quantity <= i.minThreshold).length ?? 0;
  const activeOrdersCount =
    state?.orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length ?? 0;

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B0B0D] p-4 text-white">
      <div>
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <DokoLogo size="sm" />
            <div>
              <div className="font-display text-sm font-extrabold text-white">دوكو سيستم</div>
              <div className="text-[11px] font-medium text-red-400">{roleDef?.label}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 space-y-1.5">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileNavOpen(false);
                }}
                className={`relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  active ? 'text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="workspaceActiveTab"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-l from-red-600 to-red-700 shadow-md shadow-red-950/50"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
                {tab.id === 'inventory' && lowStockCount > 0 && (
                  <span
                    className={`relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                      active ? 'bg-white/20 text-white' : 'bg-red-600/20 text-red-400'
                    }`}
                  >
                    {lowStockCount}
                  </span>
                )}
                {tab.id === 'overview' && activeOrdersCount > 0 && (
                  <span
                    className={`relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                      active ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Dark Promo Card + Actions matching uploaded dashboard mockup */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 p-3">
          <div className="relative z-10">
            <div className="font-display text-xs font-bold text-red-400">Good Food .. Good Mood</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              تزامن فوري مع المنيو والمطبخ والمخزون
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-red-500/60 hover:text-white cursor-pointer"
        >
          <Users className="h-4 w-4 text-red-500" />
          <span>تبديل الصلاحية / المستخدم</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('website')}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
        >
          <span>عرض موقع العملاء</span>
          <ExternalLink className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-zinc-900 lg:flex">
      {/* Dark Obsidian Sidebar */}
      <aside className="hidden w-64 shrink-0 border-l border-zinc-800 bg-[#0B0B0D] lg:block no-print">
        <div className="sticky top-0 h-screen overflow-y-auto">{SidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="h-full w-64 bg-[#0B0B0D] shadow-xl" onClick={(e) => e.stopPropagation()}>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500">
              <span className="font-bold text-zinc-900">DOKO</span>
              <span>/</span>
              <span>{roleDef?.label}</span>
              <span>/</span>
              <span className="font-bold text-red-600">{activeTabObj?.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-800 hover:border-red-300 hover:text-red-600 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="h-4 w-4 text-red-600" />
              <span>{session.displayName}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
