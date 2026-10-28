const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const promotionService = require('../services/promotionAdminService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { promotions: await promotionService.list() }, 'Lấy danh sách mã giảm giá thành công');
});
exports.create = asyncHandler(async (req, res) => {
  sendSuccess(res, { promotion: await promotionService.create(req.body) }, 'Thêm mã giảm giá thành công', 201);
});
exports.update = asyncHandler(async (req, res) => {
  sendSuccess(res, { promotion: await promotionService.update(req.params.id, req.body) }, 'Cập nhật mã giảm giá thành công');
});
exports.remove = asyncHandler(async (req, res) => {
  await promotionService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa mã giảm giá thành công');
});
