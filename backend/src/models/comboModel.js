const { pool } = require('../config/db');

exports.listActive = async () => {
  const [rows] = await pool.execute(
    'SELECT id, name, description, price, image_url FROM combos WHERE is_active = 1 ORDER BY price'
  );
  return rows;
};

exports.findActiveByIds = async (conn, ids) => {
  if (!ids.length) return [];
  const [rows] = await conn.execute(
    `SELECT id, name, price FROM combos WHERE is_active = 1 AND id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  return rows;
};

// ---------- Dành cho trang quản trị ----------
exports.adminList = async () => {
  const [rows] = await pool.execute(
    'SELECT id, name, description, price, image_url, is_active FROM combos ORDER BY is_active DESC, id'
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute('SELECT id, name, description, price, image_url, is_active FROM combos WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.create = async (f) => {
  const [r] = await pool.execute(
    'INSERT INTO combos (name, description, price, image_url, is_active) VALUES (?, ?, ?, ?, ?)',
    [f.name, f.description ?? null, f.price, f.image_url ?? null, f.is_active ?? 1]
  );
  return r.insertId;
};

exports.update = async (id, f) => {
  await pool.execute(
    'UPDATE combos SET name = ?, description = ?, price = ?, image_url = ?, is_active = ? WHERE id = ?',
    [f.name, f.description ?? null, f.price, f.image_url ?? null, f.is_active, id]
  );
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM combos WHERE id = ?', [id]);
};
