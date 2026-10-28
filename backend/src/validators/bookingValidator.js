const { body, query } = require('express-validator');
const { parseIdList } = require('../utils/parseList');
const { pageQuery } = require('./commonValidator');

exports.createBookingRules = [
  body('showtime_id').isInt({ min: 1 }).withMessage('showtime_id không hợp lệ').toInt(),
  body('seat_ids')
    .customSanitizer(parseIdList)
    .custom((v) => v.length >= 1 && v.every((n) => Number.isInteger(n) && n > 0))
    .withMessage('Vui lòng chọn ít nhất 1 ghế (seat_ids là danh sách id ghế)')
    .bail()
    .custom((v) => v.length <= 8)
    .withMessage('Mỗi đơn đặt tối đa 8 ghế'),
  body('combos').optional().isArray({ max: 10 }).withMessage('combos phải là danh sách (tối đa 10 loại)'),
  body('combos.*.combo_id').isInt({ min: 1 }).withMessage('combo_id không hợp lệ').toInt(),
  body('combos.*.quantity').isInt({ min: 1, max: 10 }).withMessage('Số lượng combo phải từ 1 đến 10').toInt(),
  body('promo_code').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 })
    .withMessage('Mã giảm giá không hợp lệ'),
];

exports.listBookingRules = [
  query('status').optional().isIn(['pending', 'paid', 'cancelled', 'expired'])
    .withMessage('status phải là pending, paid, cancelled hoặc expired'),
  ...pageQuery,
];

exports.payRules = [
  body('booking_id').isInt({ min: 1 }).withMessage('booking_id không hợp lệ').toInt(),
  body('method').optional().isIn(['mock']).withMessage('Hiện chỉ hỗ trợ thanh toán giả lập (method = "mock")'),
  body('simulate_fail').optional().isBoolean().toBoolean(),
];

exports.validatePromoRules = [
  body('code').isString().trim().notEmpty().withMessage('Vui lòng nhập mã giảm giá')
    .isLength({ max: 30 }).withMessage('Mã giảm giá không hợp lệ'),
  body('subtotal').isInt({ min: 0 }).withMessage('subtotal không hợp lệ').toInt(),
];
