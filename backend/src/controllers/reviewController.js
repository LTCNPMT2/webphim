const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const reviewService = require('../services/reviewService');

exports.list = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.list(req.params.id, req.query), 'Lấy danh sách đánh giá thành công');
});

exports.getMine = asyncHandler(async (req, res) => {
  const review = await reviewService.getMine(req.params.id, req.user.id);
  sendSuccess(res, { review }, 'Lấy đánh giá của bạn thành công');
});

exports.save = asyncHandler(async (req, res) => {
  const { review, created } = await reviewService.save(req.user, req.params.id, req.body);
  sendSuccess(res, { review }, created ? 'Cảm ơn bạn đã đánh giá' : 'Đã cập nhật đánh giá của bạn', created ? 201 : 200);
});

exports.removeMine = asyncHandler(async (req, res) => {
  await reviewService.removeMine(req.user, req.params.id);
  sendSuccess(res, null, 'Đã xóa đánh giá của bạn');
});
