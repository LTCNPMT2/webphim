const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { removeUploadedFiles } = require('../middlewares/upload');
const comboService = require('../services/comboService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { combos: await comboService.list() }, 'Lấy danh sách combo thành công');
});
exports.create = asyncHandler(async (req, res) => {
  try {
    const combo = await comboService.create(req.body, req.file);
    sendSuccess(res, { combo }, 'Thêm combo thành công', 201);
  } catch (err) {
    removeUploadedFiles(req.file);
    throw err;
  }
});
exports.update = asyncHandler(async (req, res) => {
  try {
    const combo = await comboService.update(req.params.id, req.body, req.file);
    sendSuccess(res, { combo }, 'Cập nhật combo thành công');
  } catch (err) {
    removeUploadedFiles(req.file);
    throw err;
  }
});
exports.remove = asyncHandler(async (req, res) => {
  await comboService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa combo thành công');
});
