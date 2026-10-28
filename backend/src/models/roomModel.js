const { pool } = require('../config/db');

exports.list = async ({ cinema_id }) => {
  const [rows] = await pool.execute(
    `SELECT r.*, c.name AS cinema_name FROM rooms r JOIN cinemas c ON c.id = r.cinema_id
     ${cinema_id ? 'WHERE r.cinema_id = ?' : ''} ORDER BY r.cinema_id, r.name`,
    cinema_id ? [cinema_id] : []
  );
  return rows;
};

exports.findById = async (id, db = pool) => {
  const [rows] = await db.execute('SELECT * FROM rooms WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.nameExists = async (cinemaId, name, excludeId = 0) => {
  const [rows] = await pool.execute(
    'SELECT id FROM rooms WHERE cinema_id = ? AND name = ? AND id <> ?',
    [cinemaId, name, excludeId]
  );
  return rows.length > 0;
};

exports.getSeats = async (roomId) => {
  const [rows] = await pool.execute(
    `SELECT id, row_label, seat_number, seat_type, price_surcharge
     FROM seats WHERE room_id = ? ORDER BY row_label, seat_number`,
    [roomId]
  );
  return rows;
};

exports.create = async (db, { cinema_id, name, room_type, total_seats }) => {
  const [r] = await db.execute(
    'INSERT INTO rooms (cinema_id, name, room_type, total_seats) VALUES (?, ?, ?, ?)',
    [cinema_id, name, room_type, total_seats]
  );
  return r.insertId;
};

// seats: mảng [room_id, row_label, seat_number, seat_type, price_surcharge]
exports.insertSeats = async (db, seats) => {
  await db.query(
    'INSERT INTO seats (room_id, row_label, seat_number, seat_type, price_surcharge) VALUES ?',
    [seats]
  );
};

exports.update = async (id, { name, room_type, is_active }) => {
  await pool.execute('UPDATE rooms SET name = ?, room_type = ?, is_active = ? WHERE id = ?', [
    name, room_type, is_active, id,
  ]);
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);
};
