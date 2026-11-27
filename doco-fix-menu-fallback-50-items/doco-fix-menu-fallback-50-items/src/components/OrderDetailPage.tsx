import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  Receipt,
  Truck,
  Utensils,
} from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
} from '../types/doko';

const TIMELINE_STEPS: {
  status: OrderStatus;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    status: 'pending',
    title: 'تم استلام الطلب بالمطبخ',
    desc: 'وصلت تذكرة طلبك إلى الشيف وتم خصم المكونات الطازجة من المخزون',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    status: 'preparing',
    title: 'الشيف يجهز طلبك الآن',
    desc: 'أطباقك قيد الشواء والطهي المباشر في مطبخ دوكو',
    icon: <ChefHat className="h-4 w-4" />,
  },
  {
    status: 'ready',
    title: 'جاهز للتقديم / التوصيل',
    desc: 'اكتمل تجهيز جميع الأصناف وبانتظار الجارسون أو المندوب',
    icon: <Utensils className="h-4 w-4" />,
  },
  {
    status: 'completed',
    title: 'تم التسليم واكتمال الطلب',
    desc: 'نتمنى لك وجبة شهية — Good Food .. Good Mood',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

export const OrderDetailPage: React.FC = () => {
  const { state, selectedOrderDetailId, setSelectedOrderDetailId } = useDoko();

  if (!selectedOrderDetailId || !state) return null;

  const order = state.orders.find((o) => o.id === selectedOrderDetailId);
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-zinc-500">تعذر العثور على هذا الطلب.</p>
        <button
          type="button"
          onClick={() => setSelectedOrderDetailId(null)}
          className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
        >
          العودة للموقع
        </button>
      </div>
    );
  }

  const activeIdx =
    order.status === 'served'
      ? 2
      : order.status === 'cancelled'
      ? -1
      : TIMELINE_STEPS.findIndex((s) => s.status === order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-[85vh] bg-zinc-50 py-8 sm:py-12"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setSelectedOrderDetailId(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-xs hover:border-red-500 hover:text-red-600 cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى الموقع والمنيو</span>
        </button>

        {/* Top Header Card */}
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-[#0B0B0D] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-red-400">
                تتبع مباشر لحظة بلحظة من المطبخ إلى الطاولة
              </div>
              <h1 className="mt-1 font-display text-3xl font-black tabular-nums">
                تفاصيل الطلب #{order.orderNumber}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                <span>{order.customerName}</span>
                <span>·</span>
                <span>{ORDER_TYPE_LABELS[order.type]}</span>
                {order.tableNumber && (
                  <>
                    <span>·</span>
                    <span className="font-bold text-red-400">طاولة رقم {order.tableNumber}</span>
                  </>
                )}
                {order.address && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-red-400" />
                      {order.address}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/40 bg-red-600/15 px-5 py-3 text-center">
              <div className="text-[11px] text-red-300">الحالة الحالية</div>
              <div className="mt-0.5 font-display text-lg font-extrabold text-white">
                {ORDER_STATUS_LABELS[order.status]}
              </div>
            </div>
          </div>

          {/* 4-Stage Kitchen-to-Table Timeline */}
          {order.status !== 'cancelled' && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= activeIdx;
                const current = i === activeIdx;
                return (
                  <motion.div
                    key={step.status}
                    animate={{ opacity: done ? 1 : 0.45 }}
                    className={`rounded-2xl border p-4 ${
                      current
                        ? 'border-red-500 bg-red-600/20'
                        : done
                        ? 'border-zinc-700 bg-zinc-900'
                        : 'border-zinc-800 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          done ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {step.icon}
                      </div>
                      {current && (
                        <motion.span
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-[11px] font-bold text-red-400"
                        >
                          الآن
                        </motion.span>
                      )}
                    </div>
                    <div className="mt-3 font-display text-sm font-bold text-white">
                      {step.title}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Itemized Prep Status & Invoice Breakdown */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-7">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <ChefHat className="h-5 w-5 text-red-600" />
              <h2 className="font-display text-lg font-bold text-zinc-900">
                حالة تجهيز كل طبق في المطبخ
              </h2>
            </div>

            <div className="mt-4 divide-y divide-zinc-100">
              {order.items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div>
                    <div className="font-display text-sm font-bold text-zinc-900">
                      <span className="font-mono text-red-600 tabular-nums">{item.quantity}× </span>
                      {item.name}
                    </div>
                    {item.notes && (
                      <div className="mt-0.5 text-xs text-zinc-500">ملاحظة: {item.notes}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-bold ${
                        item.prepared ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {item.prepared ? 'تم التجهيز ✓' : 'قيد التحضير'}
                    </span>
                    <span className="font-mono text-sm font-bold text-zinc-900 tabular-nums">
                      {item.price * item.quantity} ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Receipt className="h-5 w-5 text-red-600" />
              <h2 className="font-display text-lg font-bold text-zinc-900">ملخص الفاتورة</h2>
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>قناة الطلب</span>
                <span className="inline-flex items-center gap-1 font-bold text-zinc-900">
                  {order.type === 'delivery' && <Truck className="h-3.5 w-3.5 text-red-600" />}
                  {ORDER_TYPE_LABELS[order.type]}
                  {order.tableNumber ? ` (طاولة ${order.tableNumber})` : ''}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>طريقة الدفع</span>
                <span className="font-semibold text-zinc-900">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>المجموع الفرعي</span>
                <span className="font-mono tabular-nums">{order.subtotal} ج.م</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>الضريبة (١٤٪)</span>
                <span className="font-mono tabular-nums">{order.tax} ج.م</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>الخصم</span>
                  <span className="font-mono tabular-nums">-{order.discount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-3 font-display text-lg font-black text-zinc-900">
                <span>الإجمالي النهائي</span>
                <span className="font-mono text-red-600 tabular-nums">{order.total} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
