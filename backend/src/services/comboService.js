const ApiError = require('../utils/ApiError');
const { toPublicPath, removeFile } = require('../middlewares/upload');
const comboModel = require('../models/comboModel');

const textOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

exports.list = () => comboModel.adminList();

exports.create = async (d, file) => {
  const imageUrl = toPublicPath(file) ?? textOrNull(d.image_url);
  const id = await comboModel.create({
    name: d.name,
    description: textOrNull(d.description),
    price: Number(d.price),
    image_url: imageUrl,
    is_active: d.is_active !== undefined ? (toBool(d.is_active) ? 1 : 0) : 1,
  });
  return comboModel.findById(id);
};

exports.update = async (id, d, file) => {
  const old = await comboModel.findById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy combo');

  const newImageUrl = toPublicPath(file);
  const imageUrl = newImageUrl ?? (d.image_url !== undefined ? textOrNull(d.image_url) : old.image_url);

  await comboModel.update(id, {
    name: d.name ?? old.name,
    description: d.description !== undefined ? textOrNull(d.description) : old.description,
    price: d.price !== undefined ? Number(d.price) : old.price,
    image_url: imageUrl,
    is_active: d.is_active !== undefined ? (toBool(d.is_active) ? 1 : 0) : old.is_active,
  });

  if (newImageUrl && old.image_url && old.image_url !== newImageUrl) {
    removeFile(old.image_url);
  }

  return comboModel.findById(id);
};

// Combo đã có trong đơn đặt vé thì không xóa được (409). Hãy tắt "đang bán" để ẩn khỏi trang đặt vé.
exports.remove = async (id) => {
  const old = await comboModel.findById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy combo');
  await comboModel.remove(id);
  if (old.image_url) removeFile(old.image_url);
};
