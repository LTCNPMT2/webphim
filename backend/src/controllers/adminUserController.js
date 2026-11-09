const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const adminUserService = require('../services/adminUserService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminUserService.list(req.query), 'Lấy danh sách người dùng thành công');
});

exports.setStatus = asyncHandler(async (req, res) => {
  const user = await adminUserService.setStatus(req.user, req.params.id, req.body.is_active);
  sendSuccess(res, { user }, user.is_active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
});

exports.setRole = asyncHandler(async (req, res) => {
  const { role, staff_title, permissions } = req.body;
  const user = await adminUserService.updateRole(req.user, req.params.id, {
    role,
    staff_title,
    permissions,
  });
  sendSuccess(res, { user }, 'Cập nhật vai trò và phân quyền thành công');
});

exports.createStaff = asyncHandler(async (req, res) => {
  const { full_name, email, password, phone, role, staff_title, permissions } = req.body;
  const user = await adminUserService.createStaff(req.user, {
    full_name,
    email,
    password,
    phone,
    role,
    staff_title,
    permissions,
  });
  sendSuccess(res, { user }, 'Tạo tài khoản nhân viên thành công', 201);
});

exports.createCustomer = asyncHandler(async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  const user = await adminUserService.createCustomer(req.user, {
    full_name,
    email,
    password,
    phone,
  });
  sendSuccess(res, { user }, 'Tạo tài khoản khách hàng thành công', 201);
});

exports.getPermissions = asyncHandler(async (req, res) => {
  const data = await adminUserService.getPermissions();
  sendSuccess(res, data, 'Lấy danh mục phân quyền thành công');
});
