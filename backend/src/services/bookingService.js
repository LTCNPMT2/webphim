const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/transaction');
const { parsePagination, buildMeta } = require('../utils/pagination');
const bookingModel = require('../models/bookingModel');
const seatModel = require('../models/seatModel');
const comboModel = require('../models/comboModel');
const promotionModel = require('../models/promotionModel');
const paymentModel = require('../models/paymentModel');
const promotionService = require('./promotionService');

const MAX_SEATS = 8;            // tối đa ghế / đơn
const MAX_PENDING = 3;          // tối đa đơn đang giữ ghế cùng lúc của 1 người (chống giữ ghế hàng loạt)
const MAX_COMBO_QTY = 10;
const HOLD_MINUTES = () => Number(process.env.HOLD_MINUTES) || 10;
const CANCEL_HOURS = () => Number(process.env.CANCEL_BEFORE_HOURS) || 2;

// Mã vé dạng MV + 8 ký tự (bỏ các ký tự dễ nhầm như 0/O, 1/I)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = () =>
  'MV' + Array.from(crypto.randomBytes(8), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');

const seatLabel = (s) => `${s.row_label}${s.seat_number}`;

// ===================== ĐẶT VÉ =====================
// Toàn bộ chạy trong 1 transaction. Cách chống đặt trùng ghế (2 lớp):
//  1) Khóa dòng suất chiếu (SELECT ... FOR UPDATE): các đơn của cùng suất xếp hàng, người sau sẽ
//     thấy ghế đã bị người trước giữ.
//  2) UNIQUE(showtime_id, seat_id, active) trong DB: dù code có sót, DB vẫn từ chối ghế trùng.
exports.create = async (user, { showtime_id, seat_ids, combos = [], promo_code }) => {
  const seatIds = [...new Set(seat_ids)];
  if (seatIds.length !== seat_ids.length) throw new ApiError(400, 'Danh sách ghế bị trùng lặp');
  if (seatIds.length > MAX_SEATS) throw new ApiError(400, `Mỗi đơn đặt tối đa ${MAX_SEATS} ghế`);

  // Gộp combo trùng id (vd 2 dòng cùng combo 1 -> cộng số lượng)
  const comboQty = new Map();
  for (const c of combos) comboQty.set(c.combo_id, (comboQty.get(c.combo_id) || 0) + c.quantity);
  for (const q of comboQty.values()) {
    if (q > MAX_COMBO_QTY) throw new ApiError(400, `Mỗi loại combo tối đa ${MAX_COMBO_QTY} phần`);
  }

  let bookingId;
  try {
    bookingId = await withTransaction(async (conn) => {
      // 1. Khóa suất chiếu + kiểm tra còn bán được không
      const showtime = await bookingModel.lockShowtime(conn, showtime_id);
      if (!showtime || !showtime.is_active) throw new ApiError(404, 'Không tìm thấy suất chiếu');
      if (Number(showtime.is_future) !== 1) throw new ApiError(400, 'Suất chiếu đã bắt đầu, không thể đặt vé');

      // 2. Nhả ghế của các đơn hết hạn thuộc suất này (để khách khác đặt được ngay, không đợi cron)
      await bookingModel.expirePending(conn, showtime_id);

      if ((await bookingModel.countActivePendingByUser(conn, user.id)) >= MAX_PENDING) {
        throw new ApiError(429, `Bạn đang giữ ghế ở ${MAX_PENDING} đơn chưa thanh toán. Hãy thanh toán hoặc hủy bớt trước khi đặt thêm`);
      }

      // 3. Ghế phải thuộc phòng của suất chiếu và đang trống
      const seats = await seatModel.findByIdsInRoom(conn, seatIds, showtime.room_id);
      if (seats.length !== seatIds.length) {
        throw new ApiError(400, 'Có ghế không tồn tại hoặc không thuộc phòng chiếu của suất này');
      }
      const taken = await seatModel.findTaken(conn, showtime_id, seatIds);
      if (taken.length) {
        throw new ApiError(409, `Ghế ${taken.map(seatLabel).join(', ')} đã có người đặt hoặc đang được giữ. Vui lòng chọn ghế khác`);
      }

      // 4. Tính tiền: GIÁ LẤY TỪ DB, không tin giá client gửi lên
      const seatRows = seats.map((s) => ({ ...s, price: showtime.base_price + s.price_surcharge }));
      const seatTotal = seatRows.reduce((sum, s) => sum + s.price, 0);

      const comboRows = await comboModel.findActiveByIds(conn, [...comboQty.keys()]);
      if (comboRows.length !== comboQty.size) throw new ApiError(400, 'Có combo không tồn tại hoặc đã ngừng bán');
      const comboTotal = comboRows.reduce((sum, c) => sum + c.price * comboQty.get(c.id), 0);

      const subtotal = seatTotal + comboTotal;

      // 5. Mã giảm giá (nếu có): kiểm tra rồi giữ 1 lượt dùng
      let discount = 0;
      let promotionId = null;
      if (promo_code) {
        const result = await promotionService.validate(promo_code, subtotal, conn);
        if ((await promotionModel.reserve(conn, result.promotion.id)) === 0) {
          throw new ApiError(400, 'Mã giảm giá đã hết lượt sử dụng');
        }
        discount = result.discount;
        promotionId = result.promotion.id;
      }

      // 6. Lưu đơn + ghế + combo
      const id = await bookingModel.insertBooking(conn, {
        booking_code: generateCode(),
        user_id: user.id,
        showtime_id,
        promotion_id: promotionId,
        subtotal,
        discount_amount: discount,
        total_amount: subtotal - discount,
      }, HOLD_MINUTES());
      await bookingModel.insertSeats(conn, seatRows.map((s) => [id, showtime_id, s.id, s.price]));
      await bookingModel.insertCombos(
        conn,
        comboRows.map((c) => [id, c.id, comboQty.get(c.id), c.price])
      );
      return id;
    });
  } catch (err) {
    // Vi phạm UNIQUE của booking_seats = lớp bảo vệ thứ 2 phát hiện ghế vừa bị người khác lấy
    if (err.code === 'ER_DUP_ENTRY' && String(err.message).includes('uq_bs_showtime_seat_active')) {
      throw new ApiError(409, 'Ghế vừa bị người khác đặt, vui lòng chọn ghế khác');
    }
    throw err;
  }

  return exports.getDetail(user, bookingId);
};

// ===================== XEM CHI TIẾT / LỊCH SỬ =====================
exports.getDetail = async (user, id) => {
  const row = await bookingModel.findDetailRow(id, CANCEL_HOURS());
  // Người khác không được xem đơn của mình (trả 404 để không lộ đơn có tồn tại)
  if (!row || (row.user_id !== user.id && user.role !== 'admin')) {
    throw new ApiError(404, 'Không tìm thấy đơn đặt vé');
  }

  const [seats, combos, payments] = await Promise.all([
    bookingModel.getSeats(id),
    bookingModel.getCombos(id),
    bookingModel.getPayments(id),
  ]);

  return {
    id: row.id,
    booking_code: row.booking_code,
    qr_content: row.booking_code, // nội dung để frontend vẽ mã QR
    status: row.status,
    expires_at: row.expires_at,
    // Số giây còn lại để thanh toán (do SERVER tính, frontend dùng để đếm ngược, không phụ thuộc giờ máy khách)
    seconds_left: row.seconds_left === null ? null : Number(row.seconds_left),
    created_at: row.created_at,
    cancelled_at: row.cancelled_at,
    subtotal: row.subtotal,
    discount_amount: row.discount_amount,
    total_amount: row.total_amount,
    promotion_code: row.promotion_code,
    can_cancel: Number(row.can_cancel) === 1,
    user: {
      id: row.user_id,
      full_name: row.user_name,
      email: row.user_email,
      phone: row.user_phone,
    },
    showtime: { id: row.showtime_id, start_time: row.start_time, end_time: row.end_time },
    movie: {
      id: row.movie_id, title: row.movie_title, poster_url: row.poster_url,
      duration_minutes: row.duration_minutes, age_rating: row.age_rating,
    },
    cinema: { name: row.cinema_name, address: row.cinema_address },
    room: { name: row.room_name, room_type: row.room_type },
    seats: seats.map((s) => ({ label: `${s.row_label}${s.seat_number}`, seat_type: s.seat_type, price: s.price })),
    combos,
    payments,
  };
};

exports.listMine = async (user, query) => {
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 10, maxLimit: 50 });
  const { rows, total } = await bookingModel.listByUser(user.id, query.status, { limit, offset });
  return { items: rows, pagination: buildMeta(page, limit, total) };
};

// ===================== HỦY VÉ =====================
// asAdmin = true: admin hủy đơn của người khác và không bị giới hạn thời gian hủy
exports.cancel = async (user, id, { asAdmin = false } = {}) => {
  let expired = false;

  await withTransaction(async (conn) => {
    const booking = await bookingModel.lockBooking(conn, id);
    if (!booking || (!asAdmin && booking.user_id !== user.id)) throw new ApiError(404, 'Không tìm thấy đơn đặt vé');

    if (booking.status === 'cancelled') throw new ApiError(409, 'Đơn đã được hủy trước đó');

    // Đơn pending quá hạn (hoặc đã expired): chuyển hẳn sang expired rồi báo lại
    if (booking.status === 'expired' || (booking.status === 'pending' && Number(booking.is_expired) === 1)) {
      await bookingModel.expirePending(conn, booking.showtime_id);
      expired = true;
      return;
    }

    // Vé đã thanh toán chỉ được hủy trước giờ chiếu ít nhất N giờ
    if (booking.status === 'paid' && !asAdmin) {
      const timing = await bookingModel.getShowtimeTiming(conn, booking.showtime_id, CANCEL_HOURS());
      if (!timing.cancel_ok) {
        throw new ApiError(400, `Chỉ được hủy vé trước giờ chiếu ít nhất ${CANCEL_HOURS()} giờ`);
      }
    }

    await bookingModel.releaseSeats(conn, id); // nhả ghế
    await bookingModel.markCancelled(conn, id);
    if (booking.status === 'paid') await paymentModel.refundByBooking(conn, id); // hoàn tiền (giả lập)
    if (booking.promotion_id) await bookingModel.releasePromotion(conn, booking.promotion_id);
  });

  if (expired) throw new ApiError(409, 'Đơn đặt vé đã hết hạn giữ ghế');
  return exports.getDetail(user, id);
};
