// Toàn bộ route /api/admin/*: bắt buộc đăng nhập VÀ có role admin
const router = require('express').Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { uploadMovieImages } = require('../middlewares/upload');
const { query } = require('express-validator');
const { idParam } = require('../validators/commonValidator');

const cityQuery = query('city').optional().isString().withMessage('city không hợp lệ').trim();

const movie = require('../controllers/movieController');
const genre = require('../controllers/genreController');
const cinema = require('../controllers/cinemaController');
const room = require('../controllers/roomController');
const showtime = require('../controllers/showtimeController');
const stats = require('../controllers/statsController');
const adminUser = require('../controllers/adminUserController');
const adminBooking = require('../controllers/adminBookingController');
const comboAdmin = require('../controllers/comboAdminController');
const promotionAdmin = require('../controllers/promotionAdminController');

const { createMovieRules, updateMovieRules } = require('../validators/movieValidator');
const { genreRules } = require('../validators/genreValidator');
const { createCinemaRules, updateCinemaRules } = require('../validators/cinemaValidator');
const { listRoomRules, createRoomRules, updateRoomRules } = require('../validators/roomValidator');
const {
  createShowtimeRules, updateShowtimeRules, adminListShowtimeRules,
} = require('../validators/showtimeValidator');

const { createComboRules, updateComboRules } = require('../validators/comboValidator');
const { createPromotionRules, updatePromotionRules } = require('../validators/promotionValidator');
const { statsRules, listUserRules, userStatusRules, listAdminBookingRules } = require('../validators/adminValidator');

router.use(verifyToken, requireRole('admin')); // áp dụng cho mọi route bên dưới

// ----- Phim (multipart/form-data nếu có ảnh: field "poster", "banner"; hoặc JSON nếu không) -----
router.post('/movies', uploadMovieImages, createMovieRules, validate, movie.create);
router.put('/movies/:id', uploadMovieImages, idParam, updateMovieRules, validate, movie.update);
router.delete('/movies/:id', idParam, validate, movie.remove);

// ----- Thể loại -----
router.post('/genres', genreRules, validate, genre.create);
router.put('/genres/:id', idParam, genreRules, validate, genre.update);
router.delete('/genres/:id', idParam, validate, genre.remove);

// ----- Rạp -----
router.get('/cinemas', cityQuery, validate, cinema.adminList);
router.post('/cinemas', createCinemaRules, validate, cinema.create);
router.put('/cinemas/:id', idParam, updateCinemaRules, validate, cinema.update);
router.delete('/cinemas/:id', idParam, validate, cinema.remove);

// ----- Phòng chiếu (tạo phòng sẽ tự sinh sơ đồ ghế) -----
router.get('/rooms', listRoomRules, validate, room.list);
router.get('/rooms/:id/seats', idParam, validate, room.getSeats);
router.post('/rooms', createRoomRules, validate, room.create);
router.put('/rooms/:id', idParam, updateRoomRules, validate, room.update);
router.delete('/rooms/:id', idParam, validate, room.remove);

// ----- Suất chiếu -----
router.get('/showtimes', adminListShowtimeRules, validate, showtime.adminList);
router.post('/showtimes', createShowtimeRules, validate, showtime.create);
router.put('/showtimes/:id', idParam, updateShowtimeRules, validate, showtime.update);
router.delete('/showtimes/:id', idParam, validate, showtime.remove);

// ----- Combo bắp nước -----
router.get('/combos', comboAdmin.list);
router.post('/combos', createComboRules, validate, comboAdmin.create);
router.put('/combos/:id', idParam, updateComboRules, validate, comboAdmin.update);
router.delete('/combos/:id', idParam, validate, comboAdmin.remove);

// ----- Mã giảm giá -----
router.get('/promotions', promotionAdmin.list);
router.post('/promotions', createPromotionRules, validate, promotionAdmin.create);
router.put('/promotions/:id', idParam, updatePromotionRules, validate, promotionAdmin.update);
router.delete('/promotions/:id', idParam, validate, promotionAdmin.remove);

// ----- Đơn đặt vé (xem chi tiết 1 đơn dùng GET /api/bookings/:id, admin được phép xem mọi đơn) -----
router.get('/bookings', listAdminBookingRules, validate, adminBooking.list);
router.put('/bookings/:id/cancel', idParam, validate, adminBooking.cancel);

// ----- Người dùng -----
router.get('/users', listUserRules, validate, adminUser.list);
router.put('/users/:id/status', idParam, userStatusRules, validate, adminUser.setStatus);

// ----- Thống kê cho Dashboard -----
router.get('/stats', statsRules, validate, stats.get);

module.exports = router;
