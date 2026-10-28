# API Phim - Thể loại - Rạp - Suất chiếu (Giai đoạn 3)

Base URL: `http://localhost:5000/api`. Định dạng response giống tài liệu Auth.
Route admin cần header `Authorization: Bearer <token của tài khoản admin>`.
Thời gian dạng DATETIME (start_time, end_time) trả về chuẩn ISO (UTC), ví dụ `2026-10-17T12:30:00.000Z` = 19:30 giờ Việt Nam. Frontend dùng `new Date(...)` để hiển thị. Ngày (release_date) trả về `YYYY-MM-DD`.

---
## A. Công khai (không cần đăng nhập)

### GET /movies
| Query | Ý nghĩa |
|---|---|
| `status` | `now_showing` / `coming_soon` / `ended` |
| `genre` | id hoặc slug thể loại (vd `2` hoặc `kinh-di`) |
| `search` | tìm theo tên phim |
| `sort` | `release_date` (mặc định) / `title` / `rating` |
| `order` | `desc` (mặc định) / `asc` |
| `page`, `limit` | phân trang (mặc định 1 và 12, tối đa 50) |

200:
```json
{ "success": true, "message": "Lấy danh sách phim thành công",
  "data": { "items": [ { "id": 1, "title": "Bóng Đêm Cuối Cùng", "slug": "bong-dem-cuoi-cung", "duration_minutes": 105,
                         "release_date": "2026-10-02", "age_rating": "T18", "poster_url": "https://...", "status": "now_showing",
                         "rating_avg": "4.50", "genres": [ { "id": 2, "name": "Kinh dị", "slug": "kinh-di" } ] } ],
            "pagination": { "page": 1, "limit": 12, "total": 6, "totalPages": 1 } } }
```
Lỗi: `422` query sai (vd `status=abc`).

### GET /movies/:id
200: `data: { movie: { ...đầy đủ cột, genres: [...] } }` · Lỗi: `404` không có phim · `422` id sai

### GET /genres
200: `data: { genres: [ { id, name, slug, movie_count } ] }`

### GET /cinemas?city=Hà Nội
200: `data: { cinemas: [ { id, name, address, city, phone, image_url, room_count } ] }` (chỉ rạp đang hoạt động)

### GET /cinemas/:id
200: `data: { cinema: { ...,  rooms: [ { id, name, room_type, total_seats } ] } }` · Lỗi: `404`

### GET /showtimes?movie_id=1&cinema_id=1&date=2026-10-17
Chỉ trả suất chưa chiếu, đang hoạt động, **nhóm theo rạp**. Nên truyền `date` (nếu bỏ, trả tất cả suất sắp tới).
200:
```json
{ "success": true, "message": "Lấy danh sách suất chiếu thành công",
  "data": { "cinemas": [ { "cinema": { "id": 1, "name": "Cinema Sài Gòn Center", "address": "...", "city": "..." },
                           "showtimes": [ { "id": 1, "movie_id": 1, "movie_title": "Bóng Đêm Cuối Cùng",
                                            "start_time": "2026-10-17T12:30:00.000Z", "end_time": "2026-10-17T14:30:00.000Z",
                                            "base_price": 90000, "room_id": 1, "room_name": "Phòng 1", "room_type": "2D",
                                            "total_seats": 75, "available_seats": 75 } ] } ] } }
```
Lỗi: `422` (date sai dạng, id sai).

### GET /showtimes/:id
200: `data: { showtime: { id, movie_title, poster_url, cinema_name, room_name, start_time, end_time, base_price, total_seats, available_seats, ... } }` · Lỗi: `404`

---
## B. Admin (`/api/admin/...`): lỗi chung: `401` chưa đăng nhập · `403` không phải admin

### Phim
| Method | URL | Ghi chú |
|---|---|---|
| POST | /admin/movies | Thêm phim. Body JSON **hoặc** multipart/form-data (có ảnh) |
| PUT | /admin/movies/:id | Sửa (gửi field nào sửa field đó). Upload ảnh mới sẽ xóa ảnh cũ |
| DELETE | /admin/movies/:id | `409` nếu phim đã có vé đặt. Nên đổi `status` = `ended` |

Field: `title`*, `duration_minutes`* (1-600), `release_date`* (`YYYY-MM-DD`), `description`, `director`, `cast_members`, `language`,
`age_rating` (P/K/T13/T16/T18), `status` (coming_soon/now_showing/ended), `trailer_url`, `genre_ids` (`[1,2]` hoặc `1,2`),
ảnh: file `poster`, `banner` (JPG/PNG/WEBP, tối đa 5MB) hoặc link `poster_url`, `banner_url`. (* = bắt buộc khi thêm)

Ảnh upload được lưu tại `backend/uploads/posters/` và truy cập qua `http://localhost:5000/uploads/posters/<tên file>`.
201: `data: { movie: {...} }` · Lỗi: `422`, `400` (thể loại không tồn tại, file không phải ảnh, ảnh quá lớn), `404`

### Thể loại
POST /admin/genres · PUT /admin/genres/:id · DELETE /admin/genres/:id
Body: `{ "name": "Phiêu lưu" }` (slug tự sinh). Lỗi: `409` tên trùng · `404` · `422`

### Rạp
GET /admin/cinemas (cả rạp đã ẩn) · POST /admin/cinemas · PUT /admin/cinemas/:id · DELETE /admin/cinemas/:id
Body: `{ "name", "address", "city", "phone", "image_url", "is_active" }`. Xóa rạp đã có vé đặt trả `409`: hãy đặt `is_active: false`.

### Phòng chiếu (tự sinh sơ đồ ghế)
| Method | URL |
|---|---|
| GET | /admin/rooms?cinema_id=1 |
| GET | /admin/rooms/:id/seats |
| POST | /admin/rooms |
| PUT | /admin/rooms/:id (chỉ đổi `name`, `room_type`, `is_active`) |
| DELETE | /admin/rooms/:id |

POST body:
```json
{ "cinema_id": 1, "name": "Phòng 3", "room_type": "2D", "rows": 8, "cols": 10,
  "vip_rows": ["D","E","F","G"], "couple_rows": ["H"], "vip_surcharge": 20000, "couple_surcharge": 40000 }
```
Hàng ghế đôi có `cols/2` ghế. Hàng không nằm trong `vip_rows`/`couple_rows` là ghế thường. Lỗi: `409` trùng tên phòng trong rạp · `404` rạp không tồn tại · `400` hàng ngoài sơ đồ / hàng vừa VIP vừa đôi.

### Suất chiếu
| Method | URL |
|---|---|
| GET | /admin/showtimes?movie_id=&cinema_id=&date=&page=&limit= (gồm cả suất đã qua/đã ẩn) |
| POST | /admin/showtimes |
| PUT | /admin/showtimes/:id |
| DELETE | /admin/showtimes/:id |

POST body: `{ "movie_id": 1, "room_id": 1, "start_time": "2026-10-20 19:30", "base_price": 90000 }`
`end_time` tự tính = giờ bắt đầu + thời lượng phim + 15 phút dọn phòng.
Lỗi: `409` **trùng giờ với suất khác trong cùng phòng** (thông báo nêu tên phim bị trùng) · `400` giờ ở quá khứ / phim đã ngừng chiếu / phòng ngưng hoạt động · `404` phim/phòng không tồn tại · `422` sai định dạng giờ.
PUT: nếu suất **đã có người đặt ghế** thì không cho đổi phim/phòng/giờ (`409`), chỉ đổi được `base_price`, `is_active`.

---
## C. Đánh giá phim (Giai đoạn 6)

Mỗi người dùng chỉ có **1 đánh giá cho mỗi phim**. Gửi lại sẽ ghi đè đánh giá cũ. Điểm trung bình và số lượt (`rating_avg`, `rating_count` trong bảng movies) được cập nhật tự động.

| Method | URL | Quyền |
|---|---|---|
| GET | /movies/:id/reviews?page=&limit= | công khai |
| GET | /movies/:id/reviews/mine | đăng nhập |
| POST | /movies/:id/reviews | đăng nhập |
| DELETE | /movies/:id/reviews/mine | đăng nhập |

GET /movies/:id/reviews → 200:
```json
{ "data": { "items": [ { "id": 1, "rating": 5, "comment": "Phim rất hay!", "created_at": "...", "user_id": 2, "full_name": "Nguyễn Văn An" } ],
            "pagination": { "page": 1, "limit": 5, "total": 2, "totalPages": 1 },
            "summary": { "average": 4.5, "count": 2 } } }
```
GET .../reviews/mine → `data: { review: {...} }` hoặc `{ review: null }` nếu chưa đánh giá.
POST body: `{ "rating": 5, "comment": "Phim rất hay!" }` (`comment` không bắt buộc, tối đa 1000 ký tự). 201 nếu là đánh giá mới, 200 nếu sửa đánh giá cũ.
Lỗi: `401` chưa đăng nhập · `404` không có phim (DELETE: chưa đánh giá phim đó) · `422` điểm không nằm trong 1 đến 5.
