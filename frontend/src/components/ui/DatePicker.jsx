import { useMemo } from 'react';
import { toDateKey } from '../../utils/format.js';

// Dải chọn ngày: hôm nay + (days - 1) ngày tiếp theo. value / onChange dùng dạng "YYYY-MM-DD".
export default function DatePicker({ value, onChange, days = 7 }) {
  const list = useMemo(
    () =>
      Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return { key: toDateKey(d), date: d, i };
      }),
    [days]
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Chọn ngày chiếu">
      {list.map(({ key, date, i }) => {
        const active = key === value;
        const weekday = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : date.toLocaleDateString('vi-VN', { weekday: 'short' });
        return (
          <button key={key} role="tab" aria-selected={active} onClick={() => onChange(key)}
            className={`flex min-w-20 shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition ${
              active ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-700 bg-slate-900 hover:border-slate-500'
            }`}>
            <span className="text-xs opacity-80">{weekday}</span>
            <span className="text-lg font-bold">{String(date.getDate()).padStart(2, '0')}/{String(date.getMonth() + 1).padStart(2, '0')}</span>
          </button>
        );
      })}
    </div>
  );
}
