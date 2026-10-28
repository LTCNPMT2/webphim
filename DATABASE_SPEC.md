# BẢNG ĐẶC TẢ CƠ SỞ DỮ LIỆU (DATABASE SPECIFICATION)
## Hệ Thống Website Bán Vé Xem Phim Trực Tuyến - CineBooking
**Hệ quản trị CSDL**: MySQL / MariaDB (utf8mb4_unicode_ci)  
**Database**: `movie_booking`  
**Tổng số bảng**: 16 bảng

---

## MỤC LỤC
1. [Bảng `users` (Tài khoản người dùng & Quản trị)](#1-bảng-users-tài-khoản-người-dùng--quản-trị)
2. [Bảng `cinemas` (Cụm rạp chiếu phim)](#2-bảng-cinemas-cụm-rạp-chiếu-phim)
3. [Bảng `rooms` (Phòng chiếu phim)](#3-bảng-rooms-phòng-chiếu-phim)
4. [Bảng `seats` (Sơ đồ ghế ngồi)](#4-bảng-seats-sơ-đồ-ghế-ngồi)
5. [Bảng `genres` (Thể loại phim)](#5-bảng-genres-thể-loại-phim)
6. [Bảng `movies` (Phim điện ảnh)](#6-bảng-movies-phim-điện-ảnh)
7. [Bảng `movie_genres` (Liên kết Phim - Thể loại)](#7-bảng-movie_genres-liên-kết-phim---thể-loại)
8. [Bảng `showtimes` (Lịch & Suất chiếu)](#8-bảng-showtimes-lịch--suất-chiếu)
9. [Bảng `combos` (Bắp rang & Nước giải khát)](#9-bảng-combos-bắp-rang--nước-giải-khát)
10. [Bảng `promotions` (Mã khuyến mãi / Giảm giá)](#10-bảng-promotions-mã-khuyến-mãi--giảm-giá)
11. [Bảng `bookings` (Đơn đặt vé xem phim)](#11-bảng-bookings-đơn-đặt-vé-xem-phim)
12. [Bảng `booking_seats` (Chi tiết ghế đặt trong đơn)](#12-bảng-booking_seats-chi-tiết-ghế-đặt-trong-đơn)
13. [Bảng `booking_combos` (Chi tiết combo bắp nước đặt kèm)](#13-bảng-booking_combos-chi-tiết-combo-bắp-nước-đặt-kèm)
14. [Bảng `payments` (Lịch sử thanh toán giao dịch)](#14-bảng-payments-lịch-sử-thanh-toán-giao-dịch)
15. [Bảng `reviews` (Đánh giá & Bình luận phim)](#15-bảng-reviews-đánh-giá--bình-luận-phim)
16. [Bảng `email_logs` (Nhật ký gửi email thông báo)](#16-bảng-email_logs-nhật-ký-gửi-email-thông-báo)

---

### 1. Bảng `users` (Tài khoản người dùng & Quản trị)
Lưu trữ thông tin tài khoản của khách hàng và quản trị viên hệ thống.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh người dùng duy nhất |
| 2 | `full_name` | VARCHAR(100) | NO | | | Họ và tên người dùng |
| 3 | `email` | VARCHAR(150) | NO | UK | | Địa chỉ Email đăng nhập (Duy nhất) |
| 4 | `password_hash`| VARCHAR(255) | NO | | | Mật khẩu đã băm (Bcrypt) |
| 5 | `phone` | VARCHAR(20) | YES | | NULL | Số điện thoại liên hệ |
| 6 | `avatar_url` | VARCHAR(255) | YES | | NULL | Đường dẫn ảnh đại diện |
| 7 | `role` | ENUM('user','admin') | NO | | 'user' | Vai trò tài khoản ('user': Khách hàng, 'admin': Quản trị) |
| 8 | `is_active` | TINYINT(1) | NO | | 1 | Trạng thái hoạt động (1: Hoạt động, 0: Khóa) |
| 9 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm đăng ký tài khoản |
| 10 | `updated_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm cập nhật thông tin gần nhất |

---

### 2. Bảng `cinemas` (Cụm rạp chiếu phim)
Lưu trữ thông tin các chi nhánh rạp thuộc hệ thống CineBooking.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh rạp chiếu |
| 2 | `name` | VARCHAR(150) | NO | | | Tên cụm rạp (VD: Cinema Sài Gòn Center) |
| 3 | `address` | VARCHAR(255) | NO | | | Địa chỉ chi tiết cụm rạp |
| 4 | `city` | VARCHAR(100) | NO | | | Tỉnh / Thành phố (TP. Hồ Chí Minh, Hà Nội,...) |
| 5 | `phone` | VARCHAR(20) | YES | | NULL | Số điện thoại liên hệ cụm rạp |
| 6 | `image_url` | VARCHAR(255) | YES | | NULL | Ảnh chụp mặt tiền / không gian rạp |
| 7 | `is_active` | TINYINT(1) | NO | | 1 | Trạng thái hoạt động (1: Đang mở cửa, 0: Tạm ngưng) |
| 8 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm tạo cụm rạp |

---

### 3. Bảng `rooms` (Phòng chiếu phim)
Lưu thông tin phòng chiếu thuộc từng cụm rạp cụ thể.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh phòng chiếu |
| 2 | `cinema_id` | INT UNSIGNED | NO | FK | | Thuộc rạp nào (`cinemas.id`, ON DELETE CASCADE) |
| 3 | `name` | VARCHAR(50) | NO | | | Tên phòng chiếu (Phòng 1, Phòng 2 (IMAX)...) |
| 4 | `room_type` | ENUM('2D','3D','IMAX') | NO | | '2D' | Định dạng công nghệ phòng chiếu |
| 5 | `total_seats`| SMALLINT UNSIGNED | NO | | 0 | Tổng số ghế có trong phòng chiếu |
| 6 | `is_active` | TINYINT(1) | NO | | 1 | Trạng thái phòng (1: Hoạt động, 0: Bảo trì) |
| * | *Ràng buộc* | UNIQUE (`cinema_id`, `name`) | | UK | | Trong 1 rạp không được đặt trùng tên phòng chiếu |

---

### 4. Bảng `seats` (Sơ đồ ghế ngồi)
Lưu vị trí tọa độ hàng/cột và loại ghế trong từng phòng chiếu.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh ghế ngồi |
| 2 | `room_id` | INT UNSIGNED | NO | FK | | Thuộc phòng chiếu nào (`rooms.id`, ON DELETE CASCADE) |
| 3 | `row_label` | CHAR(1) | NO | | | Ký tự hàng ghế (A, B, C, D, E, F...) |
| 4 | `seat_number`| TINYINT UNSIGNED | NO | | | Số thứ tự ghế trong hàng (1, 2, 3...) |
| 5 | `seat_type` | ENUM('standard','vip','couple') | NO | | 'standard' | Phân loại ghế ('standard': Ghế thường, 'vip': VIP, 'couple': Đôi) |
| 6 | `price_surcharge` | INT UNSIGNED | NO | | 0 | Phụ thu cộng thêm vào giá vé cơ bản (VNĐ) |
| * | *Ràng buộc* | UNIQUE (`room_id`, `row_label`, `seat_number`) | | UK | | Một phòng không được có 2 ghế cùng hàng và cùng số |

---

### 5. Bảng `genres` (Thể loại phim)
Danh mục các thể loại điện ảnh.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh thể loại |
| 2 | `name` | VARCHAR(50) | NO | UK | | Tên thể loại (Hành động, Hài hước, Kinh dị...) |
| 3 | `slug` | VARCHAR(50) | NO | UK | | Đường dẫn định danh URL thân thiện (hanh-dong, hai-huoc...) |
| 4 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm tạo thể loại |

---

### 6. Bảng `movies` (Phim điện ảnh)
Lưu trữ toàn bộ thông tin chi tiết của các tác phẩm điện ảnh.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh phim |
| 2 | `title` | VARCHAR(255) | NO | | | Tên tác phẩm điện ảnh |
| 3 | `tagline` | VARCHAR(255) | YES | | NULL | Câu khẩu hiệu / Slogan ấn tượng của phim |
| 4 | `slug` | VARCHAR(255) | NO | UK | | Đường dẫn định danh SEO (VD: `trai-buon-nguoi`) |
| 5 | `description` | TEXT | YES | | NULL | Mô tả tóm tắt nội dung cốt truyện |
| 6 | `duration_minutes` | SMALLINT UNSIGNED | NO | | | Thời lượng phim (phút) |
| 7 | `release_date` | DATE | NO | | | Ngày khởi chiếu chính thức |
| 8 | `director` | VARCHAR(150) | YES | | NULL | Đạo diễn tác phẩm |
| 9 | `cast_members`| TEXT | YES | | NULL | Danh sách diễn viên chính (dạng text ngắn) |
| 10 | `cast_data` | LONGTEXT (JSON) | YES | | NULL | Chi tiết diễn viên (Tên, vai diễn, ảnh avatar) |
| 11 | `language` | VARCHAR(50) | YES | | 'Tiếng Việt' | Ngôn ngữ / Phụ đề |
| 12 | `country` | VARCHAR(100) | YES | | 'Việt Nam' | Quốc gia sản xuất |
| 13 | `age_rating` | ENUM('P','K','T13','T16','T18','C') | NO | | 'P' | Phân loại độ tuổi khán giả theo quy định rạp |
| 14 | `poster_url` | VARCHAR(255) | YES | | NULL | Ảnh áp phích poster dọc của phim |
| 15 | `banner_url` | VARCHAR(255) | YES | | NULL | Ảnh bìa banner ngang khổ lớn |
| 16 | `gallery_images`| LONGTEXT (JSON) | YES | | NULL | Danh sách link hình ảnh cảnh phim (stills/gallery) |
| 17 | `custom_faqs` | LONGTEXT (JSON) | YES | | NULL | Bộ câu hỏi thường gặp về phim (FAQ) |
| 18 | `trailer_url` | VARCHAR(255) | YES | | NULL | Đường dẫn video trailer YouTube |
| 19 | `status` | ENUM('coming_soon','now_showing','ended') | NO | | 'coming_soon' | Trạng thái phát hành (Sắp chiếu, Đang chiếu, Ngừng chiếu) |
| 20 | `rating_avg` | DECIMAL(4,2) | NO | | 0.00 | Điểm đánh giá trung bình chuẩn thang điểm 10.0 |
| 21 | `rating_count` | INT UNSIGNED | NO | | 0 | Tổng số lượt đánh giá |
| 22 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Ngày đăng ký tác phẩm vào hệ thống |
| 23 | `updated_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Ngày cập nhật thông tin gần nhất |

---

### 7. Bảng `movie_genres` (Liên kết Phim - Thể loại)
Bảng trung gian thể hiện quan hệ Nhiều - Nhiều giữa Phim và Thể loại (Một phim có nhiều thể loại, một thể loại có nhiều phim).

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `movie_id` | INT UNSIGNED | NO | PK, FK | | Mã phim (`movies.id`, ON DELETE CASCADE) |
| 2 | `genre_id` | INT UNSIGNED | NO | PK, FK | | Mã thể loại (`genres.id`, ON DELETE CASCADE) |

---

### 8. Bảng `showtimes` (Lịch & Suất chiếu)
Lên lịch chiếu phim tại từng phòng chiếu vào các khung giờ xác định.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh suất chiếu |
| 2 | `movie_id` | INT UNSIGNED | NO | FK | | Phim được chiếu (`movies.id`, ON DELETE CASCADE) |
| 3 | `room_id` | INT UNSIGNED | NO | FK | | Phòng chiếu (`rooms.id`, ON DELETE CASCADE) |
| 4 | `start_time` | DATETIME | NO | | | Thời gian bắt đầu chiếu (Năm-Tháng-Ngày Giờ:Phút) |
| 5 | `end_time` | DATETIME | NO | | | Thời gian kết thúc suất chiếu |
| 6 | `base_price` | INT UNSIGNED | NO | | | Giá vé cơ bản áp dụng cho suất này (VNĐ) |
| 7 | `is_active` | TINYINT(1) | NO | | 1 | Trạng thái mở bán (1: Mở bán, 0: Đóng) |
| 8 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm lên lịch suất chiếu |

---

### 9. Bảng `combos` (Bắp rang & Nước giải khát)
Danh mục combo thức ăn, nước uống bán kèm vé xem phim.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh combo |
| 2 | `name` | VARCHAR(100) | NO | | | Tên gói combo (VD: Combo Đôi Bắp Phô Mai & Nước) |
| 3 | `description` | VARCHAR(255) | YES | | NULL | Chi tiết thành phần gói bắp nước |
| 4 | `price` | INT UNSIGNED | NO | | | Đơn giá bán (VNĐ) |
| 5 | `image_url` | VARCHAR(255) | YES | | NULL | Hình ảnh minh họa gói combo |
| 6 | `is_active` | TINYINT(1) | NO | | 1 | Trạng thái kinh doanh (1: Đang bán, 0: Tạm ngưng) |
| 7 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm tạo combo |

---

### 10. Bảng `promotions` (Mã khuyến mãi / Giảm giá)
Chính sách chiết khấu, voucher giảm giá cho đơn đặt vé.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh voucher |
| 2 | `code` | VARCHAR(30) | NO | UK | | Mã code nhập khi thanh toán (VD: `CINEWELCOME10`) |
| 3 | `description` | VARCHAR(255) | YES | | NULL | Nội dung chi tiết chương trình khuyến mãi |
| 4 | `discount_type`| ENUM('percent','fixed') | NO | | 'percent' | Loại giảm giá: theo % hoặc trừ số tiền cố định |
| 5 | `discount_value`| INT UNSIGNED | NO | | | Giá trị giảm (% từ 1-100 hoặc số tiền VNĐ) |
| 6 | `min_order_amount`| INT UNSIGNED | NO | | 0 | Giá trị đơn hàng tối thiểu để được áp dụng mã |
| 7 | `max_discount` | INT UNSIGNED | YES | | NULL | Mức giảm tối đa nếu dùng loại percent (VNĐ) |
| 8 | `starts_at` | DATETIME | NO | | | Thời điểm bắt đầu có hiệu lực |
| 9 | `expires_at` | DATETIME | NO | | | Thời điểm hết hạn sử dụng |
| 10 | `usage_limit` | INT UNSIGNED | YES | | NULL | Giới hạn tổng số lượt sử dụng toàn hệ thống |
| 11 | `used_count` | INT UNSIGNED | NO | | 0 | Số lượt mã đã được áp dụng thành công |
| 12 | `is_active` | TINYINT(1) | NO | | 1 | Trạng thái mã (1: Có hiệu lực, 0: Tạm ngưng) |
| 13 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Ngày tạo mã khuyến mãi |

---

### 11. Bảng `bookings` (Đơn đặt vé xem phim)
Lưu thông tin đơn đặt vé của khách hàng.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh đơn hàng (Nội bộ) |
| 2 | `booking_code`| VARCHAR(20) | NO | UK | | Mã đơn hiển thị cho khách (VD: `BK20261028-1234`) |
| 3 | `user_id` | INT UNSIGNED | NO | FK | | Khách hàng đặt vé (`users.id`) |
| 4 | `showtime_id` | INT UNSIGNED | NO | FK | | Suất chiếu đã chọn (`showtimes.id`) |
| 5 | `promotion_id`| INT UNSIGNED | YES | FK | NULL | Mã voucher áp dụng (`promotions.id`) |
| 6 | `subtotal` | INT UNSIGNED | NO | | 0 | Tiền tạm tính (Ghế + Combo) trước giảm |
| 7 | `discount_amount`| INT UNSIGNED | NO | | 0 | Số tiền được giảm giá theo voucher |
| 8 | `total_amount`| INT UNSIGNED | NO | | 0 | Tổng tiền cuối cùng khách phải thanh toán (VNĐ) |
| 9 | `status` | ENUM('pending','paid','cancelled','expired') | NO | | 'pending' | Trạng thái: Chờ thanh toán / Đã thanh toán / Đã hủy / Hết hạn |
| 10 | `expires_at` | DATETIME | YES | | NULL | Thời điểm hết hạn giữ ghế (Mặc định 10 phút) |
| 11 | `cancelled_at`| DATETIME | YES | | NULL | Thời điểm đơn bị hủy (nếu có) |
| 12 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm khách bấm đặt giữ chỗ |
| 13 | `updated_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm đơn hàng thay đổi trạng thái |

---

### 12. Bảng `booking_seats` (Chi tiết ghế đặt trong đơn)
Lưu từng ghế cụ thể trong đơn hàng. Tích hợp cơ chế **khóa giữ ghế chống đặt trùng ghế đồng thời** (Concurrency Safety).

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh chi tiết vé ghế |
| 2 | `booking_id` | INT UNSIGNED | NO | FK | | Thuộc đơn đặt vé nào (`bookings.id`, ON DELETE CASCADE) |
| 3 | `showtime_id` | INT UNSIGNED | NO | FK | | Suất chiếu (`showtimes.id`) |
| 4 | `seat_id` | INT UNSIGNED | NO | FK | | Ghế được chọn (`seats.id`) |
| 5 | `price` | INT UNSIGNED | NO | | | Giá bán thực tế của ghế (Base price + Surcharge) |
| 6 | `active` | TINYINT(1) | YES | | 1 | Trạng thái giữ chỗ (1: Đang giữ/Đã mua, NULL: Đã hủy nhả ghế) |
| * | *Ràng buộc* | UNIQUE (`showtime_id`, `seat_id`, `active`) | | UK | | **Chống đặt trùng ghế**: Trong cùng 1 suất chiếu, một ghế chỉ có duy nhất 1 bản ghi `active=1` |

---

### 13. Bảng `booking_combos` (Chi tiết combo bắp nước đặt kèm)
Lưu trữ danh sách combo bắp nước khách chọn mua kèm vé.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã định danh chi tiết combo |
| 2 | `booking_id` | INT UNSIGNED | NO | FK | | Thuộc đơn đặt vé nào (`bookings.id`, ON DELETE CASCADE) |
| 3 | `combo_id` | INT UNSIGNED | NO | FK | | Gói bắp nước đã chọn (`combos.id`) |
| 4 | `quantity` | TINYINT UNSIGNED | NO | | 1 | Số lượng suất combo |
| 5 | `unit_price` | INT UNSIGNED | NO | | | Đơn giá tại thời điểm đặt (VNĐ) |
| * | *Ràng buộc* | UNIQUE (`booking_id`, `combo_id`) | | UK | | Trong 1 đơn không lặp lại cùng một loại combo |

---

### 14. Bảng `payments` (Lịch sử thanh toán giao dịch)
Lưu trữ lịch sử xử lý giao dịch tài chính (thanh toán chuyển khoản SePay VietQR).

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã giao dịch nội bộ |
| 2 | `booking_id` | INT UNSIGNED | NO | FK | | Thanh toán cho đơn nào (`bookings.id`, ON DELETE CASCADE) |
| 3 | `provider` | VARCHAR(50) | NO | | 'sepay' | Cổng thanh toán (`sepay`, `mock`...) |
| 4 | `amount` | INT UNSIGNED | NO | | | Số tiền thanh toán thực nhận (VNĐ) |
| 5 | `status` | ENUM('pending','success','failed') | NO | | 'pending' | Trạng thái: Chờ xử lý / Thành công / Thất bại |
| 6 | `transaction_id`| VARCHAR(100) | YES | | NULL | Mã giao dịch ngân hàng / SePay đối soát |
| 7 | `paid_at` | DATETIME | YES | | NULL | Thời điểm ngân hàng ghi nhận nhận tiền thành công |
| 8 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời điểm khởi tạo giao dịch |

---

### 15. Bảng `reviews` (Đánh giá & Bình luận phim)
Lưu nhận xét, chấm điểm sao của khách hàng dành cho tác phẩm điện ảnh.

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã đánh giá |
| 2 | `user_id` | INT UNSIGNED | NO | FK | | Khách hàng đánh giá (`users.id`, ON DELETE CASCADE) |
| 3 | `movie_id` | INT UNSIGNED | NO | FK | | Phim được đánh giá (`movies.id`, ON DELETE CASCADE) |
| 4 | `rating` | TINYINT UNSIGNED | NO | | | Điểm đánh giá (1 đến 5 sao, quy đổi thang 10) |
| 5 | `comment` | TEXT | YES | | NULL | Lời nhận xét, cảm nhận của người xem |
| 6 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời gian viết bình luận |
| * | *Ràng buộc* | UNIQUE (`user_id`, `movie_id`) | | UK | | Mỗi tài khoản chỉ đánh giá 1 lần cho mỗi phim |

---

### 16. Bảng `email_logs` (Nhật ký gửi email thông báo)
Theo dõi tiến trình gửi email tự động (Nodemailer Gmail SMTP) đảm bảo Idempotent (không gửi trùng lặp).

| STT | Tên thuộc tính | Kiểu dữ liệu | Null | Khóa | Mặc định | Diễn giải / Ý nghĩa |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `id` | INT UNSIGNED | NO | PK | Auto Inc | Mã log gửi email |
| 2 | `user_id` | INT UNSIGNED | YES | FK | NULL | Người nhận (`users.id`, ON DELETE SET NULL) |
| 3 | `order_id` | INT UNSIGNED | YES | FK | NULL | Đơn hàng gắn liền (`bookings.id`, ON DELETE SET NULL) |
| 4 | `type` | ENUM('login','booking_paid') | NO | | | Loại email: Thông báo đăng nhập / Vé xác nhận thanh toán |
| 5 | `to_email` | VARCHAR(150) | NO | | | Địa chỉ email người nhận |
| 6 | `status` | ENUM('pending','sent','failed') | NO | | 'pending' | Trạng thái: Đang chờ / Đã gửi thành công / Thất bại |
| 7 | `error` | TEXT | YES | | NULL | Chi tiết lỗi nếu gửi thất bại (phục vụ cơ chế Retry) |
| 8 | `created_at` | TIMESTAMP | NO | | CURRENT_TIMESTAMP | Thời gian tạo yêu cầu gửi mail |
| 9 | `sent_at` | DATETIME | YES | | NULL | Thời điểm gửi mail thành công |
| * | *Ràng buộc* | UNIQUE (`order_id`, `type`) | | UK | | **Idempotent**: Mỗi đơn thanh toán chỉ gửi duy nhất 1 email xác nhận |

