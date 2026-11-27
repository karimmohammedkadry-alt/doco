import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, Check, Plus, Utensils, X } from 'lucide-react';
import { useDoko } from '../../context/DokoContext';
import {
  ORDER_STATUS_LABELS,
  TABLE_STATUS_LABELS,
  type MenuItem,
  type RestaurantTable,
} from '../../types/doko';

export const WaiterFloor: React.FC = () => {
  const { state, createOrder, updateOrderStatus, updateTableStatus } = useDoko();
  const [activeTable, setActiveTable] = useState<RestaurantTable | null>(null);
  const [guestName, setGuestName] = useState('');
  const [tableCart, setTableCart] = useState<{ dish: MenuItem; qty: number }[]>([]);

  if (!state) return null;

  const readyToServeOrders = state.orders.filter((o) => o.status === 'ready');
  const zones = ['الصالة الرئيسية', 'قسم العائلات', 'التراس الخارجي'] as const;

  const addDish = (dish: MenuItem) => {
    if (!dish.available) return;
    setTableCart((prev) => {
      const ex = prev.find((p) => p.dish.id === dish.id);
      if (ex) return prev.map((p) => (p.dish.id === dish.id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { dish, qty: 1 }];
    });
  };

  const handleSendTableOrder = async () => {
    if (!activeTable || tableCart.length === 0) return;
    const order = await createOrder({
      type: 'dine_in',
      items: tableCart.map((c) => ({ menuItemId: c.dish.id, quantity: c.qty })),
      paymentMethod: 'unpaid',
      tableNumber: activeTable.number,
      customerName: guestName.trim() || activeTable.guestName || `ضيف طاولة ${activeTable.number}`,
    });
    if (order) {
      setTableCart([]);
      setGuestName('');
      setActiveTable(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kitchen Ready Pickup Alerts */}
      {readyToServeOrders.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-red-700">
            <BellRing className="h-4 w-4" />
            <span>طلبات جاهزة للاستلام من المطبخ ({readyToServeOrders.length})</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {readyToServeOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between rounded-xl border border-red-200 bg-white p-3"
              >
                <div>
                  <div className="font-mono text-sm font-bold text-zinc-900 tabular-nums">
                    #{ord.orderNumber} · {ord.tableNumber ? `طاولة ${ord.tableNumber}` : 'تيك أواي'}
                  </div>
                  <div className="text-xs text-zinc-500">{ord.customerName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'served')}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>تم التقديم</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Floor Plan by Zone */}
      <div className="space-y-6">
        {zones.map((zone) => {
          const zoneTables = state.tables.filter((t) => t.zone === zone);
          return (
            <div key={zone} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-display text-base font-bold text-zinc-900">{zone}</h3>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {zoneTables.filter((t) => t.status === 'available').length} متاحة من {zoneTables.length}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {zoneTables.map((table) => {
                  const linkedOrder = table.currentOrderId
                    ? state.orders.find((o) => o.id === table.currentOrderId)
                    : undefined;

                  return (
                    <motion.div
                      key={table.id}
                      whileHover={{ y: -2 }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                        table.status === 'available'
                          ? 'border-zinc-200 bg-zinc-50/60'
                          : table.status === 'billing'
                          ? 'border-amber-300 bg-amber-50/50'
                          : table.status === 'reserved'
                          ? 'border-zinc-300 bg-zinc-100/70'
                          : 'border-red-200 bg-red-50/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-extrabold text-zinc-900 tabular-nums">
                            طاولة {table.number}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              table.status === 'available'
                                ? 'text-emerald-700'
                                : table.status === 'billing'
                                ? 'text-amber-700'
                                : 'text-red-600'
                            }`}
                          >
                            {TABLE_STATUS_LABELS[table.status]}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 tabular-nums">
                          السعة: {table.capacity} أفراد
                          {table.guestName ? ` · ${table.guestName}` : ''}
                        </div>

                        {linkedOrder && (
                          <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-2.5 text-xs">
                            <div className="flex justify-between font-bold text-zinc-900">
                              <span className="font-mono tabular-nums">#{linkedOrder.orderNumber}</span>
                              <span className="text-red-600">
                                {ORDER_STATUS_LABELS[linkedOrder.status]}
                              </span>
                            </div>
                            <div className="mt-1 font-mono text-zinc-600 tabular-nums">
                              الإجمالي: {linkedOrder.total} ج.م
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200/70 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTable(table);
                            setGuestName(table.guestName || '');
                            setTableCart([]);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>طلب جديد</span>
                        </button>

                        {table.status === 'occupied' && (
                          <button
                            type="button"
                            onClick={() => updateTableStatus(table.id, 'billing', table.guestName)}
                            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                          >
                            طلب الحساب
                          </button>
                        )}
                        {table.status !== 'available' && !linkedOrder && (
                          <button
                            type="button"
                            onClick={() => updateTableStatus(table.id, 'available')}
                            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                          >
                            إخلاء
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Order Modal */}
      <AnimatePresence>
        {activeTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs"
            onClick={() => setActiveTable(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-red-600" />
                  <h3 className="font-display text-lg font-bold text-zinc-900">
                    تسجيل طلب — طاولة {activeTable.number} ({activeTable.zone})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTable(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="اسم الضيف (اختياري)"
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {state.menu.map((dish) => {
                  const qty = tableCart.find((c) => c.dish.id === dish.id)?.qty || 0;
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      disabled={!dish.available}
                      onClick={() => addDish(dish)}
                      className={`rounded-xl border p-3 text-right cursor-pointer ${
                        qty > 0
                          ? 'border-red-600 bg-red-50/50'
                          : 'border-zinc-200 bg-white hover:border-red-300'
                      } ${!dish.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-xs font-bold text-zinc-900">{dish.name}</div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="font-mono text-red-600 tabular-nums">{dish.price} ج.م</span>
                        {qty > 0 && (
                          <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white tabular-nums">
                            {qty}×
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-4">
                <div className="font-display text-sm font-bold text-zinc-900 tabular-nums">
                  الإجمالي التقديري:{' '}
                  <span className="text-red-600">
                    {tableCart.reduce((s, c) => s + c.dish.price * c.qty, 0)} ج.م
                  </span>
                </div>
                <button
                  type="button"
                  disabled={tableCart.length === 0}
                  onClick={handleSendTableOrder}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                >
                  إرسال الطلب للمطبخ فوراً
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
