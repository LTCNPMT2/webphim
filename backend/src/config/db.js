// Connection pool MySQL (dùng chung toàn app). Luôn dùng pool.execute(sql, [params])
// để có prepared statement -> chống SQL Injection.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00', // giờ Việt Nam
  dateStrings: ['DATE'], // cột DATE (vd release_date) trả về 'YYYY-MM-DD', tránh lệch ngày do múi giờ
});

// Đặt múi giờ cho MỖI kết nối MySQL: NOW(), CURDATE() sẽ cùng giờ Việt Nam với phía Node
// (quan trọng cho giờ hết hạn giữ ghế và giờ chiếu)
pool.pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00'");
});

// Thử lấy 1 kết nối để biết DB có hoạt động không
async function testConnection() {
  const conn = await pool.getConnection();
  conn.release();
}

module.exports = { pool, testConnection };
