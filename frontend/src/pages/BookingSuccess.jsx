import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getBooking } from '../services/bookingService.js';
import BookingSteps from '../components/booking/BookingSteps.jsx';
import TicketCard from '../components/booking/TicketCard.jsx';
import Button, { buttonClass } from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

export default function BookingSuccess() {
  const { bookingId } = useParams();
  const { data: apiBooking, error, status, reload } = useFetch(() => getBooking(bookingId), [bookingId]);

  // Đọc vé từ localStorage nếu có bản ghi thanh toán gần nhất
  const localBooking = useMemo(() => {
    try {
      const tickets = JSON.parse(localStorage.getItem('momo_paid_tickets') || '[]');
      return tickets.find((t) => String(t.id) === String(bookingId) || t.booking_code === bookingId) || null;
    } catch {
      return null;
    }
  }, [bookingId]);

  // Kết hợp dữ liệu API và dữ liệu đã lưu
  const booking = useMemo(() => {
    if (!apiBooking && !localBooking) return null;
    if (!apiBooking) return localBooking;
    if (!localBooking) return apiBooking;
    return {
      ...localBooking,
      ...apiBooking,
      status: (localBooking.status === 'paid' || apiBooking.status === 'paid') ? 'paid' : apiBooking.status,
      payments: (apiBooking.payments && apiBooking.payments.length > 0) ? apiBooking.payments : (localBooking.payments || []),
    };
  }, [apiBooking, localBooking]);

  if (error && !booking) {
    return status === 404 ? (
      <div className="py-16 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold">Không tìm thấy vé</h1>
        <Link to="/my-bookings" className={`mt-6 ${buttonClass()}`}>Vé của tôi</Link>
      </div>
    ) : <ErrorState message={error} onRetry={reload} />;
  }

  if (!booking) return <Skeleton className="mx-auto h-96 max-w-2xl" />;

  // Nếu đơn thực sự chưa thanh toán và không có bản ghi đã trả tiền: hiển thị thông báo thay vì redirect tự động gây nhảy trang
  if (booking.status === 'pending') {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <p className="text-5xl">⏳</p>
        <h1 className="text-2xl font-bold text-white">Đang chờ xác nhận thanh toán</h1>
        <p className="text-sm text-slate-400">
          Đơn đặt vé này chưa được ghi nhận thanh toán. Vui lòng hoàn tất chuyển khoản để nhận vé điện tử.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to={`/checkout/${booking.id}`} className={buttonClass('primary')}>
            Đến trang thanh toán
          </Link>
          <Button variant="secondary" onClick={reload}>
            Kiểm tra lại
          </Button>
        </div>
      </div>
    );
  }

  const paid = booking.status === 'paid';

  return (
    <div className="mx-auto max-w-2xl sm:max-w-3xl">
      <div className="print:hidden"><BookingSteps current={4} /></div>

      <div className="mt-8 text-center print:hidden">
        {paid ? (
          <>
            <p className="text-5xl">🎉</p>
            <h1 className="mt-3 text-3xl font-extrabold text-white">Đặt vé thành công!</h1>
            <p className="mt-1 text-slate-400">Hãy đưa mã QR bên dưới cho nhân viên soát vé tại rạp.</p>
          </>
        ) : (
          <>
            <p className="text-5xl">ℹ️</p>
            <h1 className="mt-3 text-2xl font-bold text-white">Vé này không còn hiệu lực</h1>
          </>
        )}
      </div>

      <div className="mt-6"><TicketCard booking={booking} /></div>

      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        {paid && <Button onClick={() => window.print()}>🖨 In vé</Button>}
        <Link to="/my-bookings" className={buttonClass('secondary')}>Vé của tôi</Link>
        <Link to="/" className={buttonClass('outline')}>Về trang chủ</Link>
      </div>
    </div>
  );
}
