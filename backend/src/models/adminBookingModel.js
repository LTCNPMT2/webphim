const { pool } = require('../config/db');
const { escapeLike } = require('../utils/sql');

// Trạng thái thực tế: đơn pending quá hạn được hiển thị là expired (kể cả khi cron chưa kịp cập nhật)
const EFFECTIVE_STATUS = `CASE WHEN b.status = 'pending' AND b.expires_at <= NOW() THEN 'expired' ELSE b.status END`;

exports.list = async ({ status, date_from, date_to, search }, { limit, offset }) => {
  const conds = [];
  const params = [];

  if (status === 'expired') conds.push("(b.status = 'expired' OR (b.status = 'pending' AND b.expires_at <= NOW()))");
  else if (status === 'pending') conds.push("(b.status = 'pending' AND b.expires_at > NOW())");
  else if (status) { conds.push('b.status = ?'); params.push(String(status)); }

  if (date_from) { conds.push('b.created_at >= CAST(? AS DATETIME)'); params.push(`${date_from} 00:00:00`); }
  if (date_to) { conds.push('b.created_at < DATE_ADD(CAST(? AS DATETIME), INTERVAL 1 DAY)'); params.push(`${date_to} 00:00:00`); }
  if (search) {
    conds.push('(b.booking_code LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)');
    const like = `%${escapeLike(String(search).trim())}%`;
    params.push(like, like, like);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const from = `FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN showtimes s ON s.id = b.showtime_id
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     JOIN cinemas c ON c.id = r.cinema_id`;

  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_code, ${EFFECTIVE_STATUS} AS status, b.total_amount, b.created_at,
            u.id AS user_id, u.full_name, u.email,
            m.title AS movie_title, c.name AS cinema_name, r.name AS room_name, s.start_time,
            (SELECT GROUP_CONCAT(CONCAT(se.row_label, se.seat_number) ORDER BY se.row_label, se.seat_number SEPARATOR ', ')
               FROM booking_seats bs JOIN seats se ON se.id = bs.seat_id WHERE bs.booking_id = b.id) AS seat_labels
     ${from} ${where}
     ORDER BY b.created_at DESC, b.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total ${from} ${where}`, params);
  return { rows, total };
};
