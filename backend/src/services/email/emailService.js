// Service điều phối gửi email (Bất đồng bộ, Idempotent, Throttle, Logging)
const emailLogModel = require('../../models/emailLogModel');
const bookingModel = require('../../models/bookingModel');
const mailer = require('./mailer');
const templates = require('./emailTemplates');

/**
 * Trích xuất địa chỉ IP thực từ Express request
 */
function extractClientIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Gửi email thông báo đăng nhập (Bất đồng bộ & Chống spam trong 30 phút)
 * @param {Object} user { id, email, full_name }
 * @param {Object} req Express request
 */
exports.sendLoginNotification = async (user, req) => {
  if (!user || !user.email) return;

  // 1. Chống spam: kiểm tra xem tài khoản này đã được gửi thông báo trong 30 phút qua chưa
  try {
    const isThrottled = await emailLogModel.isLoginThrottled(user.id, 30);
    if (isThrottled) {
      console.log(`⏳ [EmailService] Bỏ qua gửi email đăng nhập cho user ${user.id} (${user.email}) - đã gửi trong 30 phút gần nhất.`);
      return;
    }
  } catch (err) {
    console.warn('⚠️ [EmailService] Lỗi khi kiểm tra throttle:', err.message);
  }

  // 2. Thu thập dữ liệu ngữ cảnh đăng nhập
  const ip = extractClientIp(req);
  const userAgent = req?.headers ? req.headers['user-agent'] : '';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const now = new Date();

  // 3. Ghi log khởi tạo (trạng thái pending)
  let logId = null;
  try {
    logId = await emailLogModel.createLog({
      user_id: user.id,
      order_id: null,
      type: 'login',
      to_email: user.email,
      status: 'pending',
      payload: { name: user.full_name, ip, userAgent, clientUrl },
    });
  } catch (err) {
    console.error('❌ [EmailService] Lỗi tạo log email_logs (login):', err.message);
  }

  // 4. Gửi email bất đồng bộ (chạy nền, không block tiến trình)
  setImmediate(async () => {
    try {
      const emailContent = templates.buildLoginEmail({
        name: user.full_name,
        email: user.email,
        time: now,
        ip,
        userAgent,
        clientUrl,
      });

      const result = await mailer.sendMailWithRetry({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (logId) {
        if (result.success) {
          await emailLogModel.updateLogStatus(logId, {
            status: 'sent',
            retry_count: result.attempts,
            sent_at: new Date(),
          });
          console.log(`✅ [EmailService] Đã gửi thông báo đăng nhập tới: ${user.email}`);
        } else {
          await emailLogModel.updateLogStatus(logId, {
            status: 'failed',
            retry_count: result.attempts,
            error: result.error,
          });
          console.error(`❌ [EmailService] Thất bại khi gửi email đăng nhập tới ${user.email}: ${result.error}`);
        }
      }
    } catch (sendErr) {
      console.error('❌ [EmailService] Ngoại lệ khi gửi email đăng nhập:', sendErr.message);
      if (logId) {
        try {
          await emailLogModel.updateLogStatus(logId, {
            status: 'failed',
            error: sendErr.message,
          });
        } catch {}
      }
    }
  });
};

/**
 * Gửi email xác nhận đặt vé & thanh toán thành công (Idempotent 100%)
 * @param {number|string} bookingIdOrCode ID hoặc mã code của đơn đặt vé
 */
exports.sendBookingPaidConfirmation = async (bookingIdOrCode) => {
  if (!bookingIdOrCode) return;

  // 1. Tìm thông tin chi tiết đơn hàng
  let bookingId = typeof bookingIdOrCode === 'number' ? bookingIdOrCode : null;
  if (!bookingId) {
    const found = await bookingModel.findByCode(String(bookingIdOrCode));
    if (found) bookingId = found.id;
  }

  if (!bookingId) {
    console.warn(`[EmailService] Không tìm thấy đơn hàng để gửi email: ${bookingIdOrCode}`);
    return;
  }

  // 2. Đảm bảo tính Idempotent: kiểm tra xem đơn hàng đã từng gửi email booking_paid thành công chưa
  try {
    const alreadySent = await emailLogModel.isBookingEmailSent(bookingId);
    if (alreadySent) {
      console.log(`ℹ️ [EmailService] Đơn #${bookingId} đã được gửi email xác nhận trước đó. Bỏ qua để tránh gửi trùng.`);
      return;
    }
  } catch (err) {
    console.warn('[EmailService] Kiểm tra idempotent thất bại:', err.message);
  }

  // Lấy chi tiết đơn đặt vé
  const cancelBeforeHours = parseInt(process.env.CANCEL_BEFORE_HOURS || '2', 10);
  const booking = await bookingModel.findDetailRow(bookingId, cancelBeforeHours);
  if (!booking) {
    console.warn(`[EmailService] Không tìm thấy chi tiết đơn #${bookingId}`);
    return;
  }

  const toEmail = booking.user_email;
  if (!toEmail) {
    console.warn(`[EmailService] Đơn #${bookingId} không có địa chỉ email người nhận`);
    return;
  }

  // 3. Tạo bản ghi email_logs (với ràng buộc UNIQUE uq_order_type)
  let logId = null;
  try {
    const existingLog = await emailLogModel.findByOrderAndType(bookingId, 'booking_paid');
    if (existingLog) {
      if (existingLog.status === 'sent') return; // Đã gửi thành công
      logId = existingLog.id;
    } else {
      logId = await emailLogModel.createLog({
        user_id: booking.user_id,
        order_id: booking.id,
        type: 'booking_paid',
        to_email: toEmail,
        status: 'pending',
        payload: { booking_id: booking.id, booking_code: booking.booking_code },
      });
    }
  } catch (dbErr) {
    // Nếu gặp lỗi Duplicate entry do 2 webhook gọi đồng thời cùng mili-giây
    if (dbErr.code === 'ER_DUP_ENTRY') {
      console.log(`ℹ️ [EmailService] Đã có tiến trình khác đang gửi mail cho đơn #${bookingId}. Idempotency kích hoạt.`);
      return;
    }
    console.error('❌ [EmailService] Lỗi tạo log email_logs (booking_paid):', dbErr.message);
  }

  // 4. Chuẩn bị nội dung và gửi email bất đồng bộ
  setImmediate(async () => {
    try {
      const [seats, combos] = await Promise.all([
        bookingModel.getSeats(booking.id),
        bookingModel.getCombos(booking.id),
      ]);

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const emailContent = await templates.buildBookingPaidEmail({
        booking,
        seats,
        combos,
        clientUrl,
      });

      const result = await mailer.sendMailWithRetry({
        to: toEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments: emailContent.attachments,
      });

      if (logId) {
        if (result.success) {
          await emailLogModel.updateLogStatus(logId, {
            status: 'sent',
            retry_count: result.attempts,
            sent_at: new Date(),
          });
          console.log(`✅ [EmailService] Đã gửi email xác nhận vé thành công cho đơn #${booking.booking_code} tới: ${toEmail}`);
        } else {
          await emailLogModel.updateLogStatus(logId, {
            status: 'failed',
            retry_count: result.attempts,
            error: result.error,
          });
          console.error(`❌ [EmailService] Thất bại khi gửi email vé cho đơn #${booking.booking_code}: ${result.error}`);
        }
      }
    } catch (err) {
      console.error(`❌ [EmailService] Ngoại lệ khi tạo và gửi email vé #${booking.id}:`, err.message);
      if (logId) {
        try {
          await emailLogModel.updateLogStatus(logId, {
            status: 'failed',
            error: err.message,
          });
        } catch {}
      }
    }
  });
};
