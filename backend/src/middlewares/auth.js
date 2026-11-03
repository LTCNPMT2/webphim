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

// Phân quyền theo vai trò (roles)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Bạn chưa đăng nhập'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này'));
  }
  next();
};

// Phân quyền chi tiết (RBAC)
// - Admin có toàn bộ quyền (superadmin).
// - Staff cần sở hữu quyền cụ thể trong permissions.
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Bạn chưa đăng nhập'));
  if (req.user.role === 'admin') return next();

  if (req.user.role === 'staff') {
    const permissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (permissions.includes(permission)) {
      return next();
    }
    return next(new ApiError(403, `Bạn không có quyền thực hiện thao tác này (cần quyền: ${permission})`));
  }

  return next(new ApiError(403, 'Bạn không có quyền truy cập khu vực này'));
};

const requireAnyPermission = (...permissions) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Bạn chưa đăng nhập'));
  if (req.user.role === 'admin') return next();

  if (req.user.role === 'staff') {
    const userPerms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasAny = permissions.some((p) => userPerms.includes(p));
    if (hasAny) return next();
    return next(
      new ApiError(403, `Bạn không có quyền thực hiện thao tác này (cần một trong các quyền: ${permissions.join(', ')})`)
    );
  }

  return next(new ApiError(403, 'Bạn không có quyền truy cập khu vực này'));
};

module.exports = { verifyToken, requireRole, requirePermission, requireAnyPermission };
