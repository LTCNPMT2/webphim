// Gom tất cả route, được mount tại /api trong app.js
const router = require('express').Router();
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

// Kiểm tra server + DB còn sống: GET /api/health
router.get('/', (req, res) => {
  sendSuccess(res, { status: 'ok', version: '1.0.0' }, 'CineBooking API đang hoạt động');
});

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    sendSuccess(res, { status: 'ok', time: new Date().toISOString() }, 'Server đang hoạt động');
  })
);

router.use('/auth', require('./authRoutes'));
router.use('/movies', require('./movieRoutes'));
router.use('/genres', require('./genreRoutes'));
router.use('/cinemas', require('./cinemaRoutes'));
router.use('/showtimes', require('./showtimeRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/combos', require('./comboRoutes'));
router.use('/promotions', require('./promotionRoutes'));
router.use('/admin', require('./adminRoutes')); // toàn bộ route admin (yêu cầu role admin)

module.exports = router;
