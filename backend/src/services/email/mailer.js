// Universal Email Transporter sử dụng Nodemailer (Hỗ trợ Gmail App Password, Brevo, Resend, Mailgun, v.v.)
const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Khởi tạo hoặc lấy Transporter Nodemailer dựa trên biến môi trường (.env)
 */
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️ [Mailer] Chưa cấu hình SMTP_USER hoặc SMTP_PASS trong file .env. Hệ thống đang chạy ở chế độ MOCK email.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Tùy chọn timeout phòng trường hợp mạng chậm
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

/**
 * Hàm sleep hỗ trợ exponential backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gửi mail với cơ chế retry tức thì (exponential backoff: 1s, 2s, 4s...)
 * @param {Object} options { to, subject, html, text, attachments }
 * @param {number} maxRetries Số lần thử lại tối đa (mặc định 3)
 * @returns {Promise<Object>} { success, messageId, error, attempts }
 */
exports.sendMailWithRetry = async (
  { to, subject, html, text, attachments = [] },
  maxRetries = 3
) => {
  const fromName = process.env.MAIL_FROM_NAME || 'Cine Star Booking';
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || 'no-reply@cineticket.vn';
  const from = `"${fromName}" <${fromAddress}>`;

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const client = getTransporter();

  // Chế độ mô phỏng khi chưa điền SMTP trong .env
  if (!client) {
    console.log(`📨 [MOCK EMAIL] Gửi đến: ${to} | Tiêu đề: ${subject}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mock: true,
      attempts: 1,
    };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await client.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [Mailer] Lần gửi thứ ${attempt}/${maxRetries} thất bại tới ${to}: ${err.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s (1000ms), 2s (2000ms), 4s (4000ms)...
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    error: lastError ? lastError.message : 'Unknown email sending error',
    attempts: maxRetries,
  };
};

/**
 * Kiểm tra kết nối SMTP (dùng cho debug/healthcheck)
 */
exports.verifyConnection = async () => {
  const client = getTransporter();
  if (!client) return { connected: false, message: 'Chưa cấu hình SMTP credentials' };
  try {
    await client.verify();
    return { connected: true, message: 'SMTP kết nối thành công!' };
  } catch (err) {
    return { connected: false, message: err.message };
  }
};
