import Button from './Button.jsx';

export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-10 text-center">
      <p className="text-3xl">⚠️</p>
      <p className="mt-3 font-semibold text-red-300">{message || 'Đã có lỗi xảy ra'}</p>
      <p className="mt-1 text-sm text-slate-400">Hãy kiểm tra backend đang chạy tại http://localhost:5000 và MySQL trong XAMPP đã bật.</p>
      {onRetry && <Button variant="outline" onClick={onRetry} className="mt-5">Thử lại</Button>}
    </div>
  );
}
