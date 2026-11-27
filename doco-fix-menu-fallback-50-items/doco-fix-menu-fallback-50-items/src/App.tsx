import React, { useEffect, useState } from 'react';
import { DokoLogo } from './components/DokoLogo';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { DokoProvider, useDoko } from './context/DokoContext';
import { Navbar } from './components/Navbar';
import { CustomerWebsite } from './components/CustomerWebsite';
import { AuthRoleModal } from './components/AuthRoleModal';
import { CartDrawer } from './components/CartDrawer';
import { WorkspaceLayout, getTabsForRole } from './components/WorkspaceLayout';
import { ManagerDashboard } from './components/roles/ManagerDashboard';
import { CashierPOS } from './components/roles/CashierPOS';
import { ChefKDS } from './components/roles/ChefKDS';
import { WaiterFloor } from './components/roles/WaiterFloor';
import { ReceptionDesk } from './components/roles/ReceptionDesk';

const ToastOverlay: React.FC = () => {
  const { toasts } = useDoko();
  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[60] flex flex-col gap-2 no-print">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-bold shadow-lg backdrop-blur-md ${
              t.variant === 'error'
                ? 'border-red-200 bg-red-600 text-white'
                : t.variant === 'success'
                ? 'border-zinc-200 bg-white text-zinc-900'
                : 'border-zinc-200 bg-zinc-900 text-white'
            }`}
          >
            {t.variant === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : t.variant === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{t.title}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const DokoRouter: React.FC = () => {
  const { loading, session, viewMode } = useDoko();
  const tabs = getTabsForRole(session.role);
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || 'overview');

  useEffect(() => {
    const roleTabs = getTabsForRole(session.role);
    if (roleTabs.length > 0 && !roleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(roleTabs[0].id);
    }
  }, [session.role, activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0D] text-white">
        <motion.div
          animate={{ scale: [0.97, 1.03, 0.97] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        >
          <DokoLogo size="lg" />
        </motion.div>
        <p className="mt-4 font-display text-sm font-bold text-zinc-400">
          جاري تحميل منظومة مطعم دوكو...
        </p>
      </div>
    );
  }

  const showWorkspace = viewMode === 'workspace' && session.role !== 'customer';

  return (
    <>
      {!showWorkspace ? (
        <div className="min-h-screen bg-white">
          <Navbar />
          <CustomerWebsite />
        </div>
      ) : (
        <WorkspaceLayout activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${session.role}-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {session.role === 'manager' && (
                <>
                  {(activeTab === 'overview' ||
                    activeTab === 'reports' ||
                    activeTab === 'inventory' ||
                    activeTab === 'menu-rbac') && (
                    <ManagerDashboard section={activeTab} />
                  )}
                  {activeTab === 'cashier-view' && <CashierPOS />}
                  {activeTab === 'chef-view' && <ChefKDS />}
                </>
              )}
              {session.role === 'cashier' && <CashierPOS />}
              {session.role === 'chef' && <ChefKDS />}
              {session.role === 'waiter' && <WaiterFloor />}
              {session.role === 'reception' && <ReceptionDesk />}
            </motion.div>
          </AnimatePresence>
        </WorkspaceLayout>
      )}
      <AuthRoleModal />
      <CartDrawer />
      <ToastOverlay />
    </>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <DokoProvider>
        <DokoRouter />
      </DokoProvider>
    </MotionConfig>
  );
}
