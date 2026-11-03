import { useState } from 'react';
import toast from 'react-hot-toast';
import { verifyTicket, checkInTicket } from '../../services/adminService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDateTime, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Badge from '../../components/admin/Badge.jsx';

export default function AdminTicketCheckin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [recentChecks, setRecentChecks] = useState([]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Vui lòng nhập mã vé');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyTicket(cleanCode);
      setTicket(data);
    } catch (err) {
      setTicket(null);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      const updated = await checkInTicket(ticket.booking_code);
      setTicket(updated);
      toast.success(`Đã soát vé thành công: ${updated.booking_code}`);
      setRecentChecks((prev) => [
        {
          code: updated.booking_code,
          movie: updated.movie?.title,
          seats: updated.seats?.map((s) => s.label).join(', '),
          cinema: updated.cinema?.name,
          time: new Date().toLocaleTimeString('vi-VN'),
        },
        ...prev.slice(0, 9),
      ]);
      setCode('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soát vé & Check-in tại quầy"
        subtitle="Tra cứu mã đặt vé (hoặc quét mã QR trên vé khách hàng) để xác nhận vào phòng chiếu"
      />

      {/* Thanh nhập / Quét mã vé */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c101b]/90 p-5 backdrop-blur-xl shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🎟️</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã vé (VD: MV2A7X8K...)"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-3 pl-12 pr-4 text-sm font-mono font-semibold tracking-wider text-white placeholder-slate-500 uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-600 hover:bg-brand-500 px-6 py-3 font-semibold text-white text-sm transition shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Đang tra cứu...</span>
              </>
            ) : (
              <>
                <span>Tra cứu vé</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Thẻ hiển thị thông tin vé chi tiết */}
      {ticket && (
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b]/90 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster phim */}
            <div className="w-full md:w-44 shrink-0">
              <div className="aspect-2/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                {ticket.movie?.poster_url ? (
                  <img
                    src={ticket.movie.poster_url}
                    alt={ticket.movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                )}
              </div>
            </div>

            {/* Chi tiết suất chiếu & đơn vé */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{ticket.movie?.title}</h3>
                    {ticket.movie?.age_rating && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {ticket.movie.age_rating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Mã vé: <span className="font-mono font-bold text-brand-400">{ticket.booking_code}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {ticket.status === 'paid' ? (
                    <Badge cls="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs py-1 px-3">
                      Đã thanh toán
                    </Badge>
                  ) : ticket.status === 'pending' ? (
                    <Badge cls="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs py-1 px-3">
                      Chờ thanh toán
                    </Badge>
                  ) : (
                    <Badge cls="bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs py-1 px-3">
                      {ticket.status === 'cancelled' ? 'Đã hủy' : 'Đã hết hạn'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lưới thông tin rạp & ghế */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
                  <span className="text-slate-400 block mb-1">Cụm rạp:</span>
                  <span className="font-semibold text-slate-200">{ticket.cinema?.name}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{ticket.cinema?.address}</span>
                </div>

                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
                  <span className="text-slate-400 block mb-1">Phòng chiếu & Suất:</span>
                  <span className="font-semibold text-slate-200">
                    {ticket.room?.name} ({ticket.room?.room_type})
                  </span>
                  <span className="text-[11px] text-brand-400 font-medium block">
                    {formatDateTime(ticket.showtime?.start_time)}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
                  <span className="text-slate-400 block mb-1">Ghế ngồi đã đặt:</span>
                  <span className="font-bold text-amber-300 text-sm">
                    {ticket.seats?.map((s) => s.label).join(', ') || '—'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {ticket.seats?.length || 0} ghế · Tổng: {formatPrice(ticket.total_amount)}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
                  <span className="text-slate-400 block mb-1">Khách hàng:</span>
                  <span className="font-semibold text-slate-200">{ticket.user?.full_name || 'Khách vãng lai'}</span>
                  <span className="text-[11px] text-slate-400 block">{ticket.user?.phone || ticket.user?.email || '—'}</span>
                </div>

                {ticket.combos?.length > 0 && (
                  <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 sm:col-span-2">
                    <span className="text-slate-400 block mb-1">Combo bắp nước:</span>
                    <span className="font-medium text-slate-200">
                      {ticket.combos.map((c) => `${c.quantity}x ${c.name}`).join(' | ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Trạng thái Soát vé & Nút Check-in */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                {ticket.checked_in_at ? (
                  <div className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300">
                    <span className="text-xl">⚠️</span>
                    <div className="text-xs">
                      <p className="font-bold text-amber-200">VÉ NÀY ĐÃ ĐƯỢC SOÁT VÀO RẠP</p>
                      <p className="text-amber-400/80 mt-0.5">
                        Thời điểm: {formatDateTime(ticket.checked_in_at)} · Nhân viên soát:{' '}
                        <b>{ticket.checked_in_by_name || 'Nhân viên'}</b>
                      </p>
                    </div>
                  </div>
                ) : ticket.status === 'paid' ? (
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-semibold">Vé hợp lệ · Sẵn sàng vào phòng chiếu</span>
                    </div>
                    <button
                      onClick={handleCheckIn}
                      disabled={submitting}
                      className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-2.5 font-bold text-white text-sm transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Đang xác nhận...' : '✅ Xác nhận vào rạp (Check-in)'}
                    </button>
                  </div>
                ) : (
                  <div className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                    ⛔ Không thể soát vé: Vé chưa được thanh toán thành công (Trạng thái: {ticket.status}).
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử soát vé ca hiện tại */}
      {recentChecks.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b]/90 p-5 backdrop-blur-xl shadow-xl">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📋</span> Vé vừa soát trong phiên làm việc
          </h4>
          <div className="divide-y divide-slate-800 text-xs">
            {recentChecks.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-brand-400">{item.code}</span>
                  <span className="text-slate-300 font-medium">{item.movie}</span>
                  <span className="text-amber-300 font-semibold">({item.seats})</span>
                </div>
                <div className="text-right text-slate-500 shrink-0">
                  <span>{item.cinema}</span> · <span className="text-emerald-400 font-medium">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
