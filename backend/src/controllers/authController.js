// Controller mỏng: nhận request -> gọi service -> trả response
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/authService');
const emailService = require('../services/email/emailService');

exports.register = asyncHandler(async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  const data = await authService.register({ full_name, email, password, phone });
  sendSuccess(res, data, 'Đăng ký thành công', 201);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password });
  
  // Gửi email thông báo đăng nhập (bất đồng bộ, không chặn response)
  emailService.sendLoginNotification(data.user, req).catch((err) => {
    console.error('[AuthController] Lỗi gửi email đăng nhập:', err.message);
  });

  sendSuccess(res, data, 'Đăng nhập thành công');
});

exports.getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'Lấy thông tin thành công');
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, avatar_url } = req.body;
  const user = await authService.updateProfile(req.user, { full_name, phone, avatar_url });
  sendSuccess(res, { user }, 'Cập nhật hồ sơ thành công');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  await authService.changePassword(req.user.id, { current_password, new_password });
  sendSuccess(res, null, 'Đổi mật khẩu thành công');
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential, access_token, isDemo, demoEmail, demoName } = req.body;
  const data = await authService.googleLogin({ credential, access_token, isDemo, demoEmail, demoName });

  // Gửi email thông báo đăng nhập Google (bất đồng bộ, không chặn response)
  emailService.sendLoginNotification(data.user, req).catch((err) => {
    console.error('[AuthController] Lỗi gửi email đăng nhập Google:', err.message);
  });

  sendSuccess(res, data, 'Đăng nhập Google thành công');
});
