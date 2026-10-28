const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const sepayService = require('../services/sepayService');

// Lấy thông tin & link mã QR SePay / VietQR cho đơn
exports.getPaymentInfo = asyncHandler(async (req, res) => {
  const data = await sepayService.getPaymentInfo(req.user, req.params.bookingId);
  sendSuccess(res, data, 'Lấy thông tin thanh toán SePay thành công');
});

// Kiểm tra giao dịch từ SePay theo bookingId
exports.checkPayment = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const data = await sepayService.checkPayment(req.user, req.params.bookingId, code);
  sendSuccess(res, data, data.paid ? 'Đã nhận được thanh toán' : 'Chưa nhận được thanh toán');
});

// Kiểm tra giao dịch từ SePay trực tiếp theo mã booking_code
exports.checkPaymentByCode = asyncHandler(async (req, res) => {
  const code = req.params.code || req.query.code;
  const data = await sepayService.checkPayment(req.user, null, code);
  sendSuccess(res, data, data.paid ? 'Đã nhận được thanh toán' : 'Chưa nhận được thanh toán');
});

// Nhận webhook từ SePay khi có giao dịch
exports.webhook = asyncHandler(async (req, res) => {
  const result = await sepayService.handleWebhook(req.body);
  res.status(200).json(result);
});
