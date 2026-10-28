// Quản lý mẫu Email HTML & Text (Login & Booking Paid Confirmation)
const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Hàm chống HTML Injection / XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Định dạng tiền tệ VNĐ (ví dụ 150.000đ)
 */
function formatCurrencyVN(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

/**
 * Định dạng ngày giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
 */
function formatDateTimeVN(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'long',
  }).format(d);
}

/**
 * Định dạng ngắn gọn ngày giờ (vd: 19:30 - 24/10/2026)
 */
function formatShortDateTimeVN(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Phân tích User-Agent thành tên trình duyệt & hệ điều hành thân thiện
 */
function parseUserAgent(uaString = '') {
  const ua = String(uaString);
  let browser = 'Trình duyệt không xác định';
  let os = 'Thiết bị';

  // Hệ điều hành
  if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/win(dows|98|nt|me|2000|xp|7|8|10|11)/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS (Apple)';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Trình duyệt
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/postman/i.test(ua)) browser = 'Postman API Client';
  else if (/curl/i.test(ua)) browser = 'cURL CLI';

  return `${browser} trên ${os}`;
}

/**
 * Tạo chữ ký HMAC SHA-256 bảo mật cho mã vé
 */
function signBookingCode(bookingCode) {
  const secret = process.env.JWT_SECRET || 'cine_booking_secret_key';
  return crypto.createHmac('sha256', secret).update(String(bookingCode)).digest('hex').slice(0, 16);
}

/**
 * =========================================================================
 * 1. EMAIL THÔNG BÁO ĐĂNG NHẬP (Login Notification)
 * =========================================================================
 */
exports.buildLoginEmail = ({ name, email, time, ip, userAgent, clientUrl }) => {
  const safeName = escapeHtml(name || 'Quý khách');
  const safeTime = formatDateTimeVN(time || new Date());
  const safeIp = escapeHtml(ip || '127.0.0.1');
  const safeDevice = escapeHtml(parseUserAgent(userAgent));
  const baseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const supportEmail = process.env.MAIL_FROM_ADDRESS || 'cskh@cineticket.vn';

  const subject = `[Cine Star] Thông báo đăng nhập tài khoản - ${safeName}`;

  const text = `Xin chào ${safeName},

Tài khoản của bạn vừa có một lượt đăng nhập thành công vào hệ thống Đặt vé xem phim Cine Star:
- Thời gian: ${safeTime}
- Địa chỉ IP: ${safeIp}
- Thiết bị / Trình duyệt: ${safeDevice}
- Vị trí ước tính: Việt Nam

⚠️ CẢNH BÁO BẢO MẬT:
Nếu không phải bạn thực hiện đăng nhập này, rất có thể tài khoản của bạn đã bị lộ thông tin. Vui lòng đổi mật khẩu ngay lập tức hoặc bảo mật tài khoản Google của bạn, đồng thời liên hệ với chúng tôi qua email: ${supportEmail}.

Trang web Cine Star: ${baseUrl}
Trân trọng,
Đội ngũ Hỗ trợ Cine Star.`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo đăng nhập</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #111827; padding: 28px 24px; text-align: center; border-bottom: 3px solid #e50914;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">
                CINE <span style="color: #e50914;">STAR</span> CINEMA
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
                Cảnh báo an ninh tài khoản
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #111827; font-weight: 700;">
                Xin chào ${safeName},
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #4b5563;">
                Chúng tôi phát hiện tài khoản của bạn vừa có một lượt đăng nhập mới vào hệ thống website Cine Star. Dưới đây là thông tin chi tiết:
              </p>

              <!-- Info Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
                      <tr>
                        <td width="38%" style="font-size: 13px; color: #6b7280; font-weight: 600;">Thời gian:</td>
                        <td width="62%" style="font-size: 13px; color: #111827; font-weight: 600;">${safeTime}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; font-weight: 600;">Địa chỉ IP:</td>
                        <td style="font-size: 13px; color: #111827; font-family: monospace;">${safeIp}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; font-weight: 600;">Thiết bị & Trình duyệt:</td>
                        <td style="font-size: 13px; color: #111827;">${safeDevice}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #6b7280; font-weight: 600;">Vị trí ước tính:</td>
                        <td style="font-size: 13px; color: #111827;">Việt Nam (theo IP)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                      <strong>⚠️ Không phải bạn?</strong> Nếu bạn không thực hiện đăng nhập này, tài khoản của bạn có thể đang gặp rủi ro. Vui lòng đổi mật khẩu ngay lập tức, kiểm tra bảo mật tài khoản Google và liên hệ với chúng tôi qua <a href="mailto:${supportEmail}" style="color: #b45309; text-decoration: underline;">${supportEmail}</a>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <a href="${baseUrl}" target="_blank" style="display: inline-block; background-color: #e50914; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(229, 9, 20, 0.25);">
                      Truy cập Cine Star Cinema
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 6px;">Đây là email tự động từ hệ thống bảo mật Cine Star. Vui lòng không trả lời trực tiếp email này.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} Cine Star Cinema. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html, text };
};

/**
 * =========================================================================
 * 2. EMAIL XÁC NHẬN ĐẶT VÉ & THANH TOÁN THÀNH CÔNG (Booking Confirmation)
 * =========================================================================
 */
exports.buildBookingPaidEmail = async ({ booking, seats = [], combos = [], clientUrl }) => {
  const safeName = escapeHtml(booking.user_name || 'Quý khách');
  const safeCode = escapeHtml(booking.booking_code || `MM${booking.id}`);
  const safeMovie = escapeHtml(booking.movie_title || 'Vé xem phim');
  const safeAge = escapeHtml(booking.age_rating || 'P');
  const safeCinema = escapeHtml(booking.cinema_name || 'Cine Star Cinema');
  const safeAddress = escapeHtml(booking.cinema_address || 'TP. Hồ Chí Minh');
  const safeRoom = escapeHtml(booking.room_name || 'Phòng chiếu chuẩn');
  const safeTime = formatShortDateTimeVN(booking.start_time);
  const safeDuration = booking.duration_minutes ? `${booking.duration_minutes} phút` : '120 phút';
  const safeAmount = formatCurrencyVN(booking.total_amount);
  const safePaidTime = formatDateTimeVN(booking.created_at || new Date());
  const baseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
  const detailUrl = `${baseUrl}/profile`;

  // Danh sách ghế hiển thị
  const seatListStr = seats.length > 0 
    ? seats.map((s) => `${s.row_label}${s.seat_number}`).join(', ')
    : 'Chưa cập nhật';

  // Danh sách combo bắp nước
  let comboHtml = '';
  let comboText = '';
  if (combos && combos.length > 0) {
    comboHtml = `
      <tr style="border-top: 1px dashed #e5e7eb;">
        <td style="padding: 10px 0; font-size: 13px; color: #6b7280;">Bắp & Nước:</td>
        <td align="right" style="padding: 10px 0; font-size: 13px; color: #111827; font-weight: 600;">
          ${combos.map((c) => `${escapeHtml(c.name)} (x${c.quantity})`).join('<br>')}
        </td>
      </tr>
    `;
    comboText = `\n- Bắp nước: ` + combos.map((c) => `${c.name} x${c.quantity}`).join(', ');
  }

  // Tạo mã QR xác thực vé kèm chữ ký HMAC
  const hmacSig = signBookingCode(safeCode);
  const qrPayload = JSON.stringify({
    code: booking.booking_code,
    sig: hmacSig,
    id: booking.id,
    seats: seatListStr,
  });

  // Tạo buffer ảnh QR Code PNG
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    width: 260,
    margin: 1,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  });

  const attachments = [
    {
      filename: `ticket-qr-${safeCode}.png`,
      content: qrBuffer,
      cid: 'ticket-qr-cid', // Inline CID
    },
  ];

  const subject = `[Cine Star] Vé xem phim điện tử của bạn: ${safeMovie} (#${safeCode})`;

  const text = `Xin chào ${safeName},

Chúc mừng bạn đã thanh toán thành công đơn đặt vé tại Cine Star Cinema!
Dưới đây là thông tin chi tiết vé xem phim của bạn:

- Mã đơn hàng: ${safeCode}
- Tên phim: ${safeMovie} (${safeAge})
- Rạp chiếu: ${safeCinema}
- Địa chỉ: ${safeAddress}
- Phòng chiếu: ${safeRoom}
- Suất chiếu: ${safeTime} (${safeDuration})
- Ghế ngồi: ${seatListStr}${comboText}
- Tổng tiền thanh toán: ${safeAmount}
- Phương thức: Chuyển khoản SePay
- Thời gian thanh toán: ${safePaidTime}

⚠️ LƯU Ý KHI ĐẾN RẠP:
1. Vui lòng mở email này hoặc mang mã vé đến trước giờ chiếu ít nhất 15 phút để làm thủ tục quét mã vào phòng chiếu.
2. Vé đã thanh toán tuân thủ chính sách của rạp: chỉ hủy trước giờ chiếu ít nhất 2 tiếng theo quy định.
3. Không chia sẻ mã QR vé cho người khác để tránh bị quét trùng.

Xem chi tiết vé tại: ${detailUrl}

Cảm ơn bạn đã lựa chọn Cine Star. Chúc bạn có trải nghiệm xem phim thật tuyệt vời!
Đội ngũ Cine Star Cinema.`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vé xem phim điện tử</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #e50914 0%, #b81d24 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
              <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Thanh toán thành công
              </span>
              <h1 style="margin: 4px 0 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">
                VÉ XEM PHIM ĐIỆN TỬ
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">
                Mã đơn hàng: <strong style="font-family: monospace; letter-spacing: 1px;">#${safeCode}</strong>
              </p>
            </td>
          </tr>

          <!-- Ticket Summary Card -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
                Xin chào <strong>${safeName}</strong>, đơn vé xem phim của bạn đã được xác nhận thanh toán qua SePay thành công.
              </p>

              <!-- Movie Details Block -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-right: 6px;">
                        ${safeAge}
                      </span>
                      <strong style="font-size: 17px; color: #0f172a;">${safeMovie}</strong>
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="5" style="margin-top: 10px;">
                      <tr>
                        <td width="35%" style="font-size: 13px; color: #64748b;">Rạp chiếu:</td>
                        <td width="65%" style="font-size: 13px; color: #0f172a; font-weight: 600;">${safeCinema}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Địa chỉ:</td>
                        <td style="font-size: 13px; color: #334155;">${safeAddress}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Phòng chiếu:</td>
                        <td style="font-size: 13px; color: #0f172a; font-weight: 600;">${safeRoom}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Suất chiếu:</td>
                        <td style="font-size: 13px; color: #e50914; font-weight: 700;">${safeTime} (${safeDuration})</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Ghế ngồi:</td>
                        <td style="font-size: 14px; color: #0f172a; font-weight: 700; letter-spacing: 0.5px;">${seatListStr}</td>
                      </tr>
                      ${comboHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- QR Code Soát Vé -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center; margin: 20px 0; background-color: #f1f5f9; border-radius: 12px; padding: 20px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                      MÃ QR SOÁT VÉ VÀO PHÒNG CHIẾU
                    </p>
                    <div style="display: inline-block; background-color: #ffffff; padding: 12px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #cbd5e1;">
                      <img src="cid:ticket-qr-cid" alt="QR Code Vé" width="180" height="180" style="display: block; border: 0;" />
                    </div>
                    <p style="margin: 10px 0 0; font-size: 12px; color: #64748b; font-family: monospace;">
                      Mã vé: <strong>${safeCode}</strong> (Chữ ký HMAC bảo mật)
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Payment Summary -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="4">
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Phương thức thanh toán:</td>
                        <td align="right" style="font-size: 13px; color: #0f172a; font-weight: 600;">Chuyển khoản SePay (MBBank)</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Thời gian thanh toán:</td>
                        <td align="right" style="font-size: 13px; color: #0f172a;">${safePaidTime}</td>
                      </tr>
                      <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="font-size: 14px; font-weight: 700; color: #0f172a; padding-top: 8px;">Tổng thanh toán:</td>
                        <td align="right" style="font-size: 18px; font-weight: 800; color: #e50914; padding-top: 8px;">${safeAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Instructions / Notes -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #1e40af;">
                      📌 Lưu ý quan trọng cho khách hàng:
                    </p>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #1e3a8a; line-height: 1.6;">
                      <li>Vui lòng có mặt tại rạp trước giờ chiếu ít nhất <strong>15 phút</strong> để làm thủ tục soát vé và nhận combo.</li>
                      <li>Theo quy định rạp, vé đã thanh toán chỉ được hỗ trợ hủy/đổi trước giờ chiếu tối thiểu <strong>2 tiếng</strong>.</li>
                      <li>Tuyệt đối không gửi ảnh mã QR vé cho người khác để tránh rủi ro vé bị sử dụng trước.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${detailUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 30px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                      Xem vé của tôi
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 4px;">Cần hỗ trợ gấp? Gọi ngay hotline: <strong>1900 8888</strong> hoặc email <strong>cskh@cineticket.vn</strong></p>
              <p style="margin: 0;">© ${new Date().getFullYear()} Cine Star Cinema Vietnam. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html, text, attachments };
};
