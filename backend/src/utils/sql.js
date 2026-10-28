// Thoát ký tự đặc biệt của LIKE (% và _) để người dùng gõ "50%" không bị hiểu thành ký tự đại diện
exports.escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');
