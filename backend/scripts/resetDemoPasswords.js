// Đặt lại mật khẩu 3 tài khoản demo trong seed.sql thành "password".
// Chỉ cần chạy nếu đăng nhập tài khoản demo bị báo sai mật khẩu:  npm run reset:demo-passwords
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

(async () => {
  try {
    const hash = await bcrypt.hash('password', 10);
    const [result] = await pool.execute(
      "UPDATE users SET password_hash = ? WHERE email IN ('admin@cinema.vn','an@example.com','binh@example.com')",
      [hash]
    );
    console.log(`✅ Đã đặt lại mật khẩu cho ${result.affectedRows} tài khoản (mật khẩu: password)`);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await pool.end();
  }
})();
