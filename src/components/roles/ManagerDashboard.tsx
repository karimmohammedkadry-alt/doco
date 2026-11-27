import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Download,
  ExternalLink,
  Package,
  Plus,
  Printer,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDoko } from '../../context/DokoContext';
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  ROLES,
  type InventoryItem,
  type MenuItem,
  type OrderType,
  type ReportsSummary,
} from '../../types/doko';
import { DokoLogo } from '../DokoLogo';
import { DishVisual } from '../DishVisual';

interface ManagerDashboardProps {
  section: 'overview' | 'reports' | 'inventory' | 'menu-rbac';
}

const CHART_COLORS = ['#DC2626', '#18181B', '#71717A'];

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ section }) => {
  const {
    state,
    adjustInventory,
    addInventoryItem,
    updateMenuItem,
    addMenuItem,
    fetchReports,
    setAuthModalOpen,
    setViewMode,
  } = useDoko();

  // Reports filter state
  const [range, setRange] = useState<'today' | '7d' | 'all'>('all');
  const [channel, setChannel] = useState<'all' | OrderType>('all');
  const [reports, setReports] = useState<ReportsSummary | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Inventory form state
  const [showAddInv, setShowAddInv] = useState(false);
  const [newInvName, setNewInvName] = useState('');
  const [newInvCat, setNewInvCat] = useState<InventoryItem['category']>('لحوم');
  const [newInvUnit, setNewInvUnit] = useState('كجم');
  const [newInvQty, setNewInvQty] = useState(10);
  const [newInvMin, setNewInvMin] = useState(4);
  const [newInvMax, setNewInvMax] = useState(30);
  const [newInvCost, setNewInvCost] = useState(100);
  const [invFilter, setInvFilter] = useState<'all' | 'low'>('all');

  // Menu form state
  const [showAddDish, setShowAddDish] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishCat, setNewDishCat] = useState<MenuItem['category']>('البرجر واللحوم');
  const [newDishPrice, setNewDishPrice] = useState(180);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<number>(0);

  useEffect(() => {
    if (section === 'reports' || section === 'overview') {
      setLoadingReports(true);
      fetchReports(range, channel).then((r) => {
        if (r) setReports(r);
        setLoadingReports(false);
      });
    }
  }, [section, range, channel, state?.orders.length, state?.orders, fetchReports]);

  if (!state) return null;

  const lowStockItems = state.inventory.filter((i) => i.quantity <= i.minThreshold);
  const activeOrders = state.orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );

  const exportCsv = () => {
    if (!reports) return;
    const headers = ['رقم الطلب', 'العميل', 'القناة', 'الحالة', 'الدفع', 'التكلفة', 'الإجمالي', 'التاريخ'];
    const rows = reports.recentOrders.map((o) => [
      o.orderNumber,
      o.customerName,
      ORDER_TYPE_LABELS[o.type],
      ORDER_STATUS_LABELS[o.status],
      PAYMENT_METHOD_LABELS[o.paymentMethod],
      o.estimatedCost,
      o.total,
      new Date(o.createdAt).toLocaleString('ar-EG'),
    ]);
    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doko-orders-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. OVERVIEW SECTION (Recharts AreaChart + PieChart + Signature KPI Cards)
  if (section === 'overview') {
    const totalRev = reports?.grossRevenue ?? 0;
    const totalOrdersCount = reports?.totalOrders ?? state.orders.length;
    const dailyData = reports?.dailyTrend || [];
    const channelData = (reports?.byChannel || []).map((c) => ({
      name: c.label,
      value: c.revenue > 0 ? c.revenue : c.count,
      count: c.count,
    }));
    const deliveryRev =
      reports?.byChannel.find((c) => c.type === 'delivery')?.revenue ?? 0;
    const onlinePct =
      totalRev > 0 ? Math.min(95, Math.max(15, Math.round((deliveryRev / totalRev) * 100))) : 35;

    return (
      <div className="space-y-6">
        {/* 4 Signature KPI Cards: Red -> White -> Charcoal -> White */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-5 text-white shadow-md shadow-red-900/15"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-3xl font-black tabular-nums">
                  {totalOrdersCount}
                </div>
                <div className="mt-1 text-xs font-medium text-red-100">إجمالي الطلبات</div>
              </div>
              <div className="rounded-xl bg-white/15 p-2.5">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-red-100 tabular-nums">
              {activeOrders.length} طلب نشط حالياً
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-2xl font-black text-zinc-900 tabular-nums">
                  {totalRev.toLocaleString('ar-EG')} <span className="text-sm font-bold">ج.م</span>
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-500">إجمالي المبيعات</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 tabular-nums">
              صافي ربح {reports?.netProfit.toLocaleString('ar-EG') ?? 0} ج.م
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-5 text-white shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-3xl font-black tabular-nums">
                  {state.tables.filter((t) => t.status !== 'available').length}/{state.tables.length}
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-300">إشغال الطاولات الآن</div>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-400 tabular-nums">
              {state.reservations.filter((r) => r.status !== 'cancelled').length} حجوزات مسجلة
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <div
                  className={`font-display text-3xl font-black tabular-nums ${
                    lowStockItems.length > 0 ? 'text-red-600' : 'text-zinc-900'
                  }`}
                >
                  {lowStockItems.length}
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-500">تنبيهات المخزون اللحظي</div>
              </div>
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                {lowStockItems.length > 0 ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Star className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-zinc-600">
              {lowStockItems.length > 0 ? 'تتطلب توريداً سريعاً' : 'المخزون في المستوى الآمن'}
            </div>
          </motion.div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Recharts Daily Sales Overview */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-red-600" />
                    <h3 className="font-display text-base font-bold text-zinc-900">
                      المبيعات اليومية (Recharts)
                    </h3>
                  </div>
                  <div className="flex rounded-lg bg-zinc-100 p-0.5 text-[11px] font-bold">
                    {(['today', '7d', 'all'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRange(r)}
                        className={`rounded-md px-2.5 py-1 cursor-pointer ${
                          range === r ? 'bg-red-600 text-white' : 'text-zinc-600'
                        }`}
                      >
                        {r === 'today' ? 'اليوم' : r === '7d' ? 'أسبوع' : 'الكل'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 h-56 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rechartsRedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC2626" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#71717A' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#71717A' }} width={46} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                        formatter={(val) => [`${Number(val ?? 0).toLocaleString('ar-EG')} ج.م`, 'المبيعات']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#DC2626"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#rechartsRedFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders Feed */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="font-display text-base font-bold text-zinc-900">أحدث الطلبات</h3>
                  <span className="text-xs font-semibold text-red-600 tabular-nums">
                    {state.orders.length} طلب
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {state.orders.slice(0, 5).map((ord) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                          <span className="font-mono tabular-nums">#{ord.orderNumber}</span>
                          <span className="truncate font-medium text-zinc-600">
                            · {ord.customerName}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {ORDER_STATUS_LABELS[ord.status]} · {ORDER_TYPE_LABELS[ord.type]}
                        </div>
                      </div>
                      <div className="font-mono font-extrabold text-zinc-900 tabular-nums shrink-0">
                        {ord.total} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Dishes Numbered Strip */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-display text-base font-bold text-zinc-900">
                  الأطباق الأكثر مبيعاً
                </h3>
                <span className="text-xs text-zinc-500">مرتبط بالمخزون</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {state.menu.slice(0, 4).map((dish, idx) => (
                  <div
                    key={dish.id}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/60"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                      <DishVisual item={dish} />
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-red-600 font-mono text-xs font-extrabold text-white shadow-xs">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="truncate font-display text-xs font-bold text-zinc-900">
                        {dish.name}
                      </div>
                      <div className="mt-1 font-mono text-xs font-extrabold text-red-600 tabular-nums">
                        {dish.price} ج.م
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 cols */}
          <div className="space-y-6 xl:col-span-4">
            {/* Dark DOKO Restaurant Promo Card */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0B0B0D] p-5 text-white shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DokoLogo size="sm" />
                  <h4 className="mt-3 font-display text-lg font-extrabold text-white">
                    طعام شهي طازج دائماً
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400">Good Food .. Good Mood</p>
                  <button
                    type="button"
                    onClick={() => setViewMode('website')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                  >
                    <span>عرض الموقع</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-800">
                  <img
                    src="/images/dish_signature_burger_1795810517694.jpg"
                    alt="Doko Burger"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions 2x2 */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="font-display text-base font-bold text-zinc-900">إجراءات سريعة</h3>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs font-bold text-zinc-800 hover:border-red-300 hover:bg-red-50/40 cursor-pointer"
                >
                  <Users className="h-5 w-5 text-red-600" />
                  <span>تبديل الصلاحية</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (lowStockItems[0]) {
                      adjustInventory(lowStockItems[0].id, 10, 'توريد سريع من لوحة المدير');
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs font-bold text-zinc-800 hover:border-red-300 hover:bg-red-50/40 cursor-pointer"
                >
                  <Package className="h-5 w-5 text-red-600" />
                  <span>{lowStockItems[0] ? 'توريد عاجل +10' : 'المخزون مستقر'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('website')}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs font-bold text-zinc-800 hover:border-red-300 hover:bg-red-50/40 cursor-pointer"
                >
                  <ClipboardList className="h-5 w-5 text-red-600" />
                  <span>تجربة الطلب كعميل</span>
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs font-bold text-zinc-800 hover:border-red-300 hover:bg-red-50/40 cursor-pointer"
                >
                  <Download className="h-5 w-5 text-red-600" />
                  <span>تصدير التقرير CSV</span>
                </button>
              </div>
            </div>

            {/* Recharts Channel PieChart */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-zinc-900">توزيع قنوات الطلب</h3>
                <span className="font-mono text-xs font-bold text-red-600 tabular-nums">
                  دليفري {onlinePct}٪
                </span>
              </div>
              <div className="mt-2 h-44 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={66}
                      paddingAngle={3}
                    >
                      {channelData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                {channelData.map((c, idx) => (
                  <div key={c.name} className="flex items-center gap-1.5 font-semibold text-zinc-700">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. DETAILED ORDER REPORTS SECTION (Powered by Recharts)
  if (section === 'reports') {
    const topDishesChart = (reports?.topDishes || []).slice(0, 6).map((d) => ({
      name: d.name.length > 16 ? `${d.name.slice(0, 16)}…` : d.name,
      quantitySold: d.quantitySold,
      revenue: d.revenue,
    }));

    return (
      <div className="space-y-6">
        {/* Filter & Export Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl bg-zinc-100 p-1">
              {[
                { id: 'today' as const, label: 'اليوم' },
                { id: '7d' as const, label: 'آخر ٧ أيام' },
                { id: 'all' as const, label: 'كل السجلات' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRange(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    range === opt.id ? 'bg-red-600 text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex rounded-xl bg-zinc-100 p-1">
              {[
                { id: 'all' as const, label: 'جميع القنوات' },
                { id: 'dine_in' as const, label: 'صالة' },
                { id: 'takeaway' as const, label: 'تيك أواي' },
                { id: 'delivery' as const, label: 'دليفري' },
              ].map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChannel(ch.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    channel === ch.id ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 hover:border-red-300 hover:text-red-600 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>تصدير CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        {loadingReports && !reports ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            جاري تجميع تقارير الطلبات...
          </div>
        ) : reports ? (
          <>
            {/* Financial KPI Strip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'إجمالي الإيرادات', val: `${reports.grossRevenue.toLocaleString('ar-EG')} ج.م`, accent: true },
                { label: 'تكلفة المكونات', val: `${reports.totalCost.toLocaleString('ar-EG')} ج.م` },
                { label: 'صافي الربح التقديري', val: `${reports.netProfit.toLocaleString('ar-EG')} ج.م` },
                { label: 'متوسط قيمة الطلب', val: `${reports.avgOrderValue.toLocaleString('ar-EG')} ج.م` },
                { label: 'الطلبات المكتملة / الكلي', val: `${reports.completedOrders} / ${reports.totalOrders} (${reports.completionRate}٪)` },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="text-xs font-semibold text-zinc-500">{m.label}</div>
                  <div
                    className={`mt-2 font-display text-xl font-extrabold tabular-nums ${
                      m.accent ? 'text-red-600' : 'text-zinc-900'
                    }`}
                  >
                    {m.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Daily Sales + Top Selling Dishes BarChart */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="font-display text-base font-bold text-zinc-900">
                    تقرير المبيعات اليومية والأرباح (Recharts)
                  </h3>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </div>
                <div className="mt-4 h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reports.dailyTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dailyRevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC2626" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="dailyProfitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181B" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#18181B" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#71717A' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#71717A' }} width={48} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="الإيرادات (ج.م)"
                        stroke="#DC2626"
                        strokeWidth={2.5}
                        fill="url(#dailyRevGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="صافي الربح (ج.م)"
                        stroke="#18181B"
                        strokeWidth={2}
                        fill="url(#dailyProfitGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="font-display text-base font-bold text-zinc-900">
                    الأصناف الأكثر طلباً (الكميات المباعة)
                  </h3>
                  <BarChart3 className="h-4 w-4 text-red-600" />
                </div>
                <div className="mt-4 h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDishesChart} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#52525B' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#71717A' }} width={36} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="quantitySold"
                        name="الكمية المباعة"
                        fill="#DC2626"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Channel & Payment Breakdowns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-6">
                <h3 className="border-b border-zinc-100 pb-3 font-display text-base font-bold text-zinc-900">
                  المبيعات حسب قناة الطلب
                </h3>
                <div className="mt-4 space-y-3">
                  {reports.byChannel.map((ch) => {
                    const pct =
                      reports.grossRevenue > 0
                        ? Math.round((ch.revenue / reports.grossRevenue) * 100)
                        : 0;
                    return (
                      <div key={ch.type}>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-800">
                            {ch.label} ({ch.count} طلب)
                          </span>
                          <span className="font-mono text-zinc-900 tabular-nums">
                            {ch.revenue.toLocaleString('ar-EG')} ج.م · {pct}٪
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: pct / 100 }}
                            style={{ transformOrigin: 'right' }}
                            transition={{ duration: 0.5 }}
                            className="h-full w-full bg-red-600"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-6">
                <h3 className="border-b border-zinc-100 pb-3 font-display text-base font-bold text-zinc-900">
                  طرق التحصيل
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {reports.byPayment.map((pm) => (
                    <div
                      key={pm.method}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3"
                    >
                      <div className="text-xs text-zinc-500">{pm.label}</div>
                      <div className="mt-1 font-display text-sm font-bold text-zinc-900 tabular-nums">
                        {pm.revenue.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="text-[11px] text-zinc-500 tabular-nums">
                        {pm.count} عملية
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dish Profitability Table */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="border-b border-zinc-100 pb-3 font-display text-base font-bold text-zinc-900">
                تقرير ربحية الأطباق الأكثر مبيعاً (محسوب من تكلفة المكونات)
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                      <th className="py-2.5 font-semibold">الطبق</th>
                      <th className="py-2.5 font-semibold">الفئة</th>
                      <th className="py-2.5 font-semibold">الكمية المباعة</th>
                      <th className="py-2.5 font-semibold">الإيراد</th>
                      <th className="py-2.5 font-semibold">التكلفة</th>
                      <th className="py-2.5 font-semibold">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reports.topDishes.map((dish) => (
                      <tr key={dish.menuItemId} className="hover:bg-zinc-50">
                        <td className="py-3 font-bold text-zinc-900">{dish.name}</td>
                        <td className="py-3 text-xs text-zinc-500">{dish.category}</td>
                        <td className="py-3 font-mono tabular-nums">{dish.quantitySold}</td>
                        <td className="py-3 font-mono font-semibold tabular-nums">
                          {dish.revenue.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 font-mono text-zinc-500 tabular-nums">
                          {dish.cost.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-700 tabular-nums">
                          {dish.profit.toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Orders Ledger */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="border-b border-zinc-100 pb-3 font-display text-base font-bold text-zinc-900">
                سجل الطلبات التفصيلي ({reports.recentOrders.length})
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                      <th className="py-2.5 font-semibold">رقم الطلب</th>
                      <th className="py-2.5 font-semibold">العميل</th>
                      <th className="py-2.5 font-semibold">النوع</th>
                      <th className="py-2.5 font-semibold">الحالة</th>
                      <th className="py-2.5 font-semibold">بواسطة</th>
                      <th className="py-2.5 font-semibold">الدفع</th>
                      <th className="py-2.5 font-semibold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reports.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-50">
                        <td className="py-2.5 font-mono font-bold text-zinc-900 tabular-nums">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-2.5 font-medium text-zinc-800">{ord.customerName}</td>
                        <td className="py-2.5 text-zinc-600">{ORDER_TYPE_LABELS[ord.type]}</td>
                        <td className="py-2.5 font-semibold text-red-600">
                          {ORDER_STATUS_LABELS[ord.status]}
                        </td>
                        <td className="py-2.5 text-zinc-500">{ord.createdByName}</td>
                        <td className="py-2.5 text-zinc-600">
                          {PAYMENT_METHOD_LABELS[ord.paymentMethod]}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-zinc-900 tabular-nums">
                          {ord.total} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // 3. REAL-TIME INVENTORY MANAGEMENT
  if (section === 'inventory') {
    const displayedInv = invFilter === 'low' ? lowStockItems : state.inventory;

    const handleCreateInv = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newInvName.trim()) return;
      await addInventoryItem({
        name: newInvName.trim(),
        category: newInvCat,
        unit: newInvUnit.trim() || 'كجم',
        quantity: Number(newInvQty),
        minThreshold: Number(newInvMin),
        maxCapacity: Number(newInvMax),
        costPerUnit: Number(newInvCost),
      });
      setNewInvName('');
      setShowAddInv(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInvFilter('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                invFilter === 'all' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              جميع المكونات ({state.inventory.length})
            </button>
            <button
              type="button"
              onClick={() => setInvFilter('low')}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                invFilter === 'low' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              نواقص المخزون ({lowStockItems.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddInv((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة مادة مخزنية</span>
          </button>
        </div>

        {showAddInv && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateInv}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:grid-cols-3 lg:grid-cols-6"
          >
            <input
              type="text"
              required
              value={newInvName}
              onChange={(e) => setNewInvName(e.target.value)}
              placeholder="اسم المادة الخام"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={newInvCat}
              onChange={(e) => setNewInvCat(e.target.value as InventoryItem['category'])}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="لحوم">لحوم</option>
              <option value="مخبوزات">مخبوزات</option>
              <option value="أجبان وصلصات">أجبان وصلصات</option>
              <option value="خضروات وباستا">خضروات وباستا</option>
              <option value="مشروبات وحلويات">مشروبات وحلويات</option>
            </select>
            <input
              type="text"
              value={newInvUnit}
              onChange={(e) => setNewInvUnit(e.target.value)}
              placeholder="الوحدة (كجم/قطعة)"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={newInvQty}
              onChange={(e) => setNewInvQty(Number(e.target.value))}
              placeholder="الكمية"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm tabular-nums"
            />
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
            >
              حفظ بالمخزون
            </button>
          </motion.form>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedInv.map((item) => {
            const pct = Math.min(100, Math.round((item.quantity / item.maxCapacity) * 100));
            const isLow = item.quantity <= item.minThreshold;
            const isCritical = item.quantity <= item.minThreshold * 0.5;

            return (
              <motion.div
                layout
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-zinc-500">{item.category}</div>
                      <h4 className="mt-0.5 font-display text-base font-bold text-zinc-900">
                        {item.name}
                      </h4>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCritical
                          ? 'text-red-700'
                          : isLow
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {isCritical ? 'حرج' : isLow ? 'قارب على النفاد' : 'متوفر'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div className="font-display text-2xl font-extrabold text-zinc-900 tabular-nums">
                      {item.quantity}{' '}
                      <span className="text-xs font-medium text-zinc-500">{item.unit}</span>
                    </div>
                    <div className="text-xs text-zinc-500 tabular-nums">
                      الحد الأدنى: {item.minThreshold} · التكلفة: {item.costPerUnit} ج.م
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.35 }}
                      className={`h-full rounded-full ${isLow ? 'bg-red-600' : 'bg-zinc-900'}`}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() => adjustInventory(item.id, -1, 'تسوية هدر / سحب يدوي')}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer tabular-nums"
                  >
                    -1 {item.unit}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustInventory(item.id, 5, 'توريد إضافي للمطبخ')}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer tabular-nums"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustInventory(item.id, 15, 'توريد شحنة مخزن')}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer tabular-nums"
                    >
                      +15 توريد
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Stock Movements Ledger */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-red-600" />
              <h3 className="font-display text-base font-bold text-zinc-900">
                سجل حركات المخزون اللحظي (الخصم التلقائي والتوريد)
              </h3>
            </div>
            <RefreshCw className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-3 max-h-72 divide-y divide-zinc-100 overflow-y-auto">
            {state.stockMovements.slice(0, 20).map((mov) => (
              <div key={mov.id} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  {mov.delta < 0 ? (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  )}
                  <div>
                    <span className="font-bold text-zinc-900">{mov.itemName}</span>
                    <span className="mx-1.5 text-zinc-300">·</span>
                    <span className="text-zinc-500">{mov.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <span
                    className={
                      mov.delta < 0 ? 'font-bold text-red-600' : 'font-bold text-emerald-700'
                    }
                  >
                    {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                  </span>
                  <span className="text-zinc-500">الرصيد: {mov.balanceAfter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. MENU & RBAC MATRIX SECTION
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    await addMenuItem({
      name: newDishName.trim(),
      description: newDishDesc.trim() || 'طبق دوكو الخاص المحضر طازجاً.',
      category: newDishCat,
      price: Number(newDishPrice),
      prepMinutes: 15,
      calories: 550,
      available: true,
      recipe: [{ inventoryId: state.inventory[0]?.id || 'inv-wagyu', amount: 0.2 }],
    });
    setNewDishName('');
    setNewDishDesc('');
    setShowAddDish(false);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-zinc-900">
              إدارة المنيو والأسعار والتوفر
            </h3>
            <p className="text-xs text-zinc-500">
              أي تعديل هنا ينعكس فوراً في موقع العملاء وشاشة الكاشير والجارسون.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddDish((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة طبق جديد</span>
          </button>
        </div>

        {showAddDish && (
          <form
            onSubmit={handleAddDish}
            className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-red-200 bg-red-50/40 p-4 sm:grid-cols-4"
          >
            <input
              type="text"
              required
              value={newDishName}
              onChange={(e) => setNewDishName(e.target.value)}
              placeholder="اسم الطبق"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
            <select
              value={newDishCat}
              onChange={(e) => setNewDishCat(e.target.value as MenuItem['category'])}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="البرجر واللحوم">البرجر واللحوم</option>
              <option value="البيتزا">البيتزا</option>
              <option value="الباستا">الباستا</option>
              <option value="المقبلات">المقبلات</option>
              <option value="الحلويات">الحلويات</option>
              <option value="المشروبات">المشروبات</option>
            </select>
            <input
              type="number"
              min={10}
              value={newDishPrice}
              onChange={(e) => setNewDishPrice(Number(e.target.value))}
              placeholder="السعر (ج.م)"
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm tabular-nums"
            />
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
            >
              نشر في المنيو
            </button>
            <input
              type="text"
              value={newDishDesc}
              onChange={(e) => setNewDishDesc(e.target.value)}
              placeholder="وصف الطبق..."
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-4"
            />
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                <th className="py-2.5 font-semibold">الطبق</th>
                <th className="py-2.5 font-semibold">الفئة</th>
                <th className="py-2.5 font-semibold">السعر</th>
                <th className="py-2.5 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {state.menu.map((dish) => (
                <tr key={dish.id} className="hover:bg-zinc-50">
                  <td className="py-3 font-bold text-zinc-900">{dish.name}</td>
                  <td className="py-3 text-xs text-zinc-500">{dish.category}</td>
                  <td className="py-3 font-mono tabular-nums">
                    {editingPriceId === dish.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={priceDraft}
                          onChange={(e) => setPriceDraft(Number(e.target.value))}
                          className="w-20 rounded-lg border border-red-400 px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateMenuItem(dish.id, { price: priceDraft });
                            setEditingPriceId(null);
                          }}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white cursor-pointer"
                        >
                          حفظ
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPriceId(dish.id);
                          setPriceDraft(dish.price);
                        }}
                        className="font-bold text-zinc-900 hover:text-red-600 cursor-pointer"
                      >
                        {dish.price} ج.م
                      </button>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => updateMenuItem(dish.id, { available: !dish.available })}
                      className={`rounded-lg px-3 py-1 text-xs font-bold cursor-pointer ${
                        dish.available
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {dish.available ? 'متاح بالمنيو' : 'موقوف'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6-Role Permissions Overview */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-zinc-900">
              مصفوفة الصلاحيات الستة في نظام دوكو
            </h3>
            <p className="text-xs text-zinc-500">
              يمكن تجربة أي صلاحية مباشرة دون إجبار العميل على تسجيل الدخول.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
          >
            اختبار / تبديل الصلاحيات
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <div key={role.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-zinc-900">{role.label}</span>
                {role.pin && (
                  <span className="font-mono text-xs text-zinc-500 tabular-nums">
                    PIN: {role.pin}
                  </span>
                )}
              </div>
              <ul className="mt-2.5 space-y-1 text-xs text-zinc-600">
                {role.permissions.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
