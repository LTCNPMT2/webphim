const $ = (id) => document.getElementById(id);
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

let receipt;
try {
  receipt = JSON.parse(sessionStorage.getItem("starflyLatestBooking") || "null");
} catch {
  receipt = null;
}

if (!receipt?.orderId) {
  $("missing").classList.remove("hidden");
} else {
  $("receipt").classList.remove("hidden");
  $("movieTitle").textContent = receipt.movie || "STARFLY";
  $("showDate").textContent = receipt.showDate || "—";
  $("showTime").textContent = receipt.showTime || "—";
  $("room").textContent = receipt.room || "—";
  $("seats").textContent = receipt.seats?.length ? receipt.seats.join(", ") : "—";
  $("customer").textContent = receipt.customer || "Khách STARFLY";
  $("orderId").textContent = `#${receipt.orderId}`;
  $("total").textContent = money(receipt.totalAmount);
  $("confirmationCode").textContent = receipt.paymentContent || `SF-${receipt.orderId}`;
  if (window.QRCode) {
    new QRCode($("ticketQr"), {
      text: String(receipt.paymentContent || `SF-${receipt.orderId}`),
      width: 156,
      height: 156,
      colorDark: "#101522",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  } else {
    $("ticketQr").textContent = "Mã QR chưa tải được. Bạn vẫn có thể đọc mã xác nhận ở phía trên.";
  }

  const transfer = receipt.paymentMethod === "sepay";
  $("codeLabel").textContent = transfer ? "MÃ CHUYỂN KHOẢN / MÃ ĐƯA NHÂN VIÊN" : "MÃ ĐƯA NHÂN VIÊN KHI THANH TOÁN TIỀN MẶT";
  if (!transfer) $("paymentStatus").textContent = "CHỜ THANH TOÁN TẠI QUẦY";
  $("codeHelp").textContent = transfer
    ? "Ghi đúng mã này khi chuyển khoản và đưa mã cho nhân viên để tra đơn."
    : "Bạn thanh toán tiền mặt tại quầy: mở mã QR này hoặc đọc mã xác nhận bên trên cho nhân viên để tra đơn và nhận vé.";

  const foods = receipt.foodItems || [];
  if (foods.length) {
    $("foodSection").classList.remove("hidden");
    $("foods").innerHTML = foods.map((food) =>
      `<div class="food-line"><span>${escapeHtml(food.name)} × ${Number(food.quantity || 1)}</span><strong>${money(Number(food.price || 0) * Number(food.quantity || 1))}</strong></div>`,
    ).join("");
  }

  if (transfer) {
    $("transferBox").classList.remove("hidden");
    if (receipt.qrUrl) $("qrImage").src = receipt.qrUrl;
    else $("qrImage").classList.add("hidden");
  }

  $("ticketCodes").innerHTML = (receipt.tickets || []).map((code) =>
    `<span class="ticket-code">${escapeHtml(code)}</span>`,
  ).join("");

  $("downloadButton").onclick = () => {
    const content = [
      "STARFLY CINEMA — VÉ ĐẶT ONLINE",
      `Phim: ${receipt.movie}`,
      `Suất chiếu: ${receipt.showDate} ${receipt.showTime} · ${receipt.room}`,
      `Ghế: ${(receipt.seats || []).join(", ") || "—"}`,
      `Mã xác nhận: ${receipt.paymentContent}`,
      `Mã vé: ${(receipt.tickets || []).join(", ")}`,
      `Thanh toán: ${transfer ? "Chuyển khoản SePay" : "Tiền mặt tại quầy"}`,
      `Tổng tiền: ${money(receipt.totalAmount)}`,
      `Khách hàng: ${receipt.customer}`,
    ].join("\r\n");
    const blob = new Blob(["\uFEFF", content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `STARFLY-ve-${receipt.orderId}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("pdfButton").onclick = () => window.print();

  let tries = 0;
  const poll = window.setInterval(async () => {
    tries += 1;
    try {
      const response = await fetch(`/api/orders/${receipt.orderId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.order?.status === "paid") {
          $("paymentStatus").textContent = "ĐÃ THANH TOÁN";
          $("paymentStatus").classList.add("paid");
          window.clearInterval(poll);
        }
      }
    } catch { /* Keep the saved ticket visible while the server reconnects. */ }
    if (tries >= 40) window.clearInterval(poll);
  }, 3000);
}
