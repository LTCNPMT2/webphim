const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const cinemaService = require('../services/cinemaService');

// ----- Công khai -----
exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { cinemas: await cinemaService.listPublic(req.query) }, 'Lấy danh sách rạp thành công');
});

exports.getById = asyncHandler(async (req, res) => {
  sendSuccess(res, { cinema: await cinemaService.getPublicById(req.params.id) }, 'Lấy chi tiết rạp thành công');
});

// ----- Admin -----
exports.adminList = asyncHandler(async (req, res) => {
  sendSuccess(res, { cinemas: await cinemaService.listAdmin(req.query) }, 'Lấy danh sách rạp thành công');
});

exports.create = asyncHandler(async (req, res) => {
  sendSuccess(res, { cinema: await cinemaService.create(req.body) }, 'Thêm rạp thành công', 201);
});

exports.update = asyncHandler(async (req, res) => {
  sendSuccess(res, { cinema: await cinemaService.update(req.params.id, req.body) }, 'Cập nhật rạp thành công');
});

exports.remove = asyncHandler(async (req, res) => {
  await cinemaService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa rạp thành công');
});
