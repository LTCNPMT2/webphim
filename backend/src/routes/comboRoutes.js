const router = require('express').Router();
const controller = require('../controllers/bookingController');

router.get('/', controller.listCombos);

module.exports = router;
