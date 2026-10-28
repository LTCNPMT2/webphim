const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const bookingService = require('../services/bookingService');
const paymentService = require('../services/paymentService');
const comboModel = require('../models/comboModel');
const promotionService = require('../services/promotionService');

exports.create = asyncHandler(async (req, res) => {
  const booking = await bookingService.create(req.user, req.body);
  sendSuccess(res, { booking }, 'Giữ ghế thành công. Vui lòng thanh toán trước khi hết hạn', 201);
});

exports.listMine = asyncHandler(async (req, res) => {
  sendSuccess(res, await bookingService.listMine(req.user, req.query), 'Lấy lịch sử đặt vé thành công');
});

exports.getById = asyncHandler(async (req, res) => {
  sendSuccess(res, { booking: await bookingService.getDetail(req.user, req.params.id) }, 'Lấy chi tiết đơn thành công');
});

exports.cancel = asyncHandler(async (req, res) => {
  sendSuccess(res, { booking: await bookingService.cancel(req.user, req.params.id) }, 'Hủy vé thành công');
});

exports.pay = asyncHandler(async (req, res) => {
  const { booking_id, method, simulate_fail } = req.body;
  const booking = await paymentService.pay(req.user, { booking_id, method, simulate_fail });
  sendSuccess(res, { booking }, 'Thanh toán thành công');
});

exports.listCombos = asyncHandler(async (req, res) => {
  sendSuccess(res, { combos: await comboModel.listActive() }, 'Lấy danh sách combo thành công');
});

exports.validatePromo = asyncHandler(async (req, res) => {
  const result = await promotionService.preview(req.body.code, req.body.subtotal);
  sendSuccess(res, result, 'Áp dụng mã giảm giá thành công');
});
