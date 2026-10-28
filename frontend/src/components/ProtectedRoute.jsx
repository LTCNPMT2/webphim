import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { PageSpinner } from './ui/Spinner.jsx';

// Bọc các trang cần đăng nhập. Chưa đăng nhập -> chuyển tới /login và nhớ trang đang định vào
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
