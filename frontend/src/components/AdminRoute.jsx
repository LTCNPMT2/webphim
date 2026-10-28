import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { PageSpinner } from './ui/Spinner.jsx';

// Chỉ tài khoản role = admin mới vào được. (Backend vẫn kiểm tra quyền lại ở mọi API admin)
export default function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
