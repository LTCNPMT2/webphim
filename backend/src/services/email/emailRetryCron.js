// Background Cron Job quét các email gửi thất bại để retry tự động
const cron = require('node-cron');
const emailLogModel = require('../../models/emailLogModel');
const bookingModel = require('../../models/bookingModel');
const mailer = require('./mailer');
const templates = require('./emailTemplates');

let isProcessing = false;

/**
 * Xử lý retry cho 1 log email bị lỗi
 */
async function processFailedLog(log) {
  const nextRetryCount = (log.retry_count || 0) + 1;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    let emailContent = null;

    if (log.type === 'login') {
      const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : (log.payload || {});
      emailContent = templates.buildLoginEmail({
        name: payload.name || 'Quý khách',
        email: log.to_email,
        time: log.created_at,
        ip: payload.ip || '127.0.0.1',
        userAgent: payload.userAgent || '',
        clientUrl,
      });
    } else if (log.type === 'booking_paid' && log.order_id) {
      const cancelBeforeHours = parseInt(process.env.CANCEL_BEFORE_HOURS || '2', 10);
      const booking = await bookingModel.findDetailRow(log.order_id, cancelBeforeHours);
      if (!booking) {
        // Đơn hàng không còn tồn tại -> đánh dấu bỏ qua
        await emailLogModel.updateLogStatus(log.id, {
          status: 'failed',
          retry_count: 99,
          error: 'Đơn hàng không tồn tại trong database',
        });
        return;
      }

      const [seats, combos] = await Promise.all([
        bookingModel.getSeats(booking.id),
        bookingModel.getCombos(booking.id),
      ]);

      emailContent = await templates.buildBookingPaidEmail({
        booking,
        seats,
        combos,
        clientUrl,
      });
    }

    if (!emailContent) return;

    // Gửi lại email (thử 1 lần trong chu kỳ cron này)
    const result = await mailer.sendMailWithRetry({
      to: log.to_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: emailContent.attachments || [],
    }, 1);

    if (result.success) {
      await emailLogModel.updateLogStatus(log.id, {
        status: 'sent',
        retry_count: nextRetryCount,
        sent_at: new Date(),
        error: null,
      });
      console.log(`🔄 [EmailRetryCron] Gửi lại thành công email #${log.id} (${log.type}) tới ${log.to_email}`);
    } else {
      await emailLogModel.updateLogStatus(log.id, {
        status: 'failed',
        retry_count: nextRetryCount,
        error: result.error,
      });
      console.warn(`⚠️ [EmailRetryCron] Thử lại email #${log.id} lần ${nextRetryCount} thất bại: ${result.error}`);
    }
  } catch (err) {
    console.error(`❌ [EmailRetryCron] Ngoại lệ khi retry email #${log.id}:`, err.message);
    try {
      await emailLogModel.updateLogStatus(log.id, {
        status: 'failed',
        retry_count: nextRetryCount,
        error: err.message,
      });
    } catch {}
  }
}

/**
 * Khởi động cron job quét email lỗi (mặc định chạy mỗi 5 phút)
 */
exports.startEmailRetryJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const failedLogs = await emailLogModel.getFailedLogsForRetry(3, 10);
      if (failedLogs.length > 0) {
        console.log(`🔄 [EmailRetryCron] Tìm thấy ${failedLogs.length} email lỗi cần retry...`);
        for (const log of failedLogs) {
          await processFailedLog(log);
        }
      }
    } catch (err) {
      console.error('❌ [EmailRetryCron] Lỗi khi thực thi cron quét email:', err.message);
    } finally {
      isProcessing = false;
    }
  });

  console.log('🔄 Cron job tự động retry email lỗi đã được kích hoạt (chạy mỗi 5 phút)');
};
