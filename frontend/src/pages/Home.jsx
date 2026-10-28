import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getMovies } from '../services/catalogService.js';
import BannerSlider from '../components/movie/BannerSlider.jsx';
import MovieSectionSlider from '../components/movie/MovieSectionSlider.jsx';
import CinemaShowtimesWidget from '../components/movie/CinemaShowtimesWidget.jsx';
import TrailerModal from '../components/movie/TrailerModal.jsx';

export default function Home() {
  const [trailerMovie, setTrailerMovie] = useState(null);

  // Phim chiếu banner và phim đang chiếu (hiển thị kèm thứ hạng Top 1, 2, 3...)
  const nowShowing = useFetch(() => getMovies({ status: 'now_showing', limit: 12 }), []);

  // Phim sắp chiếu
  const comingSoon = useFetch(() => getMovies({ status: 'coming_soon', limit: 12 }), []);

  return (
    <div className="space-y-14 pb-12">
      {/* 1. Hero Banner Slider */}
      <BannerSlider
        movies={nowShowing.data?.items?.slice(0, 5)}
        loading={nowShowing.loading}
      />

      {/* 2. Dải Tiện ích & Ưu điểm CineBooking */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: '⚡', title: 'Đặt vé siêu tốc', desc: 'Chọn ghế & thanh toán tức thì trong 30s' },
          { icon: '🍿', title: 'Combo Bắp Nước', desc: 'Nhiều vị hấp dẫn, nhận ngay tại quầy' },
          { icon: '💺', title: 'Phòng Chiếu IMAX', desc: 'Âm thanh Dolby Atmos & Màn ảnh cong' },
          { icon: '🎟️', title: 'Ưu đãi thành viên', desc: 'Giảm giá vé & tích điểm mỗi lần xem' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur transition duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-brand-600/30 to-pink-500/10 border border-brand-500/30 text-xl">
              {item.icon}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Mục 1: PHIM ĐANG CHIẾU (Thiết kế MoMo Cinema) */}
      <div className="relative rounded-3xl border border-white/[0.07] bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-transparent p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
        <div className="pointer-events-none absolute -top-10 left-1/4 h-48 w-80 rounded-full bg-brand-600/10 blur-[80px]" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Đang chiếu rạp</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Phim Đang Chiếu
            </h2>
          </div>
          <Link
            to="/movies?status=now_showing"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-brand-400 transition"
          >
            <span>Xem tất cả</span>
            <span>→</span>
          </Link>
        </div>

        <MovieSectionSlider
          movies={nowShowing.data?.items || []}
          loading={nowShowing.loading}
          showRank={true}
          onPlayTrailer={(movie) => setTrailerMovie(movie)}
          emptyText="Hiện chưa có phim đang chiếu"
        />

        <div className="mt-4 text-center sm:hidden">
          <Link
            to="/movies?status=now_showing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-400"
          >
            <span>Xem toàn bộ lịch chiếu phim</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* 4. Khung Lịch Chiếu Phim Chuẩn MoMo Cinema */}
      <section id="showtimes" className="scroll-mt-20">
        <CinemaShowtimesWidget />
      </section>

      {/* 5. Mục 2: PHIM SẮP CHIẾU (Thiết kế MoMo Cinema) */}
      <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-slate-900/30 to-transparent p-5 sm:p-7 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400">Sắp ra mắt</span>
            <h2 className="text-2xl sm:text-3xl font-black text-pink-500 tracking-tight mt-0.5">
              Phim Sắp Chiếu
            </h2>
          </div>
          <Link
            to="/movies?status=coming_soon"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-pink-400 transition"
          >
            <span>Xem tất cả</span>
            <span>→</span>
          </Link>
        </div>

        <MovieSectionSlider
          movies={comingSoon.data?.items || []}
          loading={comingSoon.loading}
          showRank={false}
          onPlayTrailer={(movie) => setTrailerMovie(movie)}
          emptyText="Hiện chưa có phim sắp chiếu"
        />

        {/* Nút lớn ở giữa: "Tìm phim chiếu rạp" */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/movies"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-pink-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-brand-600/25 transition duration-300 hover:from-brand-500 hover:to-pink-500 hover:shadow-brand-500/40 hover:scale-105"
          >
            <span>🎬</span>
            <span>Tìm phim chiếu rạp</span>
          </Link>
        </div>
      </div>

      {/* Modal Popup Trailer khi bấm nút Play */}
      {trailerMovie && (
        <TrailerModal
          movie={trailerMovie}
          onClose={() => setTrailerMovie(null)}
        />
      )}
    </div>
  );
}
