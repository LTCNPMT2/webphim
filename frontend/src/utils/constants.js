// Nhãn độ tuổi theo quy định phân loại phim ở Việt Nam
export const AGE_LABELS = {
  P: 'Phim dành cho mọi lứa tuổi',
  K: 'Phim dưới 13 tuổi cần có người giám hộ',
  T13: 'Phim cấm khán giả dưới 13 tuổi',
  T16: 'Phim cấm khán giả dưới 16 tuổi',
  T18: 'Phim cấm khán giả dưới 18 tuổi',
};

export const AGE_COLORS = {
  P: 'bg-emerald-600',
  K: 'bg-sky-600',
  T13: 'bg-amber-500 text-slate-900',
  T16: 'bg-orange-600',
  T18: 'bg-red-600',
};

export const STATUS_LABELS = {
  now_showing: 'Đang chiếu',
  coming_soon: 'Sắp chiếu',
  ended: 'Ngừng chiếu',
};

export const MAX_SEATS = 8; // tối đa ghế mỗi đơn (backend cũng giới hạn như vậy)

export const SEAT_TYPE_LABELS = { standard: 'Thường', vip: 'VIP', couple: 'Đôi' };

export const BOOKING_STATUS = {
  pending: { label: 'Chờ thanh toán', cls: 'bg-amber-500/20 text-amber-300' },
  paid: { label: 'Đã thanh toán', cls: 'bg-emerald-500/20 text-emerald-300' },
  cancelled: { label: 'Đã hủy', cls: 'bg-slate-500/25 text-slate-300' },
  expired: { label: 'Hết hạn', cls: 'bg-red-500/20 text-red-300' },
};
