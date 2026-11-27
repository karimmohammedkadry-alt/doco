import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus, ShoppingBag, Trash2, Users, X } from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import { TABLE_STATUS_LABELS, type PaymentMethod } from '../types/doko';
import { DishVisual } from './DishVisual';

export const CartDrawer: React.FC = () => {
  const {
    state,
    session,
    cartOpen,
    setCartOpen,
    cart,
    updateCartQty,
    clearCart,
    createOrder,
    preferredOrderType,
    setPreferredOrderType,
    preferredTableNumber,
    setPreferredTableNumber,
    setSelectedOrderDetailId,
  } = useDoko();

  const [customerName, setCustomerName] = useState(session.isGuest ? '' : session.displayName);
  const [customerPhone, setCustomerPhone] = useState(session.phone || '');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((s, item) => s + item.menuItem.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.14);
  const total = subtotal + tax;

  const tables = state?.tables || [];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    const created = await createOrder({
      type: preferredOrderType,
      items: cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        notes: c.notes,
      })),
      paymentMethod:
        preferredOrderType === 'dine_in' && paymentMethod === 'cash'
          ? 'unpaid'
          : paymentMethod,
      tableNumber: preferredOrderType === 'dine_in' ? preferredTableNumber : undefined,
      customerName: customerName.trim() || 'ضيف دوكو',
      customerPhone: customerPhone.trim() || undefined,
      address: preferredOrderType === 'delivery' ? address.trim() : undefined,
    });
    setSubmitting(false);
    if (created) {
      clearCart();
      setCartOpen(false);
      setSelectedOrderDetailId(created.id);
    }
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-red-600" />
                <h2 className="font-display text-lg font-bold text-zinc-900">سلة الطلبات</h2>
                <span className="text-xs font-medium text-zinc-500 tabular-nums">
                  ({cart.reduce((s, c) => s + c.quantity, 0)} أصناف)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                aria-label="إغلاق السلة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-zinc-900">
                    سلتك فارغة حالياً
                  </h3>
                  <p className="mt-1 max-w-xs text-sm text-zinc-500">
                    اختر أطباقك المفضلة من منيو دوكو وسيتم إرسالها فوراً إلى المطبخ مع تتبع حي لحالتها.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Items */}
                  <div className="divide-y divide-zinc-100">
                    <AnimatePresence initial={false}>
                      {cart.map(({ menuItem, quantity, notes }) => (
                        <motion.div
                          key={menuItem.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-3 py-3.5"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
                            <DishVisual item={menuItem} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-display text-sm font-bold text-zinc-900">
                              {menuItem.name}
                            </h4>
                            {notes && (
                              <div className="truncate text-[11px] text-zinc-500">{notes}</div>
                            )}
                            <div className="mt-0.5 text-xs font-medium text-red-600 tabular-nums">
                              {menuItem.price * quantity} ج.م
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                            <button
                              type="button"
                              onClick={() => updateCartQty(menuItem.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-800 shadow-xs hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(menuItem.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-800 shadow-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                            >
                              {quantity === 1 ? (
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              ) : (
                                <Minus className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Checkout Form */}
                  <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 border-t border-zinc-200 pt-5">
                    <div>
                      <div className="mb-2 text-xs font-semibold text-zinc-700">نوع الطلب</div>
                      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-zinc-100 p-1">
                        {[
                          { id: 'dine_in' as const, label: 'صالة (ترابيزة)' },
                          { id: 'takeaway' as const, label: 'تيك أواي' },
                          { id: 'delivery' as const, label: 'دليفري' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPreferredOrderType(opt.id)}
                            className={`rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer ${
                              preferredOrderType === opt.id
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Table Grid Picker for Dine-in */}
                    {preferredOrderType === 'dine_in' && (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-700">
                          <span>اختر الترابيزة</span>
                          <span className="text-red-600">طاولة رقم {preferredTableNumber}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {tables.map((tbl) => {
                            const selected = preferredTableNumber === tbl.number;
                            const isAvailable = tbl.status === 'available';
                            return (
                              <button
                                key={tbl.id}
                                type="button"
                                onClick={() => setPreferredTableNumber(tbl.number)}
                                className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                                  selected
                                    ? 'border-red-600 bg-red-600 text-white shadow-xs'
                                    : isAvailable
                                    ? 'border-zinc-200 bg-white text-zinc-900 hover:border-red-300'
                                    : 'border-zinc-200 bg-zinc-100 text-zinc-500'
                                }`}
                              >
                                <span className="font-mono text-xs font-extrabold tabular-nums">
                                  T{tbl.number}
                                </span>
                                <span className="mt-0.5 flex items-center gap-0.5 text-[10px]">
                                  <Users className="h-2.5 w-2.5" />
                                  {tbl.capacity}
                                </span>
                                <span
                                  className={`mt-0.5 text-[9px] font-bold ${
                                    selected
                                      ? 'text-red-100'
                                      : isAvailable
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {TABLE_STATUS_LABELS[tbl.status]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-zinc-700">
                          الاسم (اختياري)
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="ضيف دوكو"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-zinc-700">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          required={preferredOrderType === 'delivery'}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="010xxxxxxxx"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {preferredOrderType === 'delivery' && (
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-zinc-700">
                          عنوان التوصيل
                        </label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="الحي، الشارع، رقم العقار والشقة"
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <div className="mb-2 text-xs font-semibold text-zinc-700">طريقة الدفع</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'cash' as const, label: 'كاش' },
                          { id: 'card' as const, label: 'بطاقة بنكية' },
                          { id: 'wallet' as const, label: 'محفظة' },
                        ].map((pm) => (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`rounded-lg border py-2 text-xs font-semibold transition-colors cursor-pointer ${
                              paymentMethod === pm.id
                                ? 'border-red-600 bg-red-50 text-red-700'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Footer Totals */}
            {cart.length > 0 && (
              <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-zinc-600">
                    <span>المجموع الفرعي</span>
                    <span className="tabular-nums">{subtotal} ج.م</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>ضريبة القيمة المضافة (١٤٪)</span>
                    <span className="tabular-nums">{tax} ج.م</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-2 font-display text-base font-bold text-zinc-900">
                    <span>الإجمالي النهائي</span>
                    <span className="text-red-600 tabular-nums">{total} ج.م</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'جاري إرسال الطلب للمطبخ...' : `تأكيد الطلب ومتابعة الحالة (${total} ج.م)`}
                </motion.button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
