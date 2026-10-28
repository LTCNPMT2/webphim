import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { getCinemas, getShowtimes } from '../../services/catalogService.js';
import { formatPrice, formatTime, toDateKey } from '../../utils/format.js';
import DatePicker from '../ui/DatePicker.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';

// Chọn ngày + rạp -> danh sách suất chiếu của phim (nhóm theo rạp). Bấm giờ chiếu để sang trang chọn ghế.
export default function ShowtimePicker({ movieId }) {
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [cinemaId, setCinemaId] = useState('');

  const cinemas = useFetch(getCinemas, []);
  const showtimes = useFetch(
    () => getShowtimes({ movie_id: movieId, date, ...(cinemaId && { cinema_id: cinemaId }) }),
    [movieId, date, cinemaId]
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1"><DatePicker value={date} onChange={setDate} /></div>
        <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} aria-label="Chọn rạp"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm focus:border-brand-500">
          <option value="">Tất cả rạp</option>
          {(cinemas.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="mt-4">
        {showtimes.error ? (
          <ErrorState message={showtimes.error} onRetry={showtimes.reload} />
        ) : showtimes.loading && !showtimes.data ? (
          <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        ) : showtimes.data.length === 0 ? (
          <EmptyState icon="📅" title="Không có suất chiếu"
            description="Chưa có suất chiếu nào vào ngày này. Hãy thử chọn ngày hoặc rạp khác." />
        ) : (
          <div className={`space-y-4 transition-opacity ${showtimes.loading ? 'opacity-50' : ''}`}>
            {showtimes.data.map(({ cinema, showtimes: list }) => (
              <div key={cinema.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="font-semibold">{cinema.name}</h3>
                <p className="text-xs text-slate-400">{cinema.address}, {cinema.city}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {list.map((s) => {
                    const soldOut = s.available_seats <= 0;
                    const body = (
                      <>
                        <span className="text-base font-bold">{formatTime(s.start_time)}</span>
                        <span className="text-[11px] opacity-80">{s.room_type} · {formatPrice(s.base_price)}</span>
                        <span className="text-[11px] opacity-70">{soldOut ? 'Hết vé' : `${s.available_seats} ghế trống`}</span>
                      </>
                    );
                    const cls = 'flex min-w-28 flex-col items-center rounded-xl border px-3 py-2 transition';
                    return soldOut ? (
                      <span key={s.id} className={`${cls} cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600`}>{body}</span>
                    ) : (
                      <Link key={s.id} to={`/booking/${s.id}/seats`}
                        className={`${cls} border-slate-600 hover:border-brand-500 hover:bg-brand-600/20`}>{body}</Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
