const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mailer = require('../src/services/email/mailer');
const templates = require('../src/services/email/emailTemplates');

async function testBookingEmailSend() {
  console.log('Đang tạo và gửi email vé xem phim có mã QR tới:', process.env.SMTP_USER);

  const bookingMail = await templates.buildBookingPaidEmail({
    booking: {
      id: 99,
      booking_code: 'MM890573',
      user_name: 'Bang Nguyen',
      movie_title: 'Dune: Hành Tinh Cát - Phần Hai',
      age_rating: 'T16',
      cinema_name: 'Cine Star Quốc Thanh',
      cinema_address: '271 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM',
      room_name: 'Cinema 01 (IMAX Laser)',
      start_time: new Date(Date.now() + 86400000 * 2), // 2 ngày tới
      duration_minutes: 166,
      total_amount: 195000,
      created_at: new Date(),
    },
    seats: [
      { row_label: 'F', seat_number: 5 },
      { row_label: 'F', seat_number: 6 },
    ],
    combos: [
      { name: 'Combo Solo (1 Bắp phô mai lớn + 1 Coca)', quantity: 1 },
    ],
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  });

  const sendResult = await mailer.sendMailWithRetry({
    to: process.env.SMTP_USER,
    subject: bookingMail.subject,
    html: bookingMail.html,
    text: bookingMail.text,
    attachments: bookingMail.attachments,
  });

  console.log('Kết quả gửi email vé xem phim:', sendResult);
  process.exit(sendResult.success ? 0 : 1);
}

testBookingEmailSend();
