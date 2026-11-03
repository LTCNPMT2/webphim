const { pool } = require('../config/db');

// ---------- Các hàm dùng TRONG transaction (nhận conn) ----------

// Khóa dòng suất chiếu: mọi đơn đặt vé của CÙNG 1 suất sẽ xếp hàng tuần tự -> chống đặt trùng ghế
exports.lockShowtime = async (conn, id) => {
  const [rows] = await conn.execute(
    `SELECT id, room_id, base_price, is_active, (start_time > NOW()) AS is_future
     FROM showtimes WHERE id = ? FOR UPDATE`,
    [id]
  );
  return rows[0] || null;
};

// Khóa dòng đơn đặt vé (để thanh toán/hủy/hết hạn không giẫm chân nhau)
exports.lockBooking = async (conn, id) => {
  const [rows] = await conn.execute(
    `SELECT *, (expires_at IS NOT NULL AND expires_at <= NOW()) AS is_expired
     FROM bookings WHERE id = ? FOR UPDATE`,
    [id]
  );
  return rows[0] || null;
};

// Khóa dòng đơn đặt vé theo mã booking_code
exports.lockBookingByCode = async (conn, code) => {
  const [rows] = await conn.execute(
    `SELECT *, (expires_at IS NOT NULL AND expires_at <= NOW()) AS is_expired
     FROM bookings WHERE booking_code = ? FOR UPDATE`,
    [code]
  );
  return rows[0] || null;
};

// Tìm đơn nhanh theo mã booking_code
exports.findByCode = async (code) => {
  const [rows] = await pool.execute(
    `SELECT id, booking_code, user_id, status, total_amount, expires_at, checked_in_at FROM bookings WHERE booking_code = ?`,
    [code]
  );
  return rows[0] || null;
};

// Tìm đơn nhanh theo ID
exports.findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, booking_code, user_id, status, total_amount, expires_at, checked_in_at FROM bookings WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.getShowtimeTiming = async (conn, showtimeId, hours) => {
  const [[row]] = await conn.execute(
    `SELECT (start_time > NOW()) AS is_future,
            (start_time > DATE_ADD(NOW(), INTERVAL ? HOUR)) AS cancel_ok
     FROM showtimes WHERE id = ?`,
    [hours, showtimeId]
  );
  return { is_future: Number(row.is_future) === 1, cancel_ok: Number(row.cancel_ok) === 1 };
};

// Đếm số đơn đang giữ ghế (pending chưa hết hạn) của user
exports.countActivePendingByUser = async (conn, userId) => {
  const [[row]] = await conn.execute(
    "SELECT COUNT(*) AS count FROM bookings WHERE user_id = ? AND status = 'pending' AND expires_at > NOW()",
    [userId]
  );
  return row.count;
};
exports.countPendingByUser = exports.countActivePendingByUser;
const _skipCount = async (conn, userId) => {
  const [[{ count }]] = await conn.execute(
    "SELECT COUNT(*) AS count FROM bookings WHERE user_id = ? AND status = 'pending' AND expires_at > NOW()",
    [userId]
  );
  return count;
};

// Nhả ghế của các đơn pending ĐÃ HẾT HẠN thuộc 1 suất chiếu
exports.expirePending = async (conn, showtimeId) => {
  const [expired] = await conn.execute(
    "SELECT id FROM bookings WHERE showtime_id = ? AND status = 'pending' AND expires_at <= NOW() FOR UPDATE",
    [showtimeId]
  );
  if (!expired.length) return;
  const ids = expired.map((b) => b.id);
  const inClause = ids.map(() => '?').join(',');
  await conn.execute(
    `UPDATE bookings SET status = 'expired' WHERE id IN (${inClause})`,
    ids
  );
  await conn.execute(
    `UPDATE booking_seats SET active = NULL WHERE booking_id IN (${inClause})`,
    ids
  );
};

// Kiểm tra ghế có hợp lệ không (thuộc đúng phòng chiếu)
exports.validateSeats = async (conn, roomId, seatIds) => {
  if (!seatIds.length) return [];
  const inClause = seatIds.map(() => '?').join(',');
  const [rows] = await conn.execute(
    `SELECT id, row_label, seat_number, seat_type
     FROM seats WHERE room_id = ? AND id IN (${inClause})`,
    [roomId, ...seatIds]
  );
  return rows;
};

// Khóa các dòng ghế đang active của suất chiếu (phát hiện ghế đã bị người khác giữ/mua)
exports.lockTakenSeats = async (conn, showtimeId, seatIds) => {
  if (!seatIds.length) return [];
  const inClause = seatIds.map(() => '?').join(',');
  const [rows] = await conn.execute(
    `SELECT seat_id FROM booking_seats
     WHERE showtime_id = ? AND active = 1 AND seat_id IN (${inClause}) FOR UPDATE`,
    [showtimeId, ...seatIds]
  );
  return rows.map((r) => r.seat_id);
};

// Tạo đơn mới
exports.insertBooking = async (conn, f, holdMinutes) => {
  const mins = f.holdMinutes || holdMinutes || 10;
  const [result] = await conn.execute(
    `INSERT INTO bookings
       (booking_code, user_id, showtime_id, promotion_id, subtotal, discount_amount, total_amount,
        status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [
      f.booking_code,
      f.user_id,
      f.showtime_id,
      f.promotion_id || null,
      f.subtotal,
      f.discount_amount || 0,
      f.total_amount,
      mins,
    ]
  );
  return result.insertId;
};

exports.insertSeats = async (conn, rows) => {
  if (!rows.length) return;
  await conn.query(
    'INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price, active) VALUES ?',
    [rows.map((r) => [...r, 1])]
  );
};

// rows: [[booking_id, combo_id, quantity, unit_price], ...]
exports.insertCombos = async (conn, rows) => {
  if (!rows.length) return;
  await conn.query('INSERT INTO booking_combos (booking_id, combo_id, quantity, unit_price) VALUES ?', [rows]);
};

// Nhả ghế của 1 đơn (giữ lại dòng để còn lịch sử)
exports.releaseSeats = async (conn, bookingId) => {
  await conn.execute('UPDATE booking_seats SET active = NULL WHERE booking_id = ?', [bookingId]);
};

exports.markPaid = async (conn, id) => {
  await conn.execute("UPDATE bookings SET status = 'paid', expires_at = NULL WHERE id = ?", [id]);
  await conn.execute("UPDATE booking_seats SET active = 1 WHERE booking_id = ?", [id]);
};

exports.markCancelled = async (conn, id) => {
  await conn.execute("UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?", [id]);
};

exports.releasePromotion = async (conn, promotionId) => {
  await conn.execute('UPDATE promotions SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?', [promotionId]);
};

exports.checkIn = async (bookingId, staffId) => {
  await pool.execute(
    'UPDATE bookings SET checked_in_at = NOW(), checked_in_by = ? WHERE id = ?',
    [staffId ?? null, bookingId]
  );
};

// ---------- Các hàm đọc ----------

// "status" trả về là trạng thái THỰC TẾ: đơn pending quá hạn được hiển thị là expired
// (kể cả khi cron chưa kịp cập nhật vào DB)
const EFFECTIVE_STATUS = `CASE WHEN b.status = 'pending' AND b.expires_at <= NOW() THEN 'expired' ELSE b.status END`;

exports.findDetailRow = async (id, cancelHours) => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_code, b.user_id, ${EFFECTIVE_STATUS} AS status, b.expires_at, b.created_at, b.cancelled_at,
            b.checked_in_at, b.checked_in_by, staff.full_name AS checked_in_by_name,
            b.subtotal, b.discount_amount, b.total_amount, p.code AS promotion_code,
            u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone,
            CASE WHEN b.status = 'pending' AND b.expires_at IS NOT NULL
                 THEN GREATEST(TIMESTAMPDIFF(SECOND, NOW(), b.expires_at), 0) ELSE NULL END AS seconds_left,
            s.id AS showtime_id, s.start_time, s.end_time,
            m.id AS movie_id, m.title AS movie_title, m.poster_url, m.duration_minutes, m.age_rating,
            c.name AS cinema_name, c.address AS cinema_address, r.name AS room_name, r.room_type,
            ((b.status = 'pending' AND b.expires_at > NOW())
              OR (b.status = 'paid' AND s.start_time > DATE_ADD(NOW(), INTERVAL ? HOUR))) AS can_cancel
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN showtimes s ON s.id = b.showtime_id
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     JOIN cinemas c ON c.id = r.cinema_id
     LEFT JOIN promotions p ON p.id = b.promotion_id
     LEFT JOIN users staff ON staff.id = b.checked_in_by
     WHERE b.id = ?`,
    [cancelHours, id]
  );
  return rows[0] || null;
};

exports.findDetailByCode = async (code, cancelHours = 2) => {
  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_code, b.user_id, ${EFFECTIVE_STATUS} AS status, b.expires_at, b.created_at, b.cancelled_at,
            b.checked_in_at, b.checked_in_by, staff.full_name AS checked_in_by_name,
            b.subtotal, b.discount_amount, b.total_amount, p.code AS promotion_code,
            u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone,
            CASE WHEN b.status = 'pending' AND b.expires_at IS NOT NULL
                 THEN GREATEST(TIMESTAMPDIFF(SECOND, NOW(), b.expires_at), 0) ELSE NULL END AS seconds_left,
            s.id AS showtime_id, s.start_time, s.end_time,
            m.id AS movie_id, m.title AS movie_title, m.poster_url, m.duration_minutes, m.age_rating,
            c.name AS cinema_name, c.address AS cinema_address, r.name AS room_name, r.room_type,
            ((b.status = 'pending' AND b.expires_at > NOW())
              OR (b.status = 'paid' AND s.start_time > DATE_ADD(NOW(), INTERVAL ? HOUR))) AS can_cancel
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN showtimes s ON s.id = b.showtime_id
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     JOIN cinemas c ON c.id = r.cinema_id
     LEFT JOIN promotions p ON p.id = b.promotion_id
     LEFT JOIN users staff ON staff.id = b.checked_in_by
     WHERE b.booking_code = ?`,
    [cancelHours, code]
  );
  return rows[0] || null;
};

exports.getSeats = async (bookingId) => {
  const [rows] = await pool.execute(
    `SELECT se.row_label, se.seat_number, se.seat_type, bs.price
     FROM booking_seats bs JOIN seats se ON se.id = bs.seat_id
     WHERE bs.booking_id = ?
     ORDER BY se.row_label, se.seat_number`,
    [bookingId]
  );
  return rows;
};

exports.getCombos = async (bookingId) => {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.image_url, bc.quantity, bc.unit_price, (bc.quantity * bc.unit_price) AS line_total
     FROM booking_combos bc JOIN combos c ON c.id = bc.combo_id
     WHERE bc.booking_id = ?`,
    [bookingId]
  );
  return rows;
};

exports.getPayments = async (bookingId) => {
  const [rows] = await pool.execute(
    `SELECT id, method, amount, status, transaction_code, paid_at FROM payments WHERE booking_id = ? ORDER BY id DESC`,
    [bookingId]
  );
  return rows;
};

exports.listByUser = async (userId, status, { limit, offset }) => {
  const conds = ['b.user_id = ?'];
  const params = [userId];

  if (status === 'expired') {
    conds.push("(b.status = 'expired' OR (b.status = 'pending' AND b.expires_at <= NOW()))");
  } else if (status === 'pending') {
    conds.push("(b.status = 'pending' AND b.expires_at > NOW())");
  } else if (status) {
    conds.push('b.status = ?');
    params.push(String(status));
  }

  const where = `WHERE ${conds.join(' AND ')}`;

  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_code, ${EFFECTIVE_STATUS} AS status, b.total_amount, b.created_at, b.expires_at, b.checked_in_at,
            m.id AS movie_id, m.title AS movie_title, m.poster_url, m.age_rating,
            c.name AS cinema_name, r.name AS room_name, s.start_time,
            (SELECT GROUP_CONCAT(CONCAT(se.row_label, se.seat_number) ORDER BY se.row_label, se.seat_number SEPARATOR ', ')
               FROM booking_seats bs JOIN seats se ON se.id = bs.seat_id WHERE bs.booking_id = b.id) AS seat_labels
     FROM bookings b
     JOIN showtimes s ON s.id = b.showtime_id
     JOIN movies m ON m.id = s.movie_id
     JOIN rooms r ON r.id = s.room_id
     JOIN cinemas c ON c.id = r.cinema_id
     ${where}
     ORDER BY b.created_at DESC, b.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM bookings b ${where}`, params);
  return { rows, total };
};
