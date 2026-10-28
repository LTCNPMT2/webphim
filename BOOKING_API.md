# API Đặt vé (Giai đoạn 4)

Base URL `http://localhost:5000/api`. Mọi route `/bookings`, `/payments`, `/promotions` cần header `Authorization: Bearer <token>`.

## Luồng đặt vé
```
GET  /showtimes/:id/seats        xem sơ đồ ghế
POST /bookings                   chọn ghế (+combo, +mã giảm giá) -> đơn "pending", ghế bị GIỮ 10 phút
POST /payments                   thanh toán trong 10 phút -> đơn "paid"
        quá 10 phút không trả -> cron tự chuyển "expired" và NHẢ ghế
PUT  /bookings/:id/cancel        hủy (pending: hủy ngay; paid: trước giờ chiếu >= 2 giờ)
```
Trạng thái đơn: `pending` → `paid` | `cancelled` | `expired`.

## GET /showtimes/:id/seats  (công khai)
200:
```json
{ "data": { "showtime": { "id": 9, "movie_title": "...", "cinema_name": "...", "room_name": "...", "start_time": "...", "base_price": 90000 },
            "seats": [ { "id": 76, "row_label": "A", "seat_number": 1, "seat_type": "standard", "price": 90000, "status": "available" } ],
            "summary": { "total": 75, "available": 75, "holding": 0, "booked": 0 } } }
```
`status`: `available` (trống) · `holding` (đang được người khác giữ) · `booked` (đã bán). `price` = giá cuối cùng của ghế (giá suất + phụ thu loại ghế). Lỗi: `404`.

## POST /bookings  (giữ ghế)
Body:
```json
{ "showtime_id": 9, "seat_ids": [76, 77],
  "combos": [ { "combo_id": 1, "quantity": 2 } ],
  "promo_code": "WELCOME10" }
```
`combos`, `promo_code` không bắt buộc. 201: `data.booking` (xem cấu trúc ở GET /bookings/:id).
Tiền luôn do server tính theo giá trong DB, không dùng giá client gửi.

| Mã | Khi nào |
|---|---|
| 400 | ghế không thuộc phòng của suất · suất đã bắt đầu · mã giảm giá sai/hết hạn/chưa đủ giá trị tối thiểu · combo không tồn tại |
| 404 | suất chiếu không tồn tại |
| 409 | **ghế đã có người đặt hoặc đang giữ** (thông báo nêu tên ghế) |
| 422 | không chọn ghế · quá 8 ghế · sai kiểu dữ liệu |
| 429 | đang giữ ghế ở 3 đơn chưa thanh toán |

## GET /bookings?status=&page=&limit=  (lịch sử của tôi)
`status`: pending / paid / cancelled / expired. 200: `data: { items: [ { id, booking_code, status, total_amount, movie_title, cinema_name, start_time, seat_labels: "A1, A2", expires_at } ], pagination }`

## GET /bookings/:id  (chi tiết, chỉ chủ đơn hoặc admin)
```json
{ "data": { "booking": { "id": 1, "booking_code": "MV7K2PQ9XA", "qr_content": "MV7K2PQ9XA", "status": "pending",
  "expires_at": "...", "subtotal": 318000, "discount_amount": 31800, "total_amount": 286200, "promotion_code": "WELCOME10",
  "can_cancel": true,
  "showtime": { "id": 9, "start_time": "...", "end_time": "..." },
  "movie": { "id": 6, "title": "...", "poster_url": "...", "duration_minutes": 95, "age_rating": "T13" },
  "cinema": { "name": "...", "address": "..." }, "room": { "name": "...", "room_type": "IMAX" },
  "seats": [ { "label": "A1", "seat_type": "standard", "price": 90000 } ],
  "combos": [ { "combo_id": 1, "name": "Combo Solo", "quantity": 2, "unit_price": 69000 } ],
  "payments": [ { "id": 1, "method": "mock", "amount": 286200, "status": "success", "transaction_code": "MOCK-...", "paid_at": "..." } ] } } }
```
Frontend dùng `qr_content` để vẽ mã QR. Lỗi: `404` (không có đơn / không phải của bạn).

## PUT /bookings/:id/cancel
200: `data.booking` với `status: "cancelled"` (vé đã trả tiền: thanh toán chuyển `refunded`, ghế được nhả, lượt dùng mã giảm giá được trả lại).
Lỗi: `400` vé đã trả tiền nhưng còn dưới 2 giờ là chiếu · `404` · `409` đơn đã hủy / đã hết hạn.

## POST /payments  (thanh toán giả lập)
Body: `{ "booking_id": 1, "method": "mock" }`. Chỉ test: thêm `"simulate_fail": true` để giả lập thanh toán thất bại (tắt khi `NODE_ENV=production`).
200: `data.booking` với `status: "paid"`.
Lỗi: `402` thanh toán thất bại (đơn vẫn pending, thử lại được) · `404` · `409` đã trả/đã hủy · `410` **đã hết hạn giữ ghế** · `422` method không hỗ trợ.

## GET /combos  (công khai)
200: `data: { combos: [ { id, name, description, price, image_url } ] }`

## POST /promotions/validate
Body: `{ "code": "WELCOME10", "subtotal": 200000 }` → 200: `data: { code, description, discount_amount, total_after_discount }`. Lỗi `400` kèm lý do (không tồn tại, hết hạn, hết lượt, chưa đủ giá trị tối thiểu).

---
## Cách chống đặt trùng ghế (race condition)
1. `POST /bookings` chạy trong **một transaction** và đầu tiên khóa dòng suất chiếu bằng `SELECT ... FOR UPDATE`. Hai người đặt cùng suất phải xếp hàng, người đến sau sẽ thấy ghế đã bị giữ và nhận `409`.
2. Lớp bảo vệ thứ hai: ràng buộc `UNIQUE(showtime_id, seat_id, active)` của bảng `booking_seats`. Dù code có sót, DB vẫn từ chối ghế trùng.
3. Hết hạn giữ ghế: job `node-cron` chạy mỗi phút; ngoài ra mỗi lần đặt vé cũng tự nhả ghế hết hạn của suất đó nên khách khác đặt được ngay.

## Test thủ công: hết hạn giữ ghế
1. Đặt vé (đơn pending) bằng Postman, ghi lại `booking_code`.
2. Trong phpMyAdmin, tab SQL, chạy: `UPDATE bookings SET expires_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE booking_code = 'MV...';`
3. Gọi `POST /payments` cho đơn đó: nhận `410`. Xem lại `GET /showtimes/:id/seats`: ghế đã trống. (Hoặc đợi tối đa 1 phút để cron tự nhả: terminal hiện dòng "Đã nhả ghế của 1 đơn hết hạn".)
