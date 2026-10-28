const { body, query } = require('express-validator');
const { parseLetterList } = require('../utils/parseList');

const ROOM_TYPES = ['2D', '3D', 'IMAX'];

const letterList = (field) =>
  body(field).optional()
    .customSanitizer(parseLetterList)
    .custom((v) => v.every((x) => /^[A-Z]$/.test(x)))
    .withMessage(`${field} phải là danh sách chữ cái hàng, ví dụ ["D","E"]`);

exports.listRoomRules = [
  query('cinema_id').optional().isInt({ min: 1 }).withMessage('cinema_id không hợp lệ').toInt(),
];

// Tạo phòng kèm cấu hình sơ đồ ghế
exports.createRoomRules = [
  body('cinema_id').isInt({ min: 1 }).withMessage('cinema_id không hợp lệ').toInt(),
  body('name').trim().notEmpty().withMessage('Tên phòng không được để trống')
    .isLength({ max: 50 }).withMessage('Tên phòng tối đa 50 ký tự'),
  body('room_type').optional().isIn(ROOM_TYPES).withMessage(`room_type phải là một trong: ${ROOM_TYPES.join(', ')}`),
  body('rows').isInt({ min: 1, max: 26 }).withMessage('Số hàng ghế phải từ 1 đến 26').toInt(),
  body('cols').isInt({ min: 1, max: 20 }).withMessage('Số ghế mỗi hàng phải từ 1 đến 20').toInt(),
  letterList('vip_rows'),
  letterList('couple_rows'),
  body('vip_surcharge').optional().isInt({ min: 0, max: 1000000 }).withMessage('Phụ thu VIP không hợp lệ').toInt(),
  body('couple_surcharge').optional().isInt({ min: 0, max: 1000000 }).withMessage('Phụ thu ghế đôi không hợp lệ').toInt(),
];

exports.updateRoomRules = [
  body('name').optional().trim().notEmpty().withMessage('Tên phòng không được để trống')
    .isLength({ max: 50 }).withMessage('Tên phòng tối đa 50 ký tự'),
  body('room_type').optional().isIn(ROOM_TYPES).withMessage(`room_type phải là một trong: ${ROOM_TYPES.join(', ')}`),
  body('is_active').optional().isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
];
