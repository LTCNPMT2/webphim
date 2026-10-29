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

  const cleanLocalTicketsForUser = (currentUser) => {
    try {
      const existing = JSON.parse(localStorage.getItem('momo_paid_tickets') || '[]');
      const currentEmail = (currentUser?.email || '').toLowerCase().trim();
      const cleaned = existing.filter((t) => {
        const ticketUserId = t.user_id || t.user?.id;
        const ticketEmail = (t.user_email || t.user?.email || '').toLowerCase().trim();
        return (ticketUserId && String(ticketUserId) === String(currentUser?.id)) ||
               (ticketEmail && currentEmail && ticketEmail === currentEmail);
      });
      localStorage.setItem('momo_paid_tickets', JSON.stringify(cleaned));
    } catch {}
  };

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    cleanLocalTicketsForUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem(TOKEN_KEY, data.token); // đăng ký xong tự đăng nhập luôn
    cleanLocalTicketsForUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (payload) => {
    const data = await authService.googleLogin(payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    cleanLocalTicketsForUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('momo_paid_tickets');
    setUser(null);
    toast.success('Đã đăng xuất');
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, loginWithGoogle, logout, setUser }),
    [user, loading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
