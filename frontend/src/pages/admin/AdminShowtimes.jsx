import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { getMovies } from '../../services/catalogService.js';
import { createShowtime, deleteShowtime, getCinemas, getRooms, getShowtimes, updateShowtime } from '../../services/adminService.js';
import { toInputDateTime } from '../../utils/admin.js';
import { formatDateTime, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import Badge from '../../components/admin/Badge.jsx';
import FormField from '../../components/ui/FormField.jsx';
import FormSelect from '../../components/ui/FormSelect.jsx';
import Pagination from '../../components/ui/Pagination.jsx';

function ShowtimeForm({ showtime, movies, rooms, onClose, onSaved }) {
  // Suất đã có người đặt ghế: backend không cho đổi phim/phòng/giờ, chỉ đổi giá và trạng thái
  const locked = Boolean(showtime && showtime.booked_seats > 0);
  const form = useFormState({
    movie_id: showtime?.movie_id || '',
    room_id: showtime?.room_id || '',
    start_time: toInputDateTime(showtime?.start_time),
    base_price: showtime?.base_price ?? 90000,
    is_active: showtime ? Boolean(showtime.is_active) : true,
  });
  const { values: v, errors, change } = form;

  const validate = (x) => {
    const er = {};
    if (!x.movie_id) er.movie_id = 'Vui lòng chọn phim';
    if (!x.room_id) er.room_id = 'Vui lòng chọn phòng chiếu';
    if (!x.start_time) er.start_time = 'Vui lòng chọn giờ chiếu';
    const price = Number(x.base_price);
    if (!Number.isInteger(price) || price < 1000 || price > 10000000) er.base_price = 'Giá vé từ 1.000 đến 10.000.000';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit((x) => {
      const price = Number(x.base_price);
      if (!showtime) return createShowtime({ movie_id: Number(x.movie_id), room_id: Number(x.room_id), start_time: x.start_time, base_price: price });
      if (locked) return updateShowtime(showtime.id, { base_price: price, is_active: x.is_active });
      return updateShowtime(showtime.id, { movie_id: Number(x.movie_id), room_id: Number(x.room_id), start_time: x.start_time, base_price: price, is_active: x.is_active });
    }, validate);
    if (ok) { toast.success(showtime ? 'Đã cập nhật suất chiếu' : 'Đã thêm suất chiếu'); onSaved(); }
  };

  return (
    <FormModal title={showtime ? 'Sửa thông tin suất chiếu' : 'Khởi tạo suất chiếu mới'} onClose={onClose} onSubmit={handleSubmit} saving={form.saving}>
      {locked && (
        <div role="note" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center gap-2">
          <span>⚠️</span>
          <span>Suất này đã có {showtime.booked_seats} ghế được đặt nên hệ thống chỉ cho phép sửa giá vé và bật/tắt mở bán.</span>
        </div>
      )}
      <FormSelect label="Tác phẩm điện ảnh *" name="movie_id" value={v.movie_id} onChange={change} error={errors.movie_id} disabled={locked}>
        <option value="">-- Chọn phim --</option>
        {movies.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.duration_minutes} phút)</option>)}
      </FormSelect>
      <FormSelect label="Cụm rạp & Phòng chiếu *" name="room_id" value={v.room_id} onChange={change} error={errors.room_id} disabled={locked}>
        <option value="">-- Chọn phòng --</option>
        {rooms.map((r) => <option key={r.id} value={r.id}>{r.cinema_name} - {r.name} ({r.room_type}, {r.total_seats} ghế)</option>)}
      </FormSelect>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Giờ khởi chiếu *" name="start_time" type="datetime-local" value={v.start_time} onChange={change} error={errors.start_time} disabled={locked}
          hint="Giờ kết thúc tự tính = thời lượng phim + 15 phút dọn phòng" />
        <FormField label="Giá vé cơ bản (đ) *" name="base_price" type="number" min="1000" step="1000" value={v.base_price} onChange={change} error={errors.base_price}
          hint="Ghế VIP / ghế đôi cộng thêm phụ thu tương ứng" />
      </div>
      {showtime && (
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 cursor-pointer pt-1">
          <input type="checkbox" name="is_active" checked={v.is_active} onChange={change} className="accent-indigo-500 h-4 w-4 rounded" />
          <span>Mở bán vé cho suất chiếu này</span>
        </label>
      )}
    </FormModal>
  );
}

export default function AdminShowtimes() {
  const [movieId, setMovieId] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  useEffect(() => setPage(1), [movieId, cinemaId, date]);

  const movies = useFetch(() => getMovies({ limit: 50 }), []);
  const cinemas = useFetch(getCinemas, []);
  const rooms = useFetch(() => getRooms(), []);
  const list = useFetch(
    () => getShowtimes({ movie_id: movieId || undefined, cinema_id: cinemaId || undefined, date: date || undefined, page, limit: 10 }),
    [movieId, cinemaId, date, page]
  );
  const rows = list.data?.items ?? null;

  const del = useConfirmDelete(
    (s) => deleteShowtime(s.id),
    () => (rows?.length === 1 && page > 1 ? setPage(page - 1) : list.reload()),
    'Đã xóa suất chiếu'
  );

  const movieOptions = (movies.data?.items || []).filter((m) => m.status !== 'ended' || m.id === editing?.movie_id);
  const roomOptions = (rooms.data || []).filter((r) => r.is_active || r.id === editing?.room_id);

  const columns = [
    {
      key: 'movie',
      header: 'PHIM ĐIỆN ẢNH',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-indigo-500/10 border border-indigo-500/20 shadow-xs flex items-center justify-center text-xs text-indigo-400">
            🎬
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-100 block text-sm leading-tight truncate max-w-[200px] sm:max-w-xs">
              {s.movie_title}
            </span>
            <span className="text-[10px] font-mono tracking-wider text-slate-400 block mt-0.5">
              MÃ SUẤT: #{s.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'CỤM RẠP / PHÒNG',
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-200 text-xs sm:text-sm">{s.cinema_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-slate-400">{s.room_name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
              {s.room_type}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'LỊCH CHIẾU',
      render: (s) => (
        <div>
          <p className="font-bold text-slate-100 text-xs sm:text-sm font-mono tracking-tight">
            {formatDateTime(s.start_time)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            đến {formatDateTime(s.end_time).split(',')[0]}
          </p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'GIÁ VÉ',
      render: (s) => (
        <span className="font-mono font-bold text-slate-100 text-sm">
          {formatPrice(s.base_price)}
        </span>
      ),
    },
    {
      key: 'sold',
      header: 'TỈ LỆ ĐẶT',
      render: (s) => {
        const percent = Math.min(100, Math.round(((s.booked_seats || 0) / (s.total_seats || 1)) * 100));
        return (
          <div className="min-w-[100px]">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-bold text-slate-100">{s.booked_seats}</span>
              <span className="text-slate-400 text-[11px]">/{s.total_seats} ghế ({percent}%)</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      render: (s) =>
        new Date(s.end_time) < new Date() ? (
          <Badge cls="border-slate-800 bg-slate-900 text-slate-400">Đã chiếu</Badge>
        ) : s.is_active ? (
          <Badge cls="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            ● Đang mở bán
          </Badge>
        ) : (
          <Badge cls="border-rose-500/20 bg-rose-500/10 text-rose-400">
            ● Đã tắt
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      className: 'text-right',
      render: (s) => <RowActions onEdit={() => setEditing(s)} onDelete={() => del.ask(s)} />,
    },
  ];

  // Lớp CSS cho các bộ lọc hiện đại chuẩn Enterprise
  const selectCls =
    'rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer transition';

  return (
    <div className="space-y-6">
      
      {/* Tiêu đề & Thanh công cụ lọc */}
      <PageHeader title="Quản lý suất chiếu" subtitle={list.data ? `${list.data.pagination.total} suất chiếu được ghi nhận` : ' '}>
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Lọc theo phim */}
          <select value={movieId} onChange={(e) => setMovieId(e.target.value)} aria-label="Lọc theo phim" className={`${selectCls} max-w-44 truncate`}>
            <option value="">🎬 Mọi phim</option>
            {(movies.data?.items || []).map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                {m.title}
              </option>
            ))}
          </select>

          {/* Lọc theo rạp */}
          <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} aria-label="Lọc theo rạp" className={`${selectCls} max-w-44 truncate`}>
            <option value="">🏛️ Mọi rạp</option>
            {(cinemas.data || []).map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.name}
              </option>
            ))}
          </select>

          {/* Lọc theo ngày */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Lọc theo ngày"
            className={`${selectCls}`}
          />

          {/* Nút xóa lọc */}
          {(movieId || cinemaId || date) && (
            <button
              onClick={() => {
                setMovieId('');
                setCinemaId('');
                setDate('');
              }}
              className="text-xs font-medium text-slate-400 hover:text-rose-400 hover:underline px-2 py-1 transition cursor-pointer"
            >
              ✕ Xóa lọc
            </button>
          )}

          {/* Nút Khởi tạo suất chiếu mới */}
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-600/25 hover:from-indigo-600 hover:to-violet-700 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="text-sm font-bold leading-none">＋</span>
            <span>Thêm suất chiếu</span>
          </button>
        </div>
      </PageHeader>

      {/* Bảng dữ liệu suất chiếu */}
      <AdminTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        emptyText="Không tìm thấy suất chiếu nào phù hợp với bộ lọc"
      />

      {/* Phân trang */}
      {list.data && (
        <div className="pt-2">
          <Pagination page={list.data.pagination.page} totalPages={list.data.pagination.totalPages} onChange={setPage} />
        </div>
      )}

      {/* Modal form thêm / sửa suất */}
      {editing && (
        <ShowtimeForm
          showtime={editing === 'new' ? null : editing}
          movies={movieOptions}
          rooms={roomOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      )}

      {/* Dialog xác nhận xóa */}
      <ConfirmDialog open={!!del.target} title="Xóa suất chiếu" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa suất chiếu <b>{del.target?.movie_title}</b> lúc <b>{del.target && formatDateTime(del.target.start_time)}</b>?
        {del.target?.booked_seats > 0 && (
          <span className="text-amber-300 block mt-2">
            ⚠️ Suất này đã có {del.target.booked_seats} ghế được đặt nên hệ thống sẽ từ chối xóa, bạn có thể chỉnh sửa và tắt "Đang mở bán".
          </span>
        )}
      </ConfirmDialog>
    </div>
  );
}
