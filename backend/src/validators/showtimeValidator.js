const { body, query } = require('express-validator');
const { parseDateTime } = require('../utils/datetime');
const { pageQuery } = require('./commonValidator');

const startTimeRule = (chain) =>
  chain.custom((v) => parseDateTime(v) !== null)
    .withMessage('Giờ chiếu phải có dạng YYYY-MM-DD HH:mm (ngày giờ có thật)');

const showtimeBody = (required) => {
  const f = (name) => (required ? body(name) : body(name).optional());
  return [
    f('movie_id').isInt({ min: 1 }).withMessage('movie_id không hợp lệ').toInt(),
    f('room_id').isInt({ min: 1 }).withMessage('room_id không hợp lệ').toInt(),
    startTimeRule(f('start_time')),
    f('base_price').isInt({ min: 1000, max: 10000000 }).withMessage('Giá vé phải từ 1.000 đến 10.000.000').toInt(),
    body('is_active').optional().isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
  ];
};

exports.createShowtimeRules = showtimeBody(true);
exports.updateShowtimeRules = showtimeBody(false);

const filters = [
  query('movie_id').optional().isInt({ min: 1 }).withMessage('movie_id không hợp lệ').toInt(),
  query('cinema_id').optional().isInt({ min: 1 }).withMessage('cinema_id không hợp lệ').toInt(),
  query('date').optional().isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage('date phải có dạng YYYY-MM-DD'),
];

exports.listShowtimeRules = filters;
exports.adminListShowtimeRules = [...filters, ...pageQuery];
