// Tự động nhả ghế của các đơn pending đã quá hạn (chạy mỗi phút)
const cron = require('node-cron');
const withTransaction = require('../utils/transaction');
const bookingModel = require('../models/bookingModel');

let running = false; // tránh 2 lượt quét chồng nhau

exports.runExpiry = () => withTransaction((conn) => bookingModel.expirePending(conn));

exports.startExpiryJob = () => {
  cron.schedule('* * * * *', async () => {
    if (running) return;
    running = true;
    try {
      const n = await exports.runExpiry();
      if (n) console.log(`⏱️  Đã nhả ghế của ${n} đơn hết hạn`);
    } catch (err) {
      console.error('❌ Lỗi job nhả ghế:', err.message);
    } finally {
      running = false;
    }
  });
  console.log('⏱️  Job tự động nhả ghế hết hạn đã chạy (mỗi phút)');
};
