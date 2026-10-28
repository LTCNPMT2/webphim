const { pool } = require('../config/db');

// limit/offset đã được ép kiểu số nguyên ở parsePagination nên nối vào SQL là an toàn
exports.list = async (movieId, { limit, offset }) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.id AS user_id, u.full_name, u.full_name AS user_name, u.avatar_url
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.movie_id = ? ORDER BY r.created_at DESC, r.id DESC LIMIT ${limit} OFFSET ${offset}`,
    [movieId]
  );
  const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM reviews WHERE movie_id = ?', [movieId]);
  return { rows, total };
};

exports.findMine = async (movieId, userId, db = pool) => {
  const [rows] = await db.execute(
    'SELECT id, rating, comment, created_at FROM reviews WHERE movie_id = ? AND user_id = ?',
    [movieId, userId]
  );
  return rows[0] || null;
};

// Mỗi người 1 đánh giá / phim (UNIQUE user_id + movie_id): đánh giá lại thì ghi đè đánh giá cũ
exports.upsert = async (conn, { userId, movieId, rating, comment }) => {
  await conn.execute(
    `INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
    [userId, movieId, rating, comment]
  );
};

exports.remove = async (conn, movieId, userId) => {
  const [r] = await conn.execute('DELETE FROM reviews WHERE movie_id = ? AND user_id = ?', [movieId, userId]);
  return r.affectedRows;
};

// Tính lại điểm trung bình + số lượt đánh giá lưu sẵn trong bảng movies (để danh sách phim không phải tính lại)
exports.recalcMovieRating = async (conn, movieId) => {
  await conn.execute(
    `UPDATE movies SET
       rating_avg = (SELECT COALESCE(ROUND(AVG(rating), 2), 0) FROM reviews WHERE movie_id = ?),
       rating_count = (SELECT COUNT(*) FROM reviews WHERE movie_id = ?)
     WHERE id = ?`,
    [movieId, movieId, movieId]
  );
};
