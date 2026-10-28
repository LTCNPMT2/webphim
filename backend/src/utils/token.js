const jwt = require('jsonwebtoken');

// Payload gọn nhẹ: chỉ id + role. Thông tin còn lại luôn lấy mới từ DB khi xác thực.
exports.signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
