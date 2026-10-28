const statsModel = require('../models/statsModel');

const pad = (n) => String(n).padStart(2, '0');
const num = (v) => Number(v) || 0;

// Dãy `days` ngày kết thúc ở hôm nay: ["2026-09-18", ..., "2026-10-17"] (tính theo chuỗi ngày của MySQL, không lệch múi giờ)
function lastDays(today, days) {
  const base = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

// Dãy `n` tháng kết thúc ở tháng hiện tại: ["2025-11", ..., "2026-10"]
function lastMonths(today, n) {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const idx = y * 12 + (m - 1) - (n - 1 - i);
    return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
  });
}

exports.lastDays = lastDays;
exports.lastMonths = lastMonths;

exports.getStats = async (days) => {
  const today = await statsModel.getToday();
  const [summary, byDay, byMonth, top, occRows, statusRows] = await Promise.all([
    statsModel.getSummary(),
    statsModel.revenueByDay(days),
    statsModel.revenueByMonth(12),
    statsModel.topMovies(5),
    statsModel.occupancyByCinema(),
    statsModel.bookingStatusCounts(),
  ]);

  // Điền 0 cho ngày/tháng không có doanh thu để biểu đồ liên tục
  const dayRev = new Map(byDay.rev.map((r) => [r.d, r]));
  const dayTk = new Map(byDay.tk.map((r) => [r.d, num(r.tickets)]));
  const monthRev = new Map(byMonth.rev.map((r) => [r.m, r]));
  const monthTk = new Map(byMonth.tk.map((r) => [r.m, num(r.tickets)]));

  const byCinema = occRows.map((r) => ({
    cinema_id: r.cinema_id,
    name: r.name,
    sold: num(r.sold),
    total: num(r.total),
    rate: num(r.total) ? Math.round((num(r.sold) / num(r.total)) * 1000) / 10 : 0,
  }));
  const sold = byCinema.reduce((s, c) => s + c.sold, 0);
  const total = byCinema.reduce((s, c) => s + c.total, 0);

  const booking_status = { pending: 0, paid: 0, cancelled: 0, expired: 0 };
  statusRows.forEach((r) => { booking_status[r.status] = num(r.n); });

  return {
    days,
    summary: Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, num(v)])),
    revenue_by_day: lastDays(today, days).map((d) => ({
      date: d,
      revenue: num(dayRev.get(d)?.revenue),
      bookings: num(dayRev.get(d)?.bookings),
      tickets: dayTk.get(d) || 0,
    })),
    revenue_by_month: lastMonths(today, 12).map((m) => ({
      month: m,
      revenue: num(monthRev.get(m)?.revenue),
      bookings: num(monthRev.get(m)?.bookings),
      tickets: monthTk.get(m) || 0,
    })),
    top_movies: top.map((r) => ({ id: r.id, title: r.title, tickets: num(r.tickets), revenue: num(r.revenue) })),
    occupancy: { rate: total ? Math.round((sold / total) * 1000) / 10 : 0, sold, total, by_cinema: byCinema },
    booking_status,
  };
};
