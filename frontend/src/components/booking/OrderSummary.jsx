import { formatPrice } from '../../utils/format.js';
import { SEAT_TYPE_LABELS } from '../../utils/constants.js';

// Khung tóm tắt đơn hàng. children = nút hành động ở cuối (Tiếp tục / Thanh toán...)
// seatLines: [{ label, seat_type, price }]   comboLines: [{ name, quantity, total }]
export default function OrderSummary({ info, seatLines, comboLines = [], subtotal, discount = 0, promoCode, total, children }) {
  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {info && (
        <div className="border-b border-slate-800 pb-4">
          <h2 className="font-bold leading-snug">{info.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{info.cinema} · {info.room}</p>
          <p className="text-sm text-slate-400">{info.time}</p>
        </div>
      )}

      <div className="space-y-3 py-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Ghế đã chọn</p>
          {seatLines.length === 0 ? (
            <p className="mt-1 text-slate-500">Chưa chọn ghế nào</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {seatLines.map((s) => (
                <li key={s.label} className="flex justify-between">
                  <span>{s.label} <span className="text-xs text-slate-500">({SEAT_TYPE_LABELS[s.seat_type]})</span></span>
                  <span>{formatPrice(s.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {comboLines.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Bắp nước</p>
            <ul className="mt-1 space-y-1">
              {comboLines.map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span>{c.quantity} × {c.name}</span>
                  <span>{formatPrice(c.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-1.5 border-t border-slate-800 pt-4 text-sm">
        <div className="flex justify-between text-slate-400"><span>Tạm tính</span><span>{formatPrice(subtotal)}</span></div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Mã giảm giá {promoCode && <b>{promoCode}</b>}</span><span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex items-end justify-between pt-1">
          <span className="font-semibold">Tổng cộng</span>
          <span className="text-2xl font-extrabold text-brand-400">{formatPrice(total)}</span>
        </div>
      </div>

      {children && <div className="mt-5 space-y-2">{children}</div>}
    </aside>
  );
}
