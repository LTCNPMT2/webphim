// Mô phỏng NHIỀU người cùng đặt 1 ghế cùng lúc. Kết quả đúng: đúng 1 request thành công (201), còn lại bị từ chối (409).
// Chạy khi server đang chạy:   node scripts/raceTest.js
// Tuỳ chọn:  SHOWTIME_ID=10 node scripts/raceTest.js   (Windows PowerShell: $env:SHOWTIME_ID=10; node scripts/raceTest.js)
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const SHOWTIME_ID = Number(process.env.SHOWTIME_ID) || 10; // suất 10: ngày kia, luôn ở tương lai
const PARALLEL = 10;

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* không có body */ }
  return { status: res.status, data };
}

async function login(email) {
  const r = await call('POST', '/auth/login', { email, password: 'password' });
  if (r.status !== 200) throw new Error(`Đăng nhập ${email} thất bại (${r.status}): ${r.data?.message}`);
  return r.data.data.token;
}

(async () => {
  const tokens = [await login('an@example.com'), await login('binh@example.com')];

  const map = await call('GET', `/showtimes/${SHOWTIME_ID}/seats`);
  if (map.status !== 200) throw new Error(`Không lấy được sơ đồ ghế (${map.status}): ${map.data?.message}`);
  const seat = map.data.data.seats.find((s) => s.status === 'available');
  if (!seat) throw new Error('Suất chiếu này đã hết ghế trống, hãy thử SHOWTIME_ID khác');

  console.log(`Suất ${SHOWTIME_ID}, ghế thử: ${seat.row_label}${seat.seat_number} (id ${seat.id})`);
  console.log(`Gửi ${PARALLEL} yêu cầu đặt CÙNG LÚC từ 2 tài khoản...\n`);

  const results = await Promise.all(
    Array.from({ length: PARALLEL }, (_, i) =>
      call('POST', '/bookings', { showtime_id: SHOWTIME_ID, seat_ids: [seat.id] }, tokens[i % 2])
    )
  );

  const tally = {};
  results.forEach((r) => { tally[r.status] = (tally[r.status] || 0) + 1; });
  console.log('Thống kê mã trả về:', tally);

  const winnerIdx = results.findIndex((r) => r.status === 201);
  const ok = results.filter((r) => r.status === 201).length;
  if (ok === 1) {
    console.log('\n✅ ĐÚNG: chỉ 1 người giữ được ghế, các yêu cầu còn lại bị từ chối.');
  } else {
    console.log(`\n❌ SAI: có ${ok} yêu cầu thành công cho cùng 1 ghế!`);
  }
  const sample = results.find((r) => r.status === 409);
  if (sample) console.log('Thông báo của người đến sau:', sample.data.message);

  // Dọn dữ liệu test: hủy đơn thắng cuộc để trả ghế
  if (winnerIdx >= 0) {
    const id = results[winnerIdx].data.data.booking.id;
    await call('PUT', `/bookings/${id}/cancel`, null, tokens[winnerIdx % 2]);
    console.log('(Đã hủy đơn test để trả ghế)');
  }
  process.exit(ok === 1 ? 0 : 1);
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
