const ApiError = require('../utils/ApiError');
const promotionModel = require('../models/promotionModel');

const fmt = (n) => Number(n).toLocaleString('vi-VN');

// Kiểm tra mã giảm giá và tính số tiền được giảm cho đơn có tổng tiền = subtotal
// Chưa trừ lượt dùng ở đây (việc đó làm trong transaction đặt vé)
exports.validate = async (code, subtotal, db) => {
  const promo = await promotionModel.findByCode(String(code).trim(), db);
  if (!promo || !promo.is_active) throw new ApiError(400, 'Mã giảm giá không tồn tại');
  if (Number(promo.in_range) !== 1) throw new ApiError(400, 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn');
  if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
    throw new ApiError(400, 'Mã giảm giá đã hết lượt sử dụng');
  }
  if (subtotal < promo.min_order) {
    throw new ApiError(400, `Đơn hàng tối thiểu ${fmt(promo.min_order)}đ để dùng mã này`);
  }

  let discount;
  if (promo.discount_type === 'percent') {
    discount = Math.floor((subtotal * promo.discount_value) / 100);
    if (promo.max_discount !== null) discount = Math.min(discount, promo.max_discount);
  } else {
    discount = promo.discount_value;
  }
  discount = Math.min(discount, subtotal); // không giảm quá tổng tiền

  return { promotion: promo, discount };
};

// Dùng cho API xem trước mức giảm trên giao diện
exports.preview = async (code, subtotal) => {
  const { promotion, discount } = await exports.validate(code, subtotal);
  return {
    code: promotion.code,
    description: promotion.description,
    discount_amount: discount,
    total_after_discount: subtotal - discount,
  };
};
