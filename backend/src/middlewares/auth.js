const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/userModel');

// Xác thực JWT từ header:  Authorization: Bearer <token>
// Sau khi qua middleware này, req.user chứa thông tin người dùng hiện tại.
const verifyToken = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Bạn chưa đăng nhập');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(
      401,
      err.name === 'TokenExpiredError' ? 'Phiên đăng nhập đã hết hạn' : 'Token không hợp lệ'
    );
  }

  // Luôn kiểm tra lại DB để bắt trường hợp tài khoản bị xóa/khóa hoặc đổi quyền
  const user = await userModel.findById(payload.id);
  if (!user) throw new ApiError(401, 'Tài khoản không tồn tại');
  if (!user.is_active) throw new ApiError(403, 'Tài khoản đã bị khóa');

  req.user = user;
  next();
});

// Phân quyền: dùng SAU verifyToken. Ví dụ: router.use(verifyToken, requireRole('admin'))
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Bạn chưa đăng nhập'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này'));
  }
  next();
};

module.exports = { verifyToken, requireRole };
