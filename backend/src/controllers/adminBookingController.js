const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const adminBookingService = require('../services/adminBookingService');
const bookingService = require('../services/bookingService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminBookingService.list(req.query), 'Lấy danh sách đơn đặt vé thành công');
});

exports.cancel = asyncHandler(async (req, res) => {
  const booking = await adminBookingService.cancel(req.user, req.params.id);
  sendSuccess(res, { booking }, 'Đã hủy đơn đặt vé');
});

exports.verifyTicket = asyncHandler(async (req, res) => {
  const ticket = await bookingService.verifyTicket(req.user, req.params.code);
  sendSuccess(res, { ticket }, 'Tra cứu vé thành công');
});

exports.checkIn = asyncHandler(async (req, res) => {
  const ticket = await bookingService.checkInTicket(req.user, req.body.booking_code);
  sendSuccess(res, { ticket }, 'Soát vé và check-in thành công');
});
