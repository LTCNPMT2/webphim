// Chạy fn(conn) trong 1 transaction: thành công -> commit, lỗi -> rollback rồi ném lỗi tiếp
const { pool } = require('../config/db');

module.exports = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
