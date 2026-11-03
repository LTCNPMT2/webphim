import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { PageSpinner } from './ui/Spinner.jsx';

// Bảo vệ khu vực quản trị: Chỉ Admin hoặc Nhân viên (Staff) mới được truy cập
export default function AdminRoute({ permission }) {
  const { user, loading, isManagement, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isManagement) return <Navigate to="/" replace />;

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-center text-slate-200">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center text-2xl mb-4">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-400 mb-6">
            Tài khoản nhân viên của bạn chưa được cấp quyền truy cập vào chức năng này (yêu cầu quyền: <code className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">{permission}</code>).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-600/30"
            >
              Về bảng làm việc
            </Link>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              Trang chủ website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
