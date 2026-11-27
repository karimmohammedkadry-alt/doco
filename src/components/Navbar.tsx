import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import { ROLES } from '../types/doko';
import { DokoLogo } from './DokoLogo';

export const Navbar: React.FC = () => {
  const {
    session,
    viewMode,
    setViewMode,
    setAuthModalOpen,
    cart,
    setCartOpen,
    setSelectedDishDetail,
    setSelectedOrderDetailId,
  } = useDoko();
  const activeRoleDef = ROLES.find((r) => r.id === session.role);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const navigateHomeSection = (sectionId?: string) => {
    setViewMode('website');
    setSelectedDishDetail(null);
    setSelectedOrderDetailId(null);
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrimaryAction = () => {
    if (cartCount > 0) {
      setCartOpen(true);
    } else if (session.role !== 'customer' && viewMode === 'website') {
      setViewMode('workspace');
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[#0B0B0D]/95 text-white backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Official DOKO Brand Logo */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            navigateHomeSection();
          }}
          className="flex items-center shrink-0 whitespace-nowrap"
          aria-label="دوكو الرئيسية"
        >
          <DokoLogo size="sm" />
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-300">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              navigateHomeSection('hero');
            }}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-red-500 hover:text-white"
          >
            الرئيسية
          </a>
          <a
            href="#menu"
            onClick={(e) => {
              e.preventDefault();
              navigateHomeSection('menu');
            }}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-red-500 hover:text-white"
          >
            المنيو
          </a>
          <a
            href="#reservations"
            onClick={(e) => {
              e.preventDefault();
              navigateHomeSection('reservations');
            }}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-red-500 hover:text-white"
          >
            حجز طاولة
          </a>
          <a
            href="#tracker"
            onClick={(e) => {
              e.preventDefault();
              navigateHomeSection('tracker');
            }}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-red-500 hover:text-white"
          >
            تتبع الطلب
          </a>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors hover:border-red-500 hover:text-red-400 cursor-pointer"
          >
            الصلاحيات
          </button>
        </nav>

        {/* Zone 3: 1 Primary Crimson Action */}
        <div className="flex items-center shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrimaryAction}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {cartCount > 0 ? (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>اطلب الآن ({cartCount})</span>
              </>
            ) : session.role !== 'customer' && viewMode === 'website' ? (
              <span>لوحة {activeRoleDef?.label ?? 'التشغيل'}</span>
            ) : (
              <span>{session.isGuest ? 'دخول / الصلاحيات' : session.displayName}</span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};
