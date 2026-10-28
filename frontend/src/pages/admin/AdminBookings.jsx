import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { getBooking } from '../../services/bookingService.js';
import { cancelBooking, getBookings } from '../../services/adminService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDateTime, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import BookingStatusBadge from '../../components/booking/BookingStatusBadge.jsx';
import TicketCard from '../../components/booking/TicketCard.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Button from '../../components/ui/Button.jsx';

const STATUS_OPTIONS = [['', 'Mọi trạng thái'], ['pending', 'Chờ thanh toán'], ['paid', 'Đã thanh toán'], ['cancelled', 'Đã hủy'], ['expired', 'Hết hạn']];

// Chi tiết 1 đơn: vé + thông tin khách + nút hủy của admin (không bị giới hạn giờ hủy)
function BookingModal({ row, onClose, onChanged }) {
  const { data: booking, error, reload } = useFetch(() => getBooking(row.id), [row.id]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelBooking(row.id);
      toast.success('Đã hủy đơn đặt vé');
      onChanged();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirming(false);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const cancellable = booking && (booking.status === 'paid' || booking.status === 'pending');

  return (
    <>
      <Modal open onClose={onClose} title={`Chi tiết đơn vé ${row.booking_code}`} maxWidth="max-w-2xl sm:max-w-3xl">
        <div className="max-h-[80vh] overflow-y-auto p-5 space-y-4">
          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Khách hàng</p>
            <p className="font-semibold">{row.full_name}</p>
            <p className="text-slate-400">{row.email}</p>
          </div>
          {error && !booking ? <ErrorState message={error} onRetry={reload} /> : !booking ? <Skeleton className="h-72" /> : (
            <>
              <TicketCard booking={booking} />
              {cancellable && (
                <div className="mt-4">
                  <Button variant="outline" onClick={() => setConfirming(true)}>Hủy đơn này</Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
      <ConfirmDialog open={confirming} title="Hủy đơn đặt vé" confirmLabel="Hủy đơn" busy={busy} onConfirm={handleCancel} onCancel={() => setConfirming(false)}>
        Hủy đơn <b>{row.booking_code}</b> của <b>{row.full_name}</b>?
        {booking?.status === 'paid' ? ' Vé đã thanh toán sẽ được hoàn tiền (giả lập) và ghế được trả lại.' : ' Ghế đang giữ sẽ được trả lại.'}
      </ConfirmDialog>
    </>
  );
}

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);

  useEffect(() => setPage(1), [status, dateFrom, dateTo, search]);

  const list = useFetch(
    () => getBookings({ status: status || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, search: search || undefined, page, limit: 10 }),
    [status, dateFrom, dateTo, search, page]
  );
  const rows = list.data?.items ?? null;
  const hasFilter = status || dateFrom || dateTo || searchInput;
  const dateError = dateFrom && dateTo && dateFrom > dateTo;

  const columns = [
    { key: 'code', header: 'Mã vé', render: (b) => <span className="font-mono font-semibold">{b.booking_code}</span> },
    { key: 'user', header: 'Khách hàng', render: (b) => <div><p>{b.full_name}</p><p className="text-xs text-slate-500">{b.email}</p></div> },
    { key: 'movie', header: 'Phim / Suất chiếu', render: (b) => (
      <div><p className="font-semibold">{b.movie_title}</p><p className="text-xs text-slate-500">{b.cinema_name} · {b.room_name}</p><p className="text-xs text-slate-500">{formatDateTime(b.start_time)}</p></div>) },
    { key: 'seats', header: 'Ghế', render: (b) => b.seat_labels || '—' },
    { key: 'total', header: 'Tổng tiền', render: (b) => formatPrice(b.total_amount) },
    { key: 'status', header: 'Trạng thái', render: (b) => <BookingStatusBadge status={b.status} /> },
    { key: 'created', header: 'Ngày đặt', render: (b) => <span className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(b.created_at)}</span> },
    { key: 'actions', header: '', className: 'text-right', render: (b) => <button onClick={() => setDetail(b)} className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-95 cursor-pointer">Chi tiết</button> },
  ];

  const field = 'rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition';

  return (
    <div>
      <PageHeader title="Quản lý đơn đặt vé" subtitle={list.data ? `${list.data.pagination.total} đơn` : ' '}>
        <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Mã vé, tên hoặc email khách..." aria-label="Tìm đơn" className={`${field} w-60`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái" className={field}>
          {STATUS_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">Từ <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} max={dateTo || undefined} className={field} /></label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">Đến <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={dateFrom || undefined} className={field} /></label>
        {hasFilter && <button onClick={() => { setStatus(''); setDateFrom(''); setDateTo(''); setSearchInput(''); }} className="text-xs font-medium text-slate-400 hover:text-rose-400 hover:underline">✕ Xóa lọc</button>}
      </PageHeader>

      {dateError && <p role="alert" className="mb-3 text-sm text-red-400">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p>}

      <AdminTable columns={columns} rows={dateError ? [] : rows} loading={list.loading} error={list.error} onRetry={list.reload} emptyText="Không có đơn đặt vé nào phù hợp" />
      {list.data && !dateError && <Pagination page={list.data.pagination.page} totalPages={list.data.pagination.totalPages} onChange={setPage} />}

      {detail && <BookingModal row={detail} onClose={() => setDetail(null)} onChanged={list.reload} />}
    </div>
  );
}
