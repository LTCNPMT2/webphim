// Service = nghiệp vụ. Không đụng tới req/res để dễ tái sử dụng và test.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/token');

const SALT_ROUNDS = 10;

exports.register = async ({ full_name, email, password, phone }) => {
  if (await userModel.existsByEmail(email)) {
    throw new ApiError(409, 'Email đã được sử dụng');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = await userModel.create({ full_name, email, password_hash, phone: phone || null });

  const user = await userModel.findById(id);
  return { user, token: signToken(user) };
};

exports.login = async ({ email, password }) => {
  const found = await userModel.findByEmailWithPassword(email);

  // Cùng 1 thông báo cho "sai email" và "sai mật khẩu" để tránh lộ email nào đã đăng ký
  const ok = found && (await bcrypt.compare(password, found.password_hash));
  if (!ok) throw new ApiError(401, 'Email hoặc mật khẩu không đúng');

  if (!found.is_active) throw new ApiError(403, 'Tài khoản đã bị khóa');

  const user = await userModel.findById(found.id);
  return { user, token: signToken(user) };
};

// Chỉ cập nhật những field client có gửi lên, field còn lại giữ nguyên
exports.updateProfile = async (currentUser, data) => {
  const full_name = data.full_name ?? currentUser.full_name;
  const phone = data.phone !== undefined ? data.phone || null : currentUser.phone;
  const avatar_url = data.avatar_url !== undefined ? data.avatar_url || null : currentUser.avatar_url;

  await userModel.updateProfile(currentUser.id, { full_name, phone, avatar_url });
  return userModel.findById(currentUser.id);
};

exports.changePassword = async (userId, { current_password, new_password }) => {
  const hash = await userModel.getPasswordHash(userId);
  if (!hash || !(await bcrypt.compare(current_password, hash))) {
    throw new ApiError(400, 'Mật khẩu hiện tại không đúng');
  }
  if (current_password === new_password) {
    throw new ApiError(400, 'Mật khẩu mới phải khác mật khẩu hiện tại');
  }

  await userModel.updatePassword(userId, await bcrypt.hash(new_password, SALT_ROUNDS));
};

// Đăng nhập hoặc đăng ký bằng tài khoản Google (hỗ trợ access_token OAuth2, ID token GIS và Demo kiểm thử)
exports.googleLogin = async ({ credential, access_token, isDemo, demoEmail, demoName }) => {
  let email;
  let name;
  let picture = null;

  if (isDemo) {
    // Chế độ demo / kiểm thử tiện lợi khi cần test nhanh
    email = (demoEmail || 'google.user@cinema.vn').trim().toLowerCase();
    name = (demoName || 'Khách hàng Google').trim();
    picture = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  } else if (access_token) {
    // Xác thực access_token qua Google UserInfo API (chuẩn Google Identity Services Token Client)
    try {
      const userinfoResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!userinfoResp.ok) throw new Error('Failed to fetch userinfo from Google');
      const info = await userinfoResp.json();
      if (!info.email) throw new Error('No email returned');
      const emailVerified = info.email_verified === true || info.email_verified === 'true';
      if (!emailVerified) {
        throw new ApiError(400, 'Email Google chưa được xác thực');
      }
      email = info.email.trim().toLowerCase();
      name = info.name || info.given_name || email.split('@')[0];
      picture = info.picture || null;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(401, 'Xác thực tài khoản Google thất bại hoặc phiên đã hết hạn');
    }
  } else if (credential) {
    let payload;
    try {
      const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const resp = await fetch(googleVerifyUrl);
      if (!resp.ok) {
        throw new Error('Google token rejected by oauth2 API');
      }
      payload = await resp.json();
    } catch (err) {
      throw new ApiError(401, 'Token Google không hợp lệ hoặc đã hết hạn');
    }

    if (!payload || !payload.email) {
      throw new ApiError(400, 'Không lấy được email từ tài khoản Google');
    }

    const emailVerified = payload.email_verified === 'true' || payload.email_verified === true;
    if (!emailVerified) {
      throw new ApiError(400, 'Email Google chưa được xác thực');
    }

    const configuredClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      throw new ApiError(401, 'Google Client ID không khớp với cấu hình hệ thống');
    }

    email = payload.email.trim().toLowerCase();
    name = payload.name || payload.given_name || email.split('@')[0];
    picture = payload.picture || null;
  } else {
    throw new ApiError(400, 'Thiếu thông tin xác thực Google');
  }

  // 1. Kiểm tra tài khoản đã có trong hệ thống chưa
  let user = await userModel.findByEmailWithPassword(email);

  if (user) {
    if (!user.is_active) {
      throw new ApiError(403, 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
    }

    // Nếu chưa có avatar trong hệ thống mà Google có avatar -> cập nhật avatar
    if (!user.avatar_url && picture) {
      await userModel.updateProfile(user.id, {
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: picture,
      });
    }
  } else {
    // 2. Người dùng Google mới -> tự động tạo tài khoản
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const password_hash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    const newId = await userModel.create({
      full_name: name,
      email,
      password_hash,
      phone: null,
      avatar_url: picture,
    });
    user = await userModel.findById(newId);
  }

  const finalUser = await userModel.findById(user.id);
  return { user: finalUser, token: signToken(finalUser) };
};
