// Mọi con số doanh thu tính từ bảng payments có status = 'success'.
// Khi vé bị hủy, thanh toán chuyển thành 'refunded' nên tự động không còn được tính.
const { pool } = require('../config/db');

exports.getToday = async () => {
  const [[row]] = await pool.execute("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
  return row.today;
};

exports.getSummary = async () => {
  const [[pay]] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) AS revenue_total,
            COALESCE(SUM(CASE WHEN DATE(paid_at) = CURDATE() THEN amount END), 0) AS revenue_today,
            COALESCE(SUM(CASE WHEN paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN amount END), 0) AS revenue_month,
            COUNT(*) AS paid_bookings
     FROM payments WHERE status = 'success'`
  );
  const [[tk]] = await pool.execute(
    `SELECT COUNT(*) AS tickets_total,
            COALESCE(SUM(CASE WHEN DATE(p.paid_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS tickets_today
     FROM booking_seats bs JOIN payments p ON p.booking_id = bs.booking_id AND p.status = 'success'`
  );
  const [[users]] = await pool.execute("SELECT COUNT(*) AS n FROM users WHERE role = 'user'");
  const [[movies]] = await pool.execute("SELECT COUNT(*) AS n FROM movies WHERE status = 'now_showing'");
  return { ...pay, ...tk, users_total: users.n, movies_showing: movies.n };
};

exports.revenueByDay = async (days) => {
  const [rev] = await pool.execute(
    `SELECT DATE_FORMAT(paid_at, '%Y-%m-%d') AS d, SUM(amount) AS revenue, COUNT(*) AS bookings
     FROM payments WHERE status = 'success' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY d`,
    [days - 1]
  );
  const [tk] = await pool.execute(
    `SELECT DATE_FORMAT(p.paid_at, '%Y-%m-%d') AS d, COUNT(*) AS tickets
     FROM booking_seats bs JOIN payments p ON p.booking_id = bs.booking_id AND p.status = 'success'
     WHERE p.paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY d`,
    [days - 1]
  );
  return { rev, tk };
};

exports.revenueByMonth = async (months) => {
  const since = `DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? MONTH), '%Y-%m-01')`;
  const [rev] = await pool.execute(
    `SELECT DATE_FORMAT(paid_at, '%Y-%m') AS m, SUM(amount) AS revenue, COUNT(*) AS bookings
     FROM payments WHERE status = 'success' AND paid_at >= ${since} GROUP BY m`,
    [months - 1]
  );
  const [tk] = await pool.execute(
    `SELECT DATE_FORMAT(p.paid_at, '%Y-%m') AS m, COUNT(*) AS tickets
     FROM booking_seats bs JOIN payments p ON p.booking_id = bs.booking_id AND p.status = 'success'
     WHERE p.paid_at >= ${since} GROUP BY m`,
    [months - 1]
  );
  return { rev, tk };
};

// Phim bán chạy nhất theo số vé (chỉ tính đơn đã thanh toán); revenue = tiền vé, chưa gồm combo
exports.topMovies = async (limit) => {
  const [rows] = await pool.execute(
    `SELECT m.id, m.title, COUNT(bs.id) AS tickets, SUM(bs.price) AS revenue
     FROM booking_seats bs
     JOIN bookings b ON b.id = bs.booking_id AND b.status = 'paid'
     JOIN showtimes s ON s.id = b.showtime_id
     JOIN movies m ON m.id = s.movie_id
     GROUP BY m.id, m.title ORDER BY tickets DESC, revenue DESC LIMIT ${Number(limit)}`
  );
  return rows;
};

// Tỷ lệ lấp đầy = ghế đã bán / tổng ghế, của các suất từ 30 ngày trước đến 7 ngày tới
exports.occupancyByCinema = async () => {
  const [rows] = await pool.execute(
    `SELECT t.cinema_id, t.name, SUM(t.total_seats) AS total, SUM(t.sold) AS sold
     FROM (
       SELECT c.id AS cinema_id, c.name, r.total_seats,
              (SELECT COUNT(*) FROM booking_seats bs
                 JOIN bookings b ON b.id = bs.booking_id AND b.status = 'paid'
                WHERE bs.showtime_id = s.id) AS sold
       FROM showtimes s
       JOIN rooms r ON r.id = s.room_id
       JOIN cinemas c ON c.id = r.cinema_id
       WHERE s.is_active = 1
         AND s.start_time BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND DATE_ADD(NOW(), INTERVAL 7 DAY)
     ) t
     GROUP BY t.cinema_id, t.name ORDER BY t.name`
  );
  return rows;
};

exports.bookingStatusCounts = async () => {
  const [rows] = await pool.execute('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status');
  return rows;
};
