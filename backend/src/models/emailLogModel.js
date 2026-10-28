// Model xử lý dữ liệu bảng email_logs (Idempotent & Audit log)
const { pool } = require('../config/db');

/**
 * Tạo bản ghi log gửi email mới
 * @param {Object} param0 
 */
exports.createLog = async ({
  user_id = null,
  order_id = null,
  type,
  to_email,
  status = 'pending',
  retry_count = 0,
  error = null,
  payload = null,
  metadata = null,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO email_logs 
      (user_id, order_id, type, to_email, status, retry_count, error, payload, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      user_id,
      order_id,
      type,
      to_email,
      status,
      retry_count,
      error ? String(error).slice(0, 1000) : null,
      payload ? JSON.stringify(payload) : null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  return result.insertId;
};

/**
 * Cập nhật trạng thái log email sau khi gửi hoặc sau khi retry
 */
exports.updateLogStatus = async (id, { status, retry_count, error = null, sent_at = null }) => {
  const fields = ['status = ?'];
  const params = [status];

  if (retry_count !== undefined) {
    fields.push('retry_count = ?');
    params.push(retry_count);
  }

  if (error !== undefined) {
    fields.push('error = ?');
    params.push(error ? String(error).slice(0, 1000) : null);
  }

  if (sent_at !== undefined) {
    fields.push('sent_at = ?');
    params.push(sent_at);
  }

  params.push(id);

  await pool.execute(
    `UPDATE email_logs SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
};

/**
 * Kiểm tra xem đơn đặt vé đã được gửi email xác nhận thành công chưa (Idempotency)
 * @param {number} orderId 
 * @returns {Promise<boolean>}
 */
exports.isBookingEmailSent = async (orderId) => {
  const [rows] = await pool.execute(
    `SELECT id, status FROM email_logs 
     WHERE order_id = ? AND type = 'booking_paid' AND status = 'sent' 
     LIMIT 1`,
    [orderId]
  );
  return rows.length > 0;
};

/**
 * Tìm log email của một đơn đặt vé theo order_id và type
 */
exports.findByOrderAndType = async (orderId, type = 'booking_paid') => {
  const [rows] = await pool.execute(
    `SELECT * FROM email_logs WHERE order_id = ? AND type = ? LIMIT 1`,
    [orderId, type]
  );
  return rows[0] || null;
};

/**
 * Kiểm tra xem người dùng có đăng nhập và đã gửi mail trong N phút gần nhất không (Anti-spam throttle)
 * @param {number} userId 
 * @param {number} intervalMinutes Mặc định 30 phút
 * @returns {Promise<boolean>} true nếu cần chặn gửi (throttle)
 */
exports.isLoginThrottled = async (userId, intervalMinutes = 30) => {
  if (!userId) return false;
  const [rows] = await pool.execute(
    `SELECT id FROM email_logs 
     WHERE user_id = ? AND type = 'login' AND status = 'sent'
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     LIMIT 1`,
    [userId, intervalMinutes]
  );
  return rows.length > 0;
};

/**
 * Lấy danh sách các email bị lỗi cần retry (dùng cho Cron Job)
 * @param {number} maxRetries Mặc định 3 lần
 * @param {number} limit Số lượng log xử lý mỗi lượt
 */
exports.getFailedLogsForRetry = async (maxRetries = 3, limit = 10) => {
  const [rows] = await pool.execute(
    `SELECT * FROM email_logs 
     WHERE status = 'failed' AND retry_count < ? 
     ORDER BY created_at ASC 
     LIMIT ?`,
    [maxRetries, limit]
  );
  return rows;
};
