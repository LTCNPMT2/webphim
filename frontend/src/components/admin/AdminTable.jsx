import Skeleton from '../ui/Skeleton.jsx';
import ErrorState from '../ui/ErrorState.jsx';

// columns: [{ key, header, render?: (row) => node, className? }]
export default function AdminTable({ columns, rows, loading, error, onRetry, emptyText = 'Chưa có dữ liệu nào' }) {
  if (error && !rows) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0c101c]/90 backdrop-blur-xl shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-[#101524] text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`whitespace-nowrap px-4 py-3.5 ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-800/60 transition-opacity ${loading && rows ? 'opacity-40' : ''}`}>
            {!rows ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full rounded bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-sm font-medium text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-800/40 group/row">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3.5 align-middle text-slate-200 font-medium ${c.className || ''}`}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Nút Sửa / Xóa cho cột thao tác
export function RowActions({ onEdit, onDelete, extra }) {
  const btn = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer active:scale-95';
  return (
    <div className="flex items-center justify-end gap-1.5">
      {extra}
      {onEdit && (
        <button
          onClick={onEdit}
          className={`${btn} border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Sửa</span>
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className={`${btn} border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Xóa</span>
        </button>
      )}
    </div>
  );
}
