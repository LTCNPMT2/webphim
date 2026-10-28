const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');
const userModel = require('../models/userModel');

exports.list = async (query) => {
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });
  const { rows, total } = await userModel.adminList(query, { limit, offset });
  rows.forEach((r) => { r.total_spent = Number(r.total_spent); });
  return { items: rows, pagination: buildMeta(page, limit, total) };
};

// Khóa / mở khóa tài khoản. Tài khoản bị khóa không đăng nhập được và token cũ cũng bị chặn ngay (verifyToken kiểm tra DB mỗi request)
exports.setStatus = async (admin, id, isActive) => {
  if (id === admin.id && !isActive) throw new ApiError(400, 'Bạn không thể tự khóa tài khoản của chính mình');
  if (!(await userModel.findById(id))) throw new ApiError(404, 'Không tìm thấy người dùng');
  await userModel.setActive(id, isActive);
  return userModel.findById(id);
};
