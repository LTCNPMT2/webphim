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
