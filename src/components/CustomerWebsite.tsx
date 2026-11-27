import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChefHat,
  Clock,
  Eye,
  Headphones,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Utensils,
} from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  TABLE_STATUS_LABELS,
  type MenuItem,
  type OrderStatus,
} from '../types/doko';
import { DishVisual } from './DishVisual';
import { DokoLogo } from './DokoLogo';
import { DishDetailPage } from './DishDetailPage';
import { OrderDetailPage } from './OrderDetailPage';

const CATEGORIES = [
  'الكل',
  'البرجر واللحوم',
  'البيتزا',
  'الباستا',
  'المقبلات',
  'الحلويات',
  'المشروبات',
] as const;

const TRACKER_STEPS: { status: OrderStatus; label: string; sub: string }[] = [
  { status: 'pending', label: 'المطبخ استلم الطلب', sub: 'تم خصم المكونات' },
  { status: 'preparing', label: 'جاري التحضير', sub: 'الشيف يجهز أطباقك' },
  { status: 'ready', label: 'جاهز للتقديم', sub: 'خرج من المطبخ' },
  { status: 'completed', label: 'تم التقديم / مكتمل', sub: 'بالهناء والشفاء' },
];

export const CustomerWebsite: React.FC = () => {
  const {
    state,
    cart,
    addToCart,
    updateCartQty,
    setCartOpen,
    setAuthModalOpen,
    createReservation,
    lastPlacedOrderId,
    preferredOrderType,
    setPreferredOrderType,
    preferredTableNumber,
    setPreferredTableNumber,
    selectedDishDetail,
    setSelectedDishDetail,
    selectedOrderDetailId,
    setSelectedOrderDetailId,
  } = useDoko();

  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImgError, setHeroImgError] = useState(false);

  // Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 28, restDelta: 0.001 });

  // Reservation form state
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resGuests, setResGuests] = useState(2);
  const [resDate, setResDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [resTime, setResTime] = useState('20:00');
  const [resNotes, setResNotes] = useState('');
  const [resSubmitted, setResSubmitted] = useState(false);

  // Order tracker query
  const [lookupOrderNum, setLookupOrderNum] = useState('');

  const menuItems = state?.menu || [];
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'الكل' || item.category === selectedCategory;
      const q = searchQuery.trim();
      const matchSearch =
        !q ||
        item.name.includes(q) ||
        item.description.includes(q) ||
        item.category.includes(q);
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const menuGroups = useMemo(() => {
    const cats = [
      'البرجر واللحوم',
      'البيتزا',
      'الباستا',
      'المقبلات',
      'الحلويات',
      'المشروبات',
    ] as const;
    return cats
      .map((cat) => ({
        category: cat,
        items: menuItems.filter((m) => m.category === cat),
      }))
      .filter((g) => g.items.length > 0);
  }, [menuItems]);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);

  const activeRecentOrders = useMemo(() => {
    if (!state) return [];
    return state.orders
      .filter((o) => o.status !== 'cancelled')
      .slice(0, 4);
  }, [state]);

  const trackedOrder = useMemo(() => {
    if (!state) return null;
    if (lookupOrderNum.trim()) {
      const num = Number(lookupOrderNum.replace('#', '').trim());
      return state.orders.find((o) => o.orderNumber === num) || null;
    }
    if (lastPlacedOrderId) {
      const found = state.orders.find((o) => o.id === lastPlacedOrderId);
      if (found) return found;
    }
    return state.orders[0] || null;
  }, [state, lookupOrderNum, lastPlacedOrderId]);

  // Dedicated Dish or Order Detail View Routing
  if (selectedDishDetail) {
    return <DishDetailPage />;
  }
  if (selectedOrderDetailId) {
    return <OrderDetailPage />;
  }

  const getCartQuantity = (dish: MenuItem) =>
    cart.find((c) => c.menuItem.id === dish.id)?.quantity || 0;

  const availableTablesCount =
    state?.tables.filter((t) => t.status === 'available').length ?? 0;

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim() || !resPhone.trim()) return;
    const created = await createReservation({
      customerName: resName.trim(),
      phone: resPhone.trim(),
      partySize: resGuests,
      date: resDate,
      time: resTime,
      notes: resNotes.trim() || undefined,
    });
    if (created) {
      setResSubmitted(true);
      setResName('');
      setResPhone('');
      setResNotes('');
    }
  };

  const stepIndexForOrder = (status: OrderStatus) => {
    if (status === 'served') return 2;
    const idx = TRACKER_STEPS.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <main id="top" className="relative bg-white text-zinc-900">
      {/* Top Scroll Progress Indicator */}
      <motion.div
        style={{ scaleX, transformOrigin: 'right' }}
        className="fixed top-16 left-0 right-0 z-40 h-1 bg-gradient-to-l from-red-500 via-red-600 to-rose-700"
      />

      {/* DARK OBSIDIAN HERO BANNER */}
      <section id="hero" className="relative overflow-hidden bg-[#0B0B0D] text-white">
        {/* Subtle Animated Radial Glows */}
        <motion.div
          animate={{ opacity: [0.14, 0.24, 0.14], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-red-600 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Editorial Copy Column */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-center lg:col-span-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display text-sm font-bold tracking-wide text-red-500"
              >
                مرحباً بكم في DOKO Restaurant
              </motion.div>
              <h1 className="mt-2 font-display text-4xl font-black leading-[1.18] text-white sm:text-5xl lg:text-[3.4rem] [text-wrap:balance]">
                طعام شهي .. طازج دائماً
              </h1>
              <p className="mt-3 font-mono text-sm tracking-widest text-zinc-400">
                GOOD FOOD .. GOOD MOOD
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
                في مطعم دوكو اطلب طاولتك في الصالة، أو تيك أواي، أو دليفري وتتبع طلبك من المطبخ إلى طاولتك لحظة بلحظة بدون تسجيل دخول إجباري.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <motion.a
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  href="#menu"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-950/60 transition-colors hover:bg-red-700 whitespace-nowrap"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>اطلب الآن</span>
                  <ArrowLeft className="h-4 w-4" />
                </motion.a>
                <motion.a
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href="#tracker"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:border-red-500 hover:text-red-400 whitespace-nowrap"
                >
                  <ChefHat className="h-4 w-4 text-red-500" />
                  <span>تتبع طلبك</span>
                </motion.a>
              </div>
            </motion.div>

            {/* Visual Showcase Column with Floating Accent Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:col-span-6"
            >
              <div className="relative h-72 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:h-96 lg:h-full lg:min-h-[420px]">
                {!heroImgError ? (
                  <motion.img
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.6 }}
                    src="/src/assets/images/hero_doko_feast_1795810517508.jpg"
                    alt="مائدة مطعم دوكو المميزة"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-8 text-center">
                    <DokoLogo size="lg" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-6">
                  <div className="text-xs font-semibold text-red-400">
                    شواء حي على الفحم · مشروبات مختصة · ربط مباشر بالمطبخ
                  </div>
                  <div className="mt-1 font-display text-lg font-bold text-white">
                    دوكو دبل سماش واغيو، بيتزا نابولي، وستيك ريب آي المعتق
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CRISP WHITE 4-COLUMN FEATURE STRIP (Scroll-Animated) */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            {
              icon: <Truck className="h-5 w-5 text-red-600" />,
              title: 'صالة · تيك أواي · دليفري',
              desc: 'اختر طاولتك بنفسك أو اطلب التوصيل السريع',
            },
            {
              icon: <Utensils className="h-5 w-5 text-red-600" />,
              title: 'مكونات طازجة دائماً',
              desc: 'تُخصم وتُراجع لحظياً من المخزون',
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-red-600" />,
              title: 'دفع آمن ١٠٠٪',
              desc: 'كاش، بطاقة بنكية، أو محفظة إلكترونية',
            },
            {
              icon: <Headphones className="h-5 w-5 text-red-600" />,
              title: 'تتبع من المطبخ للطاولة',
              desc: 'متابعة حية لكل طبق يجهزه الشيف',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -3 }}
              className="flex items-center gap-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50">
                {item.icon}
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE DINING MODE & TABLE SELECTOR STRIP */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="text-xs font-bold text-red-600">تخصيص تجربة الطلب</div>
                <h2 className="font-display text-lg font-extrabold text-zinc-900">
                  كيف تفضل استلام طلبك اليوم؟
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-100 p-1.5">
                {[
                  { id: 'dine_in' as const, label: 'صالة (اختيار ترابيزة)' },
                  { id: 'takeaway' as const, label: 'تيك أواي' },
                  { id: 'delivery' as const, label: 'دليفري للمنزل' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredOrderType(opt.id)}
                    className={`relative rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      preferredOrderType === opt.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {preferredOrderType === opt.id && (
                      <motion.span
                        layoutId="orderModeSelector"
                        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        className="absolute inset-0 rounded-lg bg-red-600"
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Table Picker when Dine-In is chosen */}
            <AnimatePresence>
              {preferredOrderType === 'dine_in' && state && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 border-t border-zinc-100 pt-4">
                    <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-zinc-600">
                      <span>اختر رقم الترابيزة لربط طلبك بها مباشرة:</span>
                      <span className="font-bold text-red-600">
                        المختارة حالياً: طاولة {preferredTableNumber}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
                      {state.tables.map((tbl) => {
                        const selected = preferredTableNumber === tbl.number;
                        const isAvail = tbl.status === 'available';
                        return (
                          <motion.button
                            key={tbl.id}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={() => setPreferredTableNumber(tbl.number)}
                            className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                              selected
                                ? 'border-red-600 bg-red-600 text-white shadow-sm'
                                : isAvail
                                ? 'border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-red-400'
                                : 'border-zinc-200 bg-zinc-100/70 text-zinc-500'
                            }`}
                          >
                            <div className="font-display text-sm font-black tabular-nums">
                              طاولة {tbl.number}
                            </div>
                            <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px]">
                              <Users className="h-3 w-3" />
                              <span>{tbl.capacity}</span>
                              <span>·</span>
                              <span>{tbl.zone.split(' ')[0]}</span>
                            </div>
                            <div
                              className={`mt-1 text-[10px] font-bold ${
                                selected
                                  ? 'text-red-100'
                                  : isAvail
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {TABLE_STATUS_LABELS[tbl.status]}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="bg-[#F8F9FA] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-6 md:flex-row md:items-end"
          >
            <div>
              <div className="text-xs font-bold text-red-600">مأكولات ومشروبات مختارة</div>
              <h2 className="mt-1 font-display text-3xl font-black text-zinc-900">
                منيو مطعم دوكو الكامل
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                اضغط على أي طبق أو مشروب لعرض صفحة التفاصيل وتخصيص طلبك، أو أضفه مباشرة للسلة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن طعام أو مشروب..."
                  className="w-56 rounded-xl border border-zinc-300 bg-white py-2.5 pr-9 pl-3 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                />
              </div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>سلة الطلبات</span>
                <span className="rounded-md bg-white/20 px-1.5 py-0.5 font-mono text-xs tabular-nums">
                  {cartCount}
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Animated Category Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-white'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:border-red-300 hover:text-zinc-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="menuCategoryHighlight"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-red-600"
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Menu Grid with Scroll-Triggered Staggered Reveal */}
          {filteredMenu.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-12 text-center">
              <p className="font-display text-base font-bold text-zinc-900">
                لا توجد أصناف مطابقة لبحثك
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('الكل');
                  setSearchQuery('');
                }}
                className="mt-3 text-sm font-bold text-red-600 hover:underline cursor-pointer"
              >
                عرض جميع الأصناف
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredMenu.map((dish, idx) => {
                  const qty = getCartQuantity(dish);
                  return (
                    <motion.article
                      layout
                      key={dish.id}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.12 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(idx * 0.04, 0.25),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ y: -5 }}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-shadow hover:shadow-lg"
                    >
                      <div
                        onClick={() => setSelectedDishDetail(dish)}
                        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden border-b border-zinc-100 bg-zinc-50"
                      >
                        <DishVisual item={dish} />
                        {!dish.available && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <span className="rounded-lg bg-red-600 px-3 py-1.5 font-display text-xs font-bold text-white">
                              نفدت الكمية مؤقتاً
                            </span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <Eye className="h-3 w-3" />
                          <span>التفاصيل</span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="font-bold text-red-600">{dish.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{dish.prepMinutes} دقيقة</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{dish.calories} سعرة</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDishDetail(dish)}
                            className="mt-1.5 block text-right font-display text-lg font-bold text-zinc-900 transition-colors hover:text-red-600 cursor-pointer"
                          >
                            {dish.name}
                          </button>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                            {dish.description}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                          <div className="font-display text-lg font-extrabold text-zinc-900 tabular-nums">
                            {dish.price}{' '}
                            <span className="text-xs font-semibold text-zinc-500">ج.م</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDishDetail(dish)}
                              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:border-red-300 hover:text-red-600 cursor-pointer"
                            >
                              التفاصيل
                            </button>

                            {!dish.available ? (
                              <span className="text-xs font-semibold text-zinc-400">غير متاح</span>
                            ) : qty > 0 ? (
                              <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 p-1">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(dish.id, 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <span className="w-5 text-center text-sm font-bold text-red-700 tabular-nums">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(dish.id, -1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.08 }}
                                type="button"
                                onClick={() => addToCart(dish)}
                                aria-label={`إضافة ${dish.name}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 cursor-pointer"
                              >
                                <Plus className="h-5 w-5" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* DARK & RED INTERACTIVE MENU BOOKLET BOARD */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="mt-14 overflow-hidden rounded-3xl border border-zinc-800 bg-[#0B0B0D] p-6 text-white shadow-xl sm:p-10"
          >
            <div className="flex flex-col items-center justify-between gap-4 border-b border-zinc-800 pb-6 sm:flex-row">
              <div className="flex items-center gap-4">
                <DokoLogo size="sm" />
                <div>
                  <div className="font-display text-sm font-bold text-red-500">
                    قائمة الطعام والمشروبات الكاملة
                  </div>
                  <h3 className="font-display text-2xl font-black text-white">
                    قائمة دوكو السريعة — اضغط للإضافة
                  </h3>
                </div>
              </div>
              <div className="font-mono text-xs tracking-widest text-zinc-400">
                GOOD FOOD .. GOOD MOOD
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {menuGroups.map((group) => (
                <div key={group.category} className="space-y-3">
                  <h4 className="border-b border-red-600/40 pb-2 font-display text-base font-extrabold text-red-500">
                    {group.category}
                  </h4>
                  <div className="divide-y divide-zinc-800/80">
                    {group.items.map((dish) => (
                      <button
                        key={dish.id}
                        type="button"
                        disabled={!dish.available}
                        onClick={() => addToCart(dish)}
                        className="flex w-full items-center justify-between gap-3 py-2.5 text-right transition-colors hover:text-red-400 disabled:opacity-40 cursor-pointer"
                      >
                        <span className="text-sm font-semibold">{dish.name}</span>
                        <span className="font-mono text-sm font-bold text-red-500 tabular-nums shrink-0">
                          {dish.price} ج.م
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIVE ORDER TRACKER (KITCHEN TO TABLE) & TABLE RESERVATION SECTION */}
      <section className="border-t border-zinc-200 bg-white py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Live Order Tracker */}
          <motion.div
            id="tracker"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-red-600">
                    متابعة لحظية من المطبخ إلى الطاولة
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-black text-zinc-900">
                    تتبع طلبك الآن
                  </h2>
                </div>
                <input
                  type="text"
                  value={lookupOrderNum}
                  onChange={(e) => setLookupOrderNum(e.target.value)}
                  placeholder="رقم الطلب (مثال 1044)"
                  className="w-44 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Quick Switch Active Orders */}
              {activeRecentOrders.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {activeRecentOrders.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setLookupOrderNum(String(ord.orderNumber))}
                      className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-colors cursor-pointer ${
                        trackedOrder?.id === ord.id
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-red-300'
                      }`}
                    >
                      #{ord.orderNumber} · {ORDER_TYPE_LABELS[ord.type]}
                    </button>
                  ))}
                </div>
              )}

              {trackedOrder ? (
                <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <div>
                      <span className="font-mono text-sm font-bold text-zinc-900 tabular-nums">
                        طلب #{trackedOrder.orderNumber}
                      </span>
                      <span className="mx-2 text-zinc-300">·</span>
                      <span className="text-xs font-medium text-zinc-600">
                        {trackedOrder.customerName}
                      </span>
                      {trackedOrder.tableNumber && (
                        <>
                          <span className="mx-2 text-zinc-300">·</span>
                          <span className="text-xs font-bold text-red-600">
                            طاولة {trackedOrder.tableNumber}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-bold text-red-600">
                      {ORDER_STATUS_LABELS[trackedOrder.status]}
                    </span>
                  </div>

                  {/* Animated 4-step Progress */}
                  <div className="mt-5 grid grid-cols-4 gap-2">
                    {TRACKER_STEPS.map((step, i) => {
                      const currentIdx = stepIndexForOrder(trackedOrder.status);
                      const reached = trackedOrder.status !== 'cancelled' && i <= currentIdx;
                      return (
                        <div key={step.status} className="text-center">
                          <div className="relative h-2 overflow-hidden rounded-full bg-zinc-200">
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: reached ? 1 : 0 }}
                              transition={{ duration: 0.45 }}
                              style={{ transformOrigin: 'right' }}
                              className="h-full w-full bg-red-600"
                            />
                          </div>
                          <div
                            className={`mt-2 text-[11px] font-bold ${
                              reached ? 'text-zinc-900' : 'text-zinc-400'
                            }`}
                          >
                            {step.label}
                          </div>
                          <div className="text-[10px] text-zinc-400">{step.sub}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
                    {trackedOrder.items.map((it) => (
                      <div key={it.menuItemId} className="flex justify-between">
                        <span>
                          {it.quantity}× {it.name}
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            it.prepared ? 'text-emerald-700' : 'text-amber-600'
                          }`}
                        >
                          {it.prepared ? 'جاهز ✓' : 'قيد التحضير'}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                      <div className="font-display text-sm font-bold text-zinc-900">
                        الإجمالي:{' '}
                        <span className="text-red-600 tabular-nums">{trackedOrder.total} ج.م</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetailId(trackedOrder.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>صفحة تفاصيل الطلب</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                  لا يوجد طلب بهذا الرقم. يمكنك تجربة رقم 1044 أو 1043.
                </div>
              )}
            </div>
          </motion.div>

          {/* Table Reservation Form */}
          <motion.div
            id="reservations"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-red-600">
                    متاح الآن {availableTablesCount} طاولات شاغرة
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-black text-zinc-900">
                    احجز طاولتك في دوكو
                  </h2>
                </div>
                <CalendarCheck className="h-7 w-7 text-red-600" />
              </div>

              {resSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center"
                >
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                  <h3 className="mt-3 font-display text-lg font-bold text-zinc-900">
                    تم إرسال طلب الحجز إلى الريسبشن
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    يمكن لفريق الاستقبال تأكيد الحجز وتسكين الطاولة فوراً من لوحة الريسبشن.
                  </p>
                  <button
                    type="button"
                    onClick={() => setResSubmitted(false)}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                  >
                    حجز طاولة أخرى
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleReservation} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        required
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                        placeholder="أدخل اسمك"
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        required
                        value={resPhone}
                        onChange={(e) => setResPhone(e.target.value)}
                        placeholder="010xxxxxxxx"
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">
                        عدد الأفراد
                      </label>
                      <select
                        value={resGuests}
                        onChange={(e) => setResGuests(Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                          <option key={n} value={n}>
                            {n} أفراد
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">
                        التاريخ
                      </label>
                      <input
                        type="date"
                        required
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-700">
                        الموعد
                      </label>
                      <input
                        type="time"
                        required
                        value={resTime}
                        onChange={(e) => setResTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-700">
                      ملاحظات خاصة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={resNotes}
                      onChange={(e) => setResNotes(e.target.value)}
                      placeholder="طاولة بالتراس الخارجي، مناسبة خاصة..."
                      className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 cursor-pointer"
                  >
                    تأكيد طلب الحجز
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FLOATING CART SUMMARY BAR */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-lg sm:left-6 sm:right-auto"
          >
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between gap-6 rounded-2xl border border-red-700 bg-red-600 px-5 py-3 text-white shadow-xl transition-transform hover:scale-[1.01] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5" />
                <div className="text-right">
                  <div className="font-display text-sm font-bold">
                    إتمام الطلب ({cartCount} أصناف) · {ORDER_TYPE_LABELS[preferredOrderType]}
                  </div>
                </div>
              </div>
              <div className="font-display text-base font-extrabold tabular-nums">
                {cartTotal} ج.م
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DARK OBSIDIAN FOOTER */}
      <footer className="border-t border-zinc-800 bg-[#0B0B0D] py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <DokoLogo size="sm" />
            <div className="text-xs text-zinc-400">
              © {new Date().getFullYear()} DOKO Restaurant · Good Food .. Good Mood
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-zinc-300">
            <a href="#menu" className="hover:text-red-400">
              المنيو
            </a>
            <a href="#reservations" className="hover:text-red-400">
              الحجوزات
            </a>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="text-red-500 hover:underline cursor-pointer"
            >
              بوابة الإدارة وطاقم العمل
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
};
