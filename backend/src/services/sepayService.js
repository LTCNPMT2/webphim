const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/transaction');
const bookingModel = require('../models/bookingModel');
const paymentModel = require('../models/paymentModel');
const bookingService = require('./bookingService');
const emailService = require('./email/emailService');

const getSepayConfig = () => ({
  token: process.env.SEPAY_API_TOKEN || 'ZOAOPLNCFFBBD72MACEDQPKNYVEHC5HQXSM2UYFG4GO5IRWGJXTN8KVJTXDAS7KL',
  bankBrand: process.env.SEPAY_BANK_BRAND || 'MBBank',
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '0931883988',
  accountName: process.env.SEPAY_ACCOUNT_NAME || 'NGUYEN TRONG BANG',
});

// Chuẩn hóa chuỗi: loại bỏ toàn bộ khoảng trắng, dấu gạch nối, ký tự đặc biệt
const normalizeText = (text) => String(text || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

// 1. Tạo thông tin thanh toán & link QR VietQR cho đơn đặt vé
exports.getPaymentInfo = async (user, bookingId) => {
  const booking = await bookingService.getDetail(user, bookingId);
  if (!booking) throw new ApiError(404, 'Không tìm thấy đơn đặt vé');

  const { bankBrand, accountNumber, accountName } = getSepayConfig();
  const cleanCode = normalizeText(booking.booking_code);
  const transferContent = `CINE ${cleanCode}`;
  
  // Link tạo mã QR động chính thức từ SePay (chuẩn VietQR MBBank)
  const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNumber)}&bank=${encodeURIComponent(bankBrand)}&amount=${booking.total_amount}&des=${encodeURIComponent(transferContent)}`;

  return {
    booking_id: booking.id,
    booking_code: booking.booking_code,
    bank_brand: bankBrand,
    account_number: accountNumber,
    account_name: accountName,
    amount: booking.total_amount,
    transfer_content: transferContent,
    qr_url: qrUrl,
    status: booking.status,
    seconds_left: booking.seconds_left,
  };
};

// Tra cứu danh sách giao dịch gần nhất từ SePay REST API
async function fetchRecentTransactions() {
  const { token } = getSepayConfig();
  const list = [];

  // 1. Thử my.sepay.vn
  try {
    const res = await fetch('https://my.sepay.vn/userapi/transactions/list', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.transactions)) {
        list.push(...data.transactions);
      }
    }
  } catch (err) {
    console.warn('[SePay] my.sepay.vn fetch error:', err.message);
  }

  // 2. Thử v2 userapi.sepay.vn nếu chưa có
  if (list.length === 0) {
    try {
      const res = await fetch('https://userapi.sepay.vn/v2/transactions?per_page=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          list.push(...data.data);
        }
      }
    } catch (err) {
      console.warn('[SePay] userapi.sepay.vn fetch error:', err.message);
    }
  }

  return list;
}

// 2. Kiểm tra trạng thái thanh toán từ SePay API (Client Polling hoặc Bấm nút kiểm tra)
exports.checkPayment = async (user, bookingId, bookingCode) => {
  let targetBooking = null;

  // 1. Tìm đơn theo ID từ DB
  if (bookingId && !isNaN(Number(bookingId))) {
    try {
      targetBooking = await bookingModel.findById(Number(bookingId));
    } catch {}
  }

  // 2. Tìm đơn theo mã code từ DB (nếu chưa tìm theo ID)
  const targetCode = bookingCode || targetBooking?.booking_code || (bookingId ? String(bookingId) : '');
  if (!targetBooking && targetCode) {
    try {
      targetBooking = await bookingModel.findByCode(targetCode);
    } catch {}
  }

  // Nếu đơn trong DB đã được đánh dấu paid
  if (targetBooking && targetBooking.status === 'paid') {
    return { paid: true, booking: targetBooking, message: 'Đơn hàng đã được thanh toán' };
  }

  if (!targetCode) {
    return { paid: false, status: 'pending', message: 'Thiếu thông tin mã đơn để đối soát' };
  }

  const normTarget = normalizeText(targetCode);
  const coreDigits = normTarget.replace(/^(MM|MV|CINE)/i, '');

  // Gọi SePay REST API để tra cứu giao dịch vừa nhận
  try {
    const transactions = await fetchRecentTransactions();

    // Tìm giao dịch khớp với mã đơn (loại bỏ toàn bộ ký tự phân cách)
    const matchedTx = transactions.find((tx) => {
      const content = normalizeText(tx.transaction_content || tx.description || '');
      const amount = Number(tx.amount_in || tx.transferAmount || 0);
      if (amount <= 0) return false;

      // 1. Khớp nguyên mã chuẩn hóa (ví dụ: "CINEMM890573" chứa "MM890573")
      if (normTarget && content.includes(normTarget)) return true;

      // 2. Khớp chuỗi số/chữ cốt lõi nếu dài từ 5 ký tự trở lên (ví dụ: "890573")
      if (coreDigits.length >= 5 && content.includes(coreDigits)) return true;

      return false;
    });

    if (matchedTx) {
      // Tìm thấy giao dịch hợp lệ từ SePay!
      const txCode = matchedTx.reference_number || matchedTx.id || `SEPAY-${Date.now()}`;
      const paidAmount = Number(matchedTx.amount_in || matchedTx.transferAmount || 0);

      // Cập nhật trạng thái đơn sang 'paid' trong MySQL
      if (targetBooking?.id) {
        let justPaid = false;
        await withTransaction(async (conn) => {
          const booking = await bookingModel.lockBooking(conn, targetBooking.id);
          if (!booking || booking.status === 'paid') return;

          await paymentModel.create(conn, {
            booking_id: targetBooking.id,
            method: 'sepay',
            amount: paidAmount,
            status: 'success',
            transaction_code: txCode,
          });
          await bookingModel.markPaid(conn, targetBooking.id);
          justPaid = true;
        });

        // Gửi email xác nhận đặt vé thành công (Bất đồng bộ, Idempotent)
        if (justPaid) {
          emailService.sendBookingPaidConfirmation(targetBooking.id).catch((err) => {
            console.error('[SePay CheckPayment] Lỗi gửi email xác nhận đặt vé:', err.message);
          });
        }

        return {
          paid: true,
          transaction: {
            id: matchedTx.id,
            reference_number: txCode,
            amount: paidAmount,
            date: matchedTx.transaction_date,
            content: matchedTx.transaction_content,
          },
          booking: { ...targetBooking, status: 'paid' },
          message: 'Thanh toán SePay thành công!',
        };
      }

      // Trường hợp đơn demo / offline chưa lưu DB
      return {
        paid: true,
        transaction: {
          id: matchedTx.id,
          reference_number: txCode,
          amount: paidAmount,
          date: matchedTx.transaction_date,
          content: matchedTx.transaction_content,
        },
        booking: {
          id: bookingId || Date.now(),
          booking_code: targetCode,
          status: 'paid',
          total_amount: paidAmount,
        },
        message: 'Thanh toán SePay thành công!',
      };
    }
  } catch (err) {
    console.error('Lỗi khi tra cứu SePay transactions:', err.message);
  }

  return { paid: false, status: targetBooking?.status || 'pending', message: 'Chưa tìm thấy giao dịch chuyển khoản' };
};

// 3. Xử lý SePay Webhook (nhận thông báo tức thì khi khách chuyển tiền)
exports.handleWebhook = async (body) => {
  const content = normalizeText(body.content || body.transaction_content || '');
  const transferType = String(body.transferType || body.transfer_type || '').toLowerCase();
  const amount = Number(body.transferAmount || body.amount_in || 0);
  const txCode = body.referenceCode || body.reference_number || String(body.id || '');

  if (transferType !== 'in' && transferType !== '') {
    return { success: true, message: 'Bỏ qua giao dịch không phải tiền vào' };
  }

  // Nhận diện mã vé (dạng MM... hoặc MV...)
  const match = content.match(/(?:MM|MV)[A-Z0-9]{5,10}/i);
  let bookingCode = match ? match[0] : null;

  if (!bookingCode) {
    return { success: true, message: 'Nội dung không chứa mã vé hợp lệ' };
  }

  let updatedBookingId = null;

  try {
    await withTransaction(async (conn) => {
      let booking = await bookingModel.lockBookingByCode(conn, bookingCode);
      if (!booking) {
        // Thử tìm không phân biệt tiền tố
        const row = await bookingModel.findByCode(bookingCode);
        if (row) booking = await bookingModel.lockBooking(conn, row.id);
      }
      if (!booking) return;

      if (booking.status === 'paid') return;
      if (booking.status !== 'pending') return;

      await paymentModel.create(conn, {
        booking_id: booking.id,
        method: 'sepay',
        amount: amount,
        status: 'success',
        transaction_code: txCode,
      });
      await bookingModel.markPaid(conn, booking.id);
      updatedBookingId = booking.id;
    });

    // Gửi email xác nhận đặt vé và thanh toán thành công (Bất đồng bộ & Idempotent)
    if (updatedBookingId) {
      emailService.sendBookingPaidConfirmation(updatedBookingId).catch((err) => {
        console.error('[SePay Webhook] Lỗi gửi email xác nhận đặt vé:', err.message);
      });
    }
  } catch (err) {
    console.error('Lỗi cập nhật DB từ SePay Webhook:', err.message);
  }

  return { success: true };
};
