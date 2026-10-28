const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/transaction');
const bookingModel = require('../models/bookingModel');
const paymentModel = require('../models/paymentModel');
const bookingService = require('./bookingService');

// Thanh toán GIẢ LẬP. Sau này muốn tích hợp VNPay/MoMo sandbox thì thay phần "tạo giao dịch" bên dưới,
// các bước kiểm tra đơn và cập nhật trạng thái giữ nguyên.
exports.pay = async (user, { booking_id, method = 'mock', simulate_fail = false }) => {
  let outcome = 'paid';

  await withTransaction(async (conn) => {
    const booking = await bookingModel.lockBooking(conn, booking_id);
    if (!booking || booking.user_id !== user.id) throw new ApiError(404, 'Không tìm thấy đơn đặt vé');

    if (booking.status === 'paid') throw new ApiError(409, 'Đơn đặt vé đã được thanh toán');
    if (booking.status === 'cancelled') throw new ApiError(409, 'Đơn đặt vé đã bị hủy');

    // Hết hạn giữ ghế: nhả ghế luôn, báo khách đặt lại
    if (booking.status === 'expired' || Number(booking.is_expired) === 1) {
      await bookingModel.expirePending(conn, booking.showtime_id);
      outcome = 'expired';
      return;
    }

    // Cờ simulate_fail chỉ có tác dụng ngoài môi trường production (để test luồng thất bại)
    if (simulate_fail && process.env.NODE_ENV !== 'production') {
      await paymentModel.create(conn, {
        booking_id, method, amount: booking.total_amount, status: 'failed',
      });
      outcome = 'failed';
      return; // commit để lưu lại lần thanh toán thất bại; đơn vẫn pending, khách thử lại được
    }

    await paymentModel.create(conn, {
      booking_id,
      method,
      amount: booking.total_amount,
      status: 'success',
      transaction_code: `MOCK-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
    });
    await bookingModel.markPaid(conn, booking_id);
  });

  if (outcome === 'expired') {
    throw new ApiError(410, 'Đơn đặt vé đã hết hạn giữ ghế. Vui lòng đặt lại');
  }
  if (outcome === 'failed') {
    throw new ApiError(402, 'Thanh toán thất bại. Vui lòng thử lại');
  }
  return bookingService.getDetail(user, booking_id);
};
