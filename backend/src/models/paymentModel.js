exports.create = async (conn, { booking_id, method, amount, status, transaction_code }) => {
  const [r] = await conn.execute(
    `INSERT INTO payments (booking_id, method, amount, status, transaction_code, paid_at)
     VALUES (?, ?, ?, ?, ?, ${status === 'success' ? 'NOW()' : 'NULL'})`,
    [booking_id, method, amount, status, transaction_code ?? null]
  );
  return r.insertId;
};

exports.refundByBooking = async (conn, bookingId) => {
  await conn.execute(
    "UPDATE payments SET status = 'refunded' WHERE booking_id = ? AND status = 'success'",
    [bookingId]
  );
};
