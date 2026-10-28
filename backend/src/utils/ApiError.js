// Lỗi nghiệp vụ có mã HTTP, ném ra ở bất cứ đâu -> errorHandler trả về JSON thống nhất
class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // danh sách lỗi chi tiết theo field (tùy chọn)
  }
}

module.exports = ApiError;
