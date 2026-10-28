import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFetch } from '../hooks/useFetch.js';
import { createBooking, getCombos, getSeatMap, validatePromo } from '../services/bookingService.js';
import { getErrorMessage } from '../services/api.js';
import { calcTotals, pruneSelection, seatLabel, sortSeats } from '../utils/booking.js';
import { MAX_SEATS } from '../utils/constants.js';
import { formatDateTime } from '../utils/format.js';
import SeatMap from '../components/booking/SeatMap.jsx';
import BookingSteps from '../components/booking/BookingSteps.jsx';
import OrderSummary from '../components/booking/OrderSummary.jsx';
import ComboSelector from '../components/booking/ComboSelector.jsx';
import PromoInput from '../components/booking/PromoInput.jsx';
import Button, { buttonClass } from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

const EMPTY_PROMO = { input: '', applied: null, error: '', loading: false };
const POLL_MS = 15000; // tự làm mới sơ đồ ghế để thấy ghế người khác vừa đặt

function SeatSelectionInner({ showtimeId }) {
  const navigate = useNavigate();
  const map = useFetch(() => getSeatMap(showtimeId), [showtimeId]);
  const combosFetch = useFetch(getCombos, []);

  const [step, setStep] = useState(1); // 1: chọn ghế, 2: combo + mã giảm giá
  const [selectedIds, setSelectedIds] = useState([]);
  const [qty, setQty] = useState({});
  const [promo, setPromo] = useState(EMPTY_PROMO);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const selectedRef = useRef([]);
  selectedRef.current = selectedIds;
  const conflictRef = useRef(false); // vừa gặp lỗi 409: đã báo lỗi rồi nên không báo thêm lần nữa

  // ---------- Dữ liệu dẫn xuất ----------
  const seats = map.data?.seats;
  const seatsById = useMemo(() => new Map((seats || []).map((s) => [s.id, s])), [seats]);
  const selectedSeats = useMemo(
    () => sortSeats(selectedIds.map((id) => seatsById.get(id)).filter(Boolean)),
    [selectedIds, seatsById]
  );
  const seatLines = selectedSeats.map((s) => ({ label: seatLabel(s), seat_type: s.seat_type, price: s.price }));
  const comboLines = (combosFetch.data || [])
    .filter((c) => (qty[c.id] || 0) > 0)
    .map((c) => ({ id: c.id, name: c.name, quantity: qty[c.id], total: c.price * qty[c.id] }));
  const discount = promo.applied?.discount_amount || 0;
  const totals = calcTotals({ seatLines, comboLines, discount });

  // ---------- Làm mới sơ đồ ghế định kỳ ----------
  useEffect(() => {
    if (step !== 1 || submitting) return undefined;
    const timer = setInterval(() => { if (!document.hidden) map.reload(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [step, submitting, map.reload]);

  // Mỗi lần có sơ đồ mới: bỏ khỏi danh sách chọn những ghế vừa bị người khác lấy
  useEffect(() => {
    if (!seats) return;
    const { keep, lost } = pruneSelection(selectedRef.current, seats);
    if (lost.length === 0) return;
    setSelectedIds(keep);
    if (conflictRef.current) conflictRef.current = false;
    else toast.error(`Ghế ${lost.join(', ')} vừa bị người khác đặt, vui lòng chọn ghế khác`, { duration: 6000 });
  }, [seats]);

  // Combo hoặc ghế đổi làm tổng tiền đổi: kiểm tra lại mã giảm giá đang áp dụng (có thể không còn đủ điều kiện)
  const appliedCode = promo.applied?.code;
  useEffect(() => {
    if (!appliedCode) return undefined;
    let cancelled = false;
    validatePromo(appliedCode, totals.subtotal)
      .then((res) => { if (!cancelled) setPromo((p) => ({ ...p, applied: res })); })
      .catch((err) => { if (!cancelled) setPromo({ ...EMPTY_PROMO, input: appliedCode, error: getErrorMessage(err) }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCode, totals.subtotal]);

  // ---------- Hành động ----------
  const toggleSeat = (seat) => {
    if (selectedIds.includes(seat.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== seat.id));
    } else if (selectedIds.length >= MAX_SEATS) {
      toast.error(`Chỉ được chọn tối đa ${MAX_SEATS} ghế mỗi lần đặt`);
    } else {
      setSelectedIds([...selectedIds, seat.id]);
    }
  };

  const setQuantity = (comboId, q) => setQty((prev) => ({ ...prev, [comboId]: Math.min(Math.max(q, 0), 10) }));

  const applyPromo = async () => {
    const code = promo.input.trim();
    if (!code) return setPromo((p) => ({ ...p, error: 'Vui lòng nhập mã giảm giá' }));
    setPromo((p) => ({ ...p, loading: true, error: '' }));
    try {
      const res = await validatePromo(code, totals.subtotal);
      setPromo({ input: res.code, applied: res, error: '', loading: false });
      toast.success('Đã áp dụng mã giảm giá');
    } catch (err) {
      setPromo((p) => ({ ...p, applied: null, loading: false, error: getErrorMessage(err) }));
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const booking = await createBooking({
        showtime_id: Number(showtimeId),
        seat_ids: selectedIds,
        combos: comboLines.map((c) => ({ combo_id: c.id, quantity: c.quantity })),
        ...(promo.applied && { promo_code: promo.applied.code }),
      });
      toast.success('Giữ ghế thành công! Hãy thanh toán trong thời gian quy định');
      navigate(`/checkout/${booking.id}`, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = getErrorMessage(err);
      if (status === 409) {
        // Ghế vừa bị người khác giữ: báo lỗi, quay về bước chọn ghế và tải lại sơ đồ
        toast.error(message, { duration: 7000 });
        conflictRef.current = true;
        setStep(1);
        map.reload();
      } else if (status === 400 && /giảm giá/i.test(message)) {
        setPromo((p) => ({ ...p, applied: null, error: message }));
      } else {
        setSubmitError(message); // vd 429: đang giữ ghế quá nhiều đơn
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Hiển thị ----------
  if (map.error && !map.data) {
    return map.status === 404 || map.status === 422 ? (
      <div className="py-16 text-center">
        <p className="text-5xl">🎟️</p>
        <h1 className="mt-4 text-2xl font-bold">Không tìm thấy suất chiếu</h1>
        <Link to="/movies" className={`mt-6 ${buttonClass()}`}>Xem danh sách phim</Link>
      </div>
    ) : (
      <ErrorState message={map.error} onRetry={map.reload} />
    );
  }
  if (!map.data) {
    return <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  }

  const { showtime, summary } = map.data;
  const started = new Date(showtime.start_time) <= new Date();
  const summaryInfo = {
    title: showtime.movie_title,
    cinema: showtime.cinema_name,
    room: `${showtime.room_name} (${showtime.room_type})`,
    time: formatDateTime(showtime.start_time),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BookingSteps current={step} />
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white">← Quay lại</button>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {started && (
            <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Suất chiếu này đã bắt đầu nên không thể đặt vé. <Link to="/movies" className="font-semibold underline">Chọn suất khác</Link>
            </div>
          )}
          {map.error && (
            <p role="status" className="mb-3 text-xs text-amber-400">Mất kết nối khi cập nhật sơ đồ ghế, đang thử lại...</p>
          )}

          {step === 1 ? (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-xl font-bold">Chọn ghế</h1>
                <p className="text-sm text-slate-400">
                  Còn <b className="text-slate-200">{summary.available}</b>/{summary.total} ghế trống · tối đa {MAX_SEATS} ghế
                </p>
              </div>
              <SeatMap seats={map.data.seats} selectedIds={selectedIds} onToggle={toggleSeat} disabled={started} />
            </section>
          ) : (
            <section className="space-y-6">
              <div>
                <h1 className="text-xl font-bold">Bắp nước</h1>
                <p className="mb-4 text-sm text-slate-400">Không bắt buộc. Bạn có thể bỏ qua bước này.</p>
                <ComboSelector state={combosFetch} quantities={qty} onChange={setQuantity} />
              </div>
              <PromoInput promo={promo}
                onInputChange={(v) => setPromo((p) => ({ ...p, input: v, error: '' }))}
                onApply={applyPromo}
                onRemove={() => setPromo(EMPTY_PROMO)} />
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummary info={summaryInfo} seatLines={seatLines} comboLines={comboLines}
            subtotal={totals.subtotal} discount={discount} promoCode={promo.applied?.code} total={totals.total}>
            {submitError && (
              <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {submitError} <Link to="/my-bookings" className="font-semibold underline">Xem vé của tôi</Link>
              </div>
            )}
            {step === 1 ? (
              <Button className="w-full" disabled={selectedIds.length === 0 || started} onClick={() => setStep(2)}>
                {selectedIds.length === 0 ? 'Hãy chọn ghế' : `Tiếp tục (${selectedIds.length} ghế)`}
              </Button>
            ) : (
              <>
                <Button className="w-full" loading={submitting} disabled={started} onClick={handleSubmit}>
                  {submitting ? 'Đang giữ ghế...' : 'Giữ ghế & thanh toán'}
                </Button>
                <Button variant="outline" className="w-full" disabled={submitting} onClick={() => setStep(1)}>← Chọn lại ghế</Button>
              </>
            )}
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}

// key={showtimeId}: đổi suất chiếu thì làm lại từ đầu (không giữ ghế đã chọn của suất cũ)
export default function SeatSelection() {
  const { showtimeId } = useParams();
  return <SeatSelectionInner key={showtimeId} showtimeId={showtimeId} />;
}
