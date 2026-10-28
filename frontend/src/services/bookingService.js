// Gọi API đặt vé / thanh toán / combo / mã giảm giá. Mọi route ở đây (trừ sơ đồ ghế và combo) cần đăng nhập.
import api from './api.js';

const unwrap = (res) => res.data.data;

export const getSeatMap = (showtimeId) => api.get(`/showtimes/${showtimeId}/seats`).then(unwrap); // { showtime, seats, summary }
export const getCombos = () => api.get('/combos').then((res) => res.data.data.combos);
export const validatePromo = (code, subtotal) => api.post('/promotions/validate', { code, subtotal }).then(unwrap);

export const createBooking = (payload) => api.post('/bookings', payload).then((res) => res.data.data.booking);
export const getBooking = (id) => api.get(`/bookings/${id}`).then((res) => res.data.data.booking);
export const getMyBookings = (params) => api.get('/bookings', { params }).then(unwrap); // { items, pagination }
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`).then((res) => res.data.data.booking);
export const payBooking = (payload) => api.post('/payments', payload).then((res) => res.data.data.booking);
export const getSepayInfo = (bookingId) => api.get(`/payments/sepay/${bookingId}`).then(unwrap);
export const checkSepayPayment = (bookingId) => api.get(`/payments/sepay/${bookingId}/check`).then(unwrap);
export const checkSepayByCode = (code) => api.get(`/payments/sepay/check-code/${encodeURIComponent(code)}`).then(unwrap);
