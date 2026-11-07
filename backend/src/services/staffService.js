const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');
const { pool } = require('../config/db');
const { parsePagination } = require('../utils/pagination');

const SALT_ROUNDS = 10;

exports.listRoles = async () => {
  const [rows] = await pool.query('SELECT id, code, name, description, permissions, created_at FROM roles ORDER BY id ASC');
  return rows;
};

exports.createRole = async ({ code, name, description, permissions }) => {
  if (!name || !name.trim()) throw new ApiError(400, 'Tên chức vụ không được để trống');

  let cleanCode = code ? code.trim().toUpperCase().replace(/\s+/g, '_') : '';
  if (!cleanCode) {
    cleanCode = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .replace(/_+/g, '_')
      .slice(0, 30);
  }

  const [existing] = await pool.query('SELECT id FROM roles WHERE code = ?', [cleanCode]);
  if (existing.length > 0) {
    cleanCode = `${cleanCode}_${Date.now().toString().slice(-4)}`;
  }

  const permsJson = Array.isArray(permissions) ? JSON.stringify(permissions) : JSON.stringify([]);
  const [res] = await pool.query(
    'INSERT INTO roles (code, name, description, permissions) VALUES (?, ?, ?, ?)',
    [cleanCode, name.trim(), description ? description.trim() : null, permsJson]
  );

  const [created] = await pool.query('SELECT id, code, name, description, permissions FROM roles WHERE id = ?', [res.insertId]);
  return created[0];
};

exports.listStaff = async (query) => {
  const pagination = parsePagination(query);
  const result = await userModel.listStaff(query, pagination);
  return {
    items: result.rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / pagination.limit),
    },
  };
};

exports.createStaff = async ({ full_name, email, password, phone, role_id, cinema_id }) => {
  if (await userModel.existsByEmail(email)) {
    throw new ApiError(409, 'Email này đã được sử dụng');
  }

  const [foundRole] = await pool.query('SELECT id, code FROM roles WHERE id = ?', [Number(role_id)]);
  if (foundRole.length === 0) throw new ApiError(400, 'Vai trò không hợp lệ');
  const role = foundRole[0].code;

  // ADMIN không cần gắn rạp cụ thể
  const assignedCinema = role === 'ADMIN' ? null : (cinema_id ? Number(cinema_id) : null);

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const staffId = await userModel.createStaff({
    full_name,
    email,
    password_hash,
    phone,
    role_id: Number(role_id),
    role,
    cinema_id: assignedCinema,
  });

  return userModel.findById(staffId);
};

exports.updateStaff = async (currentAdminId, staffId, { full_name, phone, cinema_id }) => {
  const staff = await userModel.findById(staffId);
  if (!staff || staff.account_type !== 'STAFF') {
    throw new ApiError(404, 'Không tìm thấy tài khoản nhân viên');
  }

  const assignedCinema = staff.role === 'ADMIN' ? null : (cinema_id ? Number(cinema_id) : null);
  await userModel.updateStaff(staffId, { full_name, phone, cinema_id: assignedCinema });
  return userModel.findById(staffId);
};

exports.updateStaffRole = async (currentAdminId, staffId, { role_id }) => {
  if (Number(currentAdminId) === Number(staffId)) {
    throw new ApiError(400, 'Không thể tự thay đổi vai trò của chính mình');
  }

  const staff = await userModel.findById(staffId);
  if (!staff || staff.account_type !== 'STAFF') {
    throw new ApiError(404, 'Không tìm thấy tài khoản nhân viên');
  }

  const [foundRole] = await pool.query('SELECT id, code FROM roles WHERE id = ?', [Number(role_id)]);
  if (foundRole.length === 0) throw new ApiError(400, 'Vai trò không hợp lệ');
  const newRole = foundRole[0].code;

  // Nếu đang là ADMIN và bị đổi sang vai trò khác -> kiểm tra xem có còn admin nào khác không
  if (staff.role === 'ADMIN' && newRole !== 'ADMIN') {
    const activeAdmins = await userModel.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ApiError(400, 'Không thể hạ quyền Admin cuối cùng trong hệ thống');
    }
  }

  await userModel.updateStaffRole(staffId, { role_id: Number(role_id), role: newRole });
  return userModel.findById(staffId);
};

exports.updateStaffStatus = async (currentAdminId, staffId, { status }) => {
  if (Number(currentAdminId) === Number(staffId)) {
    throw new ApiError(400, 'Không thể tự khóa tài khoản của chính mình');
  }

  const staff = await userModel.findById(staffId);
  if (!staff || staff.account_type !== 'STAFF') {
    throw new ApiError(404, 'Không tìm thấy tài khoản nhân viên');
  }

  if (status === 'LOCKED' && staff.role === 'ADMIN') {
    const activeAdmins = await userModel.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ApiError(400, 'Không thể khóa Quản trị viên (ADMIN) cuối cùng đang hoạt động');
    }
  }

  await userModel.updateStaffStatus(staffId, status);
  return userModel.findById(staffId);
};

exports.resetStaffPassword = async (currentAdminId, staffId, { new_password }) => {
  const staff = await userModel.findById(staffId);
  if (!staff || staff.account_type !== 'STAFF') {
    throw new ApiError(404, 'Không tìm thấy tài khoản nhân viên');
  }

  const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await userModel.updatePassword(staffId, password_hash);
};
