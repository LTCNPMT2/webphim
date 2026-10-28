import { getYoutubeEmbedUrl } from '../../utils/youtube.js';
import { Link } from 'react-router-dom';

export default function TrailerModal({ movie, onClose }) {
  if (!movie) return null;
  const embedUrl = getYoutubeEmbedUrl(movie.trailer_url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-brand-500">🎬</span>
            <h3 className="font-bold text-white text-base truncate max-w-lg">
              Trailer: {movie.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player hoặc Thông báo khi không có trailer */}
        <div className="aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              src={`${embedUrl}?autoplay=1`}
              title={`Trailer ${movie.title}`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-800 text-3xl mb-3">
                🎞️
              </div>
              <p className="text-lg font-semibold text-slate-200">
                Trailer phim {movie.title} đang được cập nhật
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Bạn có thể xem thông tin chi tiết và đặt vé xem phim ngay bây giờ!
              </p>
              <Link
                to={`/movies/${movie.id}`}
                onClick={onClose}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-500"
              >
                Xem chi tiết & Đặt vé →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
