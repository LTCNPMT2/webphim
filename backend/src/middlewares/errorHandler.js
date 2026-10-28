const ApiError = require('../utils/ApiError');

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'Ảnh quá lớn, tối đa 5MB',
  LIMIT_UNEXPECTED_FILE: 'Tên field ảnh không hợp lệ (chỉ dùng "poster" và "banner", mỗi field 1 ảnh)',
};

// Đường dẫn không tồn tại -> 404
const notFound = (req, res, next) => {
  next(new ApiError(404, `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`));
};

// Xử lý lỗi tập trung: mọi lỗi đều trả về { success:false, message, errors? }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = err.message || 'Lỗi máy chủ';
  let errors;

  if (err instanceof ApiError) {
    status = err.statusCode;
    errors = err.errors;
  } else if (err.name === 'MulterError') {
    status = 400;
    message = MULTER_MESSAGES[err.code] || err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Body JSON không hợp lệ';
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409; // vi phạm UNIQUE (ví dụ email trùng, ghế trùng)
    message = 'Dữ liệu đã tồn tại';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = 'Dữ liệu tham chiếu không tồn tại';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 409;
    message = 'Không thể xóa vì dữ liệu đang được sử dụng (đã có đơn đặt vé liên quan)';
  } else if (err.status && err.status < 500) {
    status = err.status; // lỗi từ thư viện (ví dụ body quá lớn -> 413)
  }

  if (status >= 500) {
    console.error('❌ Lỗi server:', err);
    if (process.env.NODE_ENV === 'production') message = 'Lỗi máy chủ nội bộ';
  }

  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};

module.exports = { notFound, errorHandler };
