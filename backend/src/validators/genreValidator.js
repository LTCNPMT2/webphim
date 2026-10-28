const { body } = require('express-validator');

exports.genreRules = [
  body('name').trim().notEmpty().withMessage('Tên thể loại không được để trống')
    .isLength({ max: 50 }).withMessage('Tên thể loại tối đa 50 ký tự'),
];
