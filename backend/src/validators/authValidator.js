const { body } = require('express-validator');

// Quy tắc mật khẩu mới: 8-72 ký tự (bcrypt chỉ dùng tối đa 72 byte), có chữ và số
const strongPassword = (field) =>
  body(field)
    .isString().withMessage('Mật khẩu không hợp lệ')
    .isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
    .isLength({ max: 72 }).withMessage('Mật khẩu tối đa 72 ký tự')
    .matches(/[A-Za-z]/).withMessage('Mật khẩu phải có ít nhất 1 chữ cái')
    .matches(/\d/).withMessage('Mật khẩu phải có ít nhất 1 chữ số');

const phoneRule = body('phone')
  .optional({ values: 'falsy' })
  .trim()
  .matches(/^(0|\+84)\d{9,10}$/).withMessage('Số điện thoại không hợp lệ');

exports.registerRules = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ max: 100 }).withMessage('Họ tên tối đa 100 ký tự'),
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Email không hợp lệ')
    .isLength({ max: 150 }).withMessage('Email tối đa 150 ký tự'),
  strongPassword('password'),
  phoneRule,
];

exports.loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('Email không hợp lệ'),
  body('password').isString().notEmpty().withMessage('Mật khẩu không được để trống'),
];

exports.updateProfileRules = [
  body('full_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ max: 100 }).withMessage('Họ tên tối đa 100 ký tự'),
  phoneRule,
  body('avatar_url')
    .optional({ values: 'falsy' })
    .isString().isLength({ max: 255 }).withMessage('Đường dẫn ảnh tối đa 255 ký tự'),
];

exports.changePasswordRules = [
  body('current_password').isString().notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
  strongPassword('new_password'),
];
