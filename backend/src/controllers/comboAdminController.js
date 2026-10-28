const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const comboService = require('../services/comboService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { combos: await comboService.list() }, 'Lấy danh sách combo thành công');
});
exports.create = asyncHandler(async (req, res) => {
  sendSuccess(res, { combo: await comboService.create(req.body) }, 'Thêm combo thành công', 201);
});
exports.update = asyncHandler(async (req, res) => {
  sendSuccess(res, { combo: await comboService.update(req.params.id, req.body) }, 'Cập nhật combo thành công');
});
exports.remove = asyncHandler(async (req, res) => {
  await comboService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa combo thành công');
});
