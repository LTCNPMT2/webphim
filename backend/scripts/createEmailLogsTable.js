const { pool } = require('../src/config/db');

async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NULL,
      order_id INT UNSIGNED NULL,
      type ENUM('login', 'booking_paid') NOT NULL,
      to_email VARCHAR(255) NOT NULL,
      status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
      retry_count INT NOT NULL DEFAULT 0,
      error TEXT NULL,
      payload JSON NULL,
      metadata JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP NULL,
      UNIQUE KEY uq_order_type (order_id, type),
      INDEX idx_status_retry (status, retry_count),
      INDEX idx_user_type_created (user_id, type, created_at),
      CONSTRAINT fk_email_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_email_logs_booking FOREIGN KEY (order_id) REFERENCES bookings(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.execute(sql);
    console.log('✅ Bảng email_logs đã được tạo thành công.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi tạo bảng email_logs:', err);
    process.exit(1);
  }
}

migrate();
