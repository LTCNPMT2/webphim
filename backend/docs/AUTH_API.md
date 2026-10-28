# API Auth  (base URL: http://localhost:5000/api)

Mọi response đều có dạng:
- Thành công: `{ "success": true, "message": "...", "data": ... }`
- Lỗi: `{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }` (`errors` chỉ có khi lỗi 422)

Route cần đăng nhập gửi header: `Authorization: Bearer <token>`

## 1. POST /auth/register: Đăng ký
Body:
```json
{ "full_name": "Nguyễn Văn C", "email": "c@example.com", "password": "Abc12345", "phone": "0912345678" }
```
(`phone` không bắt buộc. Mật khẩu 8-72 ký tự, có chữ và số.)

201:
```json
{ "success": true, "message": "Đăng ký thành công",
  "data": { "user": { "id": 4, "full_name": "Nguyễn Văn C", "email": "c@example.com", "phone": "0912345678",
                      "avatar_url": null, "role": "user", "is_active": 1, "created_at": "2026-10-16T08:00:00.000Z" },
            "token": "eyJhbGciOi..." } }
```
Lỗi: `409` email đã tồn tại · `422` dữ liệu sai định dạng

## 2. POST /auth/login: Đăng nhập
Body: `{ "email": "an@example.com", "password": "password" }`

200: cùng dạng `data: { user, token }` như đăng ký.
Lỗi: `401` sai email hoặc mật khẩu · `403` tài khoản bị khóa · `422` thiếu/sai định dạng

## 3. GET /auth/me: Thông tin người dùng hiện tại (cần token)
200: `{ "success": true, "message": "Lấy thông tin thành công", "data": { "user": { ... } } }`
Lỗi: `401` chưa đăng nhập / token sai / token hết hạn · `403` tài khoản bị khóa

## 4. PUT /auth/profile: Cập nhật hồ sơ (cần token)
Body (gửi field nào cập nhật field đó): `{ "full_name": "Tên mới", "phone": "0987654321", "avatar_url": "/uploads/a.png" }`
(`phone: ""` để xóa số điện thoại.)

200: `data: { user }` đã cập nhật · Lỗi: `401` · `422`

## 5. PUT /auth/change-password: Đổi mật khẩu (cần token)
Body: `{ "current_password": "password", "new_password": "NewPass123" }`

200: `{ "success": true, "message": "Đổi mật khẩu thành công", "data": null }`
Lỗi: `400` mật khẩu hiện tại sai / mật khẩu mới trùng mật khẩu cũ · `401` · `422`

## Khác
- `GET /health`: kiểm tra server và kết nối DB (200 nếu ổn).
- Đường dẫn không tồn tại: `404`. Body JSON hỏng: `400`. Lỗi server: `500`.
