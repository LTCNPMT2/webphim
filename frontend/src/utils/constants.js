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

// ── Google Maps URLs cố định cho từng cụm rạp CineBooking ──────────────────
export const CINEMA_MAPS = {
  hcm: 'https://www.google.com/maps/place/Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+h%E1%BB%8Dc+V%C4%83n+Hi%E1%BA%BFn/@10.7843334,106.6416665,232m/data=!3m1!1e3!4m6!3m5!1s0x31752fe7efcecbd5:0xb4734cea965dd333!8m2!3d10.7846215!4d106.6420233!16s%2Fg%2F11gsbqvgxb?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',
  hn: 'https://www.google.com/maps/place/Trung+t%C3%A2m+Chi%E1%BA%BFu+phim+Qu%E1%BB%91c+gia/@21.0174221,105.8079936,1712m/data=!3m1!1e3!4m6!3m5!1s0x3135ab9ef82fed13:0x1ee04aa292e377a2!8m2!3d21.016816!4d105.8156311!16s%2Fg%2F11f08fxfdq?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',
};

/**
 * Trả về URL Google Maps tương ứng theo tên thành phố.
 * @param {string} city - Tên thành phố rạp (ví dụ: 'Hà Nội', 'TP. Hồ Chí Minh')
 * @returns {string}
 */
export const getMapUrlByCity = (city = '') =>
  String(city).toLowerCase().includes('hà nội') ? CINEMA_MAPS.hn : CINEMA_MAPS.hcm;
