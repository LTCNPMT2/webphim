const { body } = require('express-validator');

const cinemaBody = (required) => {
  const f = (name) => (required ? body(name) : body(name).optional());
  return [
    f('name').trim().notEmpty().withMessage('Tên rạp không được để trống')
      .isLength({ max: 150 }).withMessage('Tên rạp tối đa 150 ký tự'),
    f('address').trim().notEmpty().withMessage('Địa chỉ không được để trống')
      .isLength({ max: 255 }).withMessage('Địa chỉ tối đa 255 ký tự'),
    f('city').trim().notEmpty().withMessage('Thành phố không được để trống')
      .isLength({ max: 100 }).withMessage('Thành phố tối đa 100 ký tự'),
    body('phone').optional({ values: 'falsy' }).trim().matches(/^[0-9+\s.-]{8,20}$/).withMessage('Số điện thoại không hợp lệ'),
    body('image_url').optional().trim().isLength({ max: 255 }).withMessage('image_url tối đa 255 ký tự'),
    body('is_active').optional().isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
  ];
};

exports.createCinemaRules = cinemaBody(true);
exports.updateCinemaRules = cinemaBody(false);
