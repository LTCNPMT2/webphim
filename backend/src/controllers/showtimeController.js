const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const showtimeService = require('../services/showtimeService');

// ----- Công khai -----
exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { cinemas: await showtimeService.listPublic(req.query) }, 'Lấy danh sách suất chiếu thành công');
});

exports.getById = asyncHandler(async (req, res) => {
  sendSuccess(res, { showtime: await showtimeService.getPublicById(req.params.id) }, 'Lấy chi tiết suất chiếu thành công');
});

exports.getSeats = asyncHandler(async (req, res) => {
  sendSuccess(res, await showtimeService.getSeatMap(req.params.id), 'Lấy sơ đồ ghế thành công');
});

// ----- Admin -----
exports.adminList = asyncHandler(async (req, res) => {
  sendSuccess(res, await showtimeService.listAdmin(req.query), 'Lấy danh sách suất chiếu thành công');
});

exports.create = asyncHandler(async (req, res) => {
  sendSuccess(res, { showtime: await showtimeService.create(req.body) }, 'Thêm suất chiếu thành công', 201);
});

exports.update = asyncHandler(async (req, res) => {
  sendSuccess(res, { showtime: await showtimeService.update(req.params.id, req.body) }, 'Cập nhật suất chiếu thành công');
});

exports.remove = asyncHandler(async (req, res) => {
  await showtimeService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa suất chiếu thành công');
});
