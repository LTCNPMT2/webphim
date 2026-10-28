import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { getGenres, getMovies } from '../services/catalogService.js';
import MovieGrid from '../components/movie/MovieGrid.jsx';
import Pagination from '../components/ui/Pagination.jsx';

const STATUS_TABS = [
  { key: 'now_showing', label: 'Đang chiếu', icon: '🎞️' },
  { key: 'coming_soon', label: 'Sắp chiếu', icon: '✨' },
  { key: 'all', label: 'Tất cả phim', icon: '🎬' },
];

const SORTS = {
  newest: { label: 'Mới nhất', sort: 'release_date', order: 'desc' },
  rating: { label: 'Đánh giá cao', sort: 'rating', order: 'desc' },
  title: { label: 'Tên A → Z', sort: 'title', order: 'asc' },
};

const LIMIT = 12;

export default function Movies() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'now_showing';
  const genre = params.get('genre') || '';
  const search = params.get('search') || '';
  const isToday = params.get('filter') === 'today';
  const sortKey = SORTS[params.get('sort')] ? params.get('sort') : 'newest';
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1);

  const update = (patch, { replace = false } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      if (!('page' in patch)) next.delete('page');
      return next;
    }, { replace });
  };

  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debounced.trim() !== search) update({ search: debounced.trim() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const genres = useFetch(getGenres, []);
  const movies = useFetch(
    () => getMovies({
      status: status === 'all' ? undefined : status,
      genre: genre || undefined,
      search: search || undefined,
      sort: SORTS[sortKey].sort,
      order: SORTS[sortKey].order,
      page,
      limit: LIMIT,
    }),
    [status, genre, search, sortKey, page]
  );

  const hasFilter = genre || search || status !== 'now_showing' || isToday;
  const total = movies.data?.pagination.total;

  return (
    <div className="space-y-8">
      {/* Header trang phim */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-r from-slate-900/60 via-slate-900/40 to-brand-950/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Danh mục điện ảnh
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Phim Chiếu Rạp
            </h1>
            <p className="text-sm text-slate-400 max-w-lg">
              Cập nhật lịch chiếu phim bom tấn chiếu rạp mới nhất, đặt vé giữ chỗ ngay tức thì.
            </p>
          </div>

          {/* Ô tìm kiếm & Sắp xếp */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm tên phim, diễn viên..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>
            <select
              value={sortKey}
              onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm font-medium text-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k} className="bg-slate-900">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab trạng thái phim */}
        <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => {
            const isActive = status === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  update({ status: t.key === 'now_showing' ? '' : t.key, filter: '' });
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}

          {isToday && (
            <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-300">
              📅 Suất chiếu hôm nay
            </span>
          )}
        </div>

        {/* Danh sách thể loại phim */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => update({ genre: '' })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              !genre
                ? 'bg-white/20 text-white border border-white/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tất cả thể loại
          </button>
          {(genres.data || []).map((g) => {
            const active = genre === g.slug;
            return (
              <button
                key={g.id}
                onClick={() => update({ genre: active ? '' : g.slug })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thông tin kết quả & nút xóa bộ lọc */}
      <div className="flex items-center justify-between px-1 text-sm text-slate-400">
        <p>
          {total !== undefined ? (
            <span>
              Tìm thấy <b className="text-white font-bold">{total}</b> phim phù hợp
            </span>
          ) : ' '}
        </p>
        {hasFilter && (
          <button
            onClick={() => {
              setSearchInput('');
              setParams({});
            }}
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 hover:underline"
          >
            <span>✕</span>
            <span>Đặt lại tất cả bộ lọc</span>
          </button>
        )}
      </div>

      {/* Lưới phim */}
      <MovieGrid
        state={movies}
        emptyTitle="Không tìm thấy phim phù hợp"
        emptyDescription="Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn thể loại khác nhé."
      />

      {/* Phân trang */}
      {movies.data?.pagination && movies.data.pagination.totalPages > 1 && (
        <div className="pt-6 flex justify-center">
          <Pagination
            meta={movies.data.pagination}
            onPageChange={(p) => update({ page: p })}
          />
        </div>
      )}
    </div>
  );
}
