// Gọi API phim / thể loại / rạp / suất chiếu / đánh giá. Mỗi hàm trả sẵn phần data của response.
import api from './api.js';

const unwrap = (res) => res.data.data;

export const getMovies = (params) => api.get('/movies', { params }).then(unwrap); // { items, pagination }
export const getMovie = (id) => api.get(`/movies/${id}`).then((res) => res.data.data.movie);
export const getGenres = () => api.get('/genres').then((res) => res.data.data.genres);
export const getCinemas = () => api.get('/cinemas').then((res) => res.data.data.cinemas);
export const getShowtimes = (params) => api.get('/showtimes', { params }).then((res) => res.data.data.cinemas); // nhóm theo rạp

export const getReviews = (movieId, params) => api.get(`/movies/${movieId}/reviews`, { params }).then(unwrap); // { items, pagination, summary }
export const getMyReview = (movieId) => api.get(`/movies/${movieId}/reviews/mine`).then((res) => res.data.data.review);
export const saveReview = (movieId, payload) => api.post(`/movies/${movieId}/reviews`, payload).then(unwrap);
export const deleteMyReview = (movieId) => api.delete(`/movies/${movieId}/reviews/mine`);
