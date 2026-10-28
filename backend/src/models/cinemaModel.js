const { pool } = require('../config/db');

// onlyActive = true: dùng cho người dùng; false: dùng cho admin (thấy cả rạp đã ẩn)
exports.list = async ({ city, onlyActive }) => {
  const conds = [];
  const params = [];
  if (onlyActive) conds.push('c.is_active = 1');
  if (city) {
    conds.push('c.city = ?');
    params.push(city);
  }
  const [rows] = await pool.execute(
    `SELECT c.*, (SELECT COUNT(*) FROM rooms r WHERE r.cinema_id = c.id AND r.is_active = 1) AS room_count
     FROM cinemas c ${conds.length ? `WHERE ${conds.join(' AND ')}` : ''}
     ORDER BY c.city, c.name`,
    params
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM cinemas WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.getActiveRooms = async (cinemaId) => {
  const [rows] = await pool.execute(
    'SELECT id, name, room_type, total_seats FROM rooms WHERE cinema_id = ? AND is_active = 1 ORDER BY id, name',
    [cinemaId]
  );
  return rows;
};

exports.create = async (f) => {
  const [r] = await pool.execute(
    'INSERT INTO cinemas (name, address, city, phone, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [f.name, f.address, f.city, f.phone ?? null, f.image_url ?? null, f.is_active ?? 1]
  );
  return r.insertId;
};

exports.update = async (id, f) => {
  await pool.execute(
    'UPDATE cinemas SET name = ?, address = ?, city = ?, phone = ?, image_url = ?, is_active = ? WHERE id = ?',
    [f.name, f.address, f.city, f.phone ?? null, f.image_url ?? null, f.is_active, id]
  );
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM cinemas WHERE id = ?', [id]);
};
