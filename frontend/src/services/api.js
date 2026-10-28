// Axios instance dùng chung: tự gắn JWT vào mọi request, tự xử lý khi token hết hạn (401)
import axios from 'axios';

export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Trước mỗi request: đính kèm header Authorization nếu đã đăng nhập
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sau mỗi response: gặp 401 khi đang có token => token sai/hết hạn => xóa token, báo cho AuthContext
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthForm = /\/auth\/(login|register)$/.test(error.config?.url || '');
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && !isAuthForm) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;

// Lấy thông báo lỗi thân thiện từ lỗi axios
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'Máy chủ phản hồi quá lâu, vui lòng thử lại';
  if (error.request) return 'Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa';
  return 'Đã có lỗi xảy ra, vui lòng thử lại';
};

// Lỗi 422 của backend -> { tên_field: "thông báo" } để hiện ngay dưới từng ô nhập
export const getFieldErrors = (error) => {
  const list = error.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return Object.fromEntries(list.map((e) => [e.field, e.message]));
};
