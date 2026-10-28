import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';
import * as authService from '../services/authService.js';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { isPhone, passwordError } from '../utils/validators.js';
import { formatDateTime } from '../utils/format.js';
import FormField from '../components/ui/FormField.jsx';
import Button from '../components/ui/Button.jsx';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: user.full_name, phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.full_name.trim()) er.full_name = 'Họ tên không được để trống';
    if (form.phone.trim() && !isPhone(form.phone.trim())) er.phone = 'Số điện thoại không hợp lệ';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      const updated = await authService.updateProfile({ full_name: form.full_name.trim(), phone: form.phone.trim() });
      setUser(updated); // cập nhật tên trên Header ngay lập tức
      toast.success('Đã cập nhật hồ sơ');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField label="Email" name="email" value={user.email} disabled readOnly hint="Email không thể thay đổi" />
        <FormField label="Họ và tên" name="full_name" value={form.full_name} onChange={handleChange} error={errors.full_name} />
        <FormField label="Số điện thoại" name="phone" type="tel" placeholder="0912345678"
          value={form.phone} onChange={handleChange} error={errors.phone} />
        <Button type="submit" loading={saving}>Lưu thay đổi</Button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const EMPTY = { current_password: '', new_password: '', confirm: '' };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.current_password) er.current_password = 'Vui lòng nhập mật khẩu hiện tại';
    const pwErr = passwordError(form.new_password);
    if (pwErr) er.new_password = pwErr;
    if (form.confirm !== form.new_password) er.confirm = 'Mật khẩu nhập lại không khớp';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    try {
      await authService.changePassword({ current_password: form.current_password, new_password: form.new_password });
      toast.success('Đổi mật khẩu thành công');
      setForm(EMPTY);
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else if (err.response?.status === 400) setErrors({ current_password: getErrorMessage(err) });
      else toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField label="Mật khẩu hiện tại" name="current_password" type="password" autoComplete="current-password"
          value={form.current_password} onChange={handleChange} error={errors.current_password} />
        <FormField label="Mật khẩu mới" name="new_password" type="password" autoComplete="new-password"
          hint="Ít nhất 8 ký tự, gồm cả chữ và số"
          value={form.new_password} onChange={handleChange} error={errors.new_password} />
        <FormField label="Nhập lại mật khẩu mới" name="confirm" type="password" autoComplete="new-password"
          value={form.confirm} onChange={handleChange} error={errors.confirm} />
        <Button type="submit" loading={saving} variant="secondary">Đổi mật khẩu</Button>
      </form>
    </section>
  );
}

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-400">
          Vai trò: {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'} · Tham gia từ {formatDateTime(user.created_at)}
        </p>
      </div>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
