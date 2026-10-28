import { Link } from 'react-router-dom';
import { buttonClass } from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="mt-2 text-slate-400">Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa.</p>
      <Link to="/" className={`mt-8 ${buttonClass()}`}>Về trang chủ</Link>
    </div>
  );
}
