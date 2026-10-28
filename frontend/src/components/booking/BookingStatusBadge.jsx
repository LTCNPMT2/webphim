import { BOOKING_STATUS } from '../../utils/constants.js';

export default function BookingStatusBadge({ status }) {
  const s = BOOKING_STATUS[status] || { label: status, cls: 'bg-slate-700 text-slate-300' };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}
