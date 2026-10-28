import { useEffect } from 'react';

// Hộp thoại phủ toàn màn hình: bấm nền đen hoặc phím Esc để đóng, khóa cuộn trang phía sau
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-3xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} my-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-slate-950/40 print:hidden">
          <h2 className="truncate text-base font-bold text-white tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
