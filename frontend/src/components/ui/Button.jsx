import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold shadow-md shadow-indigo-600/25 active:scale-95 transition-all duration-200',
  brand: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-950/30 active:scale-95 transition-all duration-200',
  secondary: 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all duration-200',
  outline: 'border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-all duration-200',
  danger: 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 shadow-xs transition-all duration-200',
};
const SIZES = { md: 'px-4 py-2.5', sm: 'px-3.5 py-1.5 text-xs' };

// Trả về chuỗi class của nút. Dùng cho <Link> khi muốn link trông như nút
export const buttonClass = (variant = 'primary', size = 'md', extra = '') =>
  `inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${SIZES[size]} ${VARIANTS[variant] || VARIANTS.primary} ${extra}`;

// loading = true: hiện vòng xoay và khóa nút (tránh bấm 2 lần)
export default function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, ...props }) {
  return (
    <button disabled={loading || props.disabled} className={buttonClass(variant, size, className)} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
