import { useMemo } from 'react';
import { formatPrice } from '../../utils/format.js';
import { SEAT_TYPE_LABELS } from '../../utils/constants.js';
import { groupByRow, seatLabel } from '../../utils/booking.js';

// Màu theo trạng thái / loại ghế
function seatClass(seat, selected) {
  if (selected) return 'border-brand-400 bg-brand-600 text-white';
  if (seat.status === 'booked') return 'cursor-not-allowed border-slate-800 bg-slate-800 text-slate-600 line-through';
  if (seat.status === 'holding') return 'cursor-not-allowed border-yellow-700/50 bg-yellow-900/40 text-yellow-700';
  if (seat.seat_type === 'vip') return 'border-amber-500/70 bg-amber-900/30 text-amber-200 hover:bg-amber-700/40';
  if (seat.seat_type === 'couple') return 'border-pink-500/70 bg-pink-900/30 text-pink-200 hover:bg-pink-700/40';
  return 'border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600';
}

const STATUS_TEXT = { booked: 'đã đặt', holding: 'đang được giữ', available: 'còn trống' };

function Legend() {
  const items = [
    ['Trống', 'border-slate-600 bg-slate-700'],
    ['Đang chọn', 'border-brand-400 bg-brand-600'],
    ['Đã đặt', 'border-slate-800 bg-slate-800'],
    ['Đang được giữ', 'border-yellow-700/50 bg-yellow-900/40'],
    ['VIP', 'border-amber-500/70 bg-amber-900/30'],
    ['Ghế đôi', 'border-pink-500/70 bg-pink-900/30'],
  ];
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
      {items.map(([label, cls]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className={`h-4 w-4 rounded border ${cls}`} /> {label}
        </li>
      ))}
    </ul>
  );
}

// seats: danh sách ghế từ API; selectedIds: mảng id đang chọn; onToggle(seat); disabled: khóa toàn bộ (vd suất đã bắt đầu)
export default function SeatMap({ seats, selectedIds, onToggle, disabled = false }) {
  const rows = useMemo(() => groupByRow(seats), [seats]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max min-w-full px-2">
          {/* Màn hình */}
          <div className="mx-auto h-2 w-3/4 rounded-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          <p className="mb-6 mt-1 text-center text-xs tracking-[0.3em] text-slate-500">MÀN HÌNH</p>

          <div className="space-y-2">
            {rows.map(([label, list]) => (
              <div key={label} className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="w-5 text-center text-xs font-semibold text-slate-500">{label}</span>
                {list.map((seat) => {
                  const isSelected = selected.has(seat.id);
                  const clickable = !disabled && seat.status === 'available';
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => clickable && onToggle(seat)}
                      disabled={!clickable && !isSelected}
                      aria-pressed={isSelected}
                      aria-label={`Ghế ${seatLabel(seat)}, ${SEAT_TYPE_LABELS[seat.seat_type]}, ${formatPrice(seat.price)}, ${isSelected ? 'đang chọn' : STATUS_TEXT[seat.status]}`}
                      title={`${seatLabel(seat)} · ${SEAT_TYPE_LABELS[seat.seat_type]} · ${formatPrice(seat.price)}`}
                      className={`h-8 shrink-0 rounded-md border text-[11px] font-semibold transition sm:h-9 ${
                        seat.seat_type === 'couple' ? 'w-[4.75rem] sm:w-[5.25rem]' : 'w-8 sm:w-9'
                      } ${seatClass(seat, isSelected)}`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
                <span className="w-5 text-center text-xs font-semibold text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Legend />
    </div>
  );
}
