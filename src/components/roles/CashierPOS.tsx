import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Banknote, CheckCircle2, CreditCard, Minus, Plus, Printer, Receipt, Search, Smartphone, Trash2 } from 'lucide-react';
import { useDoko } from '../../context/DokoContext';
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type MenuItem,
  type Order,
  type OrderType,
  type PaymentMethod,
} from '../../types/doko';

export const CashierPOS: React.FC = () => {
  const { state, createOrder, payOrder } = useDoko();
  const [category, setCategory] = useState('الكل');
  const [search, setSearch] = useState('');
  const [posItems, setPosItems] = useState<{ dish: MenuItem; qty: number }[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [tableNumber, setTableNumber] = useState<number>(2);
  const [customerName, setCustomerName] = useState('عميل كاشير');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [settleModalOrder, setSettleModalOrder] = useState<Order | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('cash');
  const [settleDiscount, setSettleDiscount] = useState(0);

  if (!state) return null;

  const categories = ['الكل', 'البرجر واللحوم', 'البيتزا', 'الباستا', 'المقبلات', 'الحلويات', 'المشروبات'];
  const filteredMenu = state.menu.filter(
    (m) =>
      (category === 'الكل' || m.category === category) &&
      (!search.trim() || m.name.includes(search.trim()))
  );

  const unpaidOrders = state.orders.filter(
    (o) => o.paymentStatus === 'unpaid' && o.status !== 'cancelled'
  );

  const addPosDish = (dish: MenuItem) => {
    if (!dish.available) return;
    setPosItems((prev) => {
      const existing = prev.find((p) => p.dish.id === dish.id);
      if (existing) {
        return prev.map((p) => (p.dish.id === dish.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const updatePosQty = (id: string, delta: number) => {
    setPosItems((prev) =>
      prev
        .map((p) => (p.dish.id === id ? { ...p, qty: p.qty + delta } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const subtotal = posItems.reduce((s, p) => s + p.dish.price * p.qty, 0);
  const tax = Math.round(subtotal * 0.14);
  const total = Math.max(0, subtotal + tax - discount);

  const handleCheckout = async () => {
    if (posItems.length === 0) return;
    const order = await createOrder({
      type: orderType,
      items: posItems.map((p) => ({ menuItemId: p.dish.id, quantity: p.qty })),
      paymentMethod,
      tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
      customerName: customerName.trim() || 'عميل كاشير',
      discount,
    });
    if (order) {
      setPosItems([]);
      setDiscount(0);
      setReceiptOrder(order);
    }
  };

  const handleSettleOpenBill = async () => {
    if (!settleModalOrder) return;
    await payOrder(settleModalOrder.id, settleMethod, settleDiscount);
    setReceiptOrder({
      ...settleModalOrder,
      discount: settleDiscount,
      total: Math.max(0, settleModalOrder.subtotal + settleModalOrder.tax - settleDiscount),
      paymentMethod: settleMethod,
      paymentStatus: 'paid',
    });
    setSettleModalOrder(null);
    setSettleDiscount(0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Menu Selection Grid */}
        <div className="space-y-4 xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    category === cat ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث سريع..."
                className="w-40 rounded-lg border border-zinc-300 py-1.5 pr-8 pl-2.5 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredMenu.map((dish) => (
              <motion.button
                key={dish.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={!dish.available}
                onClick={() => addPosDish(dish)}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all cursor-pointer ${
                  dish.available
                    ? 'border-zinc-200 bg-white hover:border-red-500 hover:shadow-sm'
                    : 'border-zinc-200 bg-zinc-100 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="text-[11px] text-zinc-500">{dish.category}</div>
                  <div className="mt-1 font-display text-sm font-bold text-zinc-900">
                    {dish.name}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2">
                  <span className="font-mono text-sm font-extrabold text-red-600 tabular-nums">
                    {dish.price} ج.م
                  </span>
                  <Plus className="h-4 w-4 text-zinc-400" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Open Unpaid Table Bills */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-display text-base font-bold text-zinc-900">
                فواتير الصالة المفتوحة ({unpaidOrders.length})
              </h3>
              <span className="text-xs text-zinc-500">تحصيل مباشر</span>
            </div>
            {unpaidOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                لا توجد فواتير غير مدفوعة حالياً.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-zinc-100">
                {unpaidOrders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                        <span className="font-mono tabular-nums">#{ord.orderNumber}</span>
                        <span>·</span>
                        <span>{ord.tableNumber ? `طاولة ${ord.tableNumber}` : ORDER_TYPE_LABELS[ord.type]}</span>
                        <span>·</span>
                        <span className="text-xs font-medium text-zinc-500">{ord.customerName}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {ORDER_STATUS_LABELS[ord.status]} · {ord.items.length} أصناف
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-extrabold text-zinc-900 tabular-nums">
                        {ord.total} ج.م
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSettleModalOrder(ord);
                          setSettleDiscount(0);
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                      >
                        تحصيل الفاتورة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active POS Cart & Checkout */}
        <div className="xl:col-span-5">
          <div className="sticky top-20 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-600" />
                <h3 className="font-display text-base font-bold text-zinc-900">فاتورة الكاشير</h3>
              </div>
              {posItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPosItems([])}
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  تفريغ
                </button>
              )}
            </div>

            {/* Channel & Customer */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-zinc-100 p-1">
              {[
                { id: 'takeaway' as const, label: 'تيك أواي' },
                { id: 'dine_in' as const, label: 'صالة' },
                { id: 'delivery' as const, label: 'دليفري' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrderType(t.id)}
                  className={`rounded-lg py-1.5 text-xs font-bold cursor-pointer ${
                    orderType === t.id ? 'bg-red-600 text-white' : 'text-zinc-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs focus:border-red-600 focus:outline-none"
              />
              {orderType === 'dine_in' ? (
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  {state.tables.map((t) => (
                    <option key={t.id} value={t.number}>
                      طاولة {t.number} ({t.zone})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="خصم (ج.م)"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs tabular-nums focus:border-red-600 focus:outline-none"
                />
              )}
            </div>

            {/* Lines */}
            <div className="mt-4 max-h-60 divide-y divide-zinc-100 overflow-y-auto">
              {posItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-400">
                  اضغط على أي صنف لإضافته إلى الفاتورة
                </div>
              ) : (
                posItems.map(({ dish, qty }) => (
                  <div key={dish.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-zinc-900">{dish.name}</div>
                      <div className="font-mono text-[11px] text-zinc-500 tabular-nums">
                        {dish.price} × {qty} = {dish.price * qty} ج.م
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updatePosQty(dish.id, 1)}
                        className="rounded border border-zinc-200 p-1 hover:bg-zinc-100 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePosQty(dish.id, -1)}
                        className="rounded border border-zinc-200 p-1 hover:bg-zinc-100 cursor-pointer"
                      >
                        {qty === 1 ? <Trash2 className="h-3 w-3 text-red-600" /> : <Minus className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3">
              {[
                { id: 'cash' as const, label: 'كاش', icon: <Banknote className="h-3.5 w-3.5" /> },
                { id: 'card' as const, label: 'بطاقة', icon: <CreditCard className="h-3.5 w-3.5" /> },
                { id: 'wallet' as const, label: 'محفظة', icon: <Smartphone className="h-3.5 w-3.5" /> },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-zinc-200 text-zinc-600'
                  }`}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t border-zinc-200 pt-3 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>المجموع الفرعي</span>
                <span className="font-mono tabular-nums">{subtotal} ج.م</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>ضريبة (١٤٪)</span>
                <span className="font-mono tabular-nums">{tax} ج.م</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>خصم</span>
                  <span className="font-mono tabular-nums">-{discount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between pt-1 font-display text-base font-extrabold text-zinc-900">
                <span>الإجمالي</span>
                <span className="font-mono text-red-600 tabular-nums">{total} ج.م</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.99 }}
              type="button"
              disabled={posItems.length === 0}
              onClick={handleCheckout}
              className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              إصدار الفاتورة وإرسال للمطبخ
            </motion.button>
          </div>
        </div>
      </div>

      {/* Settle Unpaid Bill Modal */}
      <AnimatePresence>
        {settleModalOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs"
            onClick={() => setSettleModalOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold text-zinc-900">
                تحصيل فاتورة #{settleModalOrder.orderNumber}
              </h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-600">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span className="font-bold text-zinc-900">{settleModalOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ المستحق قبل الخصم:</span>
                  <span className="font-mono font-bold tabular-nums">
                    {settleModalOrder.subtotal + settleModalOrder.tax} ج.م
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">خصم (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={settleDiscount}
                    onChange={(e) => setSettleDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash' as const, label: 'كاش' },
                    { id: 'card' as const, label: 'بطاقة' },
                    { id: 'wallet' as const, label: 'محفظة' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSettleMethod(m.id)}
                      className={`rounded-xl border py-2 text-xs font-bold cursor-pointer ${
                        settleMethod === m.id
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-zinc-200 text-zinc-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleSettleOpenBill}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 cursor-pointer"
                >
                  تأكيد الدفع (
                  {Math.max(0, settleModalOrder.subtotal + settleModalOrder.tax - settleDiscount)}{' '}
                  ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setSettleModalOrder(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {receiptOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs"
            onClick={() => setReceiptOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="border-b border-dashed border-zinc-300 pb-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <div className="mt-2 font-display text-xl font-black text-zinc-900">مطعم دوكو</div>
                <div className="font-mono text-xs text-zinc-500 tabular-nums">
                  فاتورة ضريبية #{receiptOrder.orderNumber}
                </div>
              </div>
              <div className="my-4 space-y-1.5 border-b border-dashed border-zinc-300 pb-4 text-xs">
                {receiptOrder.items.map((it) => (
                  <div key={it.menuItemId} className="flex justify-between">
                    <span>
                      {it.quantity}× {it.name}
                    </span>
                    <span className="font-mono tabular-nums">{it.price * it.quantity} ج.م</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>الضريبة (١٤٪)</span>
                  <span className="font-mono tabular-nums">{receiptOrder.tax} ج.م</span>
                </div>
                <div className="flex justify-between font-display text-base font-extrabold text-zinc-900">
                  <span>الإجمالي المدفوع</span>
                  <span className="font-mono text-red-600 tabular-nums">{receiptOrder.total} ج.م</span>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>طباعة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptOrder(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
