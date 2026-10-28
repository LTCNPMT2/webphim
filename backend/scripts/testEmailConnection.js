const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mailer = require('../src/services/email/mailer');
const templates = require('../src/services/email/emailTemplates');

async function testConnectionAndSend() {
  console.log('1. Kiểm tra tài khoản SMTP:', process.env.SMTP_USER);
  const verifyResult = await mailer.verifyConnection();
  console.log('2. Kết quả verify SMTP:', verifyResult);

  if (!verifyResult.connected) {
    console.error('❌ Kết nối SMTP thất bại:', verifyResult.message);
    process.exit(1);
  }

  console.log('3. Đang gửi email thử nghiệm tới:', process.env.SMTP_USER);
  const loginMail = templates.buildLoginEmail({
    name: 'Bang Nguyen',
    email: process.env.SMTP_USER,
    time: new Date(),
    ip: '14.232.245.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  });

  const sendResult = await mailer.sendMailWithRetry({
    to: process.env.SMTP_USER,
    subject: loginMail.subject,
    html: loginMail.html,
    text: loginMail.text,
  });

  console.log('4. Kết quả gửi email thực tế:', sendResult);
  process.exit(sendResult.success ? 0 : 1);
}

testConnectionAndSend();
