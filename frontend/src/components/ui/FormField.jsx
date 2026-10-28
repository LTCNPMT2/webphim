import { useState } from 'react';

// Ô nhập cao cấp có nhãn, icon, ẩn/hiện mật khẩu + thông báo lỗi
export default function FormField({
  label,
  name,
  type = 'text',
  error,
  hint,
  icon,
  className = '',
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 text-slate-400">
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={effectiveType}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-slate-950/70 py-3 text-sm text-slate-100 placeholder-slate-500 transition-all shadow-inner focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            icon ? 'pl-11' : 'pl-4'
          } ${isPasswordType ? 'pr-11' : 'pr-4'} ${
            error
              ? 'border-rose-500/80 bg-rose-950/15 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-white/10 hover:border-white/20 focus:border-brand-500/80 focus:ring-brand-500/20'
          }`}
          {...inputProps}
        />

        {isPasswordType && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 transition"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
