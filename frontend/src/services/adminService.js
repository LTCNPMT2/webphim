// Gọi API quản trị (/api/admin/...). Hàm danh sách trả sẵn dữ liệu cần dùng (mảng, hoặc { items, pagination }).
import api from './api.js';

const unwrap = (res) => res.data.data;

export const getStats = (days) => api.get('/admin/stats', { params: { days } }).then(unwrap);

// Phim: danh sách dùng API công khai GET /movies; thêm/sửa gửi FormData (có thể kèm ảnh)
export const createMovie = (formData) => api.post('/admin/movies', formData).then(unwrap);
export const updateMovie = (id, formData) => api.put(`/admin/movies/${id}`, formData).then(unwrap);
export const deleteMovie = (id) => api.delete(`/admin/movies/${id}`);

export const createGenre = (name) => api.post('/admin/genres', { name }).then(unwrap);
export const updateGenre = (id, name) => api.put(`/admin/genres/${id}`, { name }).then(unwrap);
export const deleteGenre = (id) => api.delete(`/admin/genres/${id}`);

export const getCinemas = () => api.get('/admin/cinemas').then((res) => res.data.data.cinemas);
export const createCinema = (body) => api.post('/admin/cinemas', body).then(unwrap);
export const updateCinema = (id, body) => api.put(`/admin/cinemas/${id}`, body).then(unwrap);
export const deleteCinema = (id) => api.delete(`/admin/cinemas/${id}`);

export const getRooms = (params) => api.get('/admin/rooms', { params }).then((res) => res.data.data.rooms);
export const getRoomSeats = (id) => api.get(`/admin/rooms/${id}/seats`).then(unwrap); // { room, seats }
export const createRoom = (body) => api.post('/admin/rooms', body).then(unwrap);
export const updateRoom = (id, body) => api.put(`/admin/rooms/${id}`, body).then(unwrap);
export const deleteRoom = (id) => api.delete(`/admin/rooms/${id}`);

export const getShowtimes = (params) => api.get('/admin/showtimes', { params }).then(unwrap); // { items, pagination }
export const createShowtime = (body) => api.post('/admin/showtimes', body).then(unwrap);
export const updateShowtime = (id, body) => api.put(`/admin/showtimes/${id}`, body).then(unwrap);
export const deleteShowtime = (id) => api.delete(`/admin/showtimes/${id}`);

export const getCombos = () => api.get('/admin/combos').then((res) => res.data.data.combos);
export const createCombo = (body) => api.post('/admin/combos', body).then(unwrap);
export const updateCombo = (id, body) => api.put(`/admin/combos/${id}`, body).then(unwrap);
export const deleteCombo = (id) => api.delete(`/admin/combos/${id}`);

export const getPromotions = () => api.get('/admin/promotions').then((res) => res.data.data.promotions);
export const createPromotion = (body) => api.post('/admin/promotions', body).then(unwrap);
export const updatePromotion = (id, body) => api.put(`/admin/promotions/${id}`, body).then(unwrap);
export const deletePromotion = (id) => api.delete(`/admin/promotions/${id}`);

export const getBookings = (params) => api.get('/admin/bookings', { params }).then(unwrap); // { items, pagination }
export const cancelBooking = (id) => api.put(`/admin/bookings/${id}/cancel`).then((res) => res.data.data.booking);

export const getUsers = (params) => api.get('/admin/users', { params }).then(unwrap); // { items, pagination }
export const setUserStatus = (id, isActive) => api.put(`/admin/users/${id}/status`, { is_active: isActive }).then((res) => res.data.data.user);
