import { formatPrice } from './format.js';

// ISO (từ server) -> "2026-10-17T19:30" cho ô <input type="datetime-local"> (giờ địa phương)
export const toInputDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// "d, e;f" -> ["D","E","F"]  (nhập hàng ghế VIP / ghế đôi)
export const parseLetters = (text) =>
  String(text || '').split(/[\s,;]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);

// Ước tính tổng số ghế của phòng sắp tạo (hàng ghế đôi chỉ có một nửa số ghế)
export const estimateSeats = ({ rows, cols, coupleRows }) => {
  const r = Number(rows) || 0;
  const c = Number(cols) || 0;
  if (r < 1 || c < 1) return 0;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, Math.min(r, 26));
  const couple = new Set(parseLetters(coupleRows).filter((l) => letters.includes(l)));
  return (r - couple.size) * c + couple.size * Math.floor(c / 2);
};

// Form thêm/sửa phim có ảnh nên gửi bằng multipart/form-data
export const buildMovieFormData = (v) => {
  const fd = new FormData();
  ['title', 'tagline', 'duration_minutes', 'release_date', 'age_rating', 'status', 'language', 'country', 'director',
    'cast_members', 'trailer_url', 'description'].forEach((k) => fd.append(k, v[k] ?? ''));
  fd.append('genre_ids', JSON.stringify(v.genre_ids || []));
  if (v.cast_data) fd.append('cast_data', JSON.stringify(v.cast_data));
  if (v.gallery_images) fd.append('gallery_images', JSON.stringify(v.gallery_images));
  if (v.custom_faqs) fd.append('custom_faqs', JSON.stringify(v.custom_faqs));
  if (v.poster) fd.append('poster', v.poster);
  if (v.banner) fd.append('banner', v.banner);
  return fd;
};

export const PROMO_STATE = {
  active: { label: 'Đang chạy', cls: 'bg-emerald-500/20 text-emerald-300' },
  upcoming: { label: 'Sắp diễn ra', cls: 'bg-sky-500/20 text-sky-300' },
  expired: { label: 'Hết hạn', cls: 'bg-red-500/20 text-red-300' },
  exhausted: { label: 'Hết lượt', cls: 'bg-orange-500/20 text-orange-300' },
  inactive: { label: 'Đã tắt', cls: 'bg-slate-500/25 text-slate-300' },
};

export const describeDiscount = (p) =>
  p.discount_type === 'percent'
    ? `${p.discount_value}%${p.max_discount ? ` (tối đa ${formatPrice(p.max_discount)})` : ''}`
    : formatPrice(p.discount_value);

// 1234567 -> "1,2tr", 45000 -> "45k": nhãn gọn cho trục biểu đồ
export const compactMoney = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace('.0', '')}tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace('.0', '')}tr`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
};
