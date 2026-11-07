import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import { getSettings } from '../../services/adminService.js';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => toast.error('Không thể tải cài đặt'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Cấu hình tham số cốt lõi của website vé xem phim CineBooking (Chỉ Quản trị viên)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin chung */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Cấu hình đặt vé & Giữ ghế
          </h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Thời gian giữ ghế tạm thời (HOLD_MINUTES)</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-md">
                {settings?.hold_minutes || 10} phút
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Cho phép hủy vé trước giờ chiếu ít nhất</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-md">
                {settings?.cancel_before_hours || 2} giờ
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">Tên thương hiệu hệ thống</span>
              <span className="font-bold text-brand-400">{settings?.site_name || 'CineBooking'}</span>
            </div>
          </div>
        </div>

        {/* Trạng thái dịch vụ bên thứ ba */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🔌</span> Dịch vụ & Cổng tích hợp bên thứ ba
          </h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Cổng thanh toán VietQR SePay</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Đang kích hoạt
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Dịch vụ gửi Email tự động (SMTP)</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sẵn sàng
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">Chính sách tài khoản nội bộ</span>
              <span className="font-bold text-rose-400">Chặn mua vé xem phim (Bắt buộc)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
