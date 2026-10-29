import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl, formatRating } from '../../utils/format.js';
import { AGE_COLORS } from '../../utils/constants.js';
import Skeleton from '../ui/Skeleton.jsx';

// Danh sách banner điện ảnh chất lượng cao chuẩn độ phân giải 2K/4K (Unsplash CDNs ổn định)
const CINEMA_BACKDROPS = [
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=85&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=85&w=1920&auto=format&fit=crop',
];

// Danh sách phim bom tấn tuyển chọn hiển thị mẫu khi backend chưa chạy hoặc chưa có dữ liệu
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

// Hàm hỗ trợ lọc và làm đẹp ảnh banner (loại bỏ ảnh placehold.co xám xịt)
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
  // Lấy dữ liệu slides: ưu tiên movies được truyền vào; nếu rỗng, dùng DEFAULT_MOVIES
  const slides = useMemo(() => {
    const list = Array.isArray(movies) && movies.length > 0 ? movies : DEFAULT_MOVIES;
    return list.slice(0, 5).map((m, idx) => ({
      ...m,
      cleanBannerUrl: resolveBannerUrl(m.banner_url || m.poster_url, idx),
      cleanPosterUrl: m.poster_url && !m.poster_url.includes('placehold.co')
        ? assetUrl(m.poster_url)
        : resolveBannerUrl(m.banner_url, idx),
    }));
  }, [movies]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Tự động chuyển slide và đồng hồ đo tiến trình mượt mà
  useEffect(() => {
    if (paused || slides.length < 2) return undefined;

    const stepMs = 50;
    const progressIncrement = (stepMs / interval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIndex((i) => (i + 1) % slides.length);
          return 0;
        }
        return prev + progressIncrement;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [paused, slides.length, interval, index]);

  // Reset thanh tiến trình khi người dùng chủ động chuyển slide
  const goToSlide = (newIndex) => {
    setIndex(newIndex);
    setProgress(0);
  };

  const handlePrev = () => {
    goToSlide((index - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    goToSlide((index + 1) % slides.length);
  };

  if (loading && slides.length === 0) {
    return (
      <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[2.35/1] w-full overflow-hidden rounded-3xl bg-slate-900">
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
      className="group/banner relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c101c] shadow-2xl transition duration-500 hover:border-white/[0.14]"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 1. Lớp Ánh Sáng Môi Trường Rạp Chiếu (Cinema Ambient Glow) */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-brand-600/15 blur-[120px] transition-all duration-1000" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-pink-600/10 blur-[120px] transition-all duration-1000" />

      {/* 2. Khung Slider Chính với tỉ lệ chuẩn điện ảnh Widescreen */}
      <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[2.35/1] w-full overflow-hidden">
        {slides.map((m, i) => {
          const isActive = i === current;
          return (
            <div
              key={m.id || i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Hình ảnh nền bom tấn với hiệu ứng phóng nhẹ (Ken Burns) */}
              <img
                src={m.cleanBannerUrl}
                alt={m.title}
                onError={(e) => {
                  e.currentTarget.src = CINEMA_BACKDROPS[i % CINEMA_BACKDROPS.length];
                }}
                className={`h-full w-full object-cover object-center transform transition-transform duration-[12000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Lớp Vignette & Gradient chuẩn phòng chiếu phim:
                  - Từ dưới lên: hòa quyện tuyệt đối vào màu nền web #080b12
                  - Từ trái sang phải: tạo độ tương phản cao giúp chữ luôn đọc rõ ràng */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080b12] via-[#080b12]/85 via-45% to-transparent w-full md:w-4/5" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          );
        })}

        {/* 3. Nội Dung Banner: Tiêu đề, Tagline, Huy hiệu và Nút bấm */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-8 md:p-12 lg:p-14">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            
            {/* Nhóm Huy Hiệu Định Dạng & Độ Tuổi */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Huy hiệu nổi bật (Spotlight Tag) */}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600/30 to-pink-600/30 border border-brand-500/40 px-2.5 py-1 text-[11px] font-bold text-pink-300 backdrop-blur-md">
                {movie.badge || '🔥 Đang Chiếu Tại Rạp'}
              </span>

              {/* Độ tuổi xem phim */}
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-black text-white shadow-md ${
                  AGE_COLORS[movie.age_rating] || 'bg-slate-700'
                }`}
                title={`Phân loại khán giả: ${movie.age_rating || 'P'}`}
              >
                {movie.age_rating || 'P'}
              </span>

              {/* Điểm đánh giá sao vàng */}
              {rating > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-extrabold text-amber-300 backdrop-blur-md shadow-sm">
                  <span className="text-amber-400">★</span> {formatRating(rating)}
                </span>
              )}

              {/* Thời lượng phim */}
              {movie.duration_minutes > 0 && (
                <span className="rounded-lg bg-slate-900/80 border border-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 backdrop-blur-md">
                  ⏱️ {movie.duration_minutes} phút
                </span>
              )}

              {/* Thể loại phim */}
              {genres && (
                <span className="hidden sm:inline-flex rounded-lg bg-white/10 border border-white/10 px-3 py-0.5 text-xs font-medium text-slate-200 backdrop-blur-md">
                  {genres}
                </span>
              )}

              {/* Định dạng chiếu (IMAX, Dolby Atmos...) */}
              {(movie.formats || ['IMAX 2D', 'Dolby Atmos']).map((fmt, fIdx) => (
                <span
                  key={fIdx}
                  className="hidden md:inline-flex rounded-lg bg-slate-800/60 border border-slate-700/80 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-300"
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Tên Phim với Font Chữ Điện Ảnh Hiện Đại */}
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {movie.title}
            </h1>

            {/* Câu nói ấn tượng / Tagline */}
            {movie.tagline && (
              <p className="hidden sm:block text-xs sm:text-sm font-semibold italic text-amber-300/90 tracking-wide">
                “{movie.tagline}”
              </p>
            )}

            {/* Tóm tắt phim chuẩn Typography Tiếng Việt */}
            <p className="line-clamp-2 text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed drop-shadow-sm">
              {movie.description ||
                'Trải nghiệm đỉnh cao điện ảnh cùng CineBooking với âm thanh vòm sống động và hệ thống màn chiếu thế hệ mới.'}
            </p>

            {/* Cụm Nút Hành Động Trực Quan */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Nút 1: Đặt vé ngay -> Mở sơ đồ chọn ghế */}
              <button
                type="button"
                onClick={() => onBookMovie?.(movie)}
                className="group/btn inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-rose-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/35 transition duration-300 hover:from-brand-500 hover:to-pink-500 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="transition-transform duration-300 group-hover/btn:rotate-12">🎟️</span>
                <span>Đặt vé ngay</span>
              </button>

              {/* Nút 2: Xem Trailer nếu có handler */}
              {onPlayTrailer && (
                <button
                  type="button"
                  onClick={() => onPlayTrailer(movie)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Xem Trailer</span>
                </button>
              )}

              {/* Nút 3: Chi tiết phim */}
              <Link
                to={`/movies/${movie.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 backdrop-blur-md px-4 py-3 text-sm font-medium text-slate-300 transition duration-300 hover:bg-white/10 hover:text-white"
              >
                <span>Chi tiết</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Điều Hướng Slide: Nút Mũi Tên Trước / Sau */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Banner trước"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/15 transition duration-300 hover:bg-brand-600 hover:border-brand-500 hover:scale-110 sm:grid cursor-pointer"
            >
              <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              aria-label="Banner kế tiếp"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden h-11 w-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/15 transition duration-300 hover:bg-brand-600 hover:border-brand-500 hover:scale-110 sm:grid cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 5. Khung Danh Sách Thumbnails Thu Nhỏ Trên Màn Hình Rộng */}
            <div className="absolute bottom-5 right-6 z-20 hidden lg:flex items-center gap-2.5 rounded-2xl bg-black/40 border border-white/10 p-1.5 backdrop-blur-md">
              {slides.map((m, i) => {
                const isSelected = i === current;
                return (
                  <button
                    key={m.id || i}
                    onClick={() => goToSlide(i)}
                    className={`group/thumb relative h-12 w-20 overflow-hidden rounded-xl transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-brand-500 scale-105 shadow-lg shadow-brand-500/40'
                        : 'opacity-60 hover:opacity-100 hover:scale-100'
                    }`}
                    title={m.title}
                  >
                    <img
                      src={m.cleanPosterUrl}
                      alt={m.title}
                      className="h-full w-full object-cover object-center"
                    />
                    <div
                      className={`absolute inset-0 transition-opacity ${
                        isSelected ? 'bg-transparent' : 'bg-black/30 group-hover/thumb:bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* 6. Dấu Chấm Chuyển Đổi Trên Di Động & Tablet */}
            <div className="absolute bottom-4 right-6 z-20 flex gap-2 lg:hidden">
              {slides.map((m, i) => (
                <button
                  key={m.id || i}
                  onClick={() => goToSlide(i)}
                  aria-label={`Chuyển đến phim ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current
                      ? 'w-8 bg-brand-500 shadow-md shadow-brand-500/50'
                      : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* 7. Thanh Tiến Trình Tự Động Chạy (Auto-play Progress Indicator) */}
        {slides.length > 1 && !paused && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-pink-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
