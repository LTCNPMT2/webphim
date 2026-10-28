import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { isEmail, isPhone, passwordError } from '../utils/validators.js';
import FormField from '../components/ui/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import GoogleLoginButton from '../components/auth/GoogleLoginButton.jsx';

const EMPTY = { full_name: '', email: '', phone: '', password: '', confirm: '' };

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const er = {};
    if (!form.full_name.trim()) er.full_name = 'Vui lòng nhập họ tên của bạn';
    if (!isEmail(form.email.trim())) er.email = 'Vui lòng nhập email hợp lệ';
    if (form.phone.trim() && !isPhone(form.phone.trim())) er.phone = 'Số điện thoại không hợp lệ (vd 0912345678)';
    const pwErr = passwordError(form.password);
    if (pwErr) er.password = pwErr;
    if (form.confirm !== form.password) er.confirm = 'Mật khẩu nhập lại không khớp';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      toast.success('Đăng ký thành công! Chào mừng bạn đến Cinema Luxe');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else if (err.response?.status === 409) setErrors({ email: getErrorMessage(err) });
      else toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] py-8 sm:py-14 flex items-center justify-center">
      {/* Spotlight Ambient Glow */}
      <div className="pointer-events-none absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Cột trái: Giới thiệu quyền lợi thành viên */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                MEMBER PRIVILEGES
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
                Gia nhập hội viên <span className="text-gradient-gold">Cinema Luxe.</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tạo tài khoản chỉ trong 30 giây để lưu lại lịch sử vé, tích điểm thành viên nhận bắp nước miễn phí và trải nghiệm thanh toán không chạm.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-lg">
                  🎁
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Voucher giảm giá vé</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Nhận ngay mã giảm 10% - 20% cho lần đặt vé đầu tiên.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-slate-900/40 p-3.5 backdrop-blur-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/30 text-lg">
                  💺
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ưu tiên vị trí đẹp</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Dễ dàng chọn hàng ghế VIP và Sweetbox cho các suất chiếu hot.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
              <span>Đã có hơn 50.000+ thành viên</span>
              <span>An toàn & Bảo mật</span>
            </div>
          </div>

          {/* Cột phải: Form Đăng ký */}
          <div className="lg:col-span-7 w-full max-w-lg mx-auto">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/85 p-7 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-2xl">
              
              <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />

              <div className="relative mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Tạo tài khoản mới
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
                  Đăng ký nhanh chóng để khám phá các suất chiếu sớm
                </p>
              </div>

              {/* Nút đăng ký nhanh bằng Google */}
              <div className="relative">
                <GoogleLoginButton />
              </div>

              {/* Đường phân cách */}
              <div className="relative my-6 flex items-center">
                <div className="grow border-t border-white/10" />
                <span className="shrink-0 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  hoặc đăng ký với email
                </span>
                <div className="grow border-t border-white/10" />
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <FormField
                  label="Họ và tên"
                  name="full_name"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={handleChange}
                  error={errors.full_name}
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    label="Số điện thoại"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0912 345 678"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />

                  <FormField
                    label="Xác nhận mật khẩu"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirm}
                    onChange={handleChange}
                    error={errors.confirm}
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    }
                  />
                </div>

                <Button
                  type="submit"
                  loading={submitting}
                  className="w-full py-3.5 font-bold tracking-wide bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600 hover:brightness-110 shadow-lg shadow-brand-950/60 transition active:scale-[0.99] cursor-pointer mt-2"
                >
                  {submitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký hội viên'}
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-bold text-amber-400 hover:text-amber-300 hover:underline">
                  Đăng nhập tại đây
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
