const { pool } = require('../config/db');

// Cột cho phép sắp xếp (whitelist để không nối chuỗi người dùng vào SQL)
const SORT_COLUMNS = { release_date: 'm.release_date', title: 'm.title', rating: 'm.rating_avg' };

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

function buildFilter({ status, genre, search }) {
  const conds = [];
  const params = [];

  if (status) {
    conds.push('m.status = ?');
    params.push(String(status));
  }
  if (genre) {
    // genre có thể là id (số) hoặc slug (vd "hanh-dong")
    conds.push(`EXISTS (
      SELECT 1 FROM movie_genres mg JOIN genres g ON g.id = mg.genre_id
      WHERE mg.movie_id = m.id AND (g.id = ? OR g.slug = ?))`);
    params.push(/^\d+$/.test(String(genre)) ? Number(genre) : 0, String(genre));
  }
  if (search) {
    conds.push('m.title LIKE ?');
    params.push(`%${escapeLike(String(search).trim())}%`);
  }
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

// limit/offset đã được ép kiểu số nguyên ở parsePagination nên nối thẳng vào SQL là an toàn
// (tránh lỗi "Incorrect arguments to mysqld_stmt_execute" khi truyền LIMIT bằng tham số ?)
exports.list = async (filters, { limit, offset }) => {
  const { where, params } = buildFilter(filters);
  const sortCol = SORT_COLUMNS[filters.sort] || SORT_COLUMNS.release_date;
  const dir = filters.order === 'asc' ? 'ASC' : 'DESC';

  const [rows] = await pool.execute(
    `SELECT m.* FROM movies m ${where}
     ORDER BY ${sortCol} ${dir}, m.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM movies m ${where}`,
    params
  );
  return { rows, total };
};

exports.findById = async (id, db = pool) => {
  const [rows] = await db.execute('SELECT * FROM movies WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.getGenres = async (movieId) => {
  const [rows] = await pool.execute(
    `SELECT g.id, g.name, g.slug FROM movie_genres mg
     JOIN genres g ON g.id = mg.genre_id WHERE mg.movie_id = ? ORDER BY g.name`,
    [movieId]
  );
  return rows;
};

// Lấy thể loại cho nhiều phim bằng 1 query (tránh N+1 query)
exports.getGenresByMovieIds = async (ids) => {
  if (!ids.length) return [];
  const [rows] = await pool.execute(
    `SELECT mg.movie_id, g.id, g.name, g.slug FROM movie_genres mg
     JOIN genres g ON g.id = mg.genre_id
     WHERE mg.movie_id IN (${ids.map(() => '?').join(',')}) ORDER BY g.name`,
    ids
  );
  return rows;
};

exports.slugExists = async (slug, excludeId, db = pool) => {
  const [rows] = await db.execute('SELECT id FROM movies WHERE slug = ? AND id <> ?', [slug, excludeId]);
  return rows.length > 0;
};

exports.countExistingGenres = async (db, ids) => {
  if (!ids.length) return 0;
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS n FROM genres WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  return rows[0].n;
};

exports.setGenres = async (db, movieId, genreIds) => {
  await db.execute('DELETE FROM movie_genres WHERE movie_id = ?', [movieId]);
  if (genreIds.length) {
    await db.query('INSERT INTO movie_genres (movie_id, genre_id) VALUES ?', [
      genreIds.map((g) => [movieId, g]),
    ]);
  }
};

const COLS = [
  'title', 'tagline', 'slug', 'description', 'duration_minutes', 'release_date', 'director', 'cast_members',
  'language', 'country', 'cast_data', 'age_rating', 'poster_url', 'banner_url', 'gallery_images', 'custom_faqs', 'trailer_url', 'status',
];

exports.create = async (db, f) => {
  const [r] = await db.execute(
    `INSERT INTO movies (${COLS.join(', ')}) VALUES (${COLS.map(() => '?').join(', ')})`,
    COLS.map((c) => f[c] ?? null)
  );
  return r.insertId;
};

exports.update = async (db, id, f) => {
  await db.execute(
    `UPDATE movies SET ${COLS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    [...COLS.map((c) => f[c] ?? null), id]
  );
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM movies WHERE id = ?', [id]);
};
