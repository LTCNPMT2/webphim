import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl, formatDate, formatRating } from '../../utils/format.js';
import { AGE_COLORS } from '../../utils/constants.js';
import Skeleton from '../ui/Skeleton.jsx';

export default function BannerSlider({ movies = [], loading, interval = 6000, onBookMovie }) {
  const slides = movies.filter((m) => m.banner_url || m.poster_url).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [paused, slides.length, interval]);

  if (loading && slides.length === 0) {
    return <Skeleton className="aspect-[16/8] sm:aspect-[21/9] w-full rounded-3xl" />;
  }
  if (slides.length === 0) return null;

  const current = Math.min(index, slides.length - 1);
  const movie = slides[current];
  const rating = Number(movie.rating_avg) || 0;
  const genres = (movie.genres || []).map((g) => g.name).join(' · ');

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c101c] shadow-2xl group/banner"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background Image Slider with smooth transition */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
        {slides.map((m, i) => (
          <div
            key={m.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={assetUrl(m.banner_url || m.poster_url)}
              alt={m.title}
              className="h-full w-full object-cover object-center transform scale-100 transition-transform duration-10000 ease-out group-hover/banner:scale-105"
            />
            {/* Lớp phủ gradient nhiều lớp kiểu rạp chiếu */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080b12] via-[#080b12]/70 to-transparent w-full md:w-3/4" />
          </div>
        ))}

        {/* Nội dung Banner nổi bật */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-8 md:p-12">
          <div className="max-w-2xl space-y-3 sm:space-y-4">
            {/* Badges thông tin */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-md px-2 py-0.5 font-black text-white shadow ${AGE_COLORS[movie.age_rating] || 'bg-slate-700'}`}>
                {movie.age_rating || 'P'}
              </span>
              {rating > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 font-bold text-amber-300">
                  ★ {formatRating(rating)}
                </span>
              )}
              {movie.duration_minutes > 0 && (
                <span className="rounded-md bg-slate-800/80 backdrop-blur px-2 py-0.5 text-slate-300 font-medium">
                  ⏱️ {movie.duration_minutes} phút
                </span>
              )}
              {genres && (
                <span className="hidden sm:inline-block rounded-md bg-white/10 backdrop-blur px-2.5 py-0.5 text-slate-200">
                  {genres}
                </span>
              )}
            </div>

            {/* Tên phim */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {movie.title}
            </h1>

            {/* Tóm tắt phim */}
            <p className="line-clamp-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {movie.description || 'Khám phá câu chuyện điện ảnh đặc sắc tại các cụm rạp CineBooking với chất lượng hình ảnh và âm thanh sống động.'}
            </p>

            {/* Các nút hành động */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onBookMovie?.(movie)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:from-brand-500 hover:to-pink-500 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>🎟️</span>
                <span>Đặt vé ngay</span>
              </button>
              <Link
                to={`/movies/${movie.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 hover:border-white/40"
              >
                <span>Chi tiết phim</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Nút lướt banner trước / sau */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
              aria-label="Banner trước"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur border border-white/15 transition hover:bg-brand-600 hover:scale-110 sm:grid"
            >
              <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setIndex((index + 1) % slides.length)}
              aria-label="Banner sau"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur border border-white/15 transition hover:bg-brand-600 hover:scale-110 sm:grid"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dấu chấm vị trí slide */}
            <div className="absolute bottom-4 right-6 z-20 flex gap-2">
              {slides.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Chuyển đến phim ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'w-8 bg-brand-500 shadow-md shadow-brand-500/50'
                      : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
