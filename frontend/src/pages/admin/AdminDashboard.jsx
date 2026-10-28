import { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useFetch } from '../../hooks/useFetch.js';
import { getStats } from '../../services/adminService.js';
import { compactMoney } from '../../utils/admin.js';
import { formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';

const RANGES = [7, 30, 90];
const AXIS = '#64748b';
const GRID = 'rgba(255, 255, 255, 0.05)';
const TOOLTIP = {
  contentStyle: {
    background: '#0a0e1a',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    color: '#e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  labelStyle: { color: '#94a3b8', fontWeight: 600 },
};

const STATUS_META = {
  paid: { label: 'Đã thanh toán', color: '#10b981' },
  pending: { label: 'Chờ thanh toán', color: '#f59e0b' },
  cancelled: { label: 'Đã hủy', color: '#64748b' },
  expired: { label: 'Hết hạn', color: '#ef4444' },
};

const shortDate = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const shortMonth = (m) => `${m.slice(5, 7)}/${m.slice(2, 4)}`;
const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function StatCard({ label, value, sub, icon, accent = 'indigo' }) {
  const accents = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400',
    sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/30 text-sky-400',
    brand: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
    purple: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0C101B]/90 p-5 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-200 hover:border-slate-700 hover:bg-[#0F1424]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br border text-base shadow-xs ${accents[accent] || accents.indigo}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400 font-medium">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0C101B]/90 p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const NoData = ({ text = 'Chưa có dữ liệu' }) => (
  <p className="grid h-64 place-items-center text-sm font-medium text-slate-500">{text}</p>
);

export function DashboardView({ stats, days, onDaysChange }) {
  const { summary, revenue_by_day: byDay, revenue_by_month: byMonth, top_movies: top, occupancy, booking_status: status } = stats;
  const pieData = Object.entries(status).filter(([, n]) => n > 0).map(([k, n]) => ({ key: k, name: STATUS_META[k].label, value: n, color: STATUS_META[k].color }));
  const hasSales = summary.paid_bookings > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng Quan Thống Kê"
        subtitle="Dữ liệu doanh thu & tỷ lệ lấp đầy phòng chiếu được cập nhật theo thời gian thực."
      >
        <div className="flex gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1 shadow-inner">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                days === d
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </PageHeader>

      {!hasSales && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-200 flex items-center gap-3">
          <span className="text-xl">💡</span>
          <div>
            Chưa có đơn đặt vé nào được thanh toán nên biểu đồ chưa hiển thị số liệu. Hãy chạy file <b>database/demo_sales.sql</b> để nạp 48 đơn hàng mẫu.
          </div>
        </div>
      )}

      {/* 8 Thẻ số liệu thống kê */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon="💰" label="Doanh thu hôm nay" value={formatPrice(summary.revenue_today)} accent="emerald" />
        <StatCard icon="📅" label="Doanh thu tháng" value={formatPrice(summary.revenue_month)} accent="indigo" />
        <StatCard icon="🏦" label="Tổng doanh thu" value={formatPrice(summary.revenue_total)} sub={`${summary.paid_bookings} đơn đã thanh toán`} accent="sky" />
        <StatCard icon="🎟️" label="Vé đã bán" value={summary.tickets_total} sub={`Hôm nay: ${summary.tickets_today} vé`} accent="violet" />
        <StatCard icon="📈" label="Tỷ lệ lấp đầy" value={`${occupancy.rate}%`} sub={`${occupancy.sold}/${occupancy.total} ghế`} accent="indigo" />
        <StatCard icon="🎬" label="Phim đang chiếu" value={summary.movies_showing} accent="violet" />
        <StatCard icon="👥" label="Khách hàng" value={summary.users_total} accent="emerald" />
        <StatCard icon="🧾" label="Đơn thành công" value={summary.paid_bookings} accent="sky" />
      </div>

      {/* Các biểu đồ trực quan */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Biểu đồ doanh thu theo ngày */}
        <ChartCard
          title={`Doanh thu theo ngày (${days} ngày qua)`}
          subtitle="Biểu đồ biến động doanh thu thanh toán thực tế mỗi ngày"
          className="lg:col-span-2"
        >
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} stroke={AXIS} fontSize={12} minTickGap={20} />
                <YAxis tickFormatter={compactMoney} stroke={AXIS} fontSize={12} width={52} />
                <Tooltip
                  {...TOOLTIP}
                  labelFormatter={shortDate}
                  formatter={(v, name) => (name === 'revenue' ? [formatPrice(v), 'Doanh thu'] : [v, 'Vé'])}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Biểu đồ doanh thu 12 tháng */}
        <ChartCard title="Doanh thu 12 tháng gần nhất" subtitle="Tổng kết doanh thu theo từng tháng">
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="month" tickFormatter={shortMonth} stroke={AXIS} fontSize={12} />
                <YAxis tickFormatter={compactMoney} stroke={AXIS} fontSize={12} width={52} />
                <Tooltip
                  {...TOOLTIP}
                  labelFormatter={shortMonth}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  formatter={(v) => [formatPrice(v), 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top 5 Phim bán chạy */}
        <ChartCard title="Top 5 Phim Bán Chạy Nhất" subtitle="Xếp hạng theo số lượng vé đã xuất">
          {top.length === 0 ? (
            <NoData />
          ) : (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top} layout="vertical" margin={{ top: 5, right: 25, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" stroke={AXIS} fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="title" width={135} stroke={AXIS} fontSize={12} tickFormatter={(t) => truncate(t, 16)} />
                  <Tooltip
                    {...TOOLTIP}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    formatter={(v, n, p) => [`${v} vé · ${formatPrice(p.payload.revenue)}`, 'Đã bán']}
                  />
                  <Bar dataKey="tickets" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Tỷ lệ lấp đầy theo rạp */}
        <ChartCard title="Tỷ Lệ Lấp Đầy Theo Rạp" subtitle="Suất chiếu từ 30 ngày trước đến 7 ngày tới">
          {occupancy.by_cinema.length === 0 ? (
            <NoData text="Chưa có suất chiếu nào" />
          ) : (
            <ul className="space-y-5 pt-2">
              {occupancy.by_cinema.map((c) => (
                <li key={c.cinema_id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span>🏢</span> {c.name}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {c.sold}/{c.total} ghế · <b className="text-indigo-400 font-bold">{c.rate}%</b>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800 p-0.5 border border-slate-700/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.min(c.rate, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        {/* Trạng thái đơn đặt vé */}
        <ChartCard title="Cơ Cấu Trạng Thái Đơn Hàng" subtitle="Tỷ lệ đơn thanh toán, chờ, hủy và hết hạn">
          {pieData.length === 0 ? (
            <NoData text="Chưa có đơn đặt vé nào" />
          ) : (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP} formatter={(v, n) => [`${v} đơn`, n]} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const { data, error, reload } = useFetch(() => getStats(days), [days]);

  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }
  return <DashboardView stats={data} days={days} onDaysChange={setDays} />;
}
