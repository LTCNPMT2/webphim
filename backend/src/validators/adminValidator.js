const { body, query } = require('express-validator');
const { pageQuery } = require('./commonValidator');

const dateQuery = (name) =>
  query(name)
    .optional({ values: 'falsy' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
    .withMessage(`${name} phải có dạng YYYY-MM-DD`);

exports.statsRules = [
  query('days').optional().isIn(['7', '30', '90']).withMessage('days chỉ nhận 7, 30 hoặc 90'),
];

exports.listUserRules = [
  query('search').optional().isString().withMessage('search không hợp lệ'),
  query('role')
    .optional({ values: 'falsy' })
    .isIn(['user', 'staff', 'admin'])
    .withMessage('role chỉ nhận user, staff hoặc admin'),
  query('status')
    .optional({ values: 'falsy' })
    .isIn(['active', 'locked'])
    .withMessage('status chỉ nhận active hoặc locked'),
  ...pageQuery,
];

exports.userStatusRules = [
  body('is_active').isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
];

exports.userRoleRules = [
  body('role').isIn(['user', 'staff', 'admin']).withMessage('role phải là user, staff hoặc admin'),
  body('staff_title').optional({ nullable: true }).isString().trim(),
  body('permissions').optional({ nullable: true }).isArray().withMessage('permissions phải là mảng các quyền'),
];

exports.createStaffRules = [
  body('full_name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Họ tên từ 2 đến 100 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('phone').optional({ values: 'falsy' }).isString().trim(),
  body('role').optional().isIn(['staff', 'admin']).withMessage('role phải là staff hoặc admin'),
  body('staff_title').optional({ nullable: true }).isString().trim(),
  body('permissions').optional({ nullable: true }).isArray().withMessage('permissions phải là mảng các quyền'),
];

exports.checkInRules = [
  body('booking_code').isString().trim().notEmpty().withMessage('Mã vé không được để trống'),
];

exports.listAdminBookingRules = [
  query('status')
    .optional({ values: 'falsy' })
    .isIn(['pending', 'paid', 'cancelled', 'expired'])
    .withMessage('status phải là pending, paid, cancelled hoặc expired'),
  query('search').optional().isString().withMessage('search không hợp lệ'),
  dateQuery('date_from'),
  dateQuery('date_to'),
  ...pageQuery,
];
