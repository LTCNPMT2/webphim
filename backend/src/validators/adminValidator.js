const { body, query } = require('express-validator');
const { pageQuery } = require('./commonValidator');

const dateQuery = (name) =>
  query(name).optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage(`${name} phải có dạng YYYY-MM-DD`);

exports.statsRules = [
  query('days').optional().isIn(['7', '30', '90']).withMessage('days chỉ nhận 7, 30 hoặc 90'),
];

exports.listUserRules = [
  query('search').optional().isString().withMessage('search không hợp lệ'),
  query('role').optional({ values: 'falsy' }).isIn(['user', 'admin']).withMessage('role chỉ nhận user hoặc admin'),
  query('status').optional({ values: 'falsy' }).isIn(['active', 'locked']).withMessage('status chỉ nhận active hoặc locked'),
  ...pageQuery,
];

exports.userStatusRules = [
  body('is_active').isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
];

exports.listAdminBookingRules = [
  query('status').optional({ values: 'falsy' }).isIn(['pending', 'paid', 'cancelled', 'expired'])
    .withMessage('status phải là pending, paid, cancelled hoặc expired'),
  query('search').optional().isString().withMessage('search không hợp lệ'),
  dateQuery('date_from'),
  dateQuery('date_to'),
  ...pageQuery,
];
