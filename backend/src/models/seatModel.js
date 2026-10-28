const { pool } = require('../config/db');

// Sơ đồ ghế của 1 suất chiếu kèm trạng thái từng ghế:
//   booked  = đã thanh toán
//   holding = đang được giữ (đơn pending còn hạn)
//   available = trống (kể cả ghế của đơn pending đã hết hạn nhưng cron chưa kịp nhả)
exports.getSeatMap = async (showtimeId, roomId) => {
  const [rows] = await pool.execute(
    `SELECT se.id, se.row_label, se.seat_number, se.seat_type, se.price_surcharge,
            CASE
              WHEN b.id IS NULL THEN 'available'
              WHEN b.status = 'paid' THEN 'booked'
              WHEN b.status = 'pending' AND b.expires_at > NOW() THEN 'holding'
              ELSE 'available'
            END AS status
     FROM seats se
     LEFT JOIN booking_seats bs ON bs.seat_id = se.id AND bs.showtime_id = ? AND bs.active = 1
     LEFT JOIN bookings b ON b.id = bs.booking_id
     WHERE se.room_id = ?
     ORDER BY se.row_label, se.seat_number`,
    [showtimeId, roomId]
  );
  return rows;
};

// Lấy các ghế theo id, CHỈ những ghế thuộc đúng phòng của suất chiếu
exports.findByIdsInRoom = async (conn, ids, roomId) => {
  const [rows] = await conn.execute(
    `SELECT id, row_label, seat_number, seat_type, price_surcharge FROM seats
     WHERE room_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
    [roomId, ...ids]
  );
  return rows;
};

// Ghế nào trong danh sách đang bị giữ/đã bán ở suất này?
exports.findTaken = async (conn, showtimeId, ids) => {
  const [rows] = await conn.execute(
    `SELECT se.id, se.row_label, se.seat_number FROM booking_seats bs
     JOIN seats se ON se.id = bs.seat_id
     WHERE bs.showtime_id = ? AND bs.active = 1 AND bs.seat_id IN (${ids.map(() => '?').join(',')})
     ORDER BY se.row_label, se.seat_number`,
    [showtimeId, ...ids]
  );
  return rows;
};
