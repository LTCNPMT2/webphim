import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { deleteMyReview, getMyReview, getReviews, saveReview } from '../../services/catalogService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { formatDay } from '../../utils/format.js';
import StarRating from '../ui/StarRating.jsx';
import Button from '../ui/Button.jsx';
import Pagination from '../ui/Pagination.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import ErrorState from '../ui/ErrorState.jsx';

function ReviewForm({ movieId, mine, onDone }) {
  const [rating, setRating] = useState(mine?.rating || 0);
  const [comment, setComment] = useState(mine?.comment || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Khi tải xong đánh giá cũ của người dùng thì điền sẵn vào form
  useEffect(() => {
    setRating(mine?.rating || 0);
    setComment(mine?.comment || '');
  }, [mine]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Vui lòng chọn số sao');
    setError('');
    setSaving(true);
    try {
      await saveReview(movieId, { rating, comment: comment.trim() });
      toast.success(mine ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá');
      onDone();
    } catch (err) {
      setError(getFieldErrors(err).comment || getFieldErrors(err).rating || getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Xóa đánh giá của bạn về phim này?')) return;
    setRemoving(true);
    try {
      await deleteMyReview(movieId);
      toast.success('Đã xóa đánh giá');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="font-semibold">{mine ? 'Đánh giá của bạn' : 'Viết đánh giá'}</p>
      <div className="mt-2"><StarRating value={rating} onChange={setRating} size="text-3xl" /></div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000}
        placeholder="Chia sẻ cảm nhận của bạn về bộ phim (không bắt buộc)"
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm placeholder-slate-500 focus:border-brand-500" />
      {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" loading={saving}>{mine ? 'Cập nhật' : 'Gửi đánh giá'}</Button>
        {mine && <Button type="button" variant="outline" loading={removing} onClick={handleRemove}>Xóa</Button>}
      </div>
    </form>
  );
}

// onChanged: gọi sau khi thêm/sửa/xóa để trang chi tiết tải lại điểm trung bình
export default function ReviewSection({ movieId, onChanged }) {
  const { user } = useAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0); // tăng lên để tải lại sau khi có thay đổi

  const reviews = useFetch(() => getReviews(movieId, { page, limit: 5 }), [movieId, page, version]);
  const mine = useFetch(() => (user ? getMyReview(movieId) : Promise.resolve(null)), [movieId, user?.id, version]);

  const refresh = () => {
    setVersion((v) => v + 1);
    onChanged?.();
  };

  const summary = reviews.data?.summary;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold">Đánh giá</h2>
        {summary && summary.count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={summary.average} />
            <span className="text-sm text-slate-300"><b>{summary.average.toFixed(1)}</b>/5 · {summary.count} lượt</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        {user ? (
          <ReviewForm movieId={movieId} mine={mine.data} onDone={refresh} />
        ) : (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            <Link to="/login" state={{ from: location }} className="font-semibold text-brand-500 hover:underline">Đăng nhập</Link>{' '}
            để viết đánh giá của bạn.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {reviews.error ? (
          <ErrorState message={reviews.error} onRetry={reviews.reload} />
        ) : reviews.loading && !reviews.data ? (
          <Skeleton className="h-20" />
        ) : reviews.data.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        ) : (
          reviews.data.items.map((r) => (
            <article key={r.id} className="rounded-xl border border-slate-800 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{r.full_name}{user?.id === r.user_id && <span className="ml-2 rounded bg-brand-600/30 px-1.5 py-0.5 text-xs text-brand-400">Bạn</span>}</p>
                <span className="text-xs text-slate-500">{formatDay(r.created_at)}</span>
              </div>
              <div className="mt-1"><StarRating value={r.rating} size="text-base" /></div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{r.comment}</p>}
            </article>
          ))
        )}
      </div>

      {reviews.data && <Pagination page={reviews.data.pagination.page} totalPages={reviews.data.pagination.totalPages} onChange={setPage} />}
    </section>
  );
}
