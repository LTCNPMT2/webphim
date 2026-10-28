import { useRef, useState } from 'react';
import MovieCard from './MovieCard.jsx';
import Skeleton from '../ui/Skeleton.jsx';

export default function MovieSectionSlider({
  title,
  titleClassName = 'text-white',
  movies = [],
  loading = false,
  showRank = false,
  onPlayTrailer,
  emptyText = 'Chưa có phim nào',
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="relative py-6">
      {/* Tiêu đề mục */}
      {title && (
        <h2 className={`text-2xl sm:text-3xl font-black text-center tracking-tight mb-7 ${titleClassName}`}>
          {title}
        </h2>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="group/slider relative">
          {/* Nút lướt sang trái */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Xem phim trước"
              className="absolute -left-3 sm:-left-5 top-1/3 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition duration-200 hover:scale-110 hover:bg-slate-100"
            >
              <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Danh sách cuộn ngang */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className="w-[calc(50%-8px)] sm:w-[calc(33.333%-14px)] md:w-[calc(25%-15px)] lg:w-[calc(20%-16px)] shrink-0 snap-start"
              >
                <MovieCard
                  movie={movie}
                  rank={showRank ? index + 1 : undefined}
                  onPlay={onPlayTrailer}
                />
              </div>
            ))}
          </div>

          {/* Nút lướt sang phải (hình tròn trắng giống ảnh MoMo) */}
          {canScrollRight && movies.length > 3 && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Xem thêm phim"
              className="absolute -right-3 sm:-right-5 top-1/3 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition duration-200 hover:scale-110 hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
