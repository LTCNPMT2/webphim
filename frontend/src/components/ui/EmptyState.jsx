export default function EmptyState({ icon = '🎞️', title, description, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center">
      <p className="text-4xl">{icon}</p>
      <p className="mt-3 font-semibold text-slate-200">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
