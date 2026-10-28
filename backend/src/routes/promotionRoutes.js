const router = require('express').Router();
const controller = require('../controllers/bookingController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { validatePromoRules } = require('../validators/bookingValidator');

// Xem trước mức giảm khi nhập mã (cần đăng nhập để hạn chế dò mã)
router.post('/validate', verifyToken, validatePromoRules, validate, controller.validatePromo);

module.exports = router;
