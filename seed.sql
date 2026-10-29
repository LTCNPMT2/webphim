-- =====================================================================
-- SEED DATA cho database movie_booking
-- Chạy SAU khi đã chạy schema.sql
-- Tài khoản demo (mật khẩu của TẤT CẢ tài khoản là: password)
--   admin@cinema.vn   (role: admin)
--   an@example.com    (role: user)
--   binh@example.com  (role: user)
-- Ngày giờ suất chiếu tính theo CURDATE() nên luôn là hôm nay / ngày mai / ngày kia
-- =====================================================================
USE movie_booking;
SET NAMES utf8mb4;
-- Xóa dữ liệu cũ theo thứ tự bảng con -> bảng cha (không cần tắt khóa ngoại)
DELETE FROM reviews;
DELETE FROM booking_combos;
DELETE FROM booking_seats;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM promotions;
DELETE FROM combos;
DELETE FROM showtimes;
DELETE FROM seats;
DELETE FROM rooms;
DELETE FROM cinemas;
DELETE FROM movie_genres;
DELETE FROM genres;
DELETE FROM movies;
DELETE FROM users;
-- Đặt lại bộ đếm id về 1 cho các bảng tự tăng không chỉ định id trong seed
ALTER TABLE seats AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE booking_seats AUTO_INCREMENT = 1;
ALTER TABLE booking_combos AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;

-- USERS
INSERT INTO users (id, full_name, email, password_hash, phone, role) VALUES
(1, 'Quản Trị Viên', 'admin@cinema.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0900000001', 'admin'),
(2, 'Nguyễn Văn An', 'an@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0900000002', 'user'),
(3, 'Trần Thị Bình', 'binh@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0900000003', 'user');

-- GENRES
INSERT INTO genres (id, name, slug) VALUES
(1, 'Hành động', 'hanh-dong'),
(2, 'Kinh dị', 'kinh-di'),
(3, 'Tình cảm', 'tinh-cam'),
(4, 'Hoạt hình', 'hoat-hinh'),
(5, 'Hài hước', 'hai-huoc');

-- MOVIES
INSERT INTO movies (id, title, slug, description, duration_minutes, release_date, director, cast_members, language, age_rating, poster_url, banner_url, status, rating_avg, rating_count) VALUES
(1, 'Bóng Đêm Cuối Cùng', 'bong-dem-cuoi-cung', 'Một nhóm bạn trẻ lạc vào căn nhà cổ bỏ hoang và phát hiện bí mật đáng sợ ẩn sau những bức tường.', 105, '2026-10-02', 'Lê Hoàng Nam', 'Quang Minh, Thu Hà, Đức Anh', 'Tiếng Việt', 'T18', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=85&w=1920&auto=format&fit=crop', 'now_showing', 4.50, 2),
(2, 'Hành Trình Về Phương Nam', 'hanh-trinh-ve-phuong-nam', 'Chuyến đi xuyên Việt bằng xe máy của hai anh em đưa họ đến những vùng đất và những ký ức bất ngờ.', 118, '2026-09-25', 'Phạm Quốc Bảo', 'Hoàng Long, Mai Phương', 'Tiếng Việt', 'T13', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=85&w=1920&auto=format&fit=crop', 'now_showing', 0.00, 0),
(3, 'Mùa Hè Năm Ấy', 'mua-he-nam-ay', 'Câu chuyện tình đầu trong trẻo của hai người bạn thanh mai trúc mã trong mùa hè cuối cấp ba.', 100, '2026-10-09', 'Ngô Thanh Vân', 'Khánh Linh, Tuấn Kiệt', 'Tiếng Việt', 'P', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1920&auto=format&fit=crop', 'now_showing', 5.00, 1),
(4, 'Đặc Vụ Sài Gòn', 'dac-vu-sai-gon', 'Một đặc vụ về hưu buộc phải quay lại cuộc chơi để ngăn chặn âm mưu nhắm vào thành phố.', 128, '2026-09-18', 'Trương Gia Huy', 'Bảo Trân, Minh Khôi, Văn Dũng', 'Tiếng Việt', 'T16', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=85&w=1920&auto=format&fit=crop', 'now_showing', 0.00, 0),
(5, 'Vương Quốc Mây', 'vuong-quoc-may', 'Cô bé Mây và chú rồng nhỏ cùng nhau bảo vệ vương quốc trên trời khỏi cơn bão bí ẩn.', 92, '2026-10-05', 'Đỗ Minh Châu', 'Lồng tiếng: Bảo Anh, Gia Hân', 'Tiếng Việt', 'P', 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=85&w=1920&auto=format&fit=crop', 'now_showing', 0.00, 0),
(6, 'Cô Hai Lọ Lem', 'co-hai-lo-lem', 'Cô gái bán hàng rong tình cờ trở thành người thừa kế một tập đoàn và gây ra hàng loạt tình huống dở khóc dở cười.', 95, '2026-10-12', 'Vũ Hải Đăng', 'Thanh Mai, Quốc Việt', 'Tiếng Việt', 'T13', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1519741497674-611481863552?q=85&w=1920&auto=format&fit=crop', 'now_showing', 0.00, 0),
(7, 'Thiên Hà Xa Lạ', 'thien-ha-xa-la', 'Phi hành đoàn tàu thăm dò nhận được tín hiệu từ một hành tinh tưởng đã biến mất từ hàng nghìn năm trước.', 135, '2026-11-20', 'Hoàng Minh Triết', 'Anh Thư, Đình Phong', 'Phụ đề tiếng Việt', 'T13', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=85&w=1920&auto=format&fit=crop', 'coming_soon', 0.00, 0),
(8, 'Tiếng Gọi Từ Rừng Sâu', 'tieng-goi-tu-rung-sau', 'Đoàn khảo sát rừng nguyên sinh nghe thấy tiếng gọi lạ mỗi đêm và lần lượt biến mất.', 110, '2026-12-05', 'Lê Hoàng Nam', 'Tấn Phát, Ngọc Hân', 'Tiếng Việt', 'T16', 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=85&w=1920&auto=format&fit=crop', 'coming_soon', 0.00, 0);

-- MOVIE_GENRES
INSERT INTO movie_genres (movie_id, genre_id) VALUES
(1,2), (2,1), (2,5), (3,3), (4,1), (5,4), (5,5), (6,5), (6,3), (7,1), (8,2);

-- CINEMAS
INSERT INTO cinemas (id, name, address, city, phone, image_url) VALUES
(1, 'Cinema Sài Gòn Center', '65 Lê Lợi, Quận 1', 'TP. Hồ Chí Minh', '02838000001', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop'),
(2, 'Cinema Hà Nội Plaza', '25 Tràng Tiền, Hoàn Kiếm', 'Hà Nội', '02438000002', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop');

-- ROOMS
INSERT INTO rooms (id, cinema_id, name, room_type, total_seats) VALUES
(1, 1, 'Phòng 1', '2D', 75),
(2, 1, 'Phòng 2 (IMAX)', 'IMAX', 75),
(3, 2, 'Phòng 1', '2D', 44),
(4, 2, 'Phòng 2 (3D)', '3D', 44);

-- SEATS (sinh tự động theo sơ đồ: hàng thường / VIP / ghế đôi)
INSERT INTO seats (room_id, row_label, seat_number, seat_type, price_surcharge) VALUES
(1, 'A', 1, 'standard', 0),
(1, 'A', 2, 'standard', 0),
(1, 'A', 3, 'standard', 0),
(1, 'A', 4, 'standard', 0),
(1, 'A', 5, 'standard', 0),
(1, 'A', 6, 'standard', 0),
(1, 'A', 7, 'standard', 0),
(1, 'A', 8, 'standard', 0),
(1, 'A', 9, 'standard', 0),
(1, 'A', 10, 'standard', 0),
(1, 'B', 1, 'standard', 0),
(1, 'B', 2, 'standard', 0),
(1, 'B', 3, 'standard', 0),
(1, 'B', 4, 'standard', 0),
(1, 'B', 5, 'standard', 0),
(1, 'B', 6, 'standard', 0),
(1, 'B', 7, 'standard', 0),
(1, 'B', 8, 'standard', 0),
(1, 'B', 9, 'standard', 0),
(1, 'B', 10, 'standard', 0),
(1, 'C', 1, 'standard', 0),
(1, 'C', 2, 'standard', 0),
(1, 'C', 3, 'standard', 0),
(1, 'C', 4, 'standard', 0),
(1, 'C', 5, 'standard', 0),
(1, 'C', 6, 'standard', 0),
(1, 'C', 7, 'standard', 0),
(1, 'C', 8, 'standard', 0),
(1, 'C', 9, 'standard', 0),
(1, 'C', 10, 'standard', 0),
(1, 'D', 1, 'vip', 20000),
(1, 'D', 2, 'vip', 20000),
(1, 'D', 3, 'vip', 20000),
(1, 'D', 4, 'vip', 20000),
(1, 'D', 5, 'vip', 20000),
(1, 'D', 6, 'vip', 20000),
(1, 'D', 7, 'vip', 20000),
(1, 'D', 8, 'vip', 20000),
(1, 'D', 9, 'vip', 20000),
(1, 'D', 10, 'vip', 20000),
(1, 'E', 1, 'vip', 20000),
(1, 'E', 2, 'vip', 20000),
(1, 'E', 3, 'vip', 20000),
(1, 'E', 4, 'vip', 20000),
(1, 'E', 5, 'vip', 20000),
(1, 'E', 6, 'vip', 20000),
(1, 'E', 7, 'vip', 20000),
(1, 'E', 8, 'vip', 20000),
(1, 'E', 9, 'vip', 20000),
(1, 'E', 10, 'vip', 20000),
(1, 'F', 1, 'vip', 20000),
(1, 'F', 2, 'vip', 20000),
(1, 'F', 3, 'vip', 20000),
(1, 'F', 4, 'vip', 20000),
(1, 'F', 5, 'vip', 20000),
(1, 'F', 6, 'vip', 20000),
(1, 'F', 7, 'vip', 20000),
(1, 'F', 8, 'vip', 20000),
(1, 'F', 9, 'vip', 20000),
(1, 'F', 10, 'vip', 20000),
(1, 'G', 1, 'vip', 20000),
(1, 'G', 2, 'vip', 20000),
(1, 'G', 3, 'vip', 20000),
(1, 'G', 4, 'vip', 20000),
(1, 'G', 5, 'vip', 20000),
(1, 'G', 6, 'vip', 20000),
(1, 'G', 7, 'vip', 20000),
(1, 'G', 8, 'vip', 20000),
(1, 'G', 9, 'vip', 20000),
(1, 'G', 10, 'vip', 20000),
(1, 'H', 1, 'couple', 40000),
(1, 'H', 2, 'couple', 40000),
(1, 'H', 3, 'couple', 40000),
(1, 'H', 4, 'couple', 40000),
(1, 'H', 5, 'couple', 40000),
(2, 'A', 1, 'standard', 0),
(2, 'A', 2, 'standard', 0),
(2, 'A', 3, 'standard', 0),
(2, 'A', 4, 'standard', 0),
(2, 'A', 5, 'standard', 0),
(2, 'A', 6, 'standard', 0),
(2, 'A', 7, 'standard', 0),
(2, 'A', 8, 'standard', 0),
(2, 'A', 9, 'standard', 0),
(2, 'A', 10, 'standard', 0),
(2, 'B', 1, 'standard', 0),
(2, 'B', 2, 'standard', 0),
(2, 'B', 3, 'standard', 0),
(2, 'B', 4, 'standard', 0),
(2, 'B', 5, 'standard', 0),
(2, 'B', 6, 'standard', 0),
(2, 'B', 7, 'standard', 0),
(2, 'B', 8, 'standard', 0),
(2, 'B', 9, 'standard', 0),
(2, 'B', 10, 'standard', 0),
(2, 'C', 1, 'standard', 0),
(2, 'C', 2, 'standard', 0),
(2, 'C', 3, 'standard', 0),
(2, 'C', 4, 'standard', 0),
(2, 'C', 5, 'standard', 0),
(2, 'C', 6, 'standard', 0),
(2, 'C', 7, 'standard', 0),
(2, 'C', 8, 'standard', 0),
(2, 'C', 9, 'standard', 0),
(2, 'C', 10, 'standard', 0),
(2, 'D', 1, 'vip', 20000),
(2, 'D', 2, 'vip', 20000),
(2, 'D', 3, 'vip', 20000),
(2, 'D', 4, 'vip', 20000),
(2, 'D', 5, 'vip', 20000),
(2, 'D', 6, 'vip', 20000),
(2, 'D', 7, 'vip', 20000),
(2, 'D', 8, 'vip', 20000),
(2, 'D', 9, 'vip', 20000),
(2, 'D', 10, 'vip', 20000),
(2, 'E', 1, 'vip', 20000),
(2, 'E', 2, 'vip', 20000),
(2, 'E', 3, 'vip', 20000),
(2, 'E', 4, 'vip', 20000),
(2, 'E', 5, 'vip', 20000),
(2, 'E', 6, 'vip', 20000),
(2, 'E', 7, 'vip', 20000),
(2, 'E', 8, 'vip', 20000),
(2, 'E', 9, 'vip', 20000),
(2, 'E', 10, 'vip', 20000),
(2, 'F', 1, 'vip', 20000),
(2, 'F', 2, 'vip', 20000),
(2, 'F', 3, 'vip', 20000),
(2, 'F', 4, 'vip', 20000),
(2, 'F', 5, 'vip', 20000),
(2, 'F', 6, 'vip', 20000),
(2, 'F', 7, 'vip', 20000),
(2, 'F', 8, 'vip', 20000),
(2, 'F', 9, 'vip', 20000),
(2, 'F', 10, 'vip', 20000),
(2, 'G', 1, 'vip', 20000),
(2, 'G', 2, 'vip', 20000),
(2, 'G', 3, 'vip', 20000),
(2, 'G', 4, 'vip', 20000),
(2, 'G', 5, 'vip', 20000),
(2, 'G', 6, 'vip', 20000),
(2, 'G', 7, 'vip', 20000),
(2, 'G', 8, 'vip', 20000),
(2, 'G', 9, 'vip', 20000),
(2, 'G', 10, 'vip', 20000),
(2, 'H', 1, 'couple', 40000),
(2, 'H', 2, 'couple', 40000),
(2, 'H', 3, 'couple', 40000),
(2, 'H', 4, 'couple', 40000),
(2, 'H', 5, 'couple', 40000),
(3, 'A', 1, 'standard', 0),
(3, 'A', 2, 'standard', 0),
(3, 'A', 3, 'standard', 0),
(3, 'A', 4, 'standard', 0),
(3, 'A', 5, 'standard', 0),
(3, 'A', 6, 'standard', 0),
(3, 'A', 7, 'standard', 0),
(3, 'A', 8, 'standard', 0),
(3, 'B', 1, 'standard', 0),
(3, 'B', 2, 'standard', 0),
(3, 'B', 3, 'standard', 0),
(3, 'B', 4, 'standard', 0),
(3, 'B', 5, 'standard', 0),
(3, 'B', 6, 'standard', 0),
(3, 'B', 7, 'standard', 0),
(3, 'B', 8, 'standard', 0),
(3, 'C', 1, 'vip', 20000),
(3, 'C', 2, 'vip', 20000),
(3, 'C', 3, 'vip', 20000),
(3, 'C', 4, 'vip', 20000),
(3, 'C', 5, 'vip', 20000),
(3, 'C', 6, 'vip', 20000),
(3, 'C', 7, 'vip', 20000),
(3, 'C', 8, 'vip', 20000),
(3, 'D', 1, 'vip', 20000),
(3, 'D', 2, 'vip', 20000),
(3, 'D', 3, 'vip', 20000),
(3, 'D', 4, 'vip', 20000),
(3, 'D', 5, 'vip', 20000),
(3, 'D', 6, 'vip', 20000),
(3, 'D', 7, 'vip', 20000),
(3, 'D', 8, 'vip', 20000),
(3, 'E', 1, 'vip', 20000),
(3, 'E', 2, 'vip', 20000),
(3, 'E', 3, 'vip', 20000),
(3, 'E', 4, 'vip', 20000),
(3, 'E', 5, 'vip', 20000),
(3, 'E', 6, 'vip', 20000),
(3, 'E', 7, 'vip', 20000),
(3, 'E', 8, 'vip', 20000),
(3, 'F', 1, 'couple', 40000),
(3, 'F', 2, 'couple', 40000),
(3, 'F', 3, 'couple', 40000),
(3, 'F', 4, 'couple', 40000),
(4, 'A', 1, 'standard', 0),
(4, 'A', 2, 'standard', 0),
(4, 'A', 3, 'standard', 0),
(4, 'A', 4, 'standard', 0),
(4, 'A', 5, 'standard', 0),
(4, 'A', 6, 'standard', 0),
(4, 'A', 7, 'standard', 0),
(4, 'A', 8, 'standard', 0),
(4, 'B', 1, 'standard', 0),
(4, 'B', 2, 'standard', 0),
(4, 'B', 3, 'standard', 0),
(4, 'B', 4, 'standard', 0),
(4, 'B', 5, 'standard', 0),
(4, 'B', 6, 'standard', 0),
(4, 'B', 7, 'standard', 0),
(4, 'B', 8, 'standard', 0),
(4, 'C', 1, 'vip', 20000),
(4, 'C', 2, 'vip', 20000),
(4, 'C', 3, 'vip', 20000),
(4, 'C', 4, 'vip', 20000),
(4, 'C', 5, 'vip', 20000),
(4, 'C', 6, 'vip', 20000),
(4, 'C', 7, 'vip', 20000),
(4, 'C', 8, 'vip', 20000),
(4, 'D', 1, 'vip', 20000),
(4, 'D', 2, 'vip', 20000),
(4, 'D', 3, 'vip', 20000),
(4, 'D', 4, 'vip', 20000),
(4, 'D', 5, 'vip', 20000),
(4, 'D', 6, 'vip', 20000),
(4, 'D', 7, 'vip', 20000),
(4, 'D', 8, 'vip', 20000),
(4, 'E', 1, 'vip', 20000),
(4, 'E', 2, 'vip', 20000),
(4, 'E', 3, 'vip', 20000),
(4, 'E', 4, 'vip', 20000),
(4, 'E', 5, 'vip', 20000),
(4, 'E', 6, 'vip', 20000),
(4, 'E', 7, 'vip', 20000),
(4, 'E', 8, 'vip', 20000),
(4, 'F', 1, 'couple', 40000),
(4, 'F', 2, 'couple', 40000),
(4, 'F', 3, 'couple', 40000),
(4, 'F', 4, 'couple', 40000);

-- SHOWTIMES (end_time = start + thời lượng phim + 15 phút dọn phòng)
INSERT INTO showtimes (id, movie_id, room_id, start_time, end_time, base_price) VALUES
(1, 1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '19:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '21:30:00'), 90000),
(2, 1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '23:30:00'), 90000),
(3, 2, 2, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '20:13:00'), 110000),
(4, 2, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '17:13:00'), 80000),
(5, 3, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '20:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 0 DAY), '21:55:00'), 80000),
(6, 4, 4, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:23:00'), 100000),
(7, 5, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:17:00'), 70000),
(8, 5, 4, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:47:00'), 70000),
(9, 6, 2, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:50:00'), 90000),
(10, 6, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '17:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '19:20:00'), 80000);

-- COMBOS
INSERT INTO combos (id, name, description, price, image_url) VALUES
(1, 'Combo Solo', '1 bắp ngọt size M + 1 nước ngọt size M', 69000, 'https://placehold.co/300x300/png?text=Combo+Solo'),
(2, 'Combo Couple', '1 bắp ngọt size L + 2 nước ngọt size M', 99000, 'https://placehold.co/300x300/png?text=Combo+Couple'),
(3, 'Combo Party', '2 bắp ngọt size L + 4 nước ngọt size M', 179000, 'https://placehold.co/300x300/png?text=Combo+Party');

-- PROMOTIONS
INSERT INTO promotions (id, code, description, discount_type, discount_value, max_discount, min_order, start_date, end_date, usage_limit) VALUES
(1, 'WELCOME10', 'Giảm 10% (tối đa 50.000đ) cho đơn từ 100.000đ', 'percent', 10, 50000, 100000, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1000),
(2, 'GIAM30K', 'Giảm thẳng 30.000đ cho đơn từ 150.000đ', 'fixed', 30000, NULL, 150000, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 6 MONTH), NULL);

-- REVIEWS
INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES
(2, 1, 5, 'Phim rất rợn, âm thanh xuất sắc!'),
(3, 1, 4, 'Cốt truyện hay, đoạn cuối hơi vội.'),
(2, 3, 5, 'Phim nhẹ nhàng, xem xong thấy nhớ thời học sinh.');
