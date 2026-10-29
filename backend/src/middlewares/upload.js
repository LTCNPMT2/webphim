// Upload ảnh poster/banner/combo bằng multer, lưu vào backend/uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const POSTER_DIR = path.join(UPLOAD_ROOT, 'posters');
const COMBO_DIR = path.join(UPLOAD_ROOT, 'combos');
fs.mkdirSync(POSTER_DIR, { recursive: true });
fs.mkdirSync(COMBO_DIR, { recursive: true });

// Đuôi file lấy từ mimetype (không tin tên file người dùng gửi)
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const posterStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, POSTER_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT_BY_MIME[file.mimetype]}`),
});

const comboStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COMBO_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT_BY_MIME[file.mimetype]}`),
});

const fileFilter = (req, file, cb) => {
  if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
  cb(new ApiError(400, 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'));
};

const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // tối đa 5MB / ảnh
  fileFilter,
});

const uploadCombo = multer({
  storage: comboStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Hai field file: "poster" và "banner" (mỗi field tối đa 1 ảnh)
exports.uploadMovieImages = uploadPoster.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

// Field file cho combo: "image" (tối đa 1 ảnh)
exports.uploadComboImage = uploadCombo.single('image');

// Đường dẫn lưu vào DB, ví dụ "/uploads/posters/abc.jpg" hoặc "/uploads/combos/xyz.jpg"
exports.toPublicPath = (file) => {
  if (!file) return undefined;
  const rel = path.relative(UPLOAD_ROOT, file.path).replace(/\\/g, '/');
  return `/uploads/${rel}`;
};

// Xóa file theo đường dẫn công khai (chỉ xóa file nằm trong thư mục uploads, bỏ qua URL ngoài)
exports.removeFile = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const abs = path.resolve(path.join(__dirname, '..', '..', publicPath));
  if (!abs.startsWith(UPLOAD_ROOT + path.sep)) return;
  fs.unlink(abs, () => {});
};

// Dọn các file vừa upload khi request bị lỗi (tránh file rác)
exports.removeUploadedFiles = (files) => {
  if (!files) return;
  if (files.path) {
    fs.unlink(files.path, () => {});
    return;
  }
  Object.values(files).flat().forEach((f) => {
    if (f && f.path) fs.unlink(f.path, () => {});
  });
};
