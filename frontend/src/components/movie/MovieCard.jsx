import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl, formatDate, formatRating } from '../../utils/format.js';
import { AGE_COLORS } from '../../utils/constants.js';

export default function MovieCard({ movie, rank, onPlay }) {
  const [imgFailed, setImgFailed] = useState(false);
  const rating = Number(movie.rating_avg) || 0;
  const genres = (movie.genres || []).map((g) => g.name).join(', ');

  // Xử lý khi nhấn nút Play trailer
  const handlePlayClick = (e) => {
    if (onPlay) {
      e.preventDefault();
      e.stopPropagation();
      onPlay(movie);
    }
  };

  // Màu sắc nhãn độ tuổi
  const ageColor = AGE_COLORS[movie.age_rating] || 'bg-slate-700';

  return (
    <div className="group relative flex flex-col">
      <Link to={`/movies/${movie.id}`} className="block">
        {/* Khung Poster */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-md transition duration-300 group-hover:shadow-xl group-hover:shadow-brand-500/10">
          {/* Ảnh poster hoặc Fallback gradient rạp phim */}
          {movie.poster_url && !imgFailed ? (
            <img
              src={assetUrl(movie.poster_url)}
              alt={movie.title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-4 text-center">
              <span className="text-4xl">🎬</span>
              <span className="mt-3 line-clamp-3 text-xs font-semibold text-slate-300">
                {movie.title}
              </span>
            </div>
          )}

          {/* Lớp phủ tối nhẹ khi hover */}
          <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Huy hiệu độ tuổi góc trên bên trái */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 z-10">
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-black text-white shadow ${ageColor}`}>
              {movie.age_rating || 'P'}
            </span>
          </div>

          {/* Nút Play tròn ở chính giữa poster (kiểu MoMo Cinema) */}
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={`Xem trailer ${movie.title}`}
            className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-black/45 text-white backdrop-blur-sm transition duration-300 hover:scale-110 hover:border-brand-400 hover:bg-brand-600/80 hover:text-white shadow-lg z-10"
          >
            <svg className="ml-0.5 h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Số thứ tự Top lớn ở góc dưới bên trái (như ảnh tham khảo MoMo: 1, 2, 3...) */}
          {rank && (
            <span className="pointer-events-none absolute -bottom-2 left-1.5 font-black italic text-5xl leading-none text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] z-10 select-none">
              {rank}
            </span>
          )}

          {/* Nhãn ngày khởi chiếu cho phim sắp chiếu */}
          {movie.status === 'coming_soon' && movie.release_date && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium text-slate-200">
              Khởi chiếu {formatDate(movie.release_date)}
            </div>
          )}
        </div>
      </Link>

      {/* Thông tin phim bên dưới poster */}
      <div className="mt-2.5 flex flex-col flex-1">
        <Link
          to={`/movies/${movie.id}`}
          className="line-clamp-2 text-sm font-bold text-slate-100 transition duration-200 group-hover:text-brand-400"
          title={movie.title}
        >
          {movie.title}
        </Link>

        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
          {genres || 'Phim chiếu rạp'}
        </p>

        {/* Điểm đánh giá sao vàng */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <span className="text-amber-400">★</span>
          <span className="font-semibold text-slate-200">
            {rating > 0 ? formatRating(rating) : 'Chưa có đánh giá'}
          </span>
          {movie.duration_minutes > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{movie.duration_minutes}p</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
