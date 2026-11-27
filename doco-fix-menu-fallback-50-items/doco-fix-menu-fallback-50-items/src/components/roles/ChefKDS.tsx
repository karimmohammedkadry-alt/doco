import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Check, CheckCircle2, ChefHat, Clock, Flame } from 'lucide-react';
import { useDoko } from '../../context/DokoContext';
import { ORDER_TYPE_LABELS, type OrderStatus } from '../../types/doko';

export const ChefKDS: React.FC = () => {
  const { state, updateOrderStatus, toggleOrderItemPrepared } = useDoko();
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!state) return null;

  const columns: { status: OrderStatus; title: string; nextStatus?: OrderStatus; nextLabel?: string }[] = [
    {
      status: 'pending',
      title: 'طلبات جديدة بانتظار المطبخ',
      nextStatus: 'preparing',
      nextLabel: 'بدء التحضير الآن',
    },
    {
      status: 'preparing',
      title: 'قيد التحضير على النار',
      nextStatus: 'ready',
      nextLabel: 'إعلام بالجاهزية للتقديم',
    },
    {
      status: 'ready',
      title: 'جاهز للتسليم والتقديم',
      nextStatus: 'served',
      nextLabel: 'تأكيد التسليم',
    },
  ];

  const lowStock = state.inventory.filter((i) => i.quantity <= i.minThreshold);

  const elapsedMinutes = (iso: string) =>
    Math.max(1, Math.floor((nowTick - new Date(iso).getTime()) / 60_000));

  return (
    <div className="space-y-5">
      {/* Kitchen Stock Warning Strip */}
      {lowStock.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>تنبيه المطبخ — مكونات قاربت على النفاد:</span>
          </div>
          <div className="flex flex-wrap gap-3 text-red-800">
            {lowStock.map((i) => (
              <span key={i.id} className="font-semibold tabular-nums">
                {i.name} ({i.quantity} {i.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Live KDS Board */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {columns.map((col) => {
          const tickets = state.orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  {col.status === 'pending' ? (
                    <Clock className="h-4 w-4 text-red-600" />
                  ) : col.status === 'preparing' ? (
                    <Flame className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <h3 className="font-display text-sm font-bold text-zinc-900">{col.title}</h3>
                </div>
                <span className="font-mono text-xs font-bold text-zinc-500 tabular-nums">
                  {tickets.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {tickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-xs text-zinc-400">
                      لا توجد تذاكر في هذه المرحلة
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const mins = elapsedMinutes(ticket.createdAt);
                      return (
                        <motion.div
                          layout
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5">
                            <div>
                              <span className="font-mono text-base font-extrabold text-zinc-900 tabular-nums">
                                #{ticket.orderNumber}
                              </span>
                              <span className="mx-1.5 text-zinc-300">·</span>
                              <span className="text-xs font-bold text-red-600">
                                {ticket.tableNumber
                                  ? `طاولة ${ticket.tableNumber}`
                                  : ORDER_TYPE_LABELS[ticket.type]}
                              </span>
                            </div>
                            <span
                              className={`font-mono text-xs font-bold tabular-nums ${
                                mins >= 15 ? 'text-red-600' : 'text-zinc-500'
                              }`}
                            >
                              منذ {mins} د
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {ticket.items.map((item) => (
                              <button
                                key={item.menuItemId}
                                type="button"
                                onClick={() => toggleOrderItemPrepared(ticket.id, item.menuItemId)}
                                className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-right text-xs border border-zinc-200/80 hover:border-red-300 cursor-pointer"
                              >
                                <span
                                  className={`font-semibold ${
                                    item.prepared
                                      ? 'text-zinc-400 line-through'
                                      : 'text-zinc-900'
                                  }`}
                                >
                                  <span className="font-mono font-bold text-red-600 tabular-nums">
                                    {item.quantity}×{' '}
                                  </span>
                                  {item.name}
                                </span>
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                    item.prepared
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-zinc-300 bg-white'
                                  }`}
                                >
                                  {item.prepared && <Check className="h-3 w-3" />}
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-zinc-500">{ticket.customerName}</span>
                            {col.nextStatus && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(ticket.id, col.nextStatus!)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                              >
                                <ChefHat className="h-3.5 w-3.5" />
                                <span>{col.nextLabel}</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
