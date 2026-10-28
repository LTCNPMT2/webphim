const router = require('express').Router();
const controller = require('../controllers/cinemaController');
const validate = require('../middlewares/validate');
const { query } = require('express-validator');
const { idParam } = require('../validators/commonValidator');

const cityQuery = query('city').optional().isString().withMessage('city không hợp lệ').trim();

router.get('/', cityQuery, validate, controller.list);
router.get('/:id', idParam, validate, controller.getById);

module.exports = router;
