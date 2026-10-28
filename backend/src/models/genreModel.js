const { pool } = require('../config/db');

exports.listWithCount = async () => {
  const [rows] = await pool.execute(
    `SELECT g.id, g.name, g.slug, COUNT(mg.movie_id) AS movie_count
     FROM genres g LEFT JOIN movie_genres mg ON mg.genre_id = g.id
     GROUP BY g.id, g.name, g.slug ORDER BY g.name`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute('SELECT id, name, slug FROM genres WHERE id = ?', [id]);
  return rows[0] || null;
};

exports.nameExists = async (name, excludeId = 0) => {
  const [rows] = await pool.execute('SELECT id FROM genres WHERE name = ? AND id <> ?', [name, excludeId]);
  return rows.length > 0;
};

exports.slugExists = async (slug, excludeId = 0) => {
  const [rows] = await pool.execute('SELECT id FROM genres WHERE slug = ? AND id <> ?', [slug, excludeId]);
  return rows.length > 0;
};

exports.create = async (name, slug) => {
  const [r] = await pool.execute('INSERT INTO genres (name, slug) VALUES (?, ?)', [name, slug]);
  return r.insertId;
};

exports.update = async (id, name, slug) => {
  await pool.execute('UPDATE genres SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
};

exports.remove = async (id) => {
  await pool.execute('DELETE FROM genres WHERE id = ?', [id]);
};
