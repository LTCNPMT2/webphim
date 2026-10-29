import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useFetch } from '../hooks/useFetch.js';
import { getMyBookings } from '../services/bookingService.js';
import { assetUrl, formatDateTime, formatPrice } from '../utils/format.js';
import BookingStatusBadge from '../components/booking/BookingStatusBadge.jsx';
import BookingDetailModal from '../components/booking/BookingDetailModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Button, { buttonClass } from '../components/ui/Button.jsx';

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ thanh toán' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'cancelled', label: 'Đã hủy' },
  { key: 'expired', label: 'Hết hạn' },
];

function BookingItem({ b, onDetail }) {
  return (
    <article className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">
        {b.poster_url && <img src={assetUrl(b.poster_url)} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="truncate font-bold">{b.movie_title}</h2>
          <BookingStatusBadge status={b.status} />
        </div>
        <p className="mt-1 text-sm text-slate-400">{b.cinema_name} · {b.room_name}</p>
        <p className="text-sm text-slate-300">{formatDateTime(b.start_time)}</p>
        <p className="mt-1 text-sm">Ghế: <b>{b.seat_labels || '—'}</b></p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Mã: <span className="font-mono">{b.booking_code}</span> · <span className="font-semibold text-brand-400">{formatPrice(b.total_amount)}</span></p>
          <div className="flex gap-2">
            {b.status === 'pending' && <Link to={`/checkout/${b.id}`} className={buttonClass('primary', 'sm')}>Thanh toán</Link>}
            <Button variant="outline" size="sm" onClick={() => onDetail(b.id)}>Chi tiết</Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);

  const list = useFetch(() => getMyBookings({ status: status || undefined, page, limit: 5 }), [status, page]);

  // Đọc danh sách vé thanh toán MoMo vừa đặt (RÀNG BUỘC THEO TÀI KHOẢN ĐANG ĐĂNG NHẬP)
  const localTickets = useMemo(() => {
    if (!user) return [];
    try {
      const tickets = JSON.parse(localStorage.getItem('momo_paid_tickets') || '[]');
      const userTickets = tickets.filter((t) => {
        const ticketUserId = t.user_id || t.user?.id;
        const ticketEmail = (t.user_email || t.user?.email || '').toLowerCase().trim();
        const currentEmail = (user.email || '').toLowerCase().trim();
        if (ticketUserId && String(ticketUserId) === String(user.id)) return true;
        if (ticketEmail && currentEmail && ticketEmail === currentEmail) return true;
        return false;
      });
      if (!status || status === 'paid') return userTickets;
      return [];
    } catch {
      return [];
    }
  }, [user, status]);

  const allItems = useMemo(() => {
    const apiItems = list.data?.items || [];
    const filteredLocal = localTickets.filter(
      (lt) => !apiItems.some((ai) => String(ai.id) === String(lt.id) || ai.booking_code === lt.booking_code)
    );
    return [...filteredLocal, ...apiItems];
  }, [list.data?.items, localTickets]);

  const changeTab = (key) => { setStatus(key); setPage(1); };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Vé của tôi</h1>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={status === t.key} onClick={() => changeTab(t.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              status === t.key ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {list.error && !list.data && allItems.length === 0 ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data && allItems.length === 0 ? (
          <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
        ) : allItems.length === 0 ? (
          <EmptyState icon="🎟️" title="Chưa có vé nào" description={status ? 'Không có đơn nào ở trạng thái này.' : 'Bạn chưa đặt vé nào. Chọn một bộ phim để bắt đầu nhé!'}>
            <Link to="/movies" className={buttonClass()}>Xem phim đang chiếu</Link>
          </EmptyState>
        ) : (
          <div className={`space-y-4 transition-opacity ${list.loading ? 'opacity-50' : ''}`}>
            {allItems.map((b) => <BookingItem key={b.id} b={b} onDetail={setDetailId} />)}
          </div>
        )}
      </div>

      {list.data && <Pagination page={list.data.pagination.page} totalPages={list.data.pagination.totalPages} onChange={setPage} />}

      {detailId && <BookingDetailModal bookingId={detailId} onClose={() => setDetailId(null)} onChanged={list.reload} />}
    </div>
  );
}
