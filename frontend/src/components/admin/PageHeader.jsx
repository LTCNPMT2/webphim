export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
