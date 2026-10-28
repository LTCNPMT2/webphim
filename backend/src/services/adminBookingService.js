const { parsePagination, buildMeta } = require('../utils/pagination');
const adminBookingModel = require('../models/adminBookingModel');
const bookingService = require('./bookingService');

exports.list = async (query) => {
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });
  const { rows, total } = await adminBookingModel.list(query, { limit, offset });
  return { items: rows, pagination: buildMeta(page, limit, total) };
};

// Admin hủy đơn của bất kỳ ai, không bị giới hạn "trước giờ chiếu N giờ" (vd xử lý sự cố, khách yêu cầu hỗ trợ)
exports.cancel = (admin, id) => bookingService.cancel(admin, id, { asAdmin: true });
