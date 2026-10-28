const router = require('express').Router();
const controller = require('../controllers/showtimeController');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/commonValidator');
const { listShowtimeRules } = require('../validators/showtimeValidator');

router.get('/', listShowtimeRules, validate, controller.list);
router.get('/:id', idParam, validate, controller.getById);
router.get('/:id/seats', idParam, validate, controller.getSeats); // sơ đồ ghế + trạng thái từng ghế

module.exports = router;
