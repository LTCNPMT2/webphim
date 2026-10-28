import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFetch } from '../../hooks/useFetch.js';
import { cancelBooking, getBooking } from '../../services/bookingService.js';
import { getErrorMessage } from '../../services/api.js';
import Modal from '../ui/Modal.jsx';
import Button, { buttonClass } from '../ui/Button.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import TicketCard from './TicketCard.jsx';

// Hộp thoại chi tiết vé điện tử đầy đủ thông tin: phim, rạp, ghế, bắp nước, khách hàng, thanh toán & mã QR
export default function BookingDetailModal({ bookingId, onClose, onChanged }) {
  const { data: apiBooking, error, reload } = useFetch(() => getBooking(bookingId), [bookingId]);
  const [cancelling, setCancelling] = useState(false);

  // Đọc vé từ localStorage nếu API trả về null hoặc vé tạo từ luồng thanh toán nhanh MoMo/SePay
  const localBooking = useMemo(() => {
    try {
      const tickets = JSON.parse(localStorage.getItem('momo_paid_tickets') || '[]');
      return tickets.find((t) => String(t.id) === String(bookingId) || t.booking_code === bookingId) || null;
    } catch {
      return null;
    }
  }, [bookingId]);

  // Kết hợp dữ liệu API và dữ liệu cục bộ để luôn có đầy đủ chi tiết nhất
  const booking = useMemo(() => {
    if (!apiBooking && !localBooking) return null;
    if (!apiBooking) return localBooking;
    if (!localBooking) return apiBooking;
    return {
      ...localBooking,
      ...apiBooking,
      payments: (apiBooking.payments && apiBooking.payments.length > 0) ? apiBooking.payments : (localBooking.payments || []),
      combos: (apiBooking.combos && apiBooking.combos.length > 0) ? apiBooking.combos : (localBooking.combos || []),
      user: apiBooking.user || localBooking.user,
    };
  }, [apiBooking, localBooking]);

  const handleCancel = async () => {
    const ask = booking.status === 'paid'
      ? 'Hủy vé đã thanh toán? Tiền sẽ được hoàn lại theo quy định và ghế được giải phóng cho khán giả khác.'
      : 'Hủy đơn đang giữ ghế này?';
    if (!window.confirm(ask)) return;

    setCancelling(true);
    try {
      await cancelBooking(booking.id);
      toast.success('Đã hủy vé thành công');
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    if (booking?.booking_code) {
      navigator.clipboard.writeText(booking.booking_code);
      toast.success(`Đã sao chép mã vé: ${booking.booking_code}`);
    }
  };

  return (
    <Modal open onClose={onClose} title="Chi tiết vé điện tử" maxWidth="max-w-2xl sm:max-w-3xl">
      <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-6 space-y-4">
        {error && !booking ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !booking ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : (
          <>
            {/* Thẻ vé điện tử đầy đủ thông tin chuẩn rạp chiếu phim */}
            <TicketCard booking={booking} />

            {/* Thanh công cụ hành động phía dưới vé */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5">
                  <span>🖨️</span>
                  <span>In / Lưu vé</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyCode} className="gap-1.5">
                  <span>📋</span>
                  <span>Sao chép mã</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {booking.status === 'pending' && (
                  <Link to={`/checkout/${booking.id}`} className={buttonClass('primary', 'sm')}>
                    💳 Thanh toán ngay
                  </Link>
                )}
                {booking.can_cancel && (
                  <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>
                    {booking.status === 'paid' ? 'Hủy vé' : 'Hủy đơn'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onClose}>
                  Đóng
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
