const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { removeUploadedFiles } = require('../middlewares/upload');
const movieService = require('../services/movieService');

// ----- Công khai -----
exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, await movieService.list(req.query), 'Lấy danh sách phim thành công');
});

exports.getById = asyncHandler(async (req, res) => {
  sendSuccess(res, { movie: await movieService.getById(req.params.id) }, 'Lấy chi tiết phim thành công');
});

// ----- Admin (nếu lỗi thì xóa ảnh vừa upload để không để lại file rác) -----
exports.create = asyncHandler(async (req, res) => {
  try {
    const movie = await movieService.create(req.body, req.files);
    sendSuccess(res, { movie }, 'Thêm phim thành công', 201);
  } catch (err) {
    removeUploadedFiles(req.files);
    throw err;
  }
});

exports.update = asyncHandler(async (req, res) => {
  try {
    const movie = await movieService.update(req.params.id, req.body, req.files);
    sendSuccess(res, { movie }, 'Cập nhật phim thành công');
  } catch (err) {
    removeUploadedFiles(req.files);
    throw err;
  }
});

exports.remove = asyncHandler(async (req, res) => {
  await movieService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa phim thành công');
});
