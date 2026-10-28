// Bọc controller async để lỗi tự chuyển sang errorHandler (không cần try/catch lặp lại)
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
