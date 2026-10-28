const STEPS = ['Chọn ghế', 'Combo & ưu đãi', 'Thanh toán', 'Hoàn tất'];

// current: bước hiện tại (1 đến 4). Bước đã qua hiện dấu ✓
export default function BookingSteps({ current }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Các bước đặt vé">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              active ? 'bg-brand-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {done ? '✓' : n}
            </span>
            <span className={`${active ? 'font-semibold text-white' : 'hidden text-slate-500 sm:inline'}`}>{label}</span>
            {n < STEPS.length && <span className="h-px w-4 bg-slate-700 sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
