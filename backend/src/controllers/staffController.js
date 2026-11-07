const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const staffService = require('../services/staffService');

exports.list = asyncHandler(async (req, res) => {
  const result = await staffService.listStaff(req.query);
  sendSuccess(res, result, 'Lấy danh sách nhân viên thành công', 200);
});

exports.listRoles = asyncHandler(async (req, res) => {
  const roles = await staffService.listRoles();
  sendSuccess(res, roles, 'Lấy danh sách chức vụ / vai trò thành công', 200);
});

exports.createRole = asyncHandler(async (req, res) => {
  const role = await staffService.createRole(req.body);
  sendSuccess(res, role, 'Tạo chức vụ / vai trò mới thành công', 201);
});

exports.create = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body);
  sendSuccess(res, staff, 'Tạo tài khoản nhân viên thành công', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(req.user.id, req.params.id, req.body);
  sendSuccess(res, staff, 'Cập nhật thông tin nhân viên thành công', 200);
});

exports.changeRole = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaffRole(req.user.id, req.params.id, req.body);
  sendSuccess(res, staff, 'Thay đổi vai trò nhân viên thành công', 200);
});

exports.changeStatus = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaffStatus(req.user.id, req.params.id, req.body);
  sendSuccess(
    res,
    staff,
    req.body.status === 'LOCKED' ? 'Đã khóa tài khoản nhân viên' : 'Đã mở khóa tài khoản nhân viên',
    200
  );
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await staffService.resetStaffPassword(req.user.id, req.params.id, req.body);
  sendSuccess(res, null, 'Đặt lại mật khẩu nhân viên thành công', 200);
});
