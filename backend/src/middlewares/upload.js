// Upload ảnh poster/banner bằng multer, lưu vào backend/uploads/posters
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const POSTER_DIR = path.join(UPLOAD_ROOT, 'posters');
fs.mkdirSync(POSTER_DIR, { recursive: true });

// Đuôi file lấy từ mimetype (không tin tên file người dùng gửi)
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, POSTER_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT_BY_MIME[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // tối đa 5MB / ảnh
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new ApiError(400, 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'));
  },
});

// Hai field file: "poster" và "banner" (mỗi field tối đa 1 ảnh)
exports.uploadMovieImages = upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

// Đường dẫn lưu vào DB, ví dụ "/uploads/posters/abc.jpg"
exports.toPublicPath = (file) => (file ? `/uploads/posters/${file.filename}` : undefined);

// Xóa file theo đường dẫn công khai (chỉ xóa file nằm trong thư mục uploads, bỏ qua URL ngoài)
exports.removeFile = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const abs = path.resolve(path.join(__dirname, '..', '..', publicPath));
  if (!abs.startsWith(UPLOAD_ROOT + path.sep)) return;
  fs.unlink(abs, () => {});
};

// Dọn các file vừa upload khi request bị lỗi (tránh file rác)
exports.removeUploadedFiles = (files) => {
  Object.values(files || {}).flat().forEach((f) => fs.unlink(f.path, () => {}));
};
