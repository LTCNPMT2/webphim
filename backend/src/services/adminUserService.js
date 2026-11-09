const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');
const userModel = require('../models/userModel');
const { PERMISSIONS, PRESET_ROLES } = require('../config/permissions');

const SALT_ROUNDS = 10;

exports.list = async (query) => {
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 10, maxLimit: 100 });
  const { rows, total } = await userModel.adminList(query, { limit, offset });
  return { items: rows, pagination: buildMeta(page, limit, total) };
};

// Khóa / mở khóa tài khoản
exports.setStatus = async (admin, id, isActive) => {
  if (Number(id) === Number(admin.id) && !isActive) {
    throw new ApiError(400, 'Bạn không thể tự khóa tài khoản của chính mình');
  }
  const target = await userModel.findById(id);
  if (!target) throw new ApiError(404, 'Không tìm thấy người dùng');

  await userModel.setActive(id, isActive);
  return userModel.findById(id);
};

// Cập nhật vai trò & phân quyền chi tiết
exports.updateRole = async (admin, id, { role, staff_title, permissions = [] }) => {
  if (Number(id) === Number(admin.id) && role !== 'admin') {
    throw new ApiError(400, 'Bạn không thể tự hạ quyền quản trị của chính mình');
  }
  const target = await userModel.findById(id);
  if (!target) throw new ApiError(404, 'Không tìm thấy người dùng');

  let sanitizedPermissions = [];
  let sanitizedTitle = null;

  if (role === 'staff') {
    sanitizedPermissions = Array.isArray(permissions) ? permissions : [];
    sanitizedTitle = staff_title ? String(staff_title).trim() : 'Nhân viên';
  } else if (role === 'admin') {
    sanitizedPermissions = PERMISSIONS.map((p) => p.id);
    sanitizedTitle = 'Quản trị viên';
  } else {
    // user
    sanitizedPermissions = [];
    sanitizedTitle = null;
  }

  await userModel.updateRoleAndPermissions(id, {
    role,
    staff_title: sanitizedTitle,
    permissions: sanitizedPermissions,
  });

  return userModel.findById(id);
};

// Thêm khách hàng mới trực tiếp từ trang quản trị
exports.createCustomer = async (admin, { full_name, email, password, phone }) => {
  if (await userModel.existsByEmail(email)) {
    throw new ApiError(409, 'Email đã được sử dụng bởi tài khoản khác');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const newId = await userModel.create({
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    phone: phone?.trim() || null,
  });

  return userModel.findById(newId);
};

// Thêm nhân viên mới trực tiếp từ trang quản trị
exports.createStaff = async (admin, { full_name, email, password, phone, role = 'staff', staff_title, permissions = [] }) => {
  if (await userModel.existsByEmail(email)) {
    throw new ApiError(409, 'Email đã được sử dụng bởi tài khoản khác');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const targetRole = role === 'admin' ? 'admin' : 'staff';
  const targetPermissions =
    targetRole === 'admin'
      ? PERMISSIONS.map((p) => p.id)
      : Array.isArray(permissions)
      ? permissions
      : [];
  const targetTitle = staff_title?.trim() || (targetRole === 'admin' ? 'Quản trị viên' : 'Nhân viên');

  const newId = await userModel.createStaff({
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    phone: phone?.trim() || null,
    role: targetRole,
    staff_title: targetTitle,
    permissions: targetPermissions,
  });

  return userModel.findById(newId);
};

// Lấy danh mục quyền hạn và vai trò mẫu
exports.getPermissions = async () => {
  return {
    permissions: PERMISSIONS,
    preset_roles: PRESET_ROLES,
  };
};
