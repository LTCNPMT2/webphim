const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { removeUploadedFiles } = require('./upload');

// Đặt sau các rule của express-validator: gom lỗi và trả 422
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  removeUploadedFiles(req.files || req.file); // nếu có ảnh đã upload thì xóa đi vì request không hợp lệ

  const errors = result
    .array({ onlyFirstError: true })
    .map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(422, 'Dữ liệu không hợp lệ', errors));
};
