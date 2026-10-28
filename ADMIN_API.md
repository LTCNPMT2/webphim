# API Quản trị bổ sung (Giai đoạn 8)

Mọi route `/api/admin/...` cần header `Authorization: Bearer <token admin>`. Lỗi chung: `401` chưa đăng nhập · `403` không phải admin.
Các API CRUD phim, thể loại, rạp, phòng, suất chiếu đã có từ Giai đoạn 3 (xem `CATALOG_API.md`).

## GET /admin/stats?days=30  (days: 7, 30 hoặc 90; mặc định 30)
Doanh thu tính từ thanh toán thành công; vé bị hủy được hoàn tiền nên tự động không còn được tính.
```json
{ "data": {
  "days": 30,
  "summary": { "revenue_total": 5200000, "revenue_today": 450000, "revenue_month": 2100000, "paid_bookings": 36,
               "tickets_total": 90, "tickets_today": 5, "users_total": 3, "movies_showing": 6 },
  "revenue_by_day":   [ { "date": "2026-10-17", "revenue": 450000, "bookings": 3, "tickets": 5 } ],
  "revenue_by_month": [ { "month": "2026-10", "revenue": 2100000, "bookings": 14, "tickets": 33 } ],
  "top_movies": [ { "id": 1, "title": "...", "tickets": 20, "revenue": 1800000 } ],
  "occupancy": { "rate": 18.5, "sold": 90, "total": 486, "by_cinema": [ { "cinema_id": 1, "name": "...", "sold": 60, "total": 300, "rate": 20 } ] },
  "booking_status": { "pending": 0, "paid": 36, "cancelled": 6, "expired": 6 } } }
```
`revenue_by_day` đủ `days` phần tử và `revenue_by_month` đủ 12 phần tử (ngày/tháng không có doanh thu là 0). `top_movies` tối đa 5 phim, `revenue` là tiền vé (chưa gồm combo). `occupancy` tính trên các suất từ 30 ngày trước đến 7 ngày tới. Lỗi: `422` days không hợp lệ.

## Người dùng
| Method | URL |
|---|---|
| GET | /admin/users?search=&role=&status=&page=&limit= |
| PUT | /admin/users/:id/status |

`status`: `active` / `locked`. `search`: tìm theo tên, email, số điện thoại. 200: `data: { items: [ { id, full_name, email, phone, role, is_active, created_at, paid_bookings, total_spent } ], pagination }`.
PUT body: `{ "is_active": false }` (khóa) hoặc `true` (mở khóa). Người bị khóa không đăng nhập được và token cũ cũng bị chặn ngay.
Lỗi: `400` tự khóa chính mình · `404` không có người dùng · `422`.

## Đơn đặt vé
| Method | URL |
|---|---|
| GET | /admin/bookings?status=&date_from=&date_to=&search=&page=&limit= |
| PUT | /admin/bookings/:id/cancel |

`date_from`, `date_to` dạng `YYYY-MM-DD` (theo ngày tạo đơn, gồm cả hai đầu). `search` tìm theo mã vé, tên hoặc email khách.
200: `data: { items: [ { id, booking_code, status, total_amount, created_at, user_id, full_name, email, movie_title, cinema_name, room_name, start_time, seat_labels } ], pagination }`.
Xem chi tiết một đơn: dùng `GET /api/bookings/:id` (admin được xem mọi đơn).
Admin hủy: hủy được đơn của bất kỳ ai và **không bị giới hạn** "trước giờ chiếu N giờ"; ghế được nhả, đơn đã trả tiền được hoàn (giả lập). Lỗi: `404` · `409` đơn đã hủy hoặc đã hết hạn.

## Combo
GET /admin/combos (cả combo đã tắt) · POST /admin/combos · PUT /admin/combos/:id · DELETE /admin/combos/:id
Body: `{ "name", "description", "price", "image_url", "is_active" }` (`name`, `price` bắt buộc khi thêm; price từ 1.000 đến 10.000.000).
Xóa combo đã có trong đơn đặt vé trả `409`: hãy đặt `is_active: false`.

## Mã giảm giá
GET /admin/promotions · POST /admin/promotions · PUT /admin/promotions/:id · DELETE /admin/promotions/:id
POST body:
```json
{ "code": "SALE20", "description": "Giảm 20%", "discount_type": "percent", "discount_value": 20,
  "max_discount": 60000, "min_order": 100000, "start_date": "2026-10-01 00:00", "end_date": "2026-12-31 23:59",
  "usage_limit": 500, "is_active": true }
```
- `discount_type`: `percent` (giá trị 1 đến 100, có thể kèm `max_discount`) hoặc `fixed` (số tiền VND).
- `usage_limit` để trống = không giới hạn lượt dùng. `code` được tự viết hoa và **không đổi được** sau khi tạo (PUT bỏ qua `code`).
- Mỗi mã trả thêm `state`: `active` / `upcoming` (chưa tới ngày) / `expired` / `exhausted` (hết lượt) / `inactive` (đã tắt).
- PUT cần gửi đủ các field như POST (trừ `code`).
Lỗi: `409` mã đã tồn tại / xóa mã đã có người dùng (hãy tắt thay vì xóa) · `422` dữ liệu sai (vd ngày kết thúc không sau ngày bắt đầu, giảm quá 100%) · `404`.
