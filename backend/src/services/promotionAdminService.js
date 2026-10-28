const ApiError = require('../utils/ApiError');
const { parseDateTime } = require('../utils/datetime');
const promotionModel = require('../models/promotionModel');

const textOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

// Chuẩn hóa dữ liệu form và kiểm tra các ràng buộc liên quan nhiều field
function normalize(d) {
  const start = parseDateTime(d.start_date);
  const end = parseDateTime(d.end_date);
  if (end <= start) throw new ApiError(422, 'Dữ liệu không hợp lệ', [{ field: 'end_date', message: 'Ngày kết thúc phải sau ngày bắt đầu' }]);

  const isPercent = d.discount_type === 'percent';
  return {
    description: textOrNull(d.description),
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    max_discount: isPercent && d.max_discount ? d.max_discount : null, // trần giảm chỉ áp dụng cho kiểu phần trăm
    min_order: d.min_order || 0,
    start_date: start,
    end_date: end,
    usage_limit: d.usage_limit || null, // để trống = không giới hạn lượt dùng
    is_active: d.is_active === false ? 0 : 1,
  };
}

exports.list = () => promotionModel.adminList();

exports.create = async (d) => {
  if (await promotionModel.codeExists(d.code)) {
    throw new ApiError(409, 'Mã giảm giá đã tồn tại', undefined);
  }
  const id = await promotionModel.create({ code: d.code, ...normalize(d) });
  return promotionModel.findById(id);
};

exports.update = async (id, d) => {
  if (!(await promotionModel.findById(id))) throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  await promotionModel.update(id, normalize(d));
  return promotionModel.findById(id);
};

// Mã đã có người dùng thì không xóa để giữ lịch sử, hãy tắt mã (is_active = false)
exports.remove = async (id) => {
  const promo = await promotionModel.findById(id);
  if (!promo) throw new ApiError(404, 'Không tìm thấy mã giảm giá');
  if (promo.used_count > 0) throw new ApiError(409, 'Mã đã được sử dụng nên không thể xóa. Hãy tắt mã thay vì xóa');
  await promotionModel.remove(id);
};
