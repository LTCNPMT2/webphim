// Các hàm kiểm tra dữ liệu form (phía trình duyệt). Server vẫn kiểm tra lại, đây chỉ để báo lỗi sớm.
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isPhone = (v) => /^(0|\+84)\d{9,10}$/.test(v);

// Trả về chuỗi lỗi, hoặc '' nếu mật khẩu hợp lệ (cùng quy tắc với backend)
export const passwordError = (v) => {
  if (!v) return 'Vui lòng nhập mật khẩu';
  if (v.length < 8) return 'Mật khẩu tối thiểu 8 ký tự';
  if (v.length > 72) return 'Mật khẩu tối đa 72 ký tự';
  if (!/[A-Za-z]/.test(v)) return 'Mật khẩu phải có ít nhất 1 chữ cái';
  if (!/\d/.test(v)) return 'Mật khẩu phải có ít nhất 1 chữ số';
  return '';
};
