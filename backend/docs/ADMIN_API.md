# API Quản trị & Phân quyền nhân viên (RBAC)

Mọi route `/api/admin/...` cần header `Authorization: Bearer <token admin hoặc staff>`.
Lỗi chung: `401` chưa đăng nhập · `403` không có quyền thực hiện thao tác.

---

## 1. Phân quyền người dùng & nhân viên (RBAC)

| Method | URL | Quyền yêu cầu | Mô tả |
|---|---|---|---|
| GET | `/admin/permissions` | Đăng nhập quản trị | Lấy toàn bộ danh mục quyền hạn và preset vai trò |
| GET | `/admin/users?search=&role=&status=&page=&limit=` | `users:manage` | Danh sách người dùng, lọc theo role (`user`, `staff`, `admin`) |
| POST | `/admin/users/staff` | `users:manage` | Tạo tài khoản nhân viên mới và cấp quyền |
| PUT | `/admin/users/:id/role` | `users:manage` | Cập nhật vai trò, chức danh và phân quyền chi tiết |
| PUT | `/admin/users/:id/status` | `users:manage` | Khóa hoặc mở khóa tài khoản |

### POST /admin/users/staff
Body:
```json
{
  "full_name": "Nguyễn Văn Staff",
  "email": "staff1@cinebooking.vn",
  "password": "Staff@123456",
  "phone": "0912345678",
  "role": "staff",
  "staff_title": "Nhân viên Quầy vé & Soát vé",
  "permissions": ["bookings:manage", "tickets:checkin"]
}
```

### PUT /admin/users/:id/role
Body:
```json
{
  "role": "staff",
  "staff_title": "Trưởng ca Lịch chiếu",
  "permissions": ["movies:manage", "genres:manage", "showtimes:manage", "rooms:manage"]
}
```

---

## 2. Soát vé & Check-in tại quầy

| Method | URL | Quyền yêu cầu | Mô tả |
|---|---|---|---|
| GET | `/admin/bookings/verify/:code` | `tickets:checkin` hoặc `bookings:manage` | Tra cứu thông tin vé theo mã đặt vé |
| POST | `/admin/bookings/check-in` | `tickets:checkin` hoặc `bookings:manage` | Xác nhận khách vào phòng chiếu |

### POST /admin/bookings/check-in
Body:
```json
{
  "booking_code": "MV2A7X8K"
}
```
200 OK: Trả về thông tin vé kèm `checked_in_at` và `checked_in_by_name`.
Lỗi `400`: Vé chưa thanh toán hoặc vé đã được soát vào lúc trước đó.

---

## 3. Thống kê & Báo cáo

| Method | URL | Quyền yêu cầu |
|---|---|---|
| GET | `/admin/stats?days=30` | `dashboard:view` |

Doanh thu tính từ thanh toán thành công; vé bị hủy được hoàn tiền nên tự động không còn được tính.
Lỗi: `403` nhân viên không có quyền xem dashboard · `422` days không hợp lệ.

---

## 4. Đơn đặt vé

| Method | URL | Quyền yêu cầu |
|---|---|---|
| GET | `/admin/bookings?status=&date_from=&date_to=&search=&page=&limit=` | `bookings:manage` |
| PUT | `/admin/bookings/:id/cancel` | `bookings:manage` |

`date_from`, `date_to` dạng `YYYY-MM-DD`. `search` tìm theo mã vé, tên hoặc email khách.

---

## 5. Phim & Thể loại

| Method | URL | Quyền yêu cầu |
|---|---|---|
| POST/PUT/DELETE | `/admin/movies...` | `movies:manage` |
| POST/PUT/DELETE | `/admin/genres...` | `genres:manage` |

---

## 6. Cụm rạp & Phòng chiếu

| Method | URL | Quyền yêu cầu |
|---|---|---|
| GET/POST/PUT/DELETE | `/admin/cinemas...` | `cinemas:manage` |
| GET/POST/PUT/DELETE | `/admin/rooms...` | `rooms:manage` |

---

## 7. Suất chiếu

| Method | URL | Quyền yêu cầu |
|---|---|---|
| GET/POST/PUT/DELETE | `/admin/showtimes...` | `showtimes:manage` |

---

## 8. Combo bắp nước & Khuyến mãi

| Method | URL | Quyền yêu cầu |
|---|---|---|
| GET/POST/PUT/DELETE | `/admin/combos...` | `combos:manage` |
| GET/POST/PUT/DELETE | `/admin/promotions...` | `promotions:manage` |
