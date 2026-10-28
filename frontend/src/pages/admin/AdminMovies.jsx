import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { getGenres, getMovies } from '../../services/catalogService.js';
import { createMovie, deleteMovie, updateMovie } from '../../services/adminService.js';
import { buildMovieFormData } from '../../utils/admin.js';
import { assetUrl, formatDate, formatRating } from '../../utils/format.js';
import { AGE_LABELS, STATUS_LABELS } from '../../utils/constants.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import ImagePicker from '../../components/admin/ImagePicker.jsx';
import Badge from '../../components/admin/Badge.jsx';
import FormField from '../../components/ui/FormField.jsx';
import FormSelect from '../../components/ui/FormSelect.jsx';
import FormTextarea from '../../components/ui/FormTextarea.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Button from '../../components/ui/Button.jsx';

const STATUS_CLS = { now_showing: 'bg-emerald-500/20 text-emerald-300', coming_soon: 'bg-sky-500/20 text-sky-300', ended: 'bg-slate-500/25 text-slate-300' };

const isUrl = (s) => { try { return Boolean(new URL(s)); } catch { return false; } };

function MovieForm({ movie, genres, onClose, onSaved }) {
  // Parse cast_data và gallery_images nếu là JSON string
  const initialCast = Array.isArray(movie?.cast_data) 
    ? movie.cast_data 
    : (typeof movie?.cast_data === 'string' ? JSON.parse(movie.cast_data || '[]') : []);

  const initialGallery = Array.isArray(movie?.gallery_images)
    ? movie.gallery_images
    : (typeof movie?.gallery_images === 'string' ? JSON.parse(movie.gallery_images || '[]') : []);

  const [castList, setCastList] = useState(
    initialCast.length > 0 ? initialCast : [{ name: '', role: '', avatar_url: '' }]
  );

  const form = useFormState({
    title: movie?.title || '',
    tagline: movie?.tagline || '',
    duration_minutes: movie?.duration_minutes ?? '',
    release_date: movie?.release_date ? movie.release_date.split('T')[0] : '',
    age_rating: movie?.age_rating || 'P',
    status: movie?.status || 'coming_soon',
    language: movie?.language || 'Tiếng Việt',
    country: movie?.country || 'Việt Nam',
    director: movie?.director || '',
    cast_members: movie?.cast_members || '',
    trailer_url: movie?.trailer_url || '',
    description: movie?.description || '',
    gallery_1: initialGallery[0] || '',
    gallery_2: initialGallery[1] || '',
    genre_ids: (movie?.genres || []).map((g) => g.id),
    poster: null,
    banner: null,
  });
  const { values: v, errors, saving, change, setValue } = form;

  const validate = (x) => {
    const er = {};
    if (!x.title.trim()) er.title = 'Vui lòng nhập tên tác phẩm';
    const d = Number(x.duration_minutes);
    if (!Number.isInteger(d) || d < 1 || d > 600) er.duration_minutes = 'Thời lượng phải từ 1 đến 600 phút';
    if (!x.release_date) er.release_date = 'Vui lòng chọn ngày khởi chiếu';
    if (!movie && !x.poster && !movie?.poster_url) er.poster = 'Vui lòng chọn ảnh Poster cho tác phẩm';
    if (x.trailer_url.trim() && !isUrl(x.trailer_url.trim())) er.trailer_url = 'Link trailer không hợp lệ (cần URL https://...)';
    if (x.gallery_1.trim() && !isUrl(x.gallery_1.trim())) er.gallery_1 = 'Link ảnh 1 không hợp lệ';
    if (x.gallery_2.trim() && !isUrl(x.gallery_2.trim())) er.gallery_2 = 'Link ảnh 2 không hợp lệ';
    return er;
  };

  const handleAddCast = () => {
    setCastList([...castList, { name: '', role: '', avatar_url: '' }]);
  };

  const handleRemoveCast = (index) => {
    setCastList(castList.filter((_, i) => i !== index));
  };

  const handleCastChange = (index, field, value) => {
    const updated = [...castList];
    updated[index][field] = value;
    setCastList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Chuẩn bị payload kèm diễn viên và 2 ảnh phong cảnh
    const validCast = castList.filter((c) => c.name.trim());
    const validGallery = [v.gallery_1.trim(), v.gallery_2.trim()].filter(Boolean);

    const submitData = {
      ...v,
      cast_data: validCast,
      gallery_images: validGallery,
    };

    const ok = await form.submit(
      (x) => (movie ? updateMovie(movie.id, buildMovieFormData(submitData)) : createMovie(buildMovieFormData(submitData))),
      validate
    );
    if (ok) {
      toast.success(movie ? 'Đã cập nhật tác phẩm điện ảnh' : 'Đã thêm tác phẩm điện ảnh mới');
      onSaved();
    }
  };

  const toggleGenre = (id) =>
    setValue('genre_ids', v.genre_ids.includes(id) ? v.genre_ids.filter((g) => g !== id) : [...v.genre_ids, id]);

  return (
    <FormModal
      title={movie ? `Sửa tác phẩm: ${movie.title}` : 'Thêm tác phẩm điện ảnh mới'}
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      maxWidth="max-w-4xl"
      submitLabel={movie ? 'Lưu thay đổi' : 'Thêm tác phẩm'}
    >
      {/* 1. Thông tin chung */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên tác phẩm điện ảnh *" name="title" value={v.title} onChange={change} error={errors.title} placeholder="Ví dụ: Trại Buôn Người" />
        <FormField label="Câu Slogan / Tagline" name="tagline" value={v.tagline} onChange={change} placeholder="Ví dụ: Khi gia đình là lý do để sống sót" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <FormField label="Thời lượng (phút) *" name="duration_minutes" type="number" min="1" max="600" value={v.duration_minutes} onChange={change} error={errors.duration_minutes} />
        <FormField label="Ngày khởi chiếu *" name="release_date" type="date" value={v.release_date} onChange={change} error={errors.release_date} />
        <FormField label="Ngôn ngữ" name="language" value={v.language} onChange={change} error={errors.language} />
        <FormField label="Quốc gia sản xuất" name="country" value={v.country} onChange={change} placeholder="Ví dụ: Việt Nam" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect label="Độ tuổi quy định" name="age_rating" value={v.age_rating} onChange={change} error={errors.age_rating} hint={AGE_LABELS[v.age_rating]}>
          {Object.keys(AGE_LABELS).map((k) => <option key={k} value={k}>{k}</option>)}
        </FormSelect>
        <FormSelect label="Trạng thái chiếu" name="status" value={v.status} onChange={change} error={errors.status}>
          {Object.entries(STATUS_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </FormSelect>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Đạo diễn" name="director" value={v.director} onChange={change} error={errors.director} placeholder="Ví dụ: Steven Spielberg, Charlie Nguyễn" />
        <FormField label="Diễn viên chính (Tóm tắt)" name="cast_members" value={v.cast_members} onChange={change} error={errors.cast_members} hint="Cách nhau bằng dấu phẩy" />
      </div>

      <FormField
        label="Link trailer (YouTube URL)"
        name="trailer_url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={v.trailer_url}
        onChange={change}
        error={errors.trailer_url}
      />

      <FormTextarea
        label="Mô tả tóm tắt nội dung phim"
        name="description"
        rows={3}
        value={v.description}
        onChange={change}
        error={errors.description}
        placeholder="Nội dung tóm tắt để hiển thị ở trang chi tiết phim..."
      />

      {/* 2. Thể loại phim */}
      <fieldset className="border border-white/5 rounded-xl p-3.5 bg-white/2">
        <legend className="px-2 text-xs font-bold text-slate-300 uppercase tracking-wider">Thể loại phim</legend>
        <div className="flex flex-wrap gap-2">
          {(genres || []).map((g) => {
            const on = v.genre_ids.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleGenre(g.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  on ? 'border-pink-500 bg-pink-600 text-white shadow-sm' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
        {errors.genre_ids && <p className="mt-1 text-xs text-red-400">{errors.genre_ids}</p>}
      </fieldset>

      {/* 3. Hình ảnh & Video: 2 ảnh phong cảnh/scene */}
      <div className="border border-white/5 rounded-xl p-3.5 bg-white/2 space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          2 Ảnh phong cảnh cảnh phim (Mục &ldquo;Hình ảnh &amp; Video&rdquo;)
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="URL Ảnh cảnh phim 1"
            name="gallery_1"
            value={v.gallery_1}
            onChange={change}
            error={errors.gallery_1}
            placeholder="https://images.unsplash.com/... hoặc link ảnh"
          />
          <FormField
            label="URL Ảnh cảnh phim 2"
            name="gallery_2"
            value={v.gallery_2}
            onChange={change}
            error={errors.gallery_2}
            placeholder="https://images.unsplash.com/... hoặc link ảnh"
          />
        </div>
      </div>

      {/* 4. Danh sách diễn viên chi tiết (Mục &ldquo;Diễn viên &amp; Đoàn làm phim&rdquo;) */}
      <div className="border border-white/5 rounded-xl p-3.5 bg-white/2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Danh sách diễn viên có ảnh đại diện &amp; vai diễn
          </span>
          <button
            type="button"
            onClick={handleAddCast}
            className="rounded-lg bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/50 px-2.5 py-1 text-xs font-bold text-pink-300 transition cursor-pointer"
          >
            ＋ Thêm diễn viên
          </button>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {castList.map((item, idx) => (
            <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
              <input
                type="text"
                placeholder="Tên diễn viên (vd: Steven Nguyễn)"
                value={item.name}
                onChange={(e) => handleCastChange(idx, 'name', e.target.value)}
                className="flex-1 min-w-[130px] rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Vai diễn (vd: Trần Duy Ny)"
                value={item.role}
                onChange={(e) => handleCastChange(idx, 'role', e.target.value)}
                className="flex-1 min-w-[130px] rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="URL ảnh chân dung..."
                value={item.avatar_url}
                onChange={(e) => handleCastChange(idx, 'avatar_url', e.target.value)}
                className="flex-1 min-w-[150px] rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white"
              />
              {castList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCast(idx)}
                  className="h-7 w-7 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 text-xs font-bold transition cursor-pointer"
                  title="Xóa dòng này"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Tải ảnh Poster & Banner */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <ImagePicker
            label="Ảnh Poster (ảnh dọc) *"
            name="poster"
            file={v.poster}
            currentUrl={movie?.poster_url}
            onChange={(f) => setValue('poster', f)}
          />
          {errors.poster && <p className="mt-1 text-xs text-red-400">{errors.poster}</p>}
        </div>
        <ImagePicker
          label="Banner (ảnh ngang độ phân giải cao)"
          name="banner"
          file={v.banner}
          currentUrl={movie?.banner_url}
          onChange={(f) => setValue('banner', f)}
          wide
        />
      </div>
    </FormModal>
  );
}

export default function AdminMovies() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | movie

  useEffect(() => setPage(1), [search, status]);

  const movies = useFetch(() => getMovies({ search: search || undefined, status: status || undefined, page, limit: 10 }), [search, status, page]);
  const genres = useFetch(getGenres, []);
  const rows = movies.data?.items ?? null;

  const del = useConfirmDelete(
    (m) => deleteMovie(m.id),
    () => (rows?.length === 1 && page > 1 ? setPage(page - 1) : movies.reload()),
    'Đã xóa phim'
  );

  const columns = [
    {
      key: 'poster',
      header: 'Poster',
      render: (m) => (
        <div className="h-16 w-11 overflow-hidden rounded bg-slate-800">
          {m.poster_url && <img src={assetUrl(m.poster_url)} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Tác phẩm điện ảnh',
      render: (m) => (
        <div>
          <p className="font-semibold text-white">{m.title}</p>
          <p className="text-xs text-slate-400 italic">{m.tagline || m.genres?.map((g) => g.name).join(', ') || 'Chưa có thể loại'}</p>
        </div>
      ),
    },
    { key: 'duration', header: 'Thời lượng', render: (m) => `${m.duration_minutes} phút` },
    { key: 'release', header: 'Khởi chiếu', render: (m) => formatDate(m.release_date) },
    { key: 'country', header: 'Quốc gia', render: (m) => m.country || 'Việt Nam' },
    { key: 'age', header: 'Tuổi', render: (m) => m.age_rating },
    { key: 'status', header: 'Trạng thái', render: (m) => <Badge cls={STATUS_CLS[m.status]}>{STATUS_LABELS[m.status]}</Badge> },
    { key: 'rating', header: 'Đánh giá', render: (m) => (Number(m.rating_avg) > 0 ? `★ ${formatRating(m.rating_avg)} (${m.rating_count})` : '—') },
    { key: 'actions', header: '', className: 'text-right', render: (m) => <RowActions onEdit={() => setEditing(m)} onDelete={() => del.ask(m)} /> },
  ];

  return (
    <div>
      <PageHeader title="Quản lý phim điện ảnh" subtitle={movies.data ? `${movies.data.pagination.total} tác phẩm điện ảnh trong hệ thống` : ' '}>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="🔍 Tìm theo tên tác phẩm..."
          aria-label="Tìm phim"
          className="w-60 rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Lọc trạng thái"
          className="rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer transition"
        >
          <option value="">🎬 Mọi trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k} className="bg-slate-900 text-white">
              {label}
            </option>
          ))}
        </select>
        <Button onClick={() => setEditing('new')}>＋ Thêm tác phẩm</Button>
      </PageHeader>

      <AdminTable columns={columns} rows={rows} loading={movies.loading} error={movies.error} onRetry={movies.reload} emptyText="Không có tác phẩm nào phù hợp" />
      {movies.data && <Pagination page={movies.data.pagination.page} totalPages={movies.data.pagination.totalPages} onChange={setPage} />}

      {editing && (
        <MovieForm
          movie={editing === 'new' ? null : editing}
          genres={genres.data}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            movies.reload();
          }}
        />
      )}
      <ConfirmDialog open={!!del.target} title="Xóa phim" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa phim <b>{del.target?.title}</b>? Các suất chiếu của phim cũng bị xóa. Nếu phim đã có đơn đặt vé thì không xóa được, khi đó hãy chuyển trạng thái sang &ldquo;Ngừng chiếu&rdquo;.
      </ConfirmDialog>
    </div>
  );
}
