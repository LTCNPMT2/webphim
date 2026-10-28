const router = require('express').Router();
const controller = require('../controllers/bookingController');
const sepayController = require('../controllers/sepayController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { payRules } = require('../validators/bookingValidator');

// Thanh toán trực tiếp
router.post('/', verifyToken, payRules, validate, controller.pay);

// Thanh toán tự động qua SePay (VietQR Ngân hàng)
router.get('/sepay/check-code/:code', sepayController.checkPaymentByCode);
router.get('/sepay/:bookingId', verifyToken, sepayController.getPaymentInfo);
router.get('/sepay/:bookingId/check', verifyToken, sepayController.checkPayment);
router.post('/sepay/webhook', sepayController.webhook);

module.exports = router;
