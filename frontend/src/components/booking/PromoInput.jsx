import { formatPrice } from '../../utils/format.js';
import Button from '../ui/Button.jsx';

// promo = { input, applied: { code, description, discount_amount } | null, error, loading }
export default function PromoInput({ promo, onInputChange, onApply, onRemove }) {
  const { input, applied, error, loading } = promo;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <label htmlFor="promo" className="font-semibold">Mã giảm giá</label>

      {applied ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div>
            <p className="font-bold text-emerald-300">{applied.code} <span className="font-normal">· giảm {formatPrice(applied.discount_amount)}</span></p>
            {applied.description && <p className="text-xs text-slate-400">{applied.description}</p>}
          </div>
          <button type="button" onClick={onRemove} className="text-sm text-slate-400 hover:text-white">Bỏ mã</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); onApply(); }} className="mt-3 flex gap-2">
          <input id="promo" value={input} onChange={(e) => onInputChange(e.target.value)} placeholder="Nhập mã, ví dụ WELCOME10"
            autoComplete="off" maxLength={30}
            className={`min-w-0 flex-1 rounded-lg border bg-slate-900 px-3.5 py-2.5 text-sm uppercase placeholder-slate-500 placeholder:normal-case focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-500/40' : 'border-slate-700 focus:border-brand-500 focus:ring-brand-500/30'}`} />
          <Button type="submit" variant="secondary" loading={loading}>Áp dụng</Button>
        </form>
      )}
      {error && !applied && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
