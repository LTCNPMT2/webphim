// 90000 -> "90.000đ"
export const formatPrice = (n) => `${new Intl.NumberFormat('vi-VN').format(Number(n) || 0)}đ`;

// ISO string -> "19:30, 17/10/2026"
export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '';

const ASSET_URL = import.meta.env.VITE_ASSET_URL || 'http://localhost:5000';

// Ảnh poster: link ngoài (http...) giữ nguyên, ảnh upload (/uploads/...) thêm địa chỉ backend
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = path.startsWith('/') ? '' : '/';
  return `${ASSET_URL}${prefix}${path}`;
};

// "2026-10-02" (hoặc ISO) -> "02/10/2026". Cắt chuỗi thay vì dùng Date để không bị lệch ngày do múi giờ
export const formatDate = (s) => {
  if (!s) return '';
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// ISO string -> "19:30"
export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

// Date -> "2026-10-17" theo GIỜ ĐỊA PHƯƠNG (toISOString sẽ cho giờ UTC, dễ lệch sang ngày hôm trước)
export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Timestamp ISO (giờ UTC từ server) -> "17/10/2026" theo giờ địa phương của người xem
export const formatDay = (iso) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '');

// 125 giây -> "02:05"
export const formatCountdown = (seconds) => {
  const s = Math.max(Number(seconds) || 0, 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// Chuẩn hóa điểm đánh giá phim luôn nằm trên thang 10.0 (tối đa 10.0 sao)
// - Nếu giá trị > 5 (ví dụ 9.6): giữ nguyên (đã là thang 10)
// - Nếu giá trị <= 5 (ví dụ 4.8): quy đổi sang thang 10 (4.8 * 2 = 9.6)
// - Luôn đảm bảo tối đa là 10.0 và tối thiểu là 0.0
export const formatRating = (val, fallback = '0.0') => {
  const num = Number(val);
  if (!num || isNaN(num) || num <= 0) return fallback;
  const score10 = num > 5.0 ? num : num * 2;
  return Math.min(10.0, Math.max(0.0, score10)).toFixed(1);
};
