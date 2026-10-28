// Điểm khởi động: nạp .env -> kiểm tra DB -> chạy server (Updated with Email Service)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Nạp .env chính xác từ thư mục backend

const app = require('./src/app');
const { testConnection } = require('./src/config/db');
const { startExpiryJob } = require('./src/services/expiryService');
const { startEmailRetryJob } = require('./src/services/email/emailRetryCron');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('Thiếu JWT_SECRET trong file .env');
    }
    await testConnection();
    console.log('✅ Kết nối MySQL thành công');

    app.listen(PORT, () => {
      console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
      startExpiryJob(); // tự nhả ghế khi đơn hết hạn
      startEmailRetryJob(); // tự động quét và thử lại email lỗi
    });
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err.message);
    process.exit(1);
  }
})();
