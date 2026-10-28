const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const roomService = require('../services/roomService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, { rooms: await roomService.list(req.query) }, 'Lấy danh sách phòng thành công');
});

exports.getSeats = asyncHandler(async (req, res) => {
  sendSuccess(res, await roomService.getSeats(req.params.id), 'Lấy sơ đồ ghế thành công');
});

exports.create = asyncHandler(async (req, res) => {
  sendSuccess(res, await roomService.create(req.body), 'Thêm phòng chiếu thành công', 201);
});

exports.update = asyncHandler(async (req, res) => {
  sendSuccess(res, { room: await roomService.update(req.params.id, req.body) }, 'Cập nhật phòng chiếu thành công');
});

exports.remove = asyncHandler(async (req, res) => {
  await roomService.remove(req.params.id);
  sendSuccess(res, null, 'Xóa phòng chiếu thành công');
});
