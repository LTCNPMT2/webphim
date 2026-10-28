import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService.js';
import { TOKEN_KEY } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading = đang kiểm tra token đã lưu có còn dùng được không (tránh nháy trang "chưa đăng nhập")
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  // Khôi phục phiên đăng nhập khi mở lại trang
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authService
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // axios báo token hết hạn/không hợp lệ (xem interceptor trong services/api.js)
  useEffect(() => {
    const onForcedLogout = () => {
      setUser(null);
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    };
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem(TOKEN_KEY, data.token); // đăng ký xong tự đăng nhập luôn
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (payload) => {
    const data = await authService.googleLogin(payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    toast.success('Đã đăng xuất');
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, loginWithGoogle, logout, setUser }),
    [user, loading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
