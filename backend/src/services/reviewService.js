const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/transaction');
const { parsePagination, buildMeta } = require('../utils/pagination');
const movieModel = require('../models/movieModel');
const reviewModel = require('../models/reviewModel');

async function assertMovie(movieId) {
  const movie = await movieModel.findById(movieId);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim');
  return movie;
}

exports.list = async (movieId, query) => {
  const movie = await assertMovie(movieId);
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 5, maxLimit: 50 });
  const { rows, total } = await reviewModel.list(movieId, { limit, offset });
  return {
    items: rows,
    pagination: buildMeta(page, limit, total),
    summary: { average: Number(movie.rating_avg), count: movie.rating_count },
  };
};

exports.getMine = async (movieId, userId) => {
  await assertMovie(movieId);
  return reviewModel.findMine(movieId, userId);
};

// Trả về { review, created }: created = true nếu là đánh giá mới, false nếu là sửa đánh giá cũ
exports.save = async (user, movieId, { rating, comment }) => {
  await assertMovie(movieId);
  const existed = await reviewModel.findMine(movieId, user.id);
  const text = comment && String(comment).trim() ? String(comment).trim() : null;

  await withTransaction(async (conn) => {
    await reviewModel.upsert(conn, { userId: user.id, movieId, rating, comment: text });
    await reviewModel.recalcMovieRating(conn, movieId);
  });

  return { review: await reviewModel.findMine(movieId, user.id), created: !existed };
};

exports.removeMine = async (user, movieId) => {
  await assertMovie(movieId);
  await withTransaction(async (conn) => {
    const removed = await reviewModel.remove(conn, movieId, user.id);
    if (!removed) throw new ApiError(404, 'Bạn chưa đánh giá phim này');
    await reviewModel.recalcMovieRating(conn, movieId);
  });
};
