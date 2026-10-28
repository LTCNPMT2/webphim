const { body } = require('express-validator');

const comboBody = (required) => {
  const f = (name) => (required ? body(name) : body(name).optional());
  return [
    f('name').trim().notEmpty().withMessage('Tên combo không được để trống')
      .isLength({ max: 100 }).withMessage('Tên combo tối đa 100 ký tự'),
    f('price').isInt({ min: 1000, max: 10000000 }).withMessage('Giá phải từ 1.000 đến 10.000.000').toInt(),
    body('description').optional().trim().isLength({ max: 255 }).withMessage('Mô tả tối đa 255 ký tự'),
    body('image_url').optional().trim().isLength({ max: 255 }).withMessage('Link ảnh tối đa 255 ký tự'),
    body('is_active').optional().isBoolean().withMessage('is_active phải là true hoặc false').toBoolean(),
  ];
};

exports.createComboRules = comboBody(true);
exports.updateComboRules = comboBody(false);
