// Mọi route đặt vé đều cần đăng nhập
const router = require('express').Router();
const controller = require('../controllers/bookingController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { idParam } = require('../validators/commonValidator');
const { createBookingRules, listBookingRules } = require('../validators/bookingValidator');

router.use(verifyToken);

router.post('/', createBookingRules, validate, controller.create);       // giữ ghế, tạo đơn pending
router.get('/', listBookingRules, validate, controller.listMine);        // lịch sử của tôi
router.get('/:id', idParam, validate, controller.getById);               // chi tiết 1 đơn
router.put('/:id/cancel', idParam, validate, controller.cancel);         // hủy vé

module.exports = router;
