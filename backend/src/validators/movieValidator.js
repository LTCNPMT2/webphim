const { body, query } = require('express-validator');
const { parseIdList } = require('../utils/parseList');
const { pageQuery } = require('./commonValidator');

const AGE = ['P', 'K', 'T13', 'T16', 'T18'];
const STATUS = ['coming_soon', 'now_showing', 'ended'];

// Dùng chung cho thêm (required = true) và sửa (required = false: field nào có mới kiểm tra)
const movieBody = (required) => {
  const f = (name) => (required ? body(name) : body(name).optional());
  return [
    f('title').trim().notEmpty().withMessage('Tên phim không được để trống')
      .isLength({ max: 200 }).withMessage('Tên phim tối đa 200 ký tự'),
    f('duration_minutes').isInt({ min: 1, max: 600 }).withMessage('Thời lượng phải từ 1 đến 600 phút').toInt(),
    f('release_date').isDate({ format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] })
      .withMessage('Ngày khởi chiếu phải có dạng YYYY-MM-DD'),
    body('age_rating').optional().isIn(AGE).withMessage(`Độ tuổi phải là một trong: ${AGE.join(', ')}`),
    body('status').optional().isIn(STATUS).withMessage(`Trạng thái phải là một trong: ${STATUS.join(', ')}`),
    body('description').optional().isString().withMessage('Mô tả không hợp lệ'),
    body('tagline').optional().trim().isLength({ max: 255 }).withMessage('Tagline tối đa 255 ký tự'),
    body('country').optional().trim().isLength({ max: 100 }).withMessage('Quốc gia tối đa 100 ký tự'),
    body('director').optional().trim().isLength({ max: 100 }).withMessage('Đạo diễn tối đa 100 ký tự'),
    body('cast_members').optional().trim().isLength({ max: 500 }).withMessage('Diễn viên tối đa 500 ký tự'),
    body('cast_data').optional(),
    body('gallery_images').optional(),
    body('custom_faqs').optional(),
    body('language').optional().trim().isLength({ max: 50 }).withMessage('Ngôn ngữ tối đa 50 ký tự'),
    body('trailer_url').optional({ values: 'falsy' }).trim().isURL().withMessage('Link trailer không hợp lệ')
      .isLength({ max: 255 }).withMessage('Link trailer tối đa 255 ký tự'),
    // poster/banner có thể là file upload, hoặc link ảnh (nếu không upload file)
    body('poster_url').optional().trim().isLength({ max: 255 }).withMessage('poster_url tối đa 255 ký tự'),
    body('banner_url').optional().trim().isLength({ max: 255 }).withMessage('banner_url tối đa 255 ký tự'),
    body('genre_ids').optional()
      .customSanitizer(parseIdList)
      .custom((v) => v.every((n) => Number.isInteger(n) && n > 0))
      .withMessage('genre_ids phải là danh sách id thể loại, ví dụ [1,2]'),
  ];
};

exports.createMovieRules = movieBody(true);
exports.updateMovieRules = movieBody(false);

exports.listMovieRules = [
  query('status').optional().isIn(STATUS).withMessage(`status phải là một trong: ${STATUS.join(', ')}`),
  query('sort').optional().isIn(['release_date', 'title', 'rating']).withMessage('sort chỉ nhận release_date, title, rating'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order chỉ nhận asc hoặc desc'),
  ...pageQuery,
];
