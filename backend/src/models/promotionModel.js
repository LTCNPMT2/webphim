const { pool } = require('../config/db');

exports.findByCode = async (code, db = pool) => {
  const [rows] = await db.execute(
    `SELECT *, (start_date <= NOW() AND end_date >= NOW()) AS in_range
     FROM promotions WHERE code = ?`,
    [code]
  );
  return rows[0] || null;
};

// "Đặt chỗ" 1 lượt dùng mã. Trả về số dòng cập nhật (0 = mã vừa hết lượt)
exports.reserve = async (conn, id) => {
  const [r] = await conn.execute(
    `UPDATE promotions SET used_count = used_count + 1
     WHERE id = ? AND is_active = 1 AND (usage_limit IS NULL OR used_count < usage_limit)`,
    [id]
  );
  return r.affectedRows;
};

// ---------- Dành cho trang quản trị ----------
// state: trạng thái hiển thị tính ngay trong SQL
exports.adminList = async () => {
  const [rows] = await pool.execute(
    `SELECT p.*,
       CASE
         WHEN p.is_active = 0 THEN 'inactive'
         WHEN p.end_date < NOW() THEN 'expired'
         WHEN p.start_date > NOW() THEN 'upcoming'
         WHEN p.usage_limit IS NOT NULL AND p.used_count >= p.usage_limit THEN 'exhausted'
         ELSE 'active'
       END AS state
     FROM promotions p ORDER BY p.id DESC`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT p.*,
       CASE
         WHEN p.is_active = 0 THEN 'inactive'
         WHEN p.end_date < NOW() THEN 'expired'
         WHEN p.start_date > NOW() THEN 'upcoming'
         WHEN p.usage_limit IS NOT NULL AND p.used_count >= p.usage_limit THEN 'exhausted'
         ELSE 'active'
       END AS state
     FROM promotions p WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.codeExists = async (code, excludeId = 0) => {
  const [rows] = await pool.execute('SELECT id FROM promotions WHERE code = ? AND id <> ?', [code, excludeId]);
  return rows.length > 0;
};

exports.create = async (f) => {
  const [r] = await pool.execute(
    `INSERT INTO promotions (code, description, discount_type, discount_value, max_discount, min_order,
                             start_date, end_date, usage_limit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, CAST(? AS DATETIME), CAST(? AS DATETIME), ?, ?)`,
    [f.code, f.description, f.discount_type, f.discount_value, f.max_discount, f.min_order,
      f.start_date, f.end_date, f.usage_limit, f.is_active]
  );
  return r.insertId;
};

// Không cho sửa code và used_count (đã có đơn dùng mã thì đổi code sẽ gây khó hiểu)
exports.update = async (id, f) => {
  await pool.execute(
    `UPDATE promotions SET description = ?, discount_type = ?, discount_value = ?, max_discount = ?,
            min_order = ?, start_date = CAST(? AS DATETIME), end_date = CAST(? AS DATETIME),
            usage_limit = ?, is_active = ? WHERE id = ?`,
    [f.description, f.discount_type, f.discount_value, f.max_discount, f.min_order,
      f.start_date, f.end_date, f.usage_limit, f.is_active, id]
  );
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM promotions WHERE id = ?', [id]);
};
