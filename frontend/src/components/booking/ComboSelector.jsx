import { assetUrl, formatPrice } from '../../utils/format.js';
import Skeleton from '../ui/Skeleton.jsx';
import ErrorState from '../ui/ErrorState.jsx';

const MAX_QTY = 10;

// state: kết quả useFetch(getCombos); quantities: { [comboId]: số lượng }; onChange(comboId, số lượng mới)
export default function ComboSelector({ state, quantities, onChange }) {
  const { data, loading, error, reload } = state;

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  if (!data || data.length === 0) return <p className="text-sm text-slate-500">Hiện chưa có combo nào.</p>;

  return (
    <ul className="space-y-3">
      {data.map((c) => {
        const q = quantities[c.id] || 0;
        return (
          <li key={c.id} className={`flex items-center gap-4 rounded-2xl border p-3 transition ${q > 0 ? 'border-brand-500/60 bg-brand-600/10' : 'border-slate-800 bg-slate-900/60'}`}>
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-800 text-3xl">
              {c.image_url ? <img src={assetUrl(c.image_url)} alt={c.name} loading="lazy" className="h-full w-full object-cover" /> : '🍿'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.name}</p>
              <p className="line-clamp-2 text-xs text-slate-400">{c.description}</p>
              <p className="mt-1 font-bold text-brand-400">{formatPrice(c.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onChange(c.id, q - 1)} disabled={q === 0} aria-label={`Giảm số lượng ${c.name}`}
                className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-lg hover:bg-slate-700 disabled:opacity-30">−</button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{q}</span>
              <button type="button" onClick={() => onChange(c.id, q + 1)} disabled={q >= MAX_QTY} aria-label={`Tăng số lượng ${c.name}`}
                className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-lg hover:bg-slate-700 disabled:opacity-30">+</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
