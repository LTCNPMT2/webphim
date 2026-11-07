const { body, query, param } = require('express-validator');

exports.listStaffRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim(),
  query('role').optional().isString().trim(),
  query('status').optional().isIn(['ACTIVE', 'LOCKED']).withMessage('Trạng thái không hợp lệ'),
];

exports.createStaffRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Họ và tên không được để trống')
    .isLength({ max: 100 })
    .withMessage('Họ tên tối đa 100 ký tự'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .withMessage('Email không đúng định dạng')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu nhân viên phải có tối thiểu 8 ký tự'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(0[3|5|7|8|9])[0-9]{8}$/)
    .withMessage('Số điện thoại không hợp lệ (10 chữ số)'),
  body('role_id')
    .notEmpty()
    .withMessage('Vui lòng chọn vai trò')
    .isInt({ min: 1 })
    .withMessage('Vai trò không hợp lệ'),
  body('cinema_id')
    .optional({ nullable: true })
    .custom((val) => val === null || Number.isInteger(Number(val)))
    .withMessage('Rạp phụ trách không hợp lệ'),
];

exports.updateStaffRules = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Họ và tên không được để trống')
    .isLength({ max: 100 }),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(0[3|5|7|8|9])[0-9]{8}$/)
    .withMessage('Số điện thoại không hợp lệ (10 chữ số)'),
  body('cinema_id')
    .optional({ nullable: true })
    .custom((val) => val === null || Number.isInteger(Number(val)))
    .withMessage('Rạp phụ trách không hợp lệ'),
];

exports.changeRoleRules = [
  body('role_id')
    .notEmpty()
    .withMessage('Vui lòng chọn vai trò')
    .isInt({ min: 1 })
    .withMessage('Vai trò không hợp lệ'),
];

exports.changeStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Vui lòng chọn trạng thái')
    .isIn(['ACTIVE', 'LOCKED'])
    .withMessage('Trạng thái phải là ACTIVE hoặc LOCKED'),
];

exports.resetPasswordRules = [
  body('new_password')
    .notEmpty()
    .withMessage('Mật khẩu mới không được để trống')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có tối thiểu 8 ký tự'),
];
