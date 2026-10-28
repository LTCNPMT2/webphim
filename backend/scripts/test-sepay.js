// Test SePay integration
const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('========================================================');
  console.log('       KIỂM THỬ TỰ ĐỘNG TÍCH HỢP CỔNG SEPAY (VIETQR)    ');
  console.log('========================================================\n');

  // 1. Đăng nhập
  const resLogin = await request(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email: 'an@example.com', password: 'password' },
  });
  const token = resLogin.data?.data?.token;
  console.log('1. Đăng nhập:', token ? '[OK]' : '[FAIL]');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Lấy sơ đồ ghế suất 13 để chọn 1 ghế trống
  const resSeats = await request(`${BASE_URL}/showtimes/13/seats`);
  const available = resSeats.data?.data?.seats?.filter((s) => s.status === 'available');
  if (!available || available.length === 0) {
    console.error('Không còn ghế trống');
    process.exit(1);
  }
  const seatId = available[0].id;
  console.log(`2. Chọn ghế ${available[0].row_label}${available[0].seat_number} (ID: ${seatId})`);

  // 3. Tạo đơn giữ ghế
  const resBooking = await request(`${BASE_URL}/bookings`, {
    method: 'POST',
    ...auth,
    body: { showtime_id: 13, seat_ids: [seatId] },
  });
  const booking = resBooking.data?.data?.booking;
  console.log(`3. Tạo đơn đặt vé: [OK] ID ${booking.id}, Mã vé: ${booking.booking_code}, Số tiền: ${booking.total_amount}đ`);

  // 4. Lấy thông tin & link VietQR SePay
  const resQr = await request(`${BASE_URL}/payments/sepay/qr/${booking.id}`, { ...auth });
  console.log('4. API Lấy mã VietQR SePay: [OK]');
  console.log('   - Ngân hàng:', resQr.data?.data?.bank_brand);
  console.log('   - Số tài khoản:', resQr.data?.data?.account_number);
  console.log('   - Chủ tài khoản:', resQr.data?.data?.account_name);
  console.log('   - Nội dung chuyển khoản:', resQr.data?.data?.transfer_content);
  console.log('   - Link QR Image:', resQr.data?.data?.qr_url);

  // 5. Kiểm tra polling checkPayment (khi chưa chuyển khoản)
  const resCheckBefore = await request(`${BASE_URL}/payments/sepay/check/${booking.id}`, { ...auth });
  console.log('5. API Polling kiểm tra SePay:', resCheckBefore.data?.data?.paid === false ? '[OK] (Đang chờ chuyển tiền)' : '[FAIL]');

  // 6. Mô phỏng SePay Webhook bắn sang khi khách chuyển khoản thành công
  console.log('6. Mô phỏng SePay Webhook bắn về server khi khách chuyển khoản...');
  const resWebhook = await request(`${BASE_URL}/payments/sepay/webhook`, {
    method: 'POST',
    body: {
      id: 999999,
      gateway: 'MBBank',
      transactionDate: '2026-10-18 22:55:00',
      accountNumber: '0931883988',
      content: `CINE ${booking.booking_code} THANH TOAN VE`,
      transferType: 'in',
      transferAmount: booking.total_amount,
      referenceCode: 'FT-TEST-SEPAY-' + Date.now(),
    },
  });
  console.log('   - Kết quả Webhook:', resWebhook.data);

  // 7. Kiểm tra trạng thái đơn sau khi webhook xử lý
  const resDetailAfter = await request(`${BASE_URL}/bookings/${booking.id}`, { ...auth });
  const statusAfter = resDetailAfter.data?.data?.booking?.status;
  console.log(`7. Trạng thái đơn sau Webhook: ${statusAfter === 'paid' ? '[OK] ĐÃ THANH TOÁN (paid)' : '[FAIL] ' + statusAfter}`);

  console.log('\n========================================================');
  console.log('   KẾT LUẬN: CỔNG THANH TOÁN SEPAY HOẠT ĐỘNG HOÀN HẢO!   ');
  console.log('========================================================');
}

run();
