const { body } = require('express-validator');
const { parseDateTime } = require('../utils/datetime');

const dateRule = (name, label) =>
  body(name).custom((v) => parseDateTime(v) !== null)
    .withMessage(`${label} phải có dạng YYYY-MM-DD HH:mm (ngày giờ có thật)`);

// requireCode = true khi thêm mới. Khi sửa, code bị bỏ qua (không cho đổi mã)
const promotionBody = (requireCode) => [
  ...(requireCode
    ? [body('code').trim().toUpperCase().matches(/^[A-Z0-9_-]{3,30}$/)
        .withMessage('Mã gồm 3 đến 30 ký tự: chữ không dấu, số, gạch ngang hoặc gạch dưới')]
    : []),
  body('description').optional().trim().isLength({ max: 255 }).withMessage('Mô tả tối đa 255 ký tự'),
  body('discount_type').isIn(['percent', 'fixed']).withMessage('Loại giảm giá phải là percent hoặc fixed'),
  body('discount_value').isInt({ min: 1, max: 100000000 }).withMessage('Giá trị giảm không hợp lệ').toInt()
    .bail()
    .custom((v, { req }) => req.body.discount_type !== 'percent' || v <= 100)
    .withMessage('Giảm theo phần trăm tối đa 100%'),
  body('max_discount').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Mức giảm tối đa không hợp lệ').toInt(),
  body('min_order').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Đơn tối thiểu không hợp lệ').toInt(),
  dateRule('start_date', 'Ngày bắt đầu'),
  dateRule('end_date', 'Ngày kết thúc'),
  body('usage_limit').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Số lượt dùng phải từ 1 trở lên').toInt(),
  body('is_active').optional().isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
];

exports.createPromotionRules = promotionBody(true);
exports.updatePromotionRules = promotionBody(false);
