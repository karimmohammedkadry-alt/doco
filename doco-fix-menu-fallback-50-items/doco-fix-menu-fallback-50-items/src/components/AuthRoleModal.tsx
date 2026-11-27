import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChefHat,
  ClipboardCheck,
  ConciergeBell,
  CreditCard,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Utensils,
  X,
} from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import { ROLES, type RoleType } from '../types/doko';

const ROLE_ICONS: Record<RoleType, React.ReactNode> = {
  customer: <Utensils className="h-5 w-5" />,
  manager: <ShieldCheck className="h-5 w-5" />,
  cashier: <CreditCard className="h-5 w-5" />,
  chef: <ChefHat className="h-5 w-5" />,
  waiter: <ClipboardCheck className="h-5 w-5" />,
  reception: <ConciergeBell className="h-5 w-5" />,
};

export const AuthRoleModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, session, switchRole, logoutToGuest } = useDoko();
  const [selectedRole, setSelectedRole] = useState<RoleType>(session.role);
  const [pin, setPin] = useState('');
  const [customerName, setCustomerName] = useState(session.isGuest ? '' : session.displayName);
  const [customerPhone, setCustomerPhone] = useState(session.phone || '');
  const [busy, setBusy] = useState(false);

  const selectedDef = ROLES.find((r) => r.id === selectedRole)!;

  const handleSubmit = async (quickDemo: boolean) => {
    setBusy(true);
    if (selectedRole === 'customer') {
      await switchRole({
        role: 'customer',
        displayName: customerName.trim() || 'زائر دوكو',
        phone: customerPhone.trim() || undefined,
        quickDemo: true,
      });
    } else {
      await switchRole({
        role: selectedRole,
        pin: quickDemo ? undefined : pin,
        quickDemo,
      });
    }
    setBusy(false);
    setPin('');
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-zinc-900">
                  بوابة الدخول والصلاحيات — مطعم دوكو
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  تسجيل الدخول اختياري للعملاء. يمكنك التصفح والطلب كضيف أو اختيار إحدى صلاحيات الطاقم لإدارة النظام لحظياً.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Role Cards List */}
              <div className="space-y-2.5 md:col-span-7">
                {ROLES.map((r) => {
                  const active = selectedRole === r.id;
                  return (
                    <motion.button
                      key={r.id}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedRole(r.id);
                        setPin('');
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-right transition-all cursor-pointer ${
                        active
                          ? 'border-red-600 bg-red-50/60 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            active ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {ROLE_ICONS[r.id]}
                        </div>
                        <div>
                          <div className="font-display text-sm font-bold text-zinc-900">
                            {r.label}
                          </div>
                          <div className="text-xs text-zinc-500">{r.subtitle}</div>
                        </div>
                      </div>
                      {r.pin && (
                        <span className="font-mono text-xs font-medium text-zinc-400 tabular-nums shrink-0">
                          PIN: {r.pin}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected Role Details & Optional Auth Form */}
              <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 md:col-span-5">
                <div>
                  <div className="flex items-center gap-2 text-red-600">
                    {ROLE_ICONS[selectedRole]}
                    <span className="font-display text-base font-bold text-zinc-900">
                      {selectedDef.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-zinc-200/70 pt-3">
                    <div className="text-xs font-semibold text-zinc-500">الصلاحيات المتاحة:</div>
                    <ul className="space-y-1.5 text-xs text-zinc-700">
                      {selectedDef.permissions.map((perm) => (
                        <li key={perm} className="flex items-start gap-2">
                          <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedRole === 'customer' ? (
                    <div className="mt-5 space-y-3 border-t border-zinc-200/70 pt-4">
                      <div className="text-xs font-semibold text-zinc-700">
                        بيانات العميل (اختياري تماماً)
                      </div>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="الاسم (اختياري — مثال: كريم محمد)"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="رقم الهاتف لمتابعة الطلب (اختياري)"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="mt-5 space-y-2 border-t border-zinc-200/70 pt-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                        <KeyRound className="h-3.5 w-3.5 text-red-600" />
                        <span>رمز التحقق للطاقم (PIN: {selectedDef.pin})</span>
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder={`أدخل ${selectedDef.pin} أو استخدم الدخول السريع`}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono tracking-widest text-zinc-900 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  {selectedRole === 'customer' ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSubmit(true)}
                        className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer"
                      >
                        {customerName.trim() ? 'حفظ الاسم والمتابعة للمنيو' : 'المتابعة كضيف بدون تسجيل'}
                      </button>
                      {!session.isGuest && (
                        <button
                          type="button"
                          onClick={() => {
                            logoutToGuest();
                            setAuthModalOpen(false);
                          }}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 cursor-pointer"
                        >
                          العودة للتصفح كضيف
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSubmit(false)}
                        className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer disabled:opacity-60"
                      >
                        دخول بالرمز ({selectedDef.label})
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSubmit(true)}
                        className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                      >
                        دخول فوري للتجربة بدون كتابة الرمز
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
