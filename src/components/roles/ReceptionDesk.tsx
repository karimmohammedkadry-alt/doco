import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarPlus, Check, ConciergeBell, UserCheck, XCircle } from 'lucide-react';
import { useDoko } from '../../context/DokoContext';
import { RESERVATION_STATUS_LABELS, TABLE_STATUS_LABELS } from '../../types/doko';

export const ReceptionDesk: React.FC = () => {
  const { state, createReservation, updateReservation } = useDoko();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('20:30');
  const [tableNumber, setTableNumber] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  if (!state) return null;

  const availableTables = state.tables.filter((t) => t.status === 'available');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    await createReservation({
      customerName: name.trim(),
      phone: phone.trim(),
      partySize,
      date,
      time,
      tableNumber: tableNumber ? Number(tableNumber) : undefined,
      notes: notes.trim() || undefined,
    });
    setName('');
    setPhone('');
    setNotes('');
    setTableNumber('');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* New Walk-in / Phone Booking Form */}
      <div className="lg:col-span-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <CalendarPlus className="h-5 w-5 text-red-600" />
            <h3 className="font-display text-base font-bold text-zinc-900">
              تسجيل حجز جديد (الاستقبال)
            </h3>
          </div>

          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الضيف"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الهاتف"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} أفراد
                  </option>
                ))}
              </select>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : '')}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">تعيين طاولة لاحقاً</option>
                {availableTables.map((t) => (
                  <option key={t.id} value={t.number}>
                    طاولة {t.number} ({t.capacity} أفراد)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات الضيف..."
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 cursor-pointer"
            >
              تأكيد الحجز
            </button>
          </form>

          {/* Quick Live Table Capacity */}
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <div className="text-xs font-bold text-zinc-700">حالة الطاولات الآن:</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {state.tables.map((tbl) => (
                <div
                  key={tbl.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs"
                >
                  <span className="font-bold tabular-nums">طاولة {tbl.number}</span>
                  <span
                    className={
                      tbl.status === 'available' ? 'font-semibold text-emerald-700' : 'text-red-600'
                    }
                  >
                    {TABLE_STATUS_LABELS[tbl.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Queue */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <ConciergeBell className="h-5 w-5 text-red-600" />
              <h3 className="font-display text-base font-bold text-zinc-900">
                قائمة الحجوزات والانتظار ({state.reservations.length})
              </h3>
            </div>
            <span className="text-xs text-zinc-500">تحديث لحظي من الموقع</span>
          </div>

          <div className="mt-4 space-y-3">
            {state.reservations.map((res) => (
              <motion.div
                layout
                key={res.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-zinc-900">
                      {res.customerName}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span className="font-mono text-xs text-zinc-600 tabular-nums">{res.phone}</span>
                    <span className="text-zinc-300">·</span>
                    <span
                      className={`text-xs font-bold ${
                        res.status === 'seated'
                          ? 'text-emerald-700'
                          : res.status === 'cancelled'
                          ? 'text-zinc-400'
                          : 'text-red-600'
                      }`}
                    >
                      {RESERVATION_STATUS_LABELS[res.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 tabular-nums">
                    {res.partySize} أفراد · {res.date} الساعة {res.time}
                    {res.tableNumber ? ` · طاولة ${res.tableNumber}` : ''}
                  </div>
                  {res.notes && <div className="mt-1 text-xs text-zinc-600">{res.notes}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {res.status !== 'cancelled' && res.status !== 'seated' && (
                    <select
                      value={res.tableNumber ?? ''}
                      onChange={(e) =>
                        updateReservation(res.id, {
                          tableNumber: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="">اختر طاولة...</option>
                      {state.tables.map((t) => (
                        <option key={t.id} value={t.number}>
                          طاولة {t.number} ({TABLE_STATUS_LABELS[t.status]})
                        </option>
                      ))}
                    </select>
                  )}

                  {res.status === 'waiting' && (
                    <button
                      type="button"
                      onClick={() => updateReservation(res.id, { status: 'confirmed' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>تأكيد</span>
                    </button>
                  )}

                  {(res.status === 'confirmed' || res.status === 'waiting') && (
                    <button
                      type="button"
                      onClick={() =>
                        updateReservation(res.id, {
                          status: 'seated',
                          tableNumber: res.tableNumber || availableTables[0]?.number,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>تسكين الضيف</span>
                    </button>
                  )}

                  {res.status !== 'cancelled' && res.status !== 'seated' && (
                    <button
                      type="button"
                      onClick={() => updateReservation(res.id, { status: 'cancelled' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>إلغاء</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
