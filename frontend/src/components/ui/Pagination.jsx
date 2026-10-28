import { getPageNumbers } from '../../utils/pagination.js';

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const item = 'grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-medium transition';
  return (
    <nav aria-label="Phân trang" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className={`${item} bg-slate-800 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40`}>
        ← Trước
      </button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-slate-500">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
            className={`${item} ${p === page ? 'bg-brand-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>
            {p}
          </button>
        )
      )}

      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className={`${item} bg-slate-800 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40`}>
        Sau →
      </button>
    </nav>
  );
}
