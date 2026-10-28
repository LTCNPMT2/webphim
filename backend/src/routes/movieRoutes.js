const router = require('express').Router();
const controller = require('../controllers/movieController');
const reviews = require('../controllers/reviewController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const { idParam, pageQuery } = require('../validators/commonValidator');
const { listMovieRules } = require('../validators/movieValidator');
const { reviewRules } = require('../validators/reviewValidator');

router.get('/', listMovieRules, validate, controller.list);
router.get('/:id', idParam, validate, controller.getById);

// Đánh giá phim: xem công khai, viết/sửa/xóa cần đăng nhập (mỗi người 1 đánh giá / phim)
router.get('/:id/reviews', idParam, pageQuery, validate, reviews.list);
router.get('/:id/reviews/mine', verifyToken, idParam, validate, reviews.getMine);
router.post('/:id/reviews', verifyToken, idParam, reviewRules, validate, reviews.save);
router.delete('/:id/reviews/mine', verifyToken, idParam, validate, reviews.removeMine);

module.exports = router;
