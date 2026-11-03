// Toàn bộ route /api/admin/*: bắt buộc đăng nhập (admin hoặc staff)
// Mỗi chức năng được kiểm soát chặt chẽ theo vai trò và quyền hạn (RBAC)
const router = require('express').Router();
const { verifyToken, requireRole, requirePermission, requireAnyPermission } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { uploadMovieImages, uploadComboImage } = require('../middlewares/upload');
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
  createShowtimeRules,
  updateShowtimeRules,
  adminListShowtimeRules,
} = require('../validators/showtimeValidator');

const { createComboRules, updateComboRules } = require('../validators/comboValidator');
const { createPromotionRules, updatePromotionRules } = require('../validators/promotionValidator');
const {
  statsRules,
  listUserRules,
  userStatusRules,
  userRoleRules,
  createStaffRules,
  checkInRules,
  listAdminBookingRules,
} = require('../validators/adminValidator');

// Bắt buộc đăng nhập và là admin hoặc staff
router.use(verifyToken, requireRole('admin', 'staff'));

// ----- Danh mục quyền hạn và vai trò mẫu -----
router.get('/permissions', adminUser.getPermissions);

// ----- Thống kê cho Dashboard -----
router.get('/stats', requirePermission('dashboard:view'), statsRules, validate, stats.get);

// ----- Phim (multipart/form-data nếu có ảnh: field "poster", "banner"; hoặc JSON nếu không) -----
router.post('/movies', requirePermission('movies:manage'), uploadMovieImages, createMovieRules, validate, movie.create);
router.put('/movies/:id', requirePermission('movies:manage'), uploadMovieImages, idParam, updateMovieRules, validate, movie.update);
router.delete('/movies/:id', requirePermission('movies:manage'), idParam, validate, movie.remove);

// ----- Thể loại -----
router.post('/genres', requirePermission('genres:manage'), genreRules, validate, genre.create);
router.put('/genres/:id', requirePermission('genres:manage'), idParam, genreRules, validate, genre.update);
router.delete('/genres/:id', requirePermission('genres:manage'), idParam, validate, genre.remove);

// ----- Rạp -----
router.get('/cinemas', requirePermission('cinemas:manage'), cityQuery, validate, cinema.adminList);
router.post('/cinemas', requirePermission('cinemas:manage'), createCinemaRules, validate, cinema.create);
router.put('/cinemas/:id', requirePermission('cinemas:manage'), idParam, updateCinemaRules, validate, cinema.update);
router.delete('/cinemas/:id', requirePermission('cinemas:manage'), idParam, validate, cinema.remove);

// ----- Phòng chiếu (tạo phòng sẽ tự sinh sơ đồ ghế) -----
router.get('/rooms', requirePermission('rooms:manage'), listRoomRules, validate, room.list);
router.get('/rooms/:id/seats', requirePermission('rooms:manage'), idParam, validate, room.getSeats);
router.post('/rooms', requirePermission('rooms:manage'), createRoomRules, validate, room.create);
router.put('/rooms/:id', requirePermission('rooms:manage'), idParam, updateRoomRules, validate, room.update);
router.delete('/rooms/:id', requirePermission('rooms:manage'), idParam, validate, room.remove);

// ----- Suất chiếu -----
router.get('/showtimes', requirePermission('showtimes:manage'), adminListShowtimeRules, validate, showtime.adminList);
router.post('/showtimes', requirePermission('showtimes:manage'), createShowtimeRules, validate, showtime.create);
router.put('/showtimes/:id', requirePermission('showtimes:manage'), idParam, updateShowtimeRules, validate, showtime.update);
router.delete('/showtimes/:id', requirePermission('showtimes:manage'), idParam, validate, showtime.remove);

// ----- Combo bắp nước -----
router.get('/combos', requirePermission('combos:manage'), comboAdmin.list);
router.post('/combos', requirePermission('combos:manage'), uploadComboImage, createComboRules, validate, comboAdmin.create);
router.put('/combos/:id', requirePermission('combos:manage'), uploadComboImage, idParam, updateComboRules, validate, comboAdmin.update);
router.delete('/combos/:id', requirePermission('combos:manage'), idParam, validate, comboAdmin.remove);

// ----- Mã giảm giá -----
router.get('/promotions', requirePermission('promotions:manage'), promotionAdmin.list);
router.post('/promotions', requirePermission('promotions:manage'), createPromotionRules, validate, promotionAdmin.create);
router.put('/promotions/:id', requirePermission('promotions:manage'), idParam, updatePromotionRules, validate, promotionAdmin.update);
router.delete('/promotions/:id', requirePermission('promotions:manage'), idParam, validate, promotionAdmin.remove);

// ----- Đơn đặt vé -----
router.get('/bookings', requirePermission('bookings:manage'), listAdminBookingRules, validate, adminBooking.list);
router.put('/bookings/:id/cancel', requirePermission('bookings:manage'), idParam, validate, adminBooking.cancel);

// ----- Soát vé & Check-in tại quầy -----
router.get(
  '/bookings/verify/:code',
  requireAnyPermission('bookings:manage', 'tickets:checkin'),
  adminBooking.verifyTicket
);
router.post(
  '/bookings/check-in',
  requireAnyPermission('bookings:manage', 'tickets:checkin'),
  checkInRules,
  validate,
  adminBooking.checkIn
);

// ----- Khách hàng & Phân quyền nhân viên (Chỉ Admin hoặc ai có quyền users:manage) -----
router.get('/users', requirePermission('users:manage'), listUserRules, validate, adminUser.list);
router.post('/users/staff', requirePermission('users:manage'), createStaffRules, validate, adminUser.createStaff);
router.put('/users/:id/status', requirePermission('users:manage'), idParam, userStatusRules, validate, adminUser.setStatus);
router.put('/users/:id/role', requirePermission('users:manage'), idParam, userRoleRules, validate, adminUser.setRole);

module.exports = router;
