const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT s.id, s.movie_id, s.room_id, s.start_time, s.end_time, s.base_price, s.is_active,
         m.title AS movie_title, m.poster_url, m.duration_minutes, m.age_rating,
         (SELECT GROUP_CONCAT(g.name SEPARATOR ', ') FROM movie_genres mg JOIN genres g ON g.id = mg.genre_id WHERE mg.movie_id = m.id) AS genres,
         r.name AS room_name, r.room_type, r.total_seats,
         c.id AS cinema_id, c.name AS cinema_name, c.address AS cinema_address, c.city AS cinema_city,
         (SELECT COUNT(*) FROM booking_seats bs WHERE bs.showtime_id = s.id AND bs.active = 1) AS booked_seats
  FROM showtimes s
  JOIN movies m ON m.id = s.movie_id
  JOIN rooms r ON r.id = s.room_id
  JOIN cinemas c ON c.id = r.cinema_id`;

function buildWhere({ movie_id, cinema_id, date }, { publicOnly }) {
  const conds = [];
  const params = [];
  if (publicOnly) {
    // Người dùng chỉ thấy suất chưa chiếu và đang hoạt động
    conds.push('s.is_active = 1', 'r.is_active = 1', 'c.is_active = 1', 's.start_time > NOW()');
  }
  if (movie_id) { conds.push('s.movie_id = ?'); params.push(movie_id); }
  if (cinema_id) { conds.push('c.id = ?'); params.push(cinema_id); }
  if (date) {
    conds.push('s.start_time >= CAST(? AS DATETIME)', 's.start_time < DATE_ADD(CAST(? AS DATETIME), INTERVAL 1 DAY)');
    params.push(`${date} 00:00:00`, `${date} 00:00:00`);
  }
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

exports.publicList = async (filters) => {
  const { where, params } = buildWhere(filters, { publicOnly: true });
  const [rows] = await pool.execute(`${BASE_SELECT} ${where} ORDER BY c.id, s.start_time`, params);
  return rows;
};

exports.adminList = async (filters, { limit, offset }) => {
  const { where, params } = buildWhere(filters, { publicOnly: false });
  const [rows] = await pool.execute(
    `${BASE_SELECT} ${where} ORDER BY s.start_time DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM showtimes s
     JOIN rooms r ON r.id = s.room_id JOIN cinemas c ON c.id = r.cinema_id ${where}`,
    params
  );
  return { rows, total };
};

exports.findPublicById = async (id) => {
  const [rows] = await pool.execute(`${BASE_SELECT} WHERE s.id = ? AND s.is_active = 1`, [id]);
  return rows[0] || null;
};

// Bản "thô" cho admin, kèm start_time_str để so sánh chính xác giờ chiếu
exports.findRawById = async (id, db = pool) => {
  const [rows] = await db.execute(
    `SELECT s.*, DATE_FORMAT(s.start_time, '%Y-%m-%d %H:%i:%s') AS start_time_str
     FROM showtimes s WHERE s.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// Khóa dòng phòng chiếu: 2 admin cùng tạo suất cho 1 phòng sẽ phải xếp hàng, tránh trùng giờ
exports.lockRoom = async (conn, roomId) => {
  await conn.execute('SELECT id FROM rooms WHERE id = ? FOR UPDATE', [roomId]);
};

// Tính giờ kết thúc và kiểm tra giờ bắt đầu có ở tương lai không (tính bằng chính MySQL)
exports.computeTimes = async (conn, start, minutes) => {
  const [[row]] = await conn.execute(
    `SELECT DATE_FORMAT(DATE_ADD(CAST(? AS DATETIME), INTERVAL ? MINUTE), '%Y-%m-%d %H:%i:%s') AS end_time,
            (CAST(? AS DATETIME) > NOW()) AS is_future`,
    [start, minutes, start]
  );
  return { end_time: row.end_time, is_future: Number(row.is_future) === 1 };
};

// Có suất nào cùng phòng giao nhau về thời gian không? (hai khoảng giao nhau khi A.start < B.end và A.end > B.start)
exports.findOverlap = async (conn, roomId, start, end, excludeId = 0) => {
  const [rows] = await conn.execute(
    `SELECT s.id, m.title FROM showtimes s JOIN movies m ON m.id = s.movie_id
     WHERE s.room_id = ? AND s.is_active = 1 AND s.id <> ?
       AND s.start_time < CAST(? AS DATETIME) AND s.end_time > CAST(? AS DATETIME)
     LIMIT 1`,
    [roomId, excludeId, end, start]
  );
  return rows[0] || null;
};

exports.hasActiveSeats = async (id) => {
  const [rows] = await pool.execute(
    'SELECT 1 FROM booking_seats WHERE showtime_id = ? AND active = 1 LIMIT 1',
    [id]
  );
  return rows.length > 0;
};

exports.create = async (conn, f) => {
  const [r] = await conn.execute(
    'INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price) VALUES (?, ?, CAST(? AS DATETIME), CAST(? AS DATETIME), ?)',
    [f.movie_id, f.room_id, f.start_time, f.end_time, f.base_price]
  );
  return r.insertId;
};

exports.update = async (conn, id, f) => {
  await conn.execute(
    `UPDATE showtimes SET movie_id = ?, room_id = ?, start_time = CAST(? AS DATETIME),
            end_time = CAST(? AS DATETIME), base_price = ?, is_active = ? WHERE id = ?`,
    [f.movie_id, f.room_id, f.start_time, f.end_time, f.base_price, f.is_active, id]
  );
};

// Chỉ đổi giá / trạng thái (không đụng tới phim, phòng, giờ)
exports.updatePriceStatus = async (id, { base_price, is_active }) => {
  await pool.execute('UPDATE showtimes SET base_price = ?, is_active = ? WHERE id = ?', [base_price, is_active, id]);
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM showtimes WHERE id = ?', [id]);
};
