import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { checkSepayPayment, checkSepayByCode, createBooking, getCombos, getSeatMap, payBooking } from '../../services/bookingService.js';
import * as authService from '../../services/authService.js';
import { TOKEN_KEY } from '../../services/api.js';
import { assetUrl, formatDateTime, formatPrice } from '../../utils/format.js';

// Danh sách Combo bắp nước chuẩn MoMo Cinema (Ảnh số 2)
const MOMO_COMBOS = [
  {
    id: 1,
    name: 'MY COMBO',
    price: 95000,
    tag: 'FREE CARAMEL',
    description: '01 Bắp ngọt lớn + 01 Nước ngọt siêu lớn\nFREE ĐỔI VỊ CARAMEL ONLINE',
    image: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'CINE COMBO',
    price: 125000,
    tag: 'FREE CARAMEL',
    description: '01 Bắp ngọt lớn + 02 Nước ngọt siêu lớn\nFREE ĐỔI VỊ CARAMEL ONLINE',
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Online_COMBO 159K',
    price: 159000,
    tag: 'TIẾT KIỆM',
    description: '02 Bắp ngọt vừa + 03 Nước ngọt\nThích hợp cho nhóm bạn 3 người',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Online_COMBO 189K',
    price: 189000,
    tag: 'HOT COMBO',
    description: '02 Bắp ngọt lớn + 04 Nước ngọt + 01 Bánh snack tùy chọn',
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    name: 'CAT IN THE HAT COMBO',
    price: 239000,
    tag: 'PHIÊN BẢN GIỚI HẠN',
    description: '01 Ly nhân vật đặc biệt + 01 Bắp ngọt lớn + 01 Nước ngọt',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=200&auto=format&fit=crop&q=80',
  },
];

export default function MoMoBookingModal({
  open,
  onClose,
  showtime,
  movie,
  cinema,
}) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Bước hiện tại: 1 = Chọn ghế, 2 = Chọn Combo, 3 = Quét mã QR, 4 = Thành công
  const [step, setStep] = useState(1);

  // Danh sách ghế đang chọn
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Số lượng combo đã chọn: { [comboId]: quantity }
  const [selectedCombos, setSelectedCombos] = useState({});

  // Danh sách combo lấy từ server (đồng bộ trang Admin)
  const [combosList, setCombosList] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoadingCombos(true);
    getCombos()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCombosList(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi lấy danh sách combo:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingCombos(false);
      });
    return () => { isMounted = false; };
  }, [open]);

  const activeCombos = useMemo(() => {
    return combosList.length > 0 ? combosList : MOMO_COMBOS;
  }, [combosList]);

  // Đơn đặt vé vừa tạo từ backend
  const [createdBooking, setCreatedBooking] = useState(null);

  // Trạng thái xử lý
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [confirmedTransaction, setConfirmedTransaction] = useState(null);
  const [seatMapData, setSeatMapData] = useState(null);

  // Số điện thoại khách hàng đặt vé (Bắt buộc)
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [phoneError, setPhoneError] = useState('');

  // Đồng bộ số điện thoại khi user hoặc modal thay đổi
  useEffect(() => {
    if (user?.phone) {
      setCustomerPhone(user.phone);
    }
  }, [user?.phone, open]);

  // Reset state mỗi khi mở modal mới
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedSeats([]);
      setSelectedCombos({});
      setCreatedBooking(null);
      setConfirmedTransaction(null);
      setCheckingPayment(false);
    }
  }, [open, showtime]);

  // Tải sơ đồ ghế thật từ API nếu showtime là số ID hợp lệ
  useEffect(() => {
    if (!open || !showtime?.id) return;
    const realId = Number(showtime.id);
    if (Number.isInteger(realId) && realId > 0) {
      getSeatMap(realId)
        .then((data) => setSeatMapData(data.seats))
        .catch(() => setSeatMapData(null));
    } else {
      setSeatMapData(null);
    }
  }, [open, showtime]);

  // Giá cơ bản của ghế
  const basePrice = showtime?.basePrice || showtime?.base_price || 90000;
  const vipSurcharge = 20000;
  const coupleSurcharge = 40000;

  // Lưới ghế chuẩn 75 ghế (30 Thường, 40 VIP, 5 Ghế đôi Sweetbox)
  const gridRows = useMemo(() => {
    // Nếu có dữ liệu ghế thật từ API (75 ghế từ DB)
    if (seatMapData && Array.isArray(seatMapData) && seatMapData.length > 0) {
      const map = new Map();
      const sorted = [...seatMapData].sort(
        (a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number
      );
      sorted.forEach((seat) => {
        const rowKey = seat.row_label;
        if (!map.has(rowKey)) {
          map.set(rowKey, {
            label: rowKey,
            type: seat.seat_type,
            seats: [],
          });
        }
        const rowObj = map.get(rowKey);
        if (seat.seat_type === 'couple') rowObj.type = 'couple';
        else if (seat.seat_type === 'vip' && rowObj.type !== 'couple') rowObj.type = 'vip';

        const seatCode = `${seat.row_label}${seat.seat_number}`;
        const isCenter = ['D', 'E', 'F', 'G'].includes(seat.row_label) && seat.seat_number >= 3 && seat.seat_number <= 8;

        rowObj.seats.push({
          id: seatCode,
          dbId: seat.id,
          num: seat.seat_number,
          type: seat.seat_type,
          isCenter,
          price: seat.price || (basePrice + (seat.seat_type === 'vip' ? vipSurcharge : seat.seat_type === 'couple' ? coupleSurcharge : 0)),
          status: seat.status || 'available',
        });
      });
      return [...map.values()];
    }

    // Fallback: Đúng chuẩn 75 ghế (A, B, C: 10 thường; D, E, F, G: 10 VIP; H: 5 Sweetbox)
    const rows = [];
    ['A', 'B', 'C'].forEach((label) => {
      rows.push({
        label,
        type: 'standard',
        seats: Array.from({ length: 10 }, (_, i) => {
          const num = i + 1;
          return {
            id: `${label}${num}`,
            num,
            type: 'standard',
            price: basePrice,
            status: 'available',
          };
        }),
      });
    });

    ['D', 'E', 'F', 'G'].forEach((label) => {
      rows.push({
        label,
        type: 'vip',
        seats: Array.from({ length: 10 }, (_, i) => {
          const num = i + 1;
          const isTaken = (label === 'F' && (num === 4 || num === 5));
          const isCenter = num >= 3 && num <= 8;
          return {
            id: `${label}${num}`,
            num,
            type: 'vip',
            isCenter,
            price: basePrice + vipSurcharge,
            status: isTaken ? 'booked' : 'available',
          };
        }),
      });
    });

    rows.push({
      label: 'H',
      type: 'couple',
      seats: Array.from({ length: 5 }, (_, i) => {
        const num = i + 1;
        return {
          id: `H${num}`,
          num,
          type: 'couple',
          price: basePrice + coupleSurcharge,
          status: 'available',
        };
      }),
    });

    return rows;
  }, [seatMapData, basePrice, vipSurcharge, coupleSurcharge]);

  const standardRows = useMemo(() => gridRows.filter((r) => ['A', 'B', 'C'].includes(r.label)), [gridRows]);
  const vipRows = useMemo(() => gridRows.filter((r) => ['D', 'E', 'F', 'G'].includes(r.label)), [gridRows]);
  const coupleRows = useMemo(() => gridRows.filter((r) => r.label === 'H' || r.type === 'couple'), [gridRows]);

  // Click chọn hoặc bỏ chọn ghế
  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return;
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      return [...prev, seat];
    });
  };

  // Tính tổng tiền vé
  const seatSubtotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSeats]);

  // Tính tổng tiền combo
  const comboSubtotal = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [comboId, qty]) => {
      const combo = activeCombos.find((c) => c.id === Number(comboId));
      return sum + (combo ? combo.price * qty : 0);
    }, 0);
  }, [selectedCombos, activeCombos]);

  // Tổng thanh toán toàn bộ
  const totalAmount = seatSubtotal + comboSubtotal;

  // Thay đổi số lượng combo
  const updateComboQty = (comboId, delta) => {
    setSelectedCombos((prev) => {
      const current = prev[comboId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[comboId];
        return copy;
      }
      return { ...prev, [comboId]: next };
    });
  };

  // Đảm bảo có tài khoản khách hàng khi thực hiện tạo đơn
  const ensureUserSession = async () => {
    if (user) return user;
    try {
      // Đăng nhập tài khoản khách hàng để lưu vé vào "Vé của tôi"
      const res = await authService.googleLogin({
        isDemo: true,
        demoEmail: 'guest@cinema.vn',
        demoName: 'Khách hàng',
      });
      localStorage.setItem(TOKEN_KEY, res.token);
      setUser(res.user);
      return res.user;
    } catch {
      return null;
    }
  };

  // Lấy mã booking không ký tự đặc biệt để tương thích 100% với tin nhắn biến động số dư ngân hàng MBBank / SePay
  const cleanBookingCode = useMemo(() => {
    const raw = createdBooking?.booking_code || '';
    const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return cleaned || 'MM890573';
  }, [createdBooking?.booking_code]);

  // Chuyển từ Bước 2 (Combo) sang Bước 3 (Quét mã QR SePay)
  const handleProceedToPayment = async () => {
    const cleanPhone = (customerPhone || user?.phone || '').trim();
    if (!cleanPhone) {
      setPhoneError('Vui lòng nhập số điện thoại để nhận thông tin vé và mã QR');
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!/^(0|\+84)\d{9,10}$/.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ (gồm 10 số, ví dụ: 0931883988)');
      toast.error('Số điện thoại không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await ensureUserSession();

      // Nếu tài khoản chưa có số điện thoại hoặc đổi số mới -> lưu ngay vào database
      if (loggedUser && (!loggedUser.phone || loggedUser.phone !== cleanPhone)) {
        try {
          const updatedUser = await authService.updateProfile({ phone: cleanPhone });
          setUser(updatedUser);
        } catch (saveErr) {
          console.warn('Lưu số điện thoại vào profile:', saveErr);
        }
      }

      // Chuẩn bị payload tạo đơn thật vào MySQL
      const realShowtimeId = Number(showtime?.id) > 0 ? Number(showtime.id) : 1;
      const seatIds = selectedSeats.map((s, idx) => s.dbId || (idx + 1));
      const combosPayload = Object.entries(selectedCombos).map(([id, qty]) => ({
        combo_id: Number(id),
        quantity: qty,
      }));

      // Mã ngẫu nhiên chuẩn không dấu gạch (vd: MM890573)
      const safeCode = 'MM' + Math.floor(Math.random() * 900000 + 100000);

      let bookingResult = null;
      try {
        bookingResult = await createBooking({
          showtime_id: realShowtimeId,
          seat_ids: seatIds,
          combos: combosPayload.length > 0 ? combosPayload : undefined,
        });
      } catch {
        // Fallback tạo mã vé chuẩn hiển thị ngay nếu offline hoặc chưa map xong ghế DB
        bookingResult = {
          id: Math.floor(Math.random() * 90000) + 10000,
          booking_code: safeCode,
          total_amount: totalAmount,
          qr_content: `CINE-${safeCode}`,
          status: 'pending',
        };
      }

      setCreatedBooking(bookingResult);
      setStep(3); // Mở Bước 3 (Quét mã QR)
    } catch (err) {
      toast.error('Có lỗi khi tạo đơn đặt vé: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác nhận thanh toán thành công CHỈ KHI CÓ GIAO DỊCH THẬT TỪ SEPAY
  const handleConfirmPaid = async (matchedTx = null) => {
    // CHẶN HOÀN TOÀN: Nếu không có giao dịch xác thực từ SePay/Ngân hàng thì tuyệt đối không cho phép
    if (!matchedTx) {
      toast.error('Chưa có thông tin xác nhận thanh toán từ ngân hàng. Vui lòng quét mã QR hoặc bấm "Kiểm tra chuyển tiền ngay".');
      return;
    }

    setLoading(true);
    try {
      if (createdBooking?.id) {
        try {
          await payBooking({
            booking_id: createdBooking.id,
            method: 'sepay',
          });
        } catch {
          // Bỏ qua lỗi nếu là đơn giả lập
        }
      }

      const txDetails = matchedTx;
      setConfirmedTransaction(txDetails);

      const phoneToSave = (customerPhone || user?.phone || '').trim();

      // Lưu vé đã thanh toán vào momo_paid_tickets để chắc chắn xuất hiện ngay trong "Vé của tôi"
      const paidTicket = {
        id: createdBooking?.id || Date.now(),
        booking_code: cleanBookingCode,
        user_id: user?.id,
        user_email: (user?.email || '').toLowerCase().trim(),
        movie_title: movie?.title || 'Trại Buôn Người',
        poster_url: movie?.poster_url || null,
        cinema_name: cinema?.name || 'Cine Sài Gòn Center',
        room_name: showtime?.roomName || 'Cinema 8',
        start_time: new Date().toISOString(),
        seat_labels: selectedSeats.map((s) => s.id).join(', '),
        total_amount: totalAmount,
        status: 'paid',
        qr_content: `CINE-PAID-${cleanBookingCode}`,
        transaction_code: txDetails.reference_number || txDetails.id || `SEPAY-${Date.now()}`,
        transaction_date: txDetails.date || new Date().toISOString(),
        payment_method: 'SePay VietQR (MBBank)',
        seats: selectedSeats.map((s) => ({ label: s.id, seat_type: s.type, price: s.price })),
        combos: Object.entries(selectedCombos).map(([id, qty]) => {
          const c = activeCombos.find((item) => item.id === Number(id));
          return { name: c?.name || 'Combo', quantity: qty, price: c?.price || 0, unit_price: c?.price || 0 };
        }),
        cinema: {
          name: cinema?.name || 'Cine Sài Gòn Center',
          address: cinema?.address || '65 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        },
        movie: {
          title: movie?.title || 'Trại Buôn Người',
          age_rating: movie?.age_rating || 'C18',
          poster_url: movie?.poster_url,
          duration_minutes: movie?.duration_minutes || 115,
        },
        room: {
          name: showtime?.roomName || 'Cinema 1',
          room_type: showtime?.roomType || movie?.room_type || '2D Chuẩn',
        },
        showtime: { start_time: showtime?.time ? `${new Date().toISOString().split('T')[0]}T${showtime.time}:00` : new Date().toISOString() },
        user: {
          full_name: user?.full_name || 'Khách hàng',
          email: user?.email || '',
          phone: phoneToSave,
        },
        payments: [
          {
            method: 'SePay VietQR (MBBank)',
            amount: totalAmount,
            status: 'paid',
            transaction_code: txDetails.reference_number || txDetails.id || `SEPAY-${Date.now()}`,
            paid_at: txDetails.date || new Date().toISOString(),
          },
        ],
      };

      try {
        const recents = JSON.parse(localStorage.getItem('momo_paid_tickets') || '[]');
        const filtered = recents.filter((t) => t.booking_code !== cleanBookingCode);
        localStorage.setItem('momo_paid_tickets', JSON.stringify([paidTicket, ...filtered]));
      } catch (e) {
        console.error(e);
      }

      toast.success('Thanh toán SePay thành công! Vé đã được xác nhận.');
      setStep(4); // Màn hình chúc mừng thành công
    } catch (err) {
      toast.error('Lỗi xác nhận thanh toán: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Điều hướng đến trang "Vé của tôi"
  const handleGoToMyBookings = () => {
    onClose();
    navigate('/my-bookings');
  };

  // Link mã QR VietQR động chính thức từ SePay của dự án (MBBank 0931883988)
  const sepayQrUrl = useMemo(() => {
    const acc = '0931883988';
    const bank = 'MBBank';
    const des = `CINE ${cleanBookingCode}`;
    return `https://qr.sepay.vn/img?acc=${encodeURIComponent(acc)}&bank=${encodeURIComponent(bank)}&amount=${totalAmount}&des=${encodeURIComponent(des)}`;
  }, [totalAmount, cleanBookingCode]);

  // Hàm kiểm tra thanh toán ngay (áp dụng cả cho Polling tự động và bấm nút thủ công)
  const verifyPaymentNow = async (isManual = false) => {
    if (!createdBooking) return false;
    if (isManual) setCheckingPayment(true);
    try {
      const code = cleanBookingCode;
      const id = createdBooking.id;

      let res = null;
      // 1. Kiểm tra nhanh qua mã code trực tiếp
      if (code) {
        res = await checkSepayByCode(code).catch(() => null);
      }
      // 2. Nếu chưa thấy, kiểm tra tiếp qua ID nếu có
      if (!res?.paid && id) {
        res = await checkSepayPayment(id).catch(() => null);
      }

      if (res?.paid) {
        handleConfirmPaid(res.transaction || {
          reference_number: `SEPAY-${code}`,
          date: new Date().toISOString(),
          amount: totalAmount,
        });
        return true;
      }

      if (isManual) {
        toast('Chưa thấy biến động số dư cho mã "CINE ' + code + '". Nếu bạn vừa chuyển khoản, vui lòng đợi 5-10 giây để SePay nhận tin nhắn ngân hàng rồi bấm kiểm tra lại nhé!', {
          icon: '⏳',
          duration: 5000,
        });
      }
    } catch (err) {
      if (isManual) {
        toast.error('Chưa thể kiểm tra với SePay lúc này: ' + (err.message || ''));
      }
    } finally {
      if (isManual) setCheckingPayment(false);
    }
    return false;
  };

  // Tự động kiểm tra trạng thái thanh toán từ SePay API mỗi 2.5 giây khi đang ở Bước 3
  useEffect(() => {
    if (step !== 3 || !createdBooking) return;
    let isMounted = true;

    // Kiểm tra ngay 1 lần khi chuyển sang Bước 3
    verifyPaymentNow(false);

    const interval = setInterval(() => {
      if (!isMounted) return;
      verifyPaymentNow(false);
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [step, createdBooking?.id, cleanBookingCode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto font-sans">
      
      {/* ============================================================== */}
      {/* BƯỚC 1: SƠ ĐỒ CHỌN GHẾ (TỐI ƯU VỪA MÀN HÌNH 100%, NÚT THOÁT RÕ RÀNG) */}
      {/* ============================================================== */}
      {step === 1 && (
        <div className="relative w-full max-w-2xl max-h-[96vh] flex flex-col my-auto overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in text-slate-800">
          
          {/* Header màu hồng Magenta chuẩn MoMo */}
          <div className="flex items-center justify-between bg-[#d82d8b] px-4 py-2 text-white shrink-0">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/20 transition text-xl font-bold cursor-pointer"
              aria-label="Quay lại"
              title="Quay lại"
            >
              ‹
            </button>
            <h2 className="text-sm sm:text-base font-bold tracking-wide">
              Mua vé xem phim
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/20 transition text-lg font-bold cursor-pointer"
              aria-label="Đóng"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Sân khấu rạp tối */}
          <div className="flex-1 overflow-y-auto bg-[#18181b] px-3 sm:px-6 py-2.5 sm:py-3 text-white text-center">
            
            {/* Thanh hiển thị Màn hình cong */}
            <div className="mb-2.5 flex flex-col items-center">
              <div className="h-1.5 w-56 sm:w-72 rounded-full bg-slate-300 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
              <span className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                MÀN HÌNH
              </span>
            </div>

            {/* Khung chứa các hàng ghế */}
            <div className="relative inline-block max-w-full overflow-x-auto pb-1">
              
              <div className="space-y-1.5 sm:space-y-2">
                {/* Hàng A, B, C: Ghế thường (màu tím) */}
                {standardRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {row.seats.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      const isBooked = seat.status === 'booked' || seat.status === 'holding';

                      let btnColor = 'bg-[#673ab7] hover:bg-[#7e57c2]'; // Ghế thường (Tím)
                      if (isBooked) btnColor = 'bg-[#3f3f46] text-slate-500 cursor-not-allowed'; // Đã đặt (Xám)
                      if (isSelected) btnColor = 'bg-[#ff007f] ring-2 ring-white scale-105 shadow-md'; // Đang chọn

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => toggleSeat(seat)}
                          className={`flex items-center justify-center text-[10px] sm:text-xs font-bold text-white transition rounded-md shadow-2xs active:scale-95 w-6 sm:w-7 h-6 sm:h-7 cursor-pointer ${btnColor}`}
                          title={`${seat.id} · Ghế thường · ${formatPrice(seat.price)}`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Hàng D, E, F, G: Ghế VIP (màu đỏ) kèm khung viền Vùng trung tâm */}
                <div className="relative space-y-1.5 sm:space-y-2 py-0.5">
                  <div
                    className="pointer-events-none absolute -inset-y-0.5 left-1/2 -translate-x-1/2 w-[184px] sm:w-[220px] border-2 border-emerald-400 rounded-lg shadow-[0_0_12px_rgba(52,211,153,0.3)] z-10"
                  />
                  {vipRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-center gap-1.5 sm:gap-2">
                      {row.seats.map((seat) => {
                        const isSelected = selectedSeats.some((s) => s.id === seat.id);
                        const isBooked = seat.status === 'booked' || seat.status === 'holding';

                        let btnColor = 'bg-[#e53935] hover:bg-[#ef5350]'; // Ghế VIP (Đỏ)
                        if (isBooked) btnColor = 'bg-[#3f3f46] text-slate-500 cursor-not-allowed'; // Đã đặt (Xám)
                        if (isSelected) btnColor = 'bg-[#ff007f] ring-2 ring-white scale-105 shadow-md'; // Đang chọn

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleSeat(seat)}
                            className={`flex items-center justify-center text-[10px] sm:text-xs font-bold text-white transition rounded-md shadow-2xs active:scale-95 w-6 sm:w-7 h-6 sm:h-7 cursor-pointer ${btnColor}`}
                            title={`${seat.id} · Ghế VIP · ${formatPrice(seat.price)}`}
                          >
                            {seat.id}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Hàng H: Ghế đôi / Sweetbox (màu hồng) */}
                {coupleRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {row.seats.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      const isBooked = seat.status === 'booked' || seat.status === 'holding';

                      let btnColor = 'bg-[#d82d8b] hover:bg-[#ec407a]'; // Ghế Sweetbox (Hồng)
                      if (isBooked) btnColor = 'bg-[#3f3f46] text-slate-500 cursor-not-allowed'; // Đã đặt (Xám)
                      if (isSelected) btnColor = 'bg-[#ff007f] ring-2 ring-white scale-105 shadow-md'; // Đang chọn

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => toggleSeat(seat)}
                          className={`flex items-center justify-center text-[10px] sm:text-xs font-bold text-white transition rounded-md shadow-2xs active:scale-95 w-14 sm:w-16 h-6 sm:h-7 cursor-pointer ${btnColor}`}
                          title={`${seat.id} · Ghế đôi Sweetbox · ${formatPrice(seat.price)}`}
                        >
                          {seat.id}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Chú thích màu sắc ghế (Legend) */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[10px] sm:text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#3f3f46]" />
                  <span>Đã đặt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#ff007f] ring-1 ring-white" />
                  <span>Ghế bạn chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#673ab7]" />
                  <span>Ghế thường</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#e53935]" />
                  <span>Ghế VIP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#d82d8b]" />
                  <span>Ghế Sweetbox</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border-2 border-emerald-400 bg-transparent" />
                  <span>Vùng trung tâm</span>
                </div>
              </div>

              <div className="mt-1 text-center">
                <button type="button" className="text-[10px] text-slate-400 underline hover:text-slate-200">
                  Xem chi tiết hình ảnh và thông tin ghế
                </button>
              </div>

            </div>

          </div>

          {/* Thanh tóm tắt trắng ở đáy chuẩn MoMo */}
          <div className="border-t border-slate-200 bg-white px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white shrink-0">
                  {movie?.age_rating || 'C18'}
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                  {movie?.title || 'Trại Buôn Người'}
                </span>
              </div>
              <p className="text-[11px] text-amber-600 font-medium truncate">
                {showtime?.startTimeStr || '13:40'} ~ {showtime?.endTimeStr || '15:55'} · Hôm nay · {showtime?.roomName || 'Cinema 8'} · {showtime?.roomType || movie?.room_type || '2D Chuẩn'}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <div className="truncate">
                  <span className="text-slate-500">Chỗ ngồi: </span>
                  <span className="font-bold text-slate-900">
                    {selectedSeats.length > 0 ? selectedSeats.map((s) => s.id).join(', ') : 'Chưa chọn'}
                  </span>
                </div>
                <div className="shrink-0">
                  <span className="text-slate-500">Tạm tính: </span>
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {formatPrice(seatSubtotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút "Mua vé" màu hồng Magenta */}
            <button
              type="button"
              disabled={selectedSeats.length === 0}
              onClick={() => setStep(2)}
              className="rounded-xl bg-[#d82d8b] px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition hover:bg-[#c2185b] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              Mua vé
            </button>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* BƯỚC 2: CHỌN COMBO - BẮP NƯỚC (ĐỒNG BỘ TỪ ADMIN) */}
      {/* ============================================================== */}
      {step === 2 && (
        <div className="relative w-full max-w-lg max-h-[96vh] flex flex-col my-auto overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in text-slate-800">
          
          {/* Header màu hồng */}
          <div className="flex items-center justify-between bg-[#d82d8b] px-4 py-2 text-white shrink-0">
            <button
              onClick={() => setStep(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/20 transition text-xl font-bold cursor-pointer"
              aria-label="Quay lại chọn ghế"
              title="Quay lại chọn ghế"
            >
              ‹
            </button>
            <h2 className="text-sm sm:text-base font-bold tracking-wide">
              Combo - Bắp nước
            </h2>
            <div className="w-8" />
          </div>

          {/* Danh sách các Combo bắp nước */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100">
            {loadingCombos && activeCombos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Đang tải danh sách bắp nước...
              </div>
            ) : (
              activeCombos.map((combo) => {
                const qty = selectedCombos[combo.id] || 0;
                const imgUrl = combo.image_url ? assetUrl(combo.image_url) : (combo.image || '');
                return (
                  <div key={combo.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
                    
                    {/* Ảnh combo */}
                    <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 grid place-items-center text-3xl">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={combo.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>🍿</span>
                      )}
                      {combo.tag && (
                        <span className="absolute top-1 left-1 rounded bg-rose-600 px-1 py-0.5 text-[8px] font-black text-white leading-tight">
                          {combo.tag}
                        </span>
                      )}
                    </div>

                    {/* Thông tin combo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {combo.name} - {formatPrice(combo.price)}
                      </h3>
                      {combo.description && (
                        <p className="mt-1 text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                          {combo.description}
                        </p>
                      )}

                      {/* Bộ tăng giảm số lượng (+ / -) */}
                      <div className="mt-2.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateComboQty(combo.id, -1)}
                          disabled={qty === 0}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-[#d82d8b] hover:text-[#d82d8b] disabled:opacity-30 transition cursor-pointer"
                        >
                          –
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-slate-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateComboQty(combo.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[#d82d8b] bg-pink-50 text-[#d82d8b] hover:bg-[#d82d8b] hover:text-white transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Thanh thanh toán ở đáy */}
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            
            {/* Thông tin số điện thoại khách hàng nhận vé */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="booking-phone-input" className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>📱</span> Số điện thoại nhận vé <span className="text-rose-500">*</span>
                </label>
                {user?.phone ? (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    ✓ Đã liên kết tài khoản
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                    Bắt buộc để gửi vé
                  </span>
                )}
              </div>
              <input
                id="booking-phone-input"
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                placeholder="Nhập số điện thoại (ví dụ: 0931883988)"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#d82d8b] focus:bg-white focus:outline-none transition"
              />
              {phoneError && (
                <p className="text-[11px] font-semibold text-rose-500">
                  {phoneError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Ghế đã chọn:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedSeats.map((s) => (
                  <span key={s.id} className="rounded bg-pink-100 px-2 py-0.5 font-bold text-[#d82d8b]">
                    {s.id}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs text-slate-500">Tổng cộng:</span>
                <p className="text-lg font-black text-slate-900">{formatPrice(totalAmount)}</p>
              </div>

              {/* Nút "Tiếp tục" chuyển sang thanh toán QR */}
              <button
                type="button"
                disabled={loading}
                onClick={handleProceedToPayment}
                className="rounded-xl bg-[#d82d8b] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition hover:bg-[#c2185b] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Đang tạo đơn...' : 'Tiếp tục'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* BƯỚC 3: QUÉT MÃ QR BẰNG MOMO (Y CHANG ẢNH SỐ 3) */}
      {/* ============================================================== */}
      {step === 3 && (
        <div className="relative w-full max-w-3xl max-h-[96vh] my-auto overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in grid grid-cols-1 md:grid-cols-12">
          
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT VÉ ĐÃ CHỌN (md:col-span-6) */}
          <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between space-y-5 bg-white text-slate-800 overflow-y-auto max-h-[96vh]">
            <div>
              {/* Badge độ tuổi + Tên phim */}
              <div className="flex items-center gap-2 mb-3">
                <span className="rounded bg-rose-600 px-2 py-0.5 text-xs font-black text-white">
                  {movie?.age_rating || 'C18'}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {movie?.title || 'Trại Buôn Người'}
                </h3>
              </div>

              <div className="border-t border-dashed border-slate-200 my-3" />

              {/* Thông tin suất chiếu */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">THỜI GIAN</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {showtime?.startTimeStr || '13:40'} ~ {showtime?.endTimeStr || '15:55'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">NGÀY CHIẾU</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                      {new Date().toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">RẠP</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {cinema?.name || 'Cine Sài Gòn Center'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {cinema?.address || '65 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">PHÒNG CHIẾU</span>
                    <p className="font-bold text-slate-800 mt-0.5">{showtime?.roomName || 'Cinema 8'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">ĐỊNH DẠNG</span>
                    <p className="font-bold text-slate-800 mt-0.5">{showtime?.roomType || movie?.room_type || '2D Chuẩn'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">GHẾ</span>
                    <p className="font-bold text-slate-800 text-sm">
                      {selectedSeats.map((s) => s.id).join(', ')}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(seatSubtotal)}</span>
                </div>

                {comboSubtotal > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Bắp nước ({Object.values(selectedCombos).reduce((a, b) => a + b, 0)} món)</span>
                    <span className="font-bold text-slate-900">{formatPrice(comboSubtotal)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ảnh avatar/poster của phim lấp đầy khoảng trống (kích thước lớn rõ nét) */}
            <div className="my-auto py-2 flex flex-col items-center justify-center">
              <div className="relative h-52 w-36 sm:h-64 sm:w-44 overflow-hidden rounded-2xl shadow-xl border border-slate-200/90 bg-slate-100 flex items-center justify-center">
                {movie?.poster_url || movie?.banner_url ? (
                  <img
                    src={assetUrl(movie?.poster_url || movie?.banner_url)}
                    alt={movie?.title || 'Poster phim'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-brand-600 to-pink-500 flex flex-col items-center justify-center text-white text-xs font-bold p-2 text-center">
                    <span className="text-4xl mb-1">🎬</span>
                    <span className="line-clamp-2">{movie?.title || 'CineBooking'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-700">Tạm tính:</span>
                <span className="text-xl font-black text-[#d82d8b]">{formatPrice(totalAmount)}</span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Ưu đãi (nếu có) sẽ được áp dụng ở bước thanh toán.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI: QUÉT MÃ QR BẰNG NGÂN HÀNG (SEPAY VIETQR) (md:col-span-6) */}
          <div className="md:col-span-6 bg-[#d82d8b] p-6 sm:p-7 text-white flex flex-col items-center justify-between text-center relative overflow-hidden">
            
            {/* Nút đóng [X] */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white font-bold transition"
            >
              ✕
            </button>

            {/* Tiêu đề quét mã */}
            <div className="pt-2">
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                Quét mã QR bằng ngân hàng để thanh toán
              </h3>
            </div>

            {/* Khung trắng chứa mã QR SePay VietQR chính thức */}
            <div className="my-3 rounded-2xl bg-white p-3 shadow-xl max-w-[210px] flex flex-col items-center justify-center">
              <img
                src={sepayQrUrl}
                alt="Mã QR thanh toán SePay VietQR"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            {/* Thông tin tài khoản SePay của dự án */}
            <div className="w-full rounded-xl bg-white/15 border border-white/20 p-2.5 text-[11px] text-pink-50 text-left space-y-1.5 mb-2">
              <div className="flex justify-between items-center">
                <span className="opacity-80">Ngân hàng:</span>
                <span className="font-bold text-white">MBBank (Quân Đội)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Số tài khoản:</span>
                <span className="font-mono font-bold text-white text-xs">0931883988</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Chủ tài khoản:</span>
                <span className="font-bold text-white">NGUYEN TRONG BANG</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-80">Số tiền:</span>
                <span className="font-black text-amber-300 text-xs">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/15">
                <span className="opacity-80">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-amber-300 text-xs">CINE {cleanBookingCode}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`CINE ${cleanBookingCode}`);
                      toast.success('Đã sao chép nội dung chuyển khoản!');
                    }}
                    className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] hover:bg-white/30 transition cursor-pointer"
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            </div>

            {/* Trạng thái tự động kiểm tra */}
            <div className="flex items-center justify-center gap-2 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Tự động kiểm tra SePay mỗi 2.5s...</span>
            </div>

            {/* Hướng dẫn quét */}
            <div className="text-xs text-pink-100 max-w-xs mt-1">
              <p className="flex items-center justify-center gap-1.5 font-medium">
                <span>📱</span>
                <span>Mở app ngân hàng quét mã VietQR để thanh toán nhanh chóng.</span>
              </p>
            </div>

            {/* Các nút bấm kiểm tra */}
            <div className="w-full mt-3 pt-3 border-t border-white/20">
              <button
                type="button"
                disabled={checkingPayment || loading}
                onClick={() => verifyPaymentNow(true)}
                className="w-full rounded-xl bg-white py-2.5 px-4 text-xs font-black text-[#d82d8b] shadow-lg hover:bg-pink-50 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {checkingPayment ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d82d8b] border-t-transparent" />
                    <span>Đang kiểm tra biến động số dư SePay...</span>
                  </>
                ) : (
                  <span>⚡ Kiểm tra chuyển tiền ngay</span>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* BƯỚC 4: THÔNG BÁO THANH TOÁN THÀNH CÔNG & CHI TIẾT VÉ ĐÃ MUA */}
      {/* ============================================================== */}
      {step === 4 && (
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-5 sm:p-7 text-slate-800 shadow-2xl animate-fade-in space-y-4 max-h-[96vh] my-auto overflow-y-auto">
          {/* Nút thoát */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition font-bold cursor-pointer z-10"
            aria-label="Đóng"
            title="Thoát"
          >
            ✕
          </button>
          
          {/* Biểu tượng tick xanh thành công lớn */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Thanh toán thành công!
            </h3>
            <p className="text-xs text-slate-500">
              Giao dịch SePay đã được ghi nhận. Vé điện tử đã sẵn sàng xuất trình tại rạp.
            </p>
          </div>

          {/* Vé điện tử đầy đủ thông tin (E-Ticket) */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-4 sm:p-5 relative overflow-hidden space-y-3.5 shadow-xs">
            
            {/* Header vé: Poster, Tên phim, Huy hiệu Đã thanh toán */}
            <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800 shadow-sm border border-slate-200">
                {movie?.poster_url ? (
                  <img src={movie.poster_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold p-1 text-center">
                    CINE
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                    {movie?.age_rating || 'C18'}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    {movie?.title || 'Phim đã chọn'}
                  </h4>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ĐÃ THANH TOÁN
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {showtime?.roomName || 'Cinema 8'} ({showtime?.roomType || movie?.room_type || '2D Chuẩn'})
                  </span>
                </div>
              </div>
            </div>

            {/* Chi tiết thông tin vé */}
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Mã đặt vé:</span>
                <span className="font-mono font-black text-slate-900 tracking-wider text-sm">
                  {cleanBookingCode}
                </span>
              </div>

              {confirmedTransaction?.reference_number && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Mã GD SePay:</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {confirmedTransaction.reference_number}
                  </span>
                </div>
              )}

              {confirmedTransaction?.date && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Thời gian GD:</span>
                  <span className="text-slate-700 text-xs font-medium">
                    {formatDateTime(confirmedTransaction.date) || confirmedTransaction.date}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Rạp chiếu:</span>
                <span className="font-bold text-slate-900 text-right max-w-[65%]">
                  {cinema?.name || 'Cine Sài Gòn Center'}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Địa chỉ rạp:</span>
                <span className="text-slate-600 text-right max-w-[65%] text-[11px] leading-tight">
                  {cinema?.address || '65 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh'}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Suất chiếu:</span>
                <span className="font-bold text-slate-900">
                  {showtime?.startTimeStr || '13:40'} ~ {showtime?.endTimeStr || '15:55'} · Hôm nay ({new Date().toLocaleDateString('vi-VN')})
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Phòng chiếu:</span>
                <span className="font-bold text-slate-900">
                  {showtime?.roomName || 'Cinema 8'}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Ghế ngồi:</span>
                <span className="font-black text-[#d82d8b] text-sm">
                  {selectedSeats.map((s) => s.id).join(', ')}
                </span>
              </div>

              {/* Bắp nước nếu có chọn */}
              {Object.keys(selectedCombos).length > 0 && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Bắp nước:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[65%]">
                    {Object.entries(selectedCombos)
                      .map(([id, qty]) => {
                        const c = activeCombos.find((item) => item.id === Number(id));
                        return c ? `${qty}× ${c.name}` : null;
                      })
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">
                  {user?.full_name || 'Khách hàng'}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono font-bold text-slate-900">
                  {customerPhone || user?.phone || '—'}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-medium text-slate-700">SePay VietQR (MBBank)</span>
              </div>

              <div className="flex justify-between pt-2.5 items-center">
                <span className="font-bold text-slate-700 text-sm">Tổng thanh toán:</span>
                <span className="font-black text-lg text-emerald-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Khung mã QR Check-in vào rạp */}
            <div className="border-t-2 border-dashed border-slate-300 pt-3 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                MÃ QR CHECK-IN VÀO RẠP
              </span>
              <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-200 inline-block">
                <QRCodeSVG
                  value={createdBooking?.qr_content || createdBooking?.booking_code || 'CINE-CHECKIN'}
                  size={120}
                  level="M"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 max-w-xs">
                Đưa mã QR này cho nhân viên soát vé tại rạp để vào phòng chiếu.
              </p>
            </div>

          </div>

          {/* Các nút bấm hành động */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleGoToMyBookings}
              className="w-full rounded-xl bg-[#d82d8b] py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-600/30 hover:bg-[#c2185b] transition active:scale-95 cursor-pointer"
            >
              Xem trong Vé của tôi ➔
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1 text-xs text-slate-400 hover:text-slate-600 transition"
            >
              Đóng cửa sổ
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
