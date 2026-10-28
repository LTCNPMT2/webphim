import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import * as authService from '../../services/authService.js';
import { TOKEN_KEY } from '../../services/api.js';
import Button from '../ui/Button.jsx';

export default function RequirePhoneModal() {
  const { user, setUser, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Trạng thái người dùng đã bấm tắt / để sau trong phiên làm việc này
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('dismiss_phone_modal') === 'true';
  });

  // Chỉ hiện khi:
  // 1. Đã đăng nhập thật sự (có token hợp lệ trong localStorage)
  // 2. Có thông tin user nhưng CHƯA có số điện thoại
  // 3. Chưa bấm đóng "Để sau" trong phiên hiện tại
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem(TOKEN_KEY));
  const needPhone = Boolean(
    hasToken &&
    user &&
    !loading &&
    !dismissed &&
    (!user.phone || user.phone.trim() === '')
  );

  const handleClose = () => {
    sessionStorage.setItem('dismiss_phone_modal', 'true');
    setDismissed(true);
  };

  // Đóng modal khi bấm phím Escape
  useEffect(() => {
    if (!needPhone) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [needPhone]);

  if (!needPhone) return null;

  // Lấy tên hiển thị thân thiện, loại bỏ hoàn toàn các chuỗi tạm/demo nếu có
  const rawName = user?.full_name || '';
  const isDemoOrMoMo = !rawName || rawName.toLowerCase().includes('momo') || rawName.toLowerCase().includes('demo');
  const greetingName = isDemoOrMoMo ? 'Quý khách' : rawName;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!/^(0|\+84)\d{9,10}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (gồm 10 chữ số, vd: 0931883988)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updatedUser = await authService.updateProfile({ phone: cleanPhone });
      setUser(updatedUser);
      toast.success('Đã cập nhật số điện thoại thành công!');
      handleClose();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        handleClose();
      } else {
        setError(err.response?.data?.message || err.message || 'Lỗi khi cập nhật số điện thoại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-7 shadow-2xl text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút X thoát hộp thoại ở góc phải trên */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng cửa sổ"
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/15 hover:text-white transition active:scale-95 cursor-pointer text-base font-bold"
        >
          ✕
        </button>

        {/* Header icon & Title */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-rose-600 text-2xl shadow-lg shadow-brand-500/25">
            📱
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Cập nhật số điện thoại
            </h3>
            <p className="text-xs text-slate-400">
              Yêu cầu bắt buộc để nhận vé & mã QR vào rạp
            </p>
          </div>
        </div>

        {/* Nội dung thông báo chào mừng */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 text-xs text-indigo-200 leading-relaxed space-y-1">
          <p>
            Xin chào <b>{greetingName}</b>!
          </p>
          <p>
            Để đảm bảo nhận mã vé điện tử, tin nhắn đối soát và hỗ trợ vào rạp xem phim thuận tiện nhất, vui lòng bổ sung số điện thoại của bạn nhé.
          </p>
        </div>

        {/* Form nhập số điện thoại */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="require-phone-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Số điện thoại di động <span className="text-rose-400">*</span>
            </label>
            <input
              id="require-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: 0931883988"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
            />
            {error && (
              <p className="mt-1.5 text-xs font-semibold text-rose-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <Button
              type="submit"
              loading={submitting}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-700 hover:to-rose-700 text-white font-bold shadow-lg shadow-brand-500/25 active:scale-95 transition"
            >
              Lưu số điện thoại & Tiếp tục
            </Button>
            
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Để sau (Bỏ qua bước này)
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
