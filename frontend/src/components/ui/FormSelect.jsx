// Ô chọn (select) có nhãn + lỗi, cùng kiểu với FormField. Truyền các <option> làm children.
export default function FormSelect({ label, name, error, hint, className = '', children, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <select id={name} name={name} aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'border-red-500 focus:ring-red-500/40' : 'border-slate-700 focus:border-brand-500 focus:ring-brand-500/30'}`}
        {...props}>
        {children}
      </select>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
