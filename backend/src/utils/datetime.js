// Chấp nhận "YYYY-MM-DD HH:mm" hoặc "YYYY-MM-DDTHH:mm" (có thể thêm :ss).
// Trả về chuỗi chuẩn "YYYY-MM-DD HH:mm:ss" (giờ địa phương, không đổi múi giờ) hoặc null nếu sai.
const RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

exports.parseDateTime = (input) => {
  const m = RE.exec(String(input ?? '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s = '00'] = m;

  // Kiểm tra ngày giờ có thật (vd 2026-02-31 hoặc 25:00 là sai)
  const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  if (
    dt.getUTCFullYear() !== +y || dt.getUTCMonth() !== +mo - 1 || dt.getUTCDate() !== +d ||
    dt.getUTCHours() !== +h || dt.getUTCMinutes() !== +mi || dt.getUTCSeconds() !== +s
  ) {
    return null;
  }
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
};
