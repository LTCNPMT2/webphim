const { param, query } = require('express-validator');

exports.idParam = param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ').toInt();

exports.pageQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit phải từ 1 đến 100'),
];
