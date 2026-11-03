require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const http = require('http');
const app = require('../src/app');
const { pool } = require('../src/config/db');

async function runAudit() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[AUDIT] Test server started at ${baseUrl}`);

  let passed = 0;
  let failed = 0;
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
      results.push({ name, status: 'PASS' });
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
      results.push({ name, status: 'FAIL', error: err.message });
    }
  }

  async function req(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return { status: res.status, data };
  }

  try {
    console.log('\n--- 1. SERVER & PUBLIC APIs ---');

    await test('GET / - Server root info', async () => {
      const res = await req('/');
      if (res.status !== 200 || res.data.status !== 'running') throw new Error(`Status ${res.status}`);
    });

    await test('GET /api/health - Health check DB query', async () => {
      const res = await req('/api/health');
      if (res.status !== 200 || !res.data.success) throw new Error(`Health check failed: ${JSON.stringify(res.data)}`);
    });

    let sampleMovieId;
    await test('GET /api/movies - List movies', async () => {
      const res = await req('/api/movies');
      if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data.items)) {
        throw new Error(`Invalid movies response: ${res.status}`);
      }
      sampleMovieId = res.data.data.items[0]?.id;
      if (!sampleMovieId) throw new Error('No movies found in database');
    });

    await test(`GET /api/movies/:id - Movie detail (id: ${sampleMovieId})`, async () => {
      const res = await req(`/api/movies/${sampleMovieId}`);
      if (res.status !== 200 || !res.data.success || res.data.data.movie?.id !== sampleMovieId) {
        throw new Error(`Invalid movie detail`);
      }
    });

    await test('GET /api/genres - List genres', async () => {
      const res = await req('/api/genres');
      if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data.genres)) {
        throw new Error(`Invalid genres response`);
      }
    });

    await test('GET /api/cinemas - List cinemas', async () => {
      const res = await req('/api/cinemas');
      if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data.cinemas)) {
        throw new Error(`Invalid cinemas response`);
      }
    });

    let sampleComboId;
    await test('GET /api/combos - List combos', async () => {
      const res = await req('/api/combos');
      if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.data.combos)) {
        throw new Error(`Invalid combos response`);
      }
      sampleComboId = res.data.data.combos[0]?.id;
    });

    let sampleShowtimeId;
    let sampleRoomId;
    await test('GET /api/showtimes - List showtimes', async () => {
      const res = await req('/api/showtimes');
      if (res.status !== 200 || !res.data.success) throw new Error(`Showtimes status ${res.status}`);
      // Find a future showtime from DB
      const [rows] = await pool.query(
        "SELECT id, room_id FROM showtimes WHERE start_time > NOW() AND is_active = 1 LIMIT 1"
      );
      if (rows.length) {
        sampleShowtimeId = rows[0].id;
        sampleRoomId = rows[0].room_id;
      } else {
        const [anySt] = await pool.query("SELECT id, room_id FROM showtimes LIMIT 1");
        if (anySt.length) {
          sampleShowtimeId = anySt[0].id;
          sampleRoomId = anySt[0].room_id;
          await pool.query(
            "UPDATE showtimes SET start_time = DATE_ADD(NOW(), INTERVAL 2 DAY), end_time = DATE_ADD(NOW(), INTERVAL 50 HOUR) WHERE id = ?",
            [sampleShowtimeId]
          );
        }
      }
    });

    let availableSeatIds = [];
    await test(`GET /api/showtimes/:id/seats - Get seat map (id: ${sampleShowtimeId})`, async () => {
      const res = await req(`/api/showtimes/${sampleShowtimeId}/seats`);
      if (res.status !== 200 || !res.data.success) throw new Error(`Seats status ${res.status}`);
      const seats = res.data.data.seats;
      if (!Array.isArray(seats)) throw new Error('Missing seats array in response');
      const available = seats.filter((s) => s.status === 'available');
      if (available.length < 2) throw new Error('Need at least 2 available seats for test');
      availableSeatIds = [available[0].id, available[1].id];
    });

    console.log('\n--- 2. USER AUTHENTICATION & PROFILE ---');

    const testEmail = `audit_user_${Date.now()}@example.com`;
    const testPassword = 'Password@123';
    let userToken = '';
    let userId = null;

    await test('POST /api/auth/register - Register new customer', async () => {
      const res = await req('/api/auth/register', {
        method: 'POST',
        body: {
          full_name: 'Kiểm Thử Viên',
          email: testEmail,
          phone: '0988776655',
          password: testPassword,
        },
      });
      if (res.status !== 201 || !res.data.success || !res.data.data.token) {
        throw new Error(`Register failed: ${JSON.stringify(res.data)}`);
      }
      userToken = res.data.data.token;
      userId = res.data.data.user.id;
    });

    await test('POST /api/auth/login - Login with newly registered credentials', async () => {
      const res = await req('/api/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: testPassword },
      });
      if (res.status !== 200 || !res.data.success || !res.data.data.token) {
        throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
      }
      userToken = res.data.data.token;
    });

    await test('GET /api/auth/me - Get customer profile', async () => {
      const res = await req('/api/auth/me', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.user?.email !== testEmail) {
        throw new Error(`Profile fetch failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('PUT /api/auth/profile - Update customer full name', async () => {
      const res = await req('/api/auth/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { full_name: 'Kiểm Thử Viên Đã Cập Nhật', phone: '0988776655' },
      });
      if (res.status !== 200 || res.data.data.user?.full_name !== 'Kiểm Thử Viên Đã Cập Nhật') {
        throw new Error(`Profile update failed: ${JSON.stringify(res.data)}`);
      }
    });

    const newPassword = 'NewPassword@456';
    await test('PUT /api/auth/change-password - Change customer password', async () => {
      const res = await req('/api/auth/change-password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { current_password: testPassword, new_password: newPassword },
      });
      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Change password failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('POST /api/auth/login - Re-login with new password', async () => {
      const res = await req('/api/auth/login', {
        method: 'POST',
        body: { email: testEmail, password: newPassword },
      });
      if (res.status !== 200 || !res.data.data.token) {
        throw new Error(`Login with new password failed`);
      }
      userToken = res.data.data.token;
    });

    console.log('\n--- 3. REVIEWS & RATINGS ---');

    await test(`POST /api/movies/:id/reviews - Create movie review`, async () => {
      const res = await req(`/api/movies/${sampleMovieId}/reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { rating: 5, comment: 'Phim rất hay và xuất sắc!' },
      });
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Create review failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test(`GET /api/movies/:id/reviews/mine - Fetch user review`, async () => {
      const res = await req(`/api/movies/${sampleMovieId}/reviews/mine`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.review?.rating !== 5) {
        throw new Error(`Fetch mine review failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test(`GET /api/movies/:id/reviews - Public reviews list`, async () => {
      const res = await req(`/api/movies/${sampleMovieId}/reviews`);
      if (res.status !== 200 || !Array.isArray(res.data.data.items)) {
        throw new Error(`Public review list failed`);
      }
    });

    await test(`DELETE /api/movies/:id/reviews/mine - Remove user review`, async () => {
      const res = await req(`/api/movies/${sampleMovieId}/reviews/mine`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) {
        throw new Error(`Delete review failed: ${JSON.stringify(res.data)}`);
      }
    });

    console.log('\n--- 4. PROMOTIONS VALIDATION ---');

    await test('POST /api/promotions/validate - Validate WELCOME10 for 120,000đ', async () => {
      const res = await req('/api/promotions/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { code: 'WELCOME10', subtotal: 120000 },
      });
      if (res.status !== 200 || !res.data.success || res.data.data.discount_amount !== 12000) {
        throw new Error(`Expected 12000 discount, got: ${JSON.stringify(res.data)}`);
      }
    });

    await test('POST /api/promotions/validate - Reject WELCOME10 under min_order (50,000đ)', async () => {
      const res = await req('/api/promotions/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { code: 'WELCOME10', subtotal: 50000 },
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 for subtotal under min_order, got ${res.status}`);
      }
    });

    await test('POST /api/promotions/validate - Reject invalid promo code', async () => {
      const res = await req('/api/promotions/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { code: 'NONEXISTENT999', subtotal: 200000 },
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}`);
      }
    });

    console.log('\n--- 5. BOOKING & CANCELLATION FLOW ---');

    let booking1Id = null;
    let booking1Code = null;

    // Pick an available seat fresh from seatmap
    const seatMapRes = await req(`/api/showtimes/${sampleShowtimeId}/seats`);
    const freshAvailable = seatMapRes.data.data.seats.filter((s) => s.status === 'available');
    const testSeatId = freshAvailable[0].id;
    console.log(`[AUDIT] Using seat_id ${testSeatId} for booking flow`);

    await test('POST /api/bookings - Create booking with seat + combo + promo', async () => {
      const combosPayload = sampleComboId ? [{ combo_id: sampleComboId, quantity: 1 }] : [];
      const res = await req('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          showtime_id: sampleShowtimeId,
          seat_ids: [testSeatId],
          combos: combosPayload,
          promo_code: 'WELCOME10',
        },
      });
      if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Create booking failed: ${res.status} ${JSON.stringify(res.data)}`);
      }
      const b = res.data.data.booking;
      booking1Id = b.id;
      booking1Code = b.booking_code;
      if (!booking1Id || !booking1Code) throw new Error('Missing booking id or code in response');
      if (b.status !== 'pending') throw new Error(`Expected status pending, got ${b.status}`);
    });

    await test('POST /api/bookings - Prevent double booking of holding seat (409)', async () => {
      const res = await req('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          showtime_id: sampleShowtimeId,
          seat_ids: [testSeatId],
        },
      });
      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict, got ${res.status}`);
      }
    });

    await test(`GET /api/bookings/:id - View booking details`, async () => {
      const res = await req(`/api/bookings/${booking1Id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.booking?.booking_code !== booking1Code) {
        throw new Error(`Fetch booking detail failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('GET /api/bookings - List user booking history', async () => {
      const res = await req('/api/bookings', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.items)) {
        throw new Error(`List bookings failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test(`PUT /api/bookings/:id/cancel - Cancel pending booking & release seat`, async () => {
      const res = await req(`/api/bookings/${booking1Id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.booking?.status !== 'cancelled') {
        throw new Error(`Cancel failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('POST /api/bookings - Re-booking released seat succeeds', async () => {
      const res = await req('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          showtime_id: sampleShowtimeId,
          seat_ids: [testSeatId],
        },
      });
      if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Re-booking failed: ${JSON.stringify(res.data)}`);
      }
      const b = res.data.data.booking;
      booking1Id = b.id;
      booking1Code = b.booking_code;
    });

    console.log('\n--- 6. PAYMENT SIMULATION ---');

    await test('POST /api/payments - Mock payment successful', async () => {
      const res = await req('/api/payments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          booking_id: booking1Id,
          method: 'mock',
        },
      });
      if (res.status !== 200 || res.data.data.booking?.status !== 'paid') {
        throw new Error(`Mock payment failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('GET /api/bookings/:id - Booking status is paid', async () => {
      const res = await req(`/api/bookings/${booking1Id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200 || res.data.data.booking?.status !== 'paid') {
        throw new Error(`Expected status paid, got: ${res.data.data?.booking?.status}`);
      }
    });

    await test('GET /api/payments/sepay/:bookingId - Fetch SePay payment info', async () => {
      const res = await req(`/api/payments/sepay/${booking1Id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) {
        throw new Error(`SePay info failed: ${res.status}`);
      }
    });

    console.log('\n--- 7. STAFF RBAC & CHECK-IN ---');

    let staffToken = '';
    await test('POST /api/auth/login - Staff login (ve@cinebooking.vn)', async () => {
      const res = await req('/api/auth/login', {
        method: 'POST',
        body: { email: 've@cinebooking.vn', password: 'Staff@123456' },
      });
      if (res.status !== 200 || !res.data.data.token) {
        throw new Error(`Staff login failed: ${JSON.stringify(res.data)}`);
      }
      staffToken = res.data.data.token;
      if (res.data.data.user.role !== 'staff') throw new Error(`Role is not staff: ${res.data.data.user.role}`);
    });

    await test(`GET /api/admin/bookings/verify/:code - Staff verify paid ticket`, async () => {
      const res = await req(`/api/admin/bookings/verify/${booking1Code}`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      if (res.status !== 200 || res.data.data.ticket?.booking_code !== booking1Code) {
        throw new Error(`Staff verify failed: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.ticket?.checked_in_at !== null) {
        throw new Error(`Ticket should not be checked in yet`);
      }
    });

    await test(`POST /api/admin/bookings/check-in - Staff check in paid ticket`, async () => {
      const res = await req(`/api/admin/bookings/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
        body: { booking_code: booking1Code },
      });
      if (res.status !== 200 || !res.data.data.ticket?.checked_in_at) {
        throw new Error(`Check-in failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test(`POST /api/admin/bookings/check-in - Duplicate check-in rejected (400)`, async () => {
      const res = await req(`/api/admin/bookings/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
        body: { booking_code: booking1Code },
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 for duplicate check-in, got ${res.status}`);
      }
    });

    await test('GET /api/admin/users - Ticket staff unauthorized for user management (403)', async () => {
      const res = await req('/api/admin/users', {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    await test('GET /api/admin/stats - Ticket staff unauthorized for stats/dashboard (403)', async () => {
      const res = await req('/api/admin/stats', {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    console.log('\n--- 8. ADMIN FULL MANAGEMENT (CRUD & RBAC) ---');

    let adminToken = '';
    await test('POST /api/auth/login - Admin login (admin@cinema.vn)', async () => {
      const res = await req('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@cinema.vn', password: 'password' },
      });
      if (res.status !== 200 || !res.data.data.token) {
        throw new Error(`Admin login failed: ${JSON.stringify(res.data)}`);
      }
      adminToken = res.data.data.token;
      if (res.data.data.user.role !== 'admin') throw new Error(`Role is not admin: ${res.data.data.user.role}`);
    });

    await test('GET /api/admin/stats - Admin dashboard statistics', async () => {
      const res = await req('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !res.data.success) {
        throw new Error(`Stats fetch failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('GET /api/admin/permissions - Permissions and preset list', async () => {
      const res = await req('/api/admin/permissions', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !res.data.data.permissions || !res.data.data.preset_roles) {
        throw new Error(`Permissions fetch failed`);
      }
    });

    await test('GET /api/admin/users - List users with role filter', async () => {
      const res = await req('/api/admin/users?role=staff', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.items)) {
        throw new Error(`Admin list users failed`);
      }
    });

    let newStaffId = null;
    const staffAuditEmail = `staff_audit_${Date.now()}@cinebooking.vn`;
    await test('POST /api/admin/users/staff - Admin creates staff member', async () => {
      const res = await req('/api/admin/users/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          full_name: 'Nhân Viên Mới Được Tạo',
          email: staffAuditEmail,
          phone: '0977889900',
          password: 'Staff@123456',
          staff_title: 'Nhân Viên Hỗ Trợ Kỹ Thuật',
          permissions: ['movies:manage', 'combos:manage'],
        },
      });
      if (res.status !== 201 || !res.data.data.user?.id) {
        throw new Error(`Create staff failed: ${JSON.stringify(res.data)}`);
      }
      newStaffId = res.data.data.user.id;
    });

    await test('PUT /api/admin/users/:id/role - Admin updates staff permissions', async () => {
      const res = await req(`/api/admin/users/${newStaffId}/role`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          role: 'staff',
          staff_title: 'Nhân Viên Trưởng Ca',
          permissions: ['movies:manage', 'showtimes:manage', 'tickets:checkin'],
        },
      });
      if (res.status !== 200 || res.data.data.user?.staff_title !== 'Nhân Viên Trưởng Ca') {
        throw new Error(`Update staff permissions failed: ${JSON.stringify(res.data)}`);
      }
    });

    await test('GET /api/admin/combos - Admin list combos', async () => {
      const res = await req('/api/admin/combos', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.combos)) {
        throw new Error(`Admin list combos failed`);
      }
    });

    await test('GET /api/admin/promotions - Admin list promotions', async () => {
      const res = await req('/api/admin/promotions', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.promotions)) {
        throw new Error(`Admin list promotions failed`);
      }
    });

    await test('GET /api/admin/bookings - Admin list bookings', async () => {
      const res = await req('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.items)) {
        throw new Error(`Admin list bookings failed`);
      }
    });

    await test('GET /api/admin/cinemas - Admin list cinemas', async () => {
      const res = await req('/api/admin/cinemas', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.cinemas)) {
        throw new Error(`Admin list cinemas failed`);
      }
    });

    await test('GET /api/admin/rooms - Admin list rooms', async () => {
      const res = await req('/api/admin/rooms', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.rooms)) {
        throw new Error(`Admin list rooms failed`);
      }
    });

    await test('GET /api/admin/showtimes - Admin list showtimes', async () => {
      const res = await req('/api/admin/showtimes', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200 || !Array.isArray(res.data.data.items)) {
        throw new Error(`Admin list showtimes failed`);
      }
    });

  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log(`\n========================================`);
    console.log(`AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log(`========================================\n`);
  }
}

runAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit fatal error:', err);
    process.exit(1);
  });
