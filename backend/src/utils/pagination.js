// Đọc ?page=&limit= từ query, giới hạn limit để tránh client xin quá nhiều dòng
exports.parsePagination = (query, { defaultLimit = 12, maxLimit = 50 } = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, offset: (page - 1) * limit };
};

exports.buildMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
