// Khối xám nhấp nháy giữ chỗ trong lúc tải dữ liệu
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800 ${className}`} />;
}

export function MovieCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-2 h-3 w-3/5" />
    </div>
  );
}
