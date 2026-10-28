import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { assetUrl, formatDateTime, formatPrice } from '../../utils/format.js';
import BookingStatusBadge from './BookingStatusBadge.jsx';

// Bảng mô tả phân loại độ tuổi điện ảnh Việt Nam
const AGE_MAP = {
  P: { badge: 'bg-emerald-600 text-white', label: 'P', desc: 'Phù hợp mọi lứa tuổi' },
  K: { badge: 'bg-sky-600 text-white', label: 'K', desc: 'Dưới 13 tuổi cần phụ huynh đi kèm' },
  T13: { badge: 'bg-amber-500 text-slate-950 font-black', label: 'T13', desc: 'Khán giả từ 13 tuổi trở lên' },
  C13: { badge: 'bg-amber-500 text-slate-950 font-black', label: 'C13', desc: 'Khán giả từ 13 tuổi trở lên' },
  T16: { badge: 'bg-orange-600 text-white', label: 'T16', desc: 'Khán giả từ 16 tuổi trở lên' },
  C16: { badge: 'bg-orange-600 text-white', label: 'C16', desc: 'Khán giả từ 16 tuổi trở lên' },
  T18: { badge: 'bg-rose-600 text-white', label: 'T18', desc: 'Khán giả từ đủ 18 tuổi trở lên (Vui lòng mang CCCD)' },
  C18: { badge: 'bg-rose-600 text-white', label: 'C18', desc: 'Khán giả từ đủ 18 tuổi trở lên (Vui lòng mang CCCD)' },
};

const SEAT_TYPE_LABELS = {
  standard: 'Ghế thường',
  vip: 'Ghế VIP',
  couple: 'Ghế đôi (Sweetbox)',
};

// Đồ họa mã vạch (Barcode) chân thực như vé in tại rạp
function BarcodeSVG({ className = 'h-9 w-full' }) {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 2, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1];
  let curX = 0;
  return (
    <svg viewBox="0 0 160 32" preserveAspectRatio="none" className={className}>
      {bars.map((w, i) => {
        const x = curX;
        curX += w + (i % 2 === 0 ? 1 : 2);
        return i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="32" fill="#1e293b" /> : null;
      })}
    </svg>
  );
}

export default function TicketCard({ booking }) {
  const [imgError, setImgError] = useState(false);
  const paid = booking?.status === 'paid';

  // Chuẩn hóa dữ liệu tương thích cả API Booking và Local Cache
  const movie = booking?.movie || {
    title: booking?.movie_title || 'Tác phẩm điện ảnh',
    poster_url: booking?.poster_url || null,
    duration_minutes: booking?.duration_minutes || 120,
    age_rating: booking?.age_rating || 'T18',
  };

  const cinema = booking?.cinema || {
    name: booking?.cinema_name || 'Cine Cinema Studio',
    address: booking?.cinema_address || 'Địa chỉ rạp chiếu phim',
  };

  const room = booking?.room || {
    name: booking?.room_name || 'Phòng chiếu',
    room_type: booking?.room_type || '2D Phụ đề Tiếng Việt',
  };

  const showtime = booking?.showtime || {
    start_time: booking?.start_time || new Date().toISOString(),
    end_time: booking?.end_time || null,
  };

  const { user: authUser } = useAuth();
  const rawUser = booking?.user || {};
  const user = {
    full_name: rawUser.full_name || rawUser.name || booking?.user_name || booking?.full_name || authUser?.full_name || 'Khách hàng',
    email: rawUser.email || booking?.user_email || booking?.email || authUser?.email || '',
    phone: rawUser.phone || booking?.user_phone || booking?.phone || authUser?.phone || '',
  };

  // Danh sách ghế
  const seatList = Array.isArray(booking?.seats) && booking.seats.length > 0
    ? booking.seats.map((s) => (typeof s === 'string' ? { label: s, seat_type: 'standard', price: null } : s))
    : (booking?.seat_labels || '').split(',').map((l) => ({ label: l.trim(), seat_type: 'standard', price: null })).filter((s) => s.label);

  const seatLabelsString = seatList.map((s) => s.label).join(', ');

  // Danh sách combo bắp nước
  const combos = Array.isArray(booking?.combos) ? booking.combos : [];

  // Thông tin giao dịch & thanh toán
  const primaryPayment = Array.isArray(booking?.payments) && booking.payments.length > 0
    ? booking.payments[0]
    : null;

  const paymentMethod = primaryPayment?.method || booking?.payment_method || (paid ? 'Chuyển khoản SePay VietQR (MBBank)' : 'Chờ thanh toán');
  const transactionCode = primaryPayment?.transaction_code || booking?.transaction_code || (paid ? `SEPAY-${booking?.booking_code}` : '—');
  const paymentTime = primaryPayment?.paid_at || booking?.transaction_date || booking?.created_at;

  // Tính toán bảng giá
  const combosTotal = combos.reduce((sum, c) => sum + (Number(c.quantity) || 1) * (Number(c.unit_price || c.price) || 0), 0);
  const finalTotal = Number(booking?.total_amount) || 0;
  const discountAmount = Number(booking?.discount_amount) || 0;
  const ticketSubtotal = Math.max(0, finalTotal + discountAmount - combosTotal);

  const ageInfo = AGE_MAP[movie.age_rating] || AGE_MAP.T18;

  // Sao chép mã vé nhanh
  const handleCopyCode = () => {
    if (booking?.booking_code) {
      navigator.clipboard.writeText(booking.booking_code);
      toast.success(`Đã sao chép mã vé: ${booking.booking_code}`);
    }
  };

  return (
    <article className="relative overflow-hidden rounded-3xl bg-white text-slate-800 shadow-2xl border border-slate-200/80 transition-all font-sans print:shadow-none print:border-none print:m-0">
      
      {/* ============================================================== */}
      {/* 1. HEADER CUỐNG VÉ: THƯƠNG HIỆU & TRẠNG THÁI */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 sm:px-7 py-3.5 text-white border-b border-slate-300/40 print:bg-slate-100! print:text-slate-950! print:border-b-2! print:border-slate-300!">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-xs text-xs font-black print:bg-slate-900! print:text-white!">
            🎬
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-white print:text-slate-950!">
              CINE<span className="text-indigo-400 print:text-indigo-600!">CINEMA</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wider font-mono print:text-slate-600!">
              VÉ ĐIỆN TỬ · E-TICKET
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {paid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-black text-emerald-300 shadow-xs print:bg-emerald-50! print:border-emerald-600! print:text-emerald-900!">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse print:hidden" />
              <span>ĐÃ THANH TOÁN THÀNH CÔNG</span>
            </span>
          ) : (
            <BookingStatusBadge status={booking?.status || 'pending'} />
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. NỘI DUNG VÉ CHÍNH: PHIM, RẠP, SUẤT CHIẾU, GHẾ & BẮP NƯỚC */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-7 space-y-6">
        
        {/* Khối Phim & Rạp chiếu */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          
          {/* Poster phim với fallback rực rỡ */}
          <div className="h-40 w-28 sm:h-44 sm:w-32 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-200 shadow-md relative mx-auto sm:mx-0">
            {movie.poster_url && !imgError ? (
              <img
                src={assetUrl(movie.poster_url)}
                alt={movie.title}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center text-white space-y-1">
                <span className="text-2xl">🎬</span>
                <span className="text-[11px] font-bold line-clamp-2 leading-tight text-slate-200">
                  {movie.title}
                </span>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">
                  CINEMA
                </span>
              </div>
            )}
          </div>

          {/* Chi tiết Phim & Địa điểm chiếu */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${ageInfo.badge}`}>
                    {movie.age_rating || 'T18'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    {movie.title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  {ageInfo.desc} {movie.duration_minutes ? `· Thời lượng: ${movie.duration_minutes} phút` : ''}
                </p>
              </div>
            </div>

            {/* Thông tin Rạp, Phòng & Suất chiếu */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 sm:p-3.5 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">🏛️</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm">{cinema.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{cinema.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Phòng chiếu
                  </span>
                  <p className="font-extrabold text-slate-800">
                    {room.name} <span className="font-normal text-slate-500">({room.room_type || '2D Phụ đề'})</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Khung giờ chiếu
                  </span>
                  <p className="font-extrabold text-indigo-600 font-mono">
                    {formatDateTime(showtime.start_time)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* KHỐI VỊ TRÍ GHẾ & BẮP NƯỚC (CONCESSIONS) */}
        {/* ============================================================== */}
        <div className="grid sm:grid-cols-2 gap-3.5">
          
          {/* Ghế đã chọn */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>💺</span> Vị trí ghế ({seatList.length} ghế)
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {seatList.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white px-2.5 py-1 text-xs font-black shadow-xs"
                >
                  <span>{s.label}</span>
                  {s.seat_type && s.seat_type !== 'standard' && (
                    <span className="text-[9px] font-normal text-indigo-300">
                      ({SEAT_TYPE_LABELS[s.seat_type] || s.seat_type})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Combo bắp nước đã đặt */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>🍿</span> Combo Bắp Nước ({combos.length > 0 ? `${combos.length} món` : 'Không có'})
            </span>

            {combos.length > 0 ? (
              <div className="space-y-1 pt-1">
                {combos.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span>{c.quantity}× {c.name}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatPrice((Number(c.quantity) || 1) * (Number(c.unit_price || c.price) || 0))}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-indigo-600 font-medium italic pt-0.5">
                  * Nhận bắp nước tại quầy Concession trước giờ chiếu 10-15 phút.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pt-1">
                Không đặt kèm combo bắp nước
              </p>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* KHỐI THÔNG TIN KHÁCH HÀNG & GIAO DỊCH THANH TOÁN */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>👤</span> Thông tin khách hàng & Giao dịch
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {paymentTime ? formatDateTime(paymentTime) : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-700">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 print:text-slate-600! block">Họ và tên</span>
              <p className="font-bold text-slate-900">{user.full_name || 'Khách hàng'}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 print:text-slate-600! block">Số điện thoại</span>
              <p className="font-bold text-slate-900 font-mono">{user.phone || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 print:text-slate-600! block">Email nhận vé</span>
              <p className="font-medium text-slate-800 truncate">{user.email || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 print:text-slate-600! block">Phương thức thanh toán</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>💳</span>
                <span>{paymentMethod}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 print:text-slate-600! block">Mã giao dịch</span>
              <p className="font-mono font-semibold text-slate-800 truncate">
                {transactionCode}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BẢNG KÊ CHI TIẾT THANH TOÁN (PRICE BREAKDOWN) */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 sm:p-5 space-y-2 print:bg-slate-50! print:text-slate-900! print:border-2! print:border-slate-300!">
          <div className="flex justify-between text-xs text-slate-300 print:text-slate-700!">
            <span>Tiền vé xem phim ({seatList.length} ghế):</span>
            <span className="font-mono print:text-slate-950! print:font-bold!">{formatPrice(ticketSubtotal)}</span>
          </div>

          {combosTotal > 0 && (
            <div className="flex justify-between text-xs text-slate-300 print:text-slate-700!">
              <span>Combo bắp nước:</span>
              <span className="font-mono print:text-slate-950! print:font-bold!">{formatPrice(combosTotal)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400 font-semibold print:text-emerald-700!">
              <span>Giảm giá khuyến mãi {booking?.promotion_code ? `(${booking.promotion_code})` : ''}:</span>
              <span className="font-mono print:text-emerald-700! print:font-bold!">-{formatPrice(discountAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 print:border-slate-300! flex items-baseline justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 print:text-slate-900! block">
                Tổng thanh toán thực tế
              </span>
              <span className="text-[10px] text-slate-400 print:text-slate-600! font-medium">
                (Đã bao gồm VAT và phụ thu phòng chiếu)
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 font-mono print:bg-none! print:text-slate-950!">
              {formatPrice(finalTotal)}
            </span>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. ĐƯỜNG RĂNG CƯA VÉ ĐIỆN TỬ (PERFORATED DIVIDER NOTCHES) */}
      {/* ============================================================== */}
      <div className="relative flex items-center justify-between print:hidden">
        <div className="h-6 w-6 rounded-full bg-slate-950 -ml-3 shadow-inner" />
        <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2" />
        <div className="h-6 w-6 rounded-full bg-slate-950 -mr-3 shadow-inner" />
      </div>
      <div className="hidden print:block border-t-2 border-dashed border-slate-300 mx-4 my-2" />

      {/* ============================================================== */}
      {/* 4. CUỐNG VÉ CHECK-IN: MÃ QR, MÃ VẠCH & MÃ VÉ SOÁT VÉ */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-7 bg-slate-50/70 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          
          {/* Khung Mã QR Code */}
          <div className="flex flex-col items-center">
            {paid ? (
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-2.5 shadow-md">
                <QRCodeSVG
                  value={booking?.qr_content || booking?.booking_code || 'CINE-BOOKING'}
                  size={136}
                  level="H"
                  includeMargin
                />
              </div>
            ) : (
              <div className="h-34 w-34 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center p-3 text-center">
                <span className="text-xl">⏳</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1">
                  Mã QR sẽ xuất hiện sau khi thanh toán
                </span>
              </div>
            )}
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider mt-1.5 uppercase">
              SCAN TO ENTER
            </span>
          </div>

          {/* Mã vé & Mã vạch Barcode */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Mã đặt vé (Booking Code)
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-slate-950">
                  {booking?.booking_code || 'MM-000000'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Sao chép mã vé"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition active:scale-95 cursor-pointer text-xs print:hidden"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Mã vạch Barcode mô phỏng */}
            <div className="max-w-xs mx-auto sm:mx-0 pt-1">
              <BarcodeSVG className="h-8 w-full text-slate-800" />
              <p className="text-[10px] font-mono text-slate-400 tracking-widest text-center sm:text-left mt-0.5">
                *{booking?.booking_code}*
              </p>
            </div>

            {/* Hướng dẫn Check-in */}
            <div className="rounded-xl bg-indigo-50 border border-indigo-200/70 p-2.5 text-xs text-indigo-950 flex items-start gap-2">
              <span className="text-sm shrink-0">💡</span>
              <span className="leading-snug text-[11px]">
                <b>Hướng dẫn check-in:</b> Đưa mã QR này hoặc mã vé cho nhân viên soát vé tại cửa phòng chiếu hoặc quét tại kiosk để vào rạp.
              </span>
            </div>
          </div>
        </div>

        {/* Quy định & Lưu ý của rạp */}
        <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
          <p>• <b>Thời gian đến rạp:</b> Quý khách vui lòng có mặt trước giờ chiếu 15-20 phút để nhận bắp nước và ổn định chỗ ngồi.</p>
          <p>• <b>Quy định độ tuổi:</b> Rạp có quyền kiểm tra giấy tờ tùy thân (CCCD) và từ chối khán giả không đủ độ tuổi quy định.</p>
          <p>• <b>Chính sách vé:</b> Vé chỉ được hủy hoặc đổi trả trước giờ chiếu ít nhất vài giờ theo quy định hiện hành của rạp.</p>
        </div>

      </div>

    </article>
  );
}
