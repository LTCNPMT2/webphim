// "Bóng Đêm Cuối Cùng" -> "bong-dem-cuoi-cung"
exports.slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
