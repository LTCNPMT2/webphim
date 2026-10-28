const router = require('express').Router();
const controller = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { verifyToken } = require('../middlewares/auth');
const rules = require('../validators/authValidator');

// Công khai
router.post('/register', rules.registerRules, validate, controller.register);
router.post('/login', rules.loginRules, validate, controller.login);
router.post('/google', controller.googleLogin);

// Cần đăng nhập (gửi header Authorization: Bearer <token>)
router.get('/me', verifyToken, controller.getMe);
router.put('/profile', verifyToken, rules.updateProfileRules, validate, controller.updateProfile);
router.put('/change-password', verifyToken, rules.changePasswordRules, validate, controller.changePassword);

module.exports = router;
