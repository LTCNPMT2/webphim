const ApiError = require('../utils/ApiError');
const comboModel = require('../models/comboModel');

const textOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

exports.list = () => comboModel.adminList();

exports.create = async (d) => {
  const id = await comboModel.create({
    name: d.name,
    description: textOrNull(d.description),
    price: d.price,
    image_url: textOrNull(d.image_url),
    is_active: d.is_active === false ? 0 : 1,
  });
  return comboModel.findById(id);
};

exports.update = async (id, d) => {
  const old = await comboModel.findById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy combo');
  await comboModel.update(id, {
    name: d.name ?? old.name,
    description: d.description !== undefined ? textOrNull(d.description) : old.description,
    price: d.price ?? old.price,
    image_url: d.image_url !== undefined ? textOrNull(d.image_url) : old.image_url,
    is_active: d.is_active !== undefined ? (d.is_active ? 1 : 0) : old.is_active,
  });
  return comboModel.findById(id);
};

// Combo đã có trong đơn đặt vé thì không xóa được (409). Hãy tắt "đang bán" để ẩn khỏi trang đặt vé.
exports.remove = async (id) => {
  if (!(await comboModel.findById(id))) throw new ApiError(404, 'Không tìm thấy combo');
  await comboModel.remove(id);
};
