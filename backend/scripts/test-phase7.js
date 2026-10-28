// Test script using native fetch (Node 18+)
const BASE_URL = 'http://localhost:5000/api';
let tokenAn = '';
let tokenBinh = '';
let testShowtimeId = 13;
let testSeatIds = [];
let testBookingId = null;

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

async function runTests() {
  console.log('========================================================');
  console.log('   KIỂM THỬ TỰ ĐỘNG GIAI ĐOẠN 7: LUỒNG ĐẶT VÉ TOÀN DIỆN   ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`\x1b[32m[OK]\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
      failed++;
    }
  }

  try {
    // 1. Đăng nhập 2 tài khoản test
    console.log('--- 1. Kiểm tra Đăng nhập tài khoản An & Bình ---');
    const resLoginAn = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email: 'an@example.com', password: 'password' },
    });
    tokenAn = resLoginAn.data?.data?.token;
    assert(tokenAn, 'Đăng nhập An (an@example.com) thành công, nhận JWT token');

    const resLoginBinh = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email: 'binh@example.com', password: 'password' },
    });
    tokenBinh = resLoginBinh.data?.data?.token;
    assert(tokenBinh, 'Đăng nhập Bình (binh@example.com) thành công, nhận JWT token');

    const authAn = { headers: { Authorization: `Bearer ${tokenAn}` } };
    const authBinh = { headers: { Authorization: `Bearer ${tokenBinh}` } };

    // 2. Lấy danh sách phim & suất chiếu hợp lệ
    console.log('\n--- 2. Lấy thông tin phim và suất chiếu ---');
    const resMovies = await request(`${BASE_URL}/movies?status=now_showing&limit=5`);
    const movies = resMovies.data?.data?.items;
    assert(movies && movies.length > 0, `Lấy danh sách phim đang chiếu: có ${movies?.length} phim`);

    const movie = movies[0];
    const resShowtimes = await request(`${BASE_URL}/showtimes?movie_id=${movie.id}&date=2026-10-19`);
    const cinemas = resShowtimes.data?.data?.cinemas || [];
    assert(Array.isArray(cinemas), `Lấy danh sách suất chiếu ngày 2026-10-19: ${cinemas.length} cụm rạp`);
    console.log(`Sử dụng suất chiếu tương lai ID: ${testShowtimeId}`);

    // 3. API Sơ đồ ghế: GET /api/showtimes/:id/seats
    console.log('\n--- 3. Kiểm tra API Sơ đồ ghế (GET /api/showtimes/:id/seats) ---');
    const resSeats = await request(`${BASE_URL}/showtimes/${testShowtimeId}/seats`);
    assert(resSeats.data?.success === true, 'Gọi API sơ đồ ghế trả về success = true');
    const seatData = resSeats.data?.data;
    assert(seatData?.seats && seatData.seats.length > 0, `Sơ đồ có ${seatData?.seats?.length} ghế`);

    const firstSeat = seatData.seats[0];
    assert(
      firstSeat.id && firstSeat.row_label && firstSeat.seat_number && firstSeat.seat_type && firstSeat.status && typeof firstSeat.price === 'number',
      `Ghế mẫu (${firstSeat.row_label}${firstSeat.seat_number}): loại ${firstSeat.seat_type}, giá ${firstSeat.price}đ, trạng thái '${firstSeat.status}'`
    );

    const availableSeats = seatData.seats.filter((s) => s.status === 'available');
    assert(availableSeats.length >= 2, `Có ${availableSeats.length} ghế đang trống (available)`);
    testSeatIds = [availableSeats[0].id, availableSeats[1].id];
    console.log(`Chọn 2 ghế test: ID ${testSeatIds[0]} (${availableSeats[0].row_label}${availableSeats[0].seat_number}) và ID ${testSeatIds[1]} (${availableSeats[1].row_label}${availableSeats[1].seat_number})`);

    // 4. API Bắp nước: GET /api/combos
    console.log('\n--- 4. Kiểm tra API Bắp nước (GET /api/combos) ---');
    const resCombos = await request(`${BASE_URL}/combos`);
    assert(resCombos.data?.success === true, 'Lấy danh sách combo thành công');
    const combos = resCombos.data?.data?.combos || [];
    assert(Array.isArray(combos) && combos.length > 0, `Có ${combos.length} gói combo bắp nước`);
    const testCombo = combos[0];
    console.log(`Combo mẫu: ${testCombo.name} - ${testCombo.price}đ`);

    // 5. API Kiểm tra mã giảm giá: POST /api/promotions/validate
    console.log('\n--- 5. Kiểm tra API Mã giảm giá (POST /api/promotions/validate) ---');
    const resPromo = await request(`${BASE_URL}/promotions/validate`, {
      method: 'POST',
      ...authAn,
      body: { code: 'WELCOME10', subtotal: 200000 },
    });
    if (resPromo.ok) {
      assert(resPromo.data?.success === true, `Áp dụng mã WELCOME10 thành công: giảm ${resPromo.data?.data?.discount_amount}đ`);
    } else {
      console.log('Mã WELCOME10 thông báo:', resPromo.data?.message);
    }

    const resBadPromo = await request(`${BASE_URL}/promotions/validate`, {
      method: 'POST',
      ...authAn,
      body: { code: 'MA_KHONG_TON_TAI_12345', subtotal: 200000 },
    });
    assert(resBadPromo.status === 404 || resBadPromo.status === 400, `Mã không hợp lệ bị từ chối chính xác (HTTP ${resBadPromo.status})`);

    // 6. API Tạo đơn đặt vé / Giữ ghế: POST /api/bookings
    console.log('\n--- 6. Kiểm tra Giữ ghế & Tạo đơn đặt vé (POST /api/bookings) ---');
    // Hủy các đơn pending cũ của An nếu có
    const oldBookings = await request(`${BASE_URL}/bookings?status=pending`, { ...authAn });
    for (const b of oldBookings.data?.data?.items || []) {
      await request(`${BASE_URL}/bookings/${b.id}/cancel`, { method: 'PUT', ...authAn });
    }

    const resCreateBooking = await request(`${BASE_URL}/bookings`, {
      method: 'POST',
      ...authAn,
      body: {
        showtime_id: testShowtimeId,
        seat_ids: testSeatIds,
        combos: [{ combo_id: testCombo.id, quantity: 1 }],
        promo_code: 'WELCOME10',
      },
    });

    assert(resCreateBooking.status === 201, `Tạo đơn đặt vé thành công (HTTP 201)`);
    const bookingCreated = resCreateBooking.data?.data?.booking;
    testBookingId = bookingCreated?.id;
    const bookingCode = bookingCreated?.booking_code;
    assert(testBookingId && bookingCode, `Đơn ID ${testBookingId}, Mã đơn: ${bookingCode}`);

    // 7. Chi tiết đơn & seconds_left
    console.log('\n--- 7. Kiểm tra Chi tiết đơn & Countdown (GET /api/bookings/:id) ---');
    const resBookingDetail = await request(`${BASE_URL}/bookings/${testBookingId}`, { ...authAn });
    const detail = resBookingDetail.data?.data?.booking;
    assert(detail?.status === 'pending', `Trạng thái đơn là '${detail?.status}'`);
    assert(typeof detail?.seconds_left === 'number' && detail?.seconds_left > 0, `seconds_left do SERVER tính: ${detail?.seconds_left}s (hỗ trợ đếm ngược chính xác không phụ thuộc giờ máy)`);
    assert(detail?.qr_content === bookingCode, `qr_content khớp với mã vé: ${detail?.qr_content}`);
    assert(detail?.seats?.length === 2, `Danh sách ghế trong đơn: ${detail?.seats?.map((s) => s.label).join(', ')}`);
    assert(detail?.combos?.length === 1, `Combo trong đơn: ${detail?.combos?.[0]?.name} x ${detail?.combos?.[0]?.quantity}`);

    // 8. Sơ đồ ghế cập nhật 'holding'
    console.log('\n--- 8. Kiểm tra Sơ đồ ghế đổi trạng thái sang holding ---');
    const resSeatsAfterHold = await request(`${BASE_URL}/showtimes/${testShowtimeId}/seats`);
    const heldSeats = resSeatsAfterHold.data?.data?.seats?.filter((s) => testSeatIds.includes(s.id));
    assert(
      heldSeats && heldSeats.every((s) => s.status === 'holding' || s.status === 'booked'),
      `Các ghế vừa chọn đã chuyển sang trạng thái '${heldSeats?.[0]?.status}'`
    );

    // 9. Tranh ghế / Race condition (409 Conflict): Bình cố giữ ghế mà An đang giữ
    console.log('\n--- 9. Kiểm tra Tranh chấp ghế (Bình cố đặt ghế của An) ---');
    const resConflict = await request(`${BASE_URL}/bookings`, {
      method: 'POST',
      ...authBinh,
      body: {
        showtime_id: testShowtimeId,
        seat_ids: [testSeatIds[0]],
      },
    });
    assert(
      resConflict.status === 409,
      `Server chặn thành công với HTTP 409 Conflict: "${resConflict.data?.message}"`
    );

    // 10. Giới hạn tối đa 8 ghế
    console.log('\n--- 10. Kiểm tra Giới hạn tối đa 8 ghế ---');
    const resMaxSeats = await request(`${BASE_URL}/bookings`, {
      method: 'POST',
      ...authBinh,
      body: {
        showtime_id: testShowtimeId,
        seat_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
    });
    assert(
      resMaxSeats.status === 400 || resMaxSeats.status === 422,
      `Chặn chọn quá 8 ghế chính xác (HTTP ${resMaxSeats.status}): "${resMaxSeats.data?.message || resMaxSeats.data?.errors?.[0]?.message}"`
    );

    // 11. Thanh toán giả lập thất bại (simulate_fail: true) -> HTTP 402
    console.log('\n--- 11. Kiểm tra Thanh toán thất bại (simulate_fail) ---');
    const resPayFail = await request(`${BASE_URL}/payments`, {
      method: 'POST',
      ...authAn,
      body: {
        booking_id: testBookingId,
        method: 'mock',
        simulate_fail: true,
      },
    });
    assert(
      resPayFail.status === 402,
      `Thanh toán thất bại giả lập trả về HTTP 402: "${resPayFail.data?.message}" (đơn vẫn giữ để người dùng bấm thử lại)`
    );

    // 12. Thanh toán thành công (simulate_fail: false)
    console.log('\n--- 12. Kiểm tra Thanh toán thành công ---');
    const resPaySuccess = await request(`${BASE_URL}/payments`, {
      method: 'POST',
      ...authAn,
      body: {
        booking_id: testBookingId,
        method: 'mock',
      },
    });
    assert(
      resPaySuccess.status === 200 || resPaySuccess.status === 201,
      `Thanh toán thành công (HTTP ${resPaySuccess.status})`
    );

    // 13. Kiểm tra đơn sau khi thanh toán: status = 'paid'
    console.log('\n--- 13. Kiểm tra Trạng thái đơn sau khi thanh toán ---');
    const resPaidBooking = await request(`${BASE_URL}/bookings/${testBookingId}`, { ...authAn });
    const paidDetail = resPaidBooking.data?.data?.booking;
    assert(paidDetail?.status === 'paid', `Trạng thái đơn chuyển thành 'paid'`);
    assert(paidDetail?.qr_content, `Vé đã thanh toán có qr_content: ${paidDetail?.qr_content}`);

    // Ghế bây giờ phải là 'booked' trong sơ đồ ghế
    const resSeatsAfterPay = await request(`${BASE_URL}/showtimes/${testShowtimeId}/seats`);
    const paidSeatsInMap = resSeatsAfterPay.data?.data?.seats?.filter((s) => testSeatIds.includes(s.id));
    assert(
      paidSeatsInMap && paidSeatsInMap.every((s) => s.status === 'booked'),
      `Ghế trong sơ đồ đã chuyển thành 'booked' (đã bán)`
    );

    // Không thể thanh toán lại đơn đã paid (409)
    const resRePay = await request(`${BASE_URL}/payments`, {
      method: 'POST',
      ...authAn,
      body: {
        booking_id: testBookingId,
        method: 'mock',
      },
    });
    assert(resRePay.status === 409, `Chặn thanh toán lại đơn đã trả (HTTP 409): "${resRePay.data?.message}"`);

    // 14. Kiểm tra Lịch sử vé của tôi: GET /api/bookings
    console.log('\n--- 14. Kiểm tra Lịch sử "Vé của tôi" (GET /api/bookings) ---');
    const resMyBookings = await request(`${BASE_URL}/bookings?page=1&limit=10`, { ...authAn });
    assert(resMyBookings.data?.success === true, 'Lấy danh sách vé của tôi thành công');
    const myItems = resMyBookings.data?.data?.items;
    assert(myItems && myItems.some((b) => b.id === testBookingId), `Đơn vé ${bookingCode} xuất hiện trong danh sách vé của tôi`);

    // Lọc theo status=paid
    const resPaidOnly = await request(`${BASE_URL}/bookings?status=paid`, { ...authAn });
    assert(
      resPaidOnly.data?.data?.items?.every((b) => b.status === 'paid'),
      `Bộ lọc status=paid chỉ trả về vé đã thanh toán (${resPaidOnly.data?.data?.items?.length} vé)`
    );

    // 15. Kiểm tra Hủy vé đơn pending
    console.log('\n--- 15. Kiểm tra Hủy vé (PUT /api/bookings/:id/cancel) ---');
    const resAvailable2 = await request(`${BASE_URL}/showtimes/${testShowtimeId}/seats`);
    const freeSeats = resAvailable2.data?.data?.seats?.filter((s) => s.status === 'available');
    if (freeSeats && freeSeats.length > 0) {
      const cancelSeatId = freeSeats[0].id;
      const bToCancel = await request(`${BASE_URL}/bookings`, {
        method: 'POST',
        ...authAn,
        body: { showtime_id: testShowtimeId, seat_ids: [cancelSeatId] },
      });
      const toCancelId = bToCancel.data?.data?.booking?.id;
      const resCancel = await request(`${BASE_URL}/bookings/${toCancelId}/cancel`, {
        method: 'PUT',
        ...authAn,
      });
      assert(resCancel.status === 200, `Hủy đơn pending thành công (HTTP 200)`);

      const resCheckReleased = await request(`${BASE_URL}/showtimes/${testShowtimeId}/seats`);
      const releasedSeat = resCheckReleased.data?.data?.seats?.find((s) => s.id === cancelSeatId);
      assert(releasedSeat?.status === 'available', `Ghế ${releasedSeat?.row_label}${releasedSeat?.seat_number} đã được nhả lại thành available`);
    }

  } catch (err) {
    console.error('LỖI KHÔNG MONG MUỐN:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`KET QUA KIEM THU: ${passed} dat, ${failed} loi.`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
