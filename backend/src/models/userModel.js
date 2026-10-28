// Model = nơi DUY NHẤT chứa câu SQL liên quan tới bảng users.
// Dùng pool.execute (prepared statement) -> an toàn trước SQL Injection.
const { pool } = require('../config/db');
const { escapeLike } = require('../utils/sql');

// Các cột an toàn để trả về client (KHÔNG có password_hash)
const PUBLIC_COLUMNS =
  'id, full_name, email, phone, avatar_url, role, is_active, created_at';

exports.findById = async (id) => {
  const [rows] = await pool.execute(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
};

// Dùng khi đăng nhập: lấy cả password_hash để so sánh
exports.findByEmailWithPassword = async (email) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

exports.existsByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  return rows.length > 0;
};

exports.getPasswordHash = async (id) => {
  const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [id]);
  return rows[0] ? rows[0].password_hash : null;
};

exports.create = async ({ full_name, email, password_hash, phone, avatar_url }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password_hash, phone, avatar_url) VALUES (?, ?, ?, ?, ?)',
    [full_name, email, password_hash, phone ?? null, avatar_url ?? null]
  );
  return result.insertId;
};

exports.updateProfile = async (id, { full_name, phone, avatar_url }) => {
  await pool.execute(
    'UPDATE users SET full_name = ?, phone = ?, avatar_url = ? WHERE id = ?',
    [full_name, phone ?? null, avatar_url ?? null, id]
  );
};

exports.updatePassword = async (id, password_hash) => {
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
};

// ---------- Dành cho trang quản trị ----------
// limit/offset đã được ép kiểu số nguyên ở parsePagination nên nối vào SQL là an toàn
exports.adminList = async ({ search, role, status }, { limit, offset }) => {
  const conds = [];
  const params = [];
  if (search) {
    conds.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    const like = `%${escapeLike(String(search).trim())}%`;
    params.push(like, like, like);
  }
  if (role) { conds.push('u.role = ?'); params.push(String(role)); }
  if (status === 'active') conds.push('u.is_active = 1');
  if (status === 'locked') conds.push('u.is_active = 0');
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id AND b.status = 'paid') AS paid_bookings,
            (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b WHERE b.user_id = u.id AND b.status = 'paid') AS total_spent
     FROM users u ${where} ORDER BY u.created_at DESC, u.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
  return { rows, total };
};

exports.setActive = async (id, active) => {
  await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
};
