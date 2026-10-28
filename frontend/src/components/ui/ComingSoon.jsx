import { Link } from 'react-router-dom';
import { buttonClass } from './Button.jsx';

// Khung tạm cho các trang sẽ làm ở giai đoạn sau (route đã sẵn sàng, chỉ thay nội dung)
export default function ComingSoon({ title, phase, note }) {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl">🚧</p>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-400">Trang này sẽ được xây dựng ở Giai đoạn {phase}.</p>
      {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
      <Link to="/" className={`mt-8 ${buttonClass('secondary')}`}>Về trang chủ</Link>
    </div>
  );
}
