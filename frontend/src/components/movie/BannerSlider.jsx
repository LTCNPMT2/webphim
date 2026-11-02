import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl, formatRating } from '../../utils/format.js';
import { AGE_COLORS } from '../../utils/constants.js';
import Skeleton from '../ui/Skeleton.jsx';

// Danh sách banner điện ảnh chất lượng cao chuẩn độ phân giải 2K/4K
const CINEMA_BACKDROPS = [
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=85&w=1920&auto=format&fit=crop',
];

// Danh sách phim mẫu khi backend chưa có dữ liệu
const DEFAULT_MOVIES = [
  {
    id: 1,
    title: 'Hành Tinh Cát: Phần Hai (Dune 2)',
    tagline: 'Số phận của vũ trụ nằm trong tay người được chọn',
    description:
      'Paul Atreides hợp nhất với Chani và người Fremen để trả thù những kẻ đã hủy diệt gia tộc mình, đối mặt với sự lựa chọn định đoạt vận mệnh của toàn vũ trụ.',
    age_rating: 'T16',
    rating_avg: 4.8,
    duration_minutes: 166,
    genres: [{ id: 1, name: 'Hành Động' }, { id: 7, name: 'Khoa Học Viễn Tưởng' }, { id: 9, name: 'Phiêu Lưu' }],
    banner_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=85&w=1920&auto=format&fit=crop',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    trailer_url: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    badge: '⚡ Siêu Bom Tấn IMAX',
    formats: ['IMAX 2D', 'Dolby Atmos', '4K Laser'],
  },
  {
    id: 2,
    title: 'Mai',
    tagline: 'Quá khứ chưa qua, ngày mai đã đến',
    description:
      'Bộ phim tâm lý - tình cảm sâu sắc của đạo diễn Trấn Thành, xoay quanh số phận của Mai - người phụ nữ từng chịu nhiều tổn thương nhưng luôn khao khát hạnh phúc đích thực.',
    age_rating: 'T18',
    rating_avg: 4.9,
    duration_minutes: 131,
    genres: [{ id: 2, name: 'Tâm Lý' }, { id: 3, name: 'Tình Cảm' }, { id: 5, name: 'Gia Đình' }],
    banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=85&w=1920&auto=format&fit=crop',
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    trailer_url: 'https://www.youtube.com/watch?v=s5e1E9x_bZc',
    badge: '🔥 Kỷ Lục Phòng Vé 550 Tỷ',
    formats: ['2D Tiếng Việt', 'Phụ Đề English'],
  },
  {
    id: 3,
    title: 'Godzilla x Kong: Đế Chế Mới',
    tagline: 'Hai kỳ quan tự nhiên kề vai tác chiến',
    description:
      'Trận chiến bùng nổ khi hai titan huyền thoại Godzilla và Kong cùng hợp lực chống lại một mối đe dọa khổng lồ chưa từng thấy ẩn sâu trong Trái Đất Rỗng.',
    age_rating: 'T13',
    rating_avg: 4.7,
    duration_minutes: 115,
    genres: [{ id: 1, name: 'Hành Động' }, { id: 7, name: 'Khoa Học Viễn Tưởng' }, { id: 8, name: 'Quái Thú' }],
    banner_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=85&w=1920&auto=format&fit=crop',
    poster_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=600&auto=format&fit=crop',
    trailer_url: 'https://www.youtube.com/watch?v=qqrpMRDuPfc',
    badge: '💥 Đại Chiến Quái Thú',
    formats: ['IMAX 3D', '4DX', 'ScreenX'],
  },
  {
    id: 4,
    title: 'Deadpool & Wolverine',
    tagline: 'Cặp đôi hỗn loạn nhất Marvel chính thức hội ngộ',
    description:
      'Wade Wilson bất đắc dĩ phải lôi kéo Wolverine đang chán nản tham gia vào một nhiệm vụ bảo vệ thực tại đầy những pha hành động nghẹt thở và hài hước điên cuồng.',
    age_rating: 'T18',
    rating_avg: 4.9,
    duration_minutes: 128,
    genres: [{ id: 1, name: 'Hành Động' }, { id: 4, name: 'Hài Hước' }, { id: 6, name: 'Siêu Anh Hùng' }],
    banner_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=85&w=1920&auto=format&fit=crop',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    trailer_url: 'https://www.youtube.com/watch?v=73_1biulkYk',
    badge: '⭐ Marvel Bom Tấn Năm',
    formats: ['IMAX 2D', 'Dolby Cinema'],
  },
  {
    id: 5,
    title: 'Vương Quốc Mây Huyền Ảo',
    tagline: 'Chuyến phiêu lưu kỳ diệu vượt không gian',
    description:
      'Cô bé Mây cùng chú rồng nhỏ can đảm khởi hành chuyến thám hiểm vượt mây ngàn để thắp lại nguồn sáng bảo vệ vương quốc trước cơn bão bí ẩn.',
    age_rating: 'P',
    rating_avg: 4.6,
    duration_minutes: 95,
    genres: [{ id: 10, name: 'Hoạt Hình' }, { id: 9, name: 'Phiêu Lưu' }, { id: 5, name: 'Gia Đình' }],
    banner_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=85&w=1920&auto=format&fit=crop',
    poster_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop',
    trailer_url: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
    badge: '🌈 Phim Hoạt Hình Gia Đình',
    formats: ['2D Lồng Tiếng Việt'],
  },
];

function resolveBannerUrl(url, idx) {
  if (!url || typeof url !== 'string' || url.includes('placehold.co')) {
    return CINEMA_BACKDROPS[idx % CINEMA_BACKDROPS.length];
  }
  return assetUrl(url);
}

export default function BannerSlider({
  movies = [],
  loading = false,
  interval = 6000,
  onBookMovie,
  onPlayTrailer,
}) {
  const slides = useMemo(() => {
    const list = Array.isArray(movies) && movies.length > 0 ? movies : DEFAULT_MOVIES;
    return list.slice(0, 5).map((m, idx) => ({
      ...m,
      cleanBannerUrl: resolveBannerUrl(m.banner_url || m.poster_url, idx),
    }));
  }, [movies]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Tự động chuyển slide (giữ nguyên chức năng)
  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [paused, slides.length, interval, index]);

  const goToSlide = (newIndex) => setIndex(newIndex);

  if (loading && slides.length === 0) {
    return (
      <div className="w-full bg-slate-900 h-[540px] sm:h-[600px] md:h-[650px] lg:h-[700px]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const current = Math.min(index, slides.length - 1);
  const movie = slides[current];
  const rating = Number(movie.rating_avg) || 0;
  const genres = (movie.genres || []).map((g) => (typeof g === 'string' ? g : g.name)).join(' · ');

  return (
    <section
      className="relative w-full overflow-hidden bg-[#080b12] h-[540px] sm:h-[600px] md:h-[650px] lg:h-[700px] xl:h-[720px]"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Ảnh nền slides ── */}
      <div className="absolute inset-0">
        {slides.map((m, i) => {
          const isActive = i === current;
          return (
            <div
              key={m.id || i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Ảnh nền – Ken Burns nhẹ */}
              <img
                src={m.cleanBannerUrl}
                alt={m.title}
                onError={(e) => { e.currentTarget.src = CINEMA_BACKDROPS[i % CINEMA_BACKDROPS.length]; }}
                className={`absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-[12000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
              {/* Gradient trái → phải (vùng tối giúp chữ và nút dễ đọc nhất) */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(8,11,18,0.96) 0%, rgba(8,11,18,0.85) 35%, rgba(8,11,18,0.35) 65%, transparent 100%)',
                }}
              />
              {/* Gradient đỉnh → trong suốt (hòa trộn mượt mà với Header) */}
              <div
                className="absolute top-0 left-0 right-0 h-24"
                style={{
                  background: 'linear-gradient(to bottom, rgba(8,11,18,0.7) 0%, transparent 100%)',
                }}
              />
              {/* Gradient đáy → trong suốt (kết nối mượt mà xuống phần nội dung bên dưới) */}
              <div
                className="absolute bottom-0 left-0 right-0 h-32 sm:h-40"
                style={{
                  background:
                    'linear-gradient(to top, #080b12 0%, rgba(8,11,18,0.6) 45%, transparent 100%)',
                }}
              />
              {/* Lớp tối nhẹ toàn cảnh */}
              <div className="absolute inset-0 bg-black/15" />
            </div>
          );
        })}
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-brand-600/15 blur-[100px]" />

      {/* ── Nội dung banner: Căn lề đồng nhất tuyệt đối với các khu vực bên dưới ── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center pointer-events-none">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pointer-events-auto">
          <div className="max-w-2xl lg:max-w-3xl space-y-3.5 sm:space-y-4">

            {/* Tag huy hiệu, độ tuổi, đánh giá, thời lượng, thể loại */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600/40 to-pink-600/40 border border-brand-500/50 px-2.5 py-1 text-[11px] font-bold text-pink-200 backdrop-blur-md shadow-sm">
                {movie.badge || '🔥 Đang Chiếu Tại Rạp'}
              </span>
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-black text-white shadow-md ${
                  AGE_COLORS[movie.age_rating] || 'bg-slate-700'
                }`}
              >
                {movie.age_rating || 'P'}
              </span>
              {rating > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 backdrop-blur-md">
                  <span className="text-amber-400">★</span> {formatRating(rating)}
                </span>
              )}
              {movie.duration_minutes > 0 && (
                <span className="rounded-lg bg-slate-900/80 border border-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 backdrop-blur-md">
                  ⏱️ {movie.duration_minutes} phút
                </span>
              )}
              {genres && (
                <span className="hidden sm:inline-flex rounded-lg bg-white/10 border border-white/15 px-3 py-0.5 text-xs font-medium text-slate-200 backdrop-blur-md">
                  {genres}
                </span>
              )}
              {(movie.formats || ['IMAX 2D', 'Dolby Atmos']).map((fmt, fIdx) => (
                <span
                  key={fIdx}
                  className="hidden md:inline-flex rounded-lg bg-slate-800/70 border border-slate-700/80 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-300"
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Tên phim */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="hidden sm:block text-sm sm:text-base font-semibold italic text-amber-300/95 tracking-wide drop-shadow">
                "{movie.tagline}"
              </p>
            )}

            {/* Mô tả phim */}
            <p className="line-clamp-2 sm:line-clamp-3 text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed drop-shadow">
              {movie.description ||
                'Trải nghiệm đỉnh cao điện ảnh cùng CineBooking với âm thanh vòm sống động và hệ thống màn chiếu thế hệ mới.'}
            </p>

            {/* Nút hành động */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onBookMovie?.(movie)}
                className="group/btn inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-rose-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-brand-600/35 transition duration-300 hover:from-brand-500 hover:to-pink-500 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="transition-transform duration-300 group-hover/btn:rotate-12">🎟️</span>
                <span>Đặt vé ngay</span>
              </button>

              {onPlayTrailer && (
                <button
                  type="button"
                  onClick={() => onPlayTrailer(movie)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/40 backdrop-blur-md px-5 py-3 text-sm font-semibold text-white shadow-md transition duration-300 hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Xem Trailer</span>
                </button>
              )}

              <Link
                to={`/movies/${movie.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md px-4 py-3 text-sm font-medium text-slate-200 transition duration-300 hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <span>Chi tiết</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dấu chấm điều hướng – TUYỆT ĐỐI KHÔNG có nút mũi tên < > theo yêu cầu ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((m, i) => (
            <button
              key={m.id || i}
              onClick={() => goToSlide(i)}
              aria-label={`Chuyển đến phim ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === current
                  ? 'w-8 bg-brand-500 shadow-md shadow-brand-500/50'
                  : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
