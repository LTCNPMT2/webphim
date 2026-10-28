const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const adminBookingService = require('../services/adminBookingService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminBookingService.list(req.query), 'Lấy danh sách đơn đặt vé thành công');
});

exports.cancel = asyncHandler(async (req, res) => {
  const booking = await adminBookingService.cancel(req.user, req.params.id);
  sendSuccess(res, { booking }, 'Đã hủy đơn đặt vé');
});
