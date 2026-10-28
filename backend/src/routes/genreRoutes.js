const router = require('express').Router();
const controller = require('../controllers/genreController');

router.get('/', controller.list);

module.exports = router;
