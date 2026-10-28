const { body } = require('express-validator');

exports.reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Điểm đánh giá phải từ 1 đến 5 sao').toInt(),
  body('comment').optional({ values: 'null' }).isString().withMessage('Nhận xét không hợp lệ')
    .trim().isLength({ max: 1000 }).withMessage('Nhận xét tối đa 1000 ký tự'),
];
