import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFetch } from '../hooks/useFetch.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { cancelBooking, getBooking, checkSepayPayment, checkSepayByCode } from '../services/bookingService.js';
import { getErrorMessage } from '../services/api.js';
import { formatCountdown, formatDateTime, formatPrice } from '../utils/format.js';
import BookingSteps from '../components/booking/BookingSteps.jsx';
import OrderSummary from '../components/booking/OrderSummary.jsx';
import Button, { buttonClass } from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

function Notice({ icon, title, text, children }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="text-5xl">{icon}</p>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-400">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { data: booking, error, status, reload } = useFetch(() => getBooking(bookingId), [bookingId]);

  const [cancelling, setCancelling] = useState(false);
  const [checkingSepay, setCheckingSepay] = useState(false);
  const isPaidRef = useRef(false);
  const toastShownRef = useRef(false);

  // Mốc hết hạn = lúc tải + số giây còn lại do SERVER tính (không phụ thuộc đồng hồ máy người dùng)
  const deadline = useMemo(
    () => (booking?.status === 'pending' && booking.seconds_left != null ? Date.now() + booking.seconds_left * 1000 : null),
    [booking]
  );
  const left = useCountdown(deadline);
  const timeIsUp = deadline !== null && left === 0;

  // Hết giờ: hỏi lại server để cập nhật trạng thái thật của đơn
  useEffect(() => {
    if (timeIsUp) reload();
  }, [timeIsUp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Làm sạch mã đơn hàng chỉ lấy chữ cái và số để tương thích 100% với biến động số dư ngân hàng
  const cleanBookingCode = useMemo(() => {
    const raw = booking?.booking_code || '';
    return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || String(booking?.id || '');
  }, [booking?.booking_code, booking?.id]);

  // Link mã QR động chính thức từ SePay (VietQR MBBank)
  const sepayQrUrl = useMemo(() => {
    if (!booking) return '';
    const acc = '0931883988';
    const bank = 'MBBank';
    const amount = booking.total_amount || 0;
    const des = `CINE ${cleanBookingCode}`;
    return `https://qr.sepay.vn/img?acc=${encodeURIComponent(acc)}&bank=${encodeURIComponent(bank)}&amount=${amount}&des=${encodeURIComponent(des)}`;
  }, [booking, cleanBookingCode]);

  // Hàm sao chép nhanh có thông báo
  const copyText = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg || 'Đã sao chép!');
  };

  // Hàm đối soát giao dịch SePay (áp dụng cả cho Polling tự động và bấm nút thủ công)
  const verifyPaymentNow = async (isManual = false) => {
    if (isPaidRef.current) return true;
    if (!booking || booking.status === 'paid') return true;
    if (isManual) setCheckingSepay(true);

    try {
      let res = null;
      // 1. Kiểm tra qua ID nếu có (chắc chắn khớp và ghi DB)
      if (booking.id) {
        res = await checkSepayPayment(booking.id).catch(() => null);
      }
      // 2. Nếu chưa thấy, thử tiếp qua mã code
      if (!res?.paid && cleanBookingCode) {
        res = await checkSepayByCode(cleanBookingCode).catch(() => null);
      }

      if (res?.paid) {
        if (isPaidRef.current) return true;
        isPaidRef.current = true;

        // Lưu vé vào momo_paid_tickets để luôn hiển thị đầy đủ trong "Vé của tôi"
        try {
          const paidTicket = {
            id: booking.id,
            booking_code: booking.booking_code,
            user_id: user?.id || booking.user_id,
            user_email: (user?.email || booking.user?.email || '').toLowerCase().trim(),
            movie_title: booking.movie?.title,
            poster_url: booking.movie?.poster_url,
            cinema_name: booking.cinema?.name,
            room_name: booking.room?.name,
            start_time: booking.showtime?.start_time,
            seat_labels: (booking.seats || []).map((s) => s.label).join(', '),
            total_amount: booking.total_amount,
            status: 'paid',
            qr_content: `CINE-PAID-${cleanBookingCode}`,
            transaction_code: res.transaction?.reference_number || res.transaction?.id || `SEPAY-${Date.now()}`,
            transaction_date: res.transaction?.date || new Date().toISOString(),
            payment_method: 'SePay VietQR (MBBank)',
            seats: booking.seats,
            combos: booking.combos,
            cinema: booking.cinema,
            movie: booking.movie,
            room: booking.room,
            showtime: booking.showtime,
            user: booking.user,
            payments: [
              {
                method: 'SePay VietQR (MBBank)',
                amount: booking.total_amount,
                status: 'paid',
                transaction_code: res.transaction?.reference_number || res.transaction?.id || `SEPAY-${Date.now()}`,
                paid_at: res.transaction?.date || new Date().toISOString(),
              },
            ],
          };
          const recents = JSON.parse(localStorage.getItem('momo_paid_tickets') || '[]');
          const filtered = recents.filter((t) => t.booking_code !== booking.booking_code && t.id !== booking.id);
          localStorage.setItem('momo_paid_tickets', JSON.stringify([paidTicket, ...filtered]));
        } catch (e) {
          console.error(e);
        }

        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.success('Thanh toán SePay thành công! Vé của bạn đã được xác nhận.');
        }

        navigate(`/booking-success/${booking.id}`, { replace: true });
        return true;
      }

      if (isManual) {
        toast('Chưa thấy biến động số dư cho mã "CINE ' + cleanBookingCode + '". Nếu bạn vừa chuyển khoản, vui lòng đợi 5-10 giây để ngân hàng gửi thông báo rồi bấm kiểm tra lại nhé!', {
          icon: '⏳',
          duration: 5000,
        });
      }
    } catch (err) {
      if (isManual) {
        toast.error('Chưa thể kiểm tra SePay lúc này: ' + (err.message || ''));
      }
    } finally {
      if (isManual) setCheckingSepay(false);
    }
    return false;
  };

  // Tự động kiểm tra giao dịch SePay mỗi 2.5 giây khi đơn đang ở trạng thái pending
  useEffect(() => {
    if (!booking || booking.status !== 'pending' || isPaidRef.current) return;
    let isMounted = true;

    // Kiểm tra ngay 1 lần khi mở trang
    verifyPaymentNow(false);

    const interval = setInterval(() => {
      if (!isMounted || isPaidRef.current) return;
      verifyPaymentNow(false);
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [booking?.id, booking?.status, cleanBookingCode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !booking) {
    return status === 404 ? (
      <Notice icon="🔍" title="Không tìm thấy đơn đặt vé" text="Đơn không tồn tại hoặc không thuộc về tài khoản của bạn.">
        <Link to="/my-bookings" className={buttonClass()}>Vé của tôi</Link>
      </Notice>
    ) : <ErrorState message={error} onRetry={reload} />;
  }
  if (!booking) return <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>;

  if (booking.status === 'paid') return <Navigate to={`/booking-success/${booking.id}`} replace />;

  if (booking.status !== 'pending') {
    const cancelled = booking.status === 'cancelled';
    return (
      <Notice icon={cancelled ? '🚫' : '⌛'} title={cancelled ? 'Đơn đã được hủy' : 'Đơn đã hết hạn giữ ghế'}
        text={cancelled ? 'Đơn đặt vé này đã bị hủy.' : 'Quá thời gian thanh toán nên ghế đã được trả lại. Bạn có thể đặt lại.'}>
        <Link to={`/booking/${booking.showtime.id}/seats`} className={buttonClass()}>Đặt lại suất này</Link>
        <Link to="/my-bookings" className={buttonClass('outline')}>Vé của tôi</Link>
      </Notice>
    );
  }

  const handleCancel = async () => {
    if (!window.confirm('Hủy đơn này? Ghế đang giữ sẽ được trả lại.')) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id);
      toast.success('Đã hủy đơn, ghế đã được trả lại');
      navigate(`/movies/${booking.movie.id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setCancelling(false);
    }
  };

  const urgent = left !== null && left <= 60;
  const summaryInfo = {
    title: booking.movie.title,
    cinema: booking.cinema.name,
    room: `${booking.room.name} (${booking.room.room_type})`,
    time: formatDateTime(booking.showtime.start_time),
  };

  return (
    <div>
      <BookingSteps current={3} />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        
        {/* CỘT TRÁI: ĐỒNG HỒ ĐẾM NGƯỢC & PHƯƠNG THỨC THANH TOÁN SEPAY */}
        <div className="space-y-5">
          
          {/* Thanh đếm ngược giữ ghế */}
          <section className={`rounded-2xl border p-5 text-center ${urgent ? 'border-red-500/50 bg-red-500/10' : 'border-amber-500/40 bg-amber-500/10'}`}>
            <p className="text-sm text-slate-300">Ghế của bạn đang được giữ. Thời gian còn lại để thanh toán</p>
            <p className={`mt-1 font-mono text-5xl font-extrabold tabular-nums ${urgent ? 'animate-pulse text-red-400' : 'text-amber-300'}`} role="timer" aria-live="off">
              {formatCountdown(left)}
            </p>
            <p className="mt-2 text-xs text-slate-400">Hết giờ đơn sẽ tự hủy và ghế được trả lại cho người khác.</p>
          </section>

          {/* KHUNG THANH TOÁN SEPAY CHÍNH THỨC */}
          <section className="rounded-2xl border border-pink-500/30 bg-slate-900/80 p-5 sm:p-6 space-y-5 shadow-xl shadow-pink-950/10">
            
            {/* Header phương thức thanh toán */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#d82d8b] to-rose-600 text-xl font-black text-white shadow-md shadow-pink-600/30">
                  ⚡
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Thanh toán SePay</span>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      Tự động 2.5s
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chuyển khoản VietQR qua mọi ứng dụng Ngân hàng (MBBank)
                  </p>
                </div>
              </div>

              {/* Tag trạng thái Polling tự động */}
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-300 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Tự động đối soát SePay</span>
              </div>
            </div>

            {/* Chi tiết Mã QR & Thông tin tài khoản nhận tiền */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              
              {/* Cột Trái: Mã QR VietQR SePay */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 shadow-md">
                <div className="w-44 h-44 relative flex items-center justify-center">
                  {sepayQrUrl ? (
                    <img
                      src={sepayQrUrl}
                      alt="Mã QR SePay VietQR"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Đang tải mã QR...
                    </div>
                  )}
                </div>
                <p className="mt-3 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 text-center">
                  <span>📱</span>
                  <span>Mở App ngân hàng quét mã VietQR</span>
                </p>
                <span className="text-[10px] font-mono font-medium text-slate-500 mt-0.5 text-center">
                  Hỗ trợ 40+ ngân hàng tại Việt Nam
                </span>
              </div>

              {/* Cột Phải: Thông tin số tài khoản & nội dung */}
              <div className="sm:col-span-7 space-y-2.5 text-xs">
                
                {/* Ngân hàng */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 border border-white/5 p-3">
                  <span className="text-slate-400 font-medium">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-white">MBBank (Quân Đội)</span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 border border-white/5 p-3">
                  <span className="text-slate-400 font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-300 text-sm">0931883988</span>
                    <button
                      type="button"
                      onClick={() => copyText('0931883988', 'Đã sao chép số tài khoản!')}
                      className="rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-bold text-white transition cursor-pointer"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 border border-white/5 p-3">
                  <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
                  <span className="font-bold text-white">NGUYEN TRONG BANG</span>
                </div>

                {/* Số tiền */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 border border-white/5 p-3">
                  <span className="text-slate-400 font-medium">Số tiền thanh toán:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {formatPrice(booking.total_amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(String(booking.total_amount), 'Đã sao chép số tiền!')}
                      className="rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-bold text-white transition cursor-pointer"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="flex items-center justify-between rounded-xl bg-pink-500/10 border border-pink-500/30 p-3">
                  <div className="min-w-0 pr-2">
                    <span className="text-pink-300 font-bold block">Nội dung CK:</span>
                    <span className="text-[10px] text-pink-200/80 italic">Bắt buộc giữ nguyên</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-300 text-sm">
                      CINE {cleanBookingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(`CINE ${cleanBookingCode}`, 'Đã sao chép nội dung chuyển khoản!')}
                      className="rounded-lg bg-[#d82d8b] hover:bg-[#c2185b] px-2.5 py-1 text-[10px] font-black text-white transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Nút bấm kiểm tra giao dịch SePay */}
            <div className="pt-2">
              <button
                type="button"
                disabled={checkingSepay || timeIsUp || cancelling}
                onClick={() => verifyPaymentNow(true)}
                className="w-full rounded-xl bg-gradient-to-r from-[#d82d8b] to-rose-600 hover:from-[#c2185b] hover:to-rose-700 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {checkingSepay ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang kiểm tra biến động số dư SePay...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Tôi đã chuyển tiền - Kiểm tra giao dịch ngay</span>
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">
                Sau khi chuyển khoản thành công, hệ thống sẽ tự động chuyển trang sau 2-5 giây hoặc bạn có thể bấm nút kiểm tra ở trên.
              </p>
            </div>

          </section>

          {/* Các phương thức khác */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Phương thức thanh toán khác
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Ví MoMo', 'Cổng VNPay'].map((m) => (
                <div key={m} className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 opacity-60">
                  <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                  <span className="font-semibold text-slate-300">{m}</span>
                  <span className="ml-auto text-[10px] text-slate-500 font-medium">Sắp ra mắt</span>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <OrderSummary
          info={summaryInfo}
          seatLines={booking.seats.map((s) => ({ label: s.label, seat_type: s.seat_type, price: s.price }))}
          comboLines={booking.combos.map((c) => ({ name: c.name, quantity: c.quantity, total: c.quantity * c.unit_price }))}
          subtotal={booking.subtotal}
          discount={booking.discount_amount}
          promoCode={booking.promotion_code}
          total={booking.total_amount}
        >
          <Button
            className="w-full gap-2 bg-gradient-to-r from-[#d82d8b] to-rose-600 hover:from-[#c2185b] hover:to-rose-700 shadow-lg shadow-pink-600/30 font-bold py-3 text-sm"
            loading={checkingSepay}
            disabled={timeIsUp || cancelling}
            onClick={() => verifyPaymentNow(true)}
          >
            {checkingSepay ? (
              <span>Đang kiểm tra SePay...</span>
            ) : (
              <span>⚡ Kiểm tra thanh toán SePay</span>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            loading={cancelling}
            disabled={checkingSepay}
            onClick={handleCancel}
          >
            Hủy đơn
          </Button>
        </OrderSummary>

      </div>
    </div>
  );
}
