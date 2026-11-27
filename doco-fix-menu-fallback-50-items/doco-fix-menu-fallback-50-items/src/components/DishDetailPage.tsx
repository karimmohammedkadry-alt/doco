import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Clock, Flame, Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { useDoko } from '../context/DokoContext';
import { DishVisual } from './DishVisual';

const QUICK_NOTES = [
  'بدون بصل',
  'صوص دوكو إكسترا',
  'مستوى طهي متوسط (Medium)',
  'حار إضافي',
  'بدون مخلل',
];

export const DishDetailPage: React.FC = () => {
  const { state, selectedDishDetail, setSelectedDishDetail, addToCart, setCartOpen } = useDoko();
  const [qty, setQty] = useState(1);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');

  if (!selectedDishDetail || !state) return null;

  const dish = state.menu.find((m) => m.id === selectedDishDetail.id) || selectedDishDetail;

  const toggleNote = (note: string) => {
    setSelectedNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const pairings = state.menu
    .filter((m) => m.id !== dish.id && (m.category === 'المشروبات' || m.category === 'المقبلات') && m.available)
    .slice(0, 3);

  const handleAdd = () => {
    const combinedNote = [...selectedNotes, customNote.trim()].filter(Boolean).join(' · ');
    addToCart(dish, qty, combinedNote || undefined);
    setSelectedDishDetail(null);
    setCartOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-[85vh] bg-zinc-50 py-8 sm:py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setSelectedDishDetail(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-xs transition-colors hover:border-red-500 hover:text-red-600 cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى المنيو</span>
        </button>

        <div className="mt-6 grid grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-12 lg:p-8">
          {/* Image Column */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45 }}
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50"
            >
              <DishVisual item={dish} />
            </motion.div>

            {/* Live Inventory Ingredients Transparency */}
            <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
                <span>المكونات الطازجة (تُخصم لحظياً عند الطلب)</span>
                <span className={dish.available ? 'text-emerald-700' : 'text-red-600'}>
                  {dish.available ? 'متاح للتحضير' : 'نفدت المكونات'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {dish.recipe.map((req) => {
                  const inv = state.inventory.find((i) => i.id === req.inventoryId);
                  if (!inv) return null;
                  return (
                    <div
                      key={req.inventoryId}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
                    >
                      <span className="font-semibold text-zinc-900">{inv.name}</span>
                      <span className="mx-1.5 text-zinc-300">·</span>
                      <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                        متبقي {inv.quantity} {inv.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Info & Customization Column */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500">
                <span className="text-red-600">{dish.category}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-red-600" />
                  {dish.prepMinutes} دقيقة
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Flame className="h-3.5 w-3.5 text-red-600" />
                  {dish.calories} سعرة حرارية
                </span>
              </div>

              <h1 className="mt-2 font-display text-3xl font-black text-zinc-900">
                {dish.name}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-zinc-600">
                {dish.description}
              </p>

              <div className="mt-5 font-display text-3xl font-black text-red-600 tabular-nums">
                {dish.price * qty}{' '}
                <span className="text-sm font-bold text-zinc-500">ج.م</span>
              </div>

              {/* Customizations */}
              <div className="mt-6 border-t border-zinc-100 pt-5">
                <div className="text-xs font-bold text-zinc-800">
                  تخصيص طلبك للمطبخ (اختياري)
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {QUICK_NOTES.map((note) => {
                    const active = selectedNotes.includes(note);
                    return (
                      <button
                        key={note}
                        type="button"
                        onClick={() => toggleNote(note)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        <span>{note}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="أضف أي ملاحظة خاصة للشيف..."
                  className="mt-3 w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Quantity & Add CTA */}
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-5">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5">
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-xs hover:bg-red-600 hover:text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-mono text-base font-extrabold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-xs hover:bg-zinc-200 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={!dish.available}
                onClick={handleAdd}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-red-900/15 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>إضافة إلى السلة · {dish.price * qty} ج.م</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Suggested Pairings */}
        {pairings.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 font-display text-lg font-bold text-zinc-900">
              <Sparkles className="h-5 w-5 text-red-600" />
              <span>مشروبات ومقبلات مقترحة مع هذا الطبق</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {pairings.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs"
                >
                  <div
                    onClick={() => setSelectedDishDetail(item)}
                    className="h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-zinc-50"
                  >
                    <DishVisual item={item} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDishDetail(item)}
                      className="truncate text-right font-display text-sm font-bold text-zinc-900 hover:text-red-600 cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <div className="mt-0.5 font-mono text-xs font-bold text-red-600 tabular-nums">
                      {item.price} ج.م
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
