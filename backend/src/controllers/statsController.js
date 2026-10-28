const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const statsService = require('../services/statsService');

exports.get = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  sendSuccess(res, await statsService.getStats(days), 'Lấy thống kê thành công');
});
