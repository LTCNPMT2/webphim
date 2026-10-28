import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { isEmail } from '../utils/validators.js';
import FormField from '../components/ui/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleLoginButton from '../components/auth/GoogleLoginButton.jsx';

export default function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Đã đăng nhập thì chuyển hướng
  if (user) return <Navigate to={from} replace />;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
    setFormError('');
  };

  const validate = () => {
    const er = {};
    if (!isEmail(form.email.trim())) er.email = 'Vui lòng nhập email hợp lệ';
    if (!form.password) er.password = 'Vui lòng nhập mật khẩu';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Đăng nhập thành công');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Nạp nhanh tài khoản mẫu
  const fillQuickAccount = (email, password) => {
    setForm({ email, password });
    setErrors({});
    setFormError('');
  };

  // Đăng nhập nhanh Google Demo (dành cho kiểm thử / chấm đồ án)
  const handleQuickDemoGoogle = async () => {
    setDemoLoading(true);
    try {
      await loginWithGoogle({
        isDemo: true,
        demoEmail: 'google.user@cinema.vn',
        demoName: 'Khách hàng Google',
      });
      toast.success('Đăng nhập thành công với tài khoản Google Test!');
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Đăng nhập Google Demo thất bại');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] py-8 sm:py-14 flex items-center justify-center">
      {/* Spotlight Ambient Glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Cột trái: Trải nghiệm điện ảnh thương hiệu cao cấp */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                CINEMA LUXE EXPERIENCE
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
                Thưởng thức điện ảnh đỉnh cao, <span className="text-gradient-gold">tiện lợi mọi lúc.</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Đăng nhập ngay để tận hưởng công nghệ phòng chiếu hiện đại chuẩn quốc tế, giữ chỗ trực tuyến tức thì và nhận vô vàn ưu đãi bắp nước độc quyền.
              </p>
            </div>

            {/* 3 Thẻ tính năng kính mờ */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/30 text-lg">
                  🎟️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Giữ chỗ tức thì 10 phút</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Thanh toán VietQR / SePay tự động, vé điện tử gửi về tài khoản ngay.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-lg">
                  🍿
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Combo bắp nước đa dạng</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Đặt trước combo yêu thích, nhận trực tiếp tại rạp không lo xếp hàng.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-lg">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Đăng nhập một chạm Google</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Xác thực bảo mật chính thức qua Google Identity Services.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
              <span>Hỗ trợ 24/7: 1900 8888</span>
              <span>Bảo mật dữ liệu 100%</span>
            </div>
          </div>

          {/* Cột phải: Form Đăng nhập kính mờ Luxury */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/85 p-7 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-2xl">
              
              {/* Trang trí góc thẻ */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />

              <div className="relative mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Đăng nhập
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
                  Chào mừng bạn quay lại hệ thống Cinema Luxe
                </p>
              </div>

              {/* Nút đăng nhập Google cao cấp */}
              <div className="relative">
                <GoogleLoginButton />
              </div>

              {/* Đường phân cách đối xứng */}
              <div className="relative my-6 flex items-center">
                <div className="grow border-t border-white/10" />
                <span className="shrink-0 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  hoặc với email
                </span>
                <div className="grow border-t border-white/10" />
              </div>

              {formError && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                  <svg className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <FormField
                  label="Địa chỉ Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                <FormField
                  label="Mật khẩu"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-0" />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <Link to="/register" className="text-amber-400 hover:text-amber-300 hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  type="submit"
                  loading={submitting}
                  className="w-full py-3.5 font-bold tracking-wide bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600 hover:brightness-110 shadow-lg shadow-brand-950/60 transition active:scale-[0.99] cursor-pointer"
                >
                  {submitting ? 'Đang xác thực...' : 'Đăng nhập vào rạp'}
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-bold text-amber-400 hover:text-amber-300 hover:underline">
                  Đăng ký tài khoản mới
                </Link>
              </div>

              {/* Thanh chọn nhanh tài khoản kiểm thử */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Kiểm thử nhanh (Demo):
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickDemoGoogle}
                    disabled={demoLoading}
                    className="text-[11px] font-bold text-brand-400 hover:text-brand-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>⚡ Google Demo</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin@cinema.vn', 'password')}
                    className="rounded-lg border border-white/5 bg-slate-950/50 px-2.5 py-1.5 text-left text-[11px] text-slate-300 hover:border-brand-500/40 hover:bg-slate-800 transition"
                  >
                    <span className="block font-bold text-amber-400">Admin</span>
                    <span className="text-[10px] text-slate-500">admin@cinema.vn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('user@cinema.vn', 'password')}
                    className="rounded-lg border border-white/5 bg-slate-950/50 px-2.5 py-1.5 text-left text-[11px] text-slate-300 hover:border-brand-500/40 hover:bg-slate-800 transition"
                  >
                    <span className="block font-bold text-sky-400">User</span>
                    <span className="text-[10px] text-slate-500">user@cinema.vn</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
