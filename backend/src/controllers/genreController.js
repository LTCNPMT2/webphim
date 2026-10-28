const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const genreService = require('../services/genreService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { genres: await genreService.list() }, 'Lấy danh sách thể loại thành công');
});

exports.create = asyncHandler(async (req, res) => {
  sendSuccess(res, { genre: await genreService.create(req.body) }, 'Thêm thể loại thành công', 201);
});

exports.update = asyncHandler(async (req, res) => {
  sendSuccess(res, { genre: await genreService.update(req.params.id, req.body) }, 'Cập nhật thể loại thành công');
});

exports.remove = asyncHandler(async (req, res) => {
  await genreService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa thể loại thành công');
});
