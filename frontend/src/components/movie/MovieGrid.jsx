import MovieCard from './MovieCard.jsx';
import { MovieCardSkeleton } from '../ui/Skeleton.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';

// Lưới phim đủ 3 trạng thái: đang tải (skeleton) / lỗi (nút thử lại) / trống / có dữ liệu.
// `state` là kết quả của useFetch(() => getMovies(...)).
export default function MovieGrid({ state, skeletonCount = 12, emptyTitle = 'Chưa có phim nào', emptyDescription, emptyAction }) {
  const { data, loading, error, reload } = state;
  const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (loading && !data) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }, (_, i) => <MovieCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription}>{emptyAction}</EmptyState>;
  }

  return (
    <div className={`${gridClass} transition-opacity ${loading ? 'opacity-50' : ''}`}>
      {data.items.map((m) => <MovieCard key={m.id} movie={m} />)}
    </div>
  );
}
