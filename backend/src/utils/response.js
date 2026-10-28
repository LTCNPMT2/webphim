// Format response thành công thống nhất: { success, message, data }
exports.sendSuccess = (res, data = null, message = 'Thành công', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });
