export default function Badge({ cls = 'bg-slate-800 text-slate-300 border-slate-700', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-2xs ${cls}`}>
      {children}
    </span>
  );
}

export const ActiveBadge = ({ active, on = 'Hoạt động', off = 'Tạm ẩn' }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
      active
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
        : 'border-slate-700 bg-slate-800/80 text-slate-400'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
    <span>{active ? on : off}</span>
  </span>
);
