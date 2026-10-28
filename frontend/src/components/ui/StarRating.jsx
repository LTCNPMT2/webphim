import { useState } from 'react';

// Hiển thị sao (chỉ đọc) hoặc cho chọn sao (nếu truyền onChange)
export default function StarRating({ value = 0, onChange, size = 'text-xl' }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className={`inline-flex ${size}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <span className={n <= Math.round(shown) ? 'text-amber-400' : 'text-slate-600'}>★</span>
        );
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)}
            aria-label={`${n} sao`} className="px-0.5 transition hover:scale-110">
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
