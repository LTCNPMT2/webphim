-- Các câu SELECT kiểm tra sau khi import (chạy trong tab SQL của phpMyAdmin)
USE movie_booking;

-- 1. Số dòng của từng bảng (kỳ vọng: users 3, genres 5, movies 8, cinemas 2, rooms 4, seats 238, showtimes 10, combos 3, promotions 2)
SELECT 'users' t, COUNT(*) n FROM users UNION ALL SELECT 'genres', COUNT(*) FROM genres
UNION ALL SELECT 'movies', COUNT(*) FROM movies UNION ALL SELECT 'cinemas', COUNT(*) FROM cinemas
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms UNION ALL SELECT 'seats', COUNT(*) FROM seats
UNION ALL SELECT 'showtimes', COUNT(*) FROM showtimes UNION ALL SELECT 'combos', COUNT(*) FROM combos
UNION ALL SELECT 'promotions', COUNT(*) FROM promotions;

-- 2. Phim đang chiếu kèm thể loại
SELECT m.id, m.title, m.status, GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
FROM movies m
JOIN movie_genres mg ON mg.movie_id = m.id
JOIN genres g ON g.id = mg.genre_id
WHERE m.status = 'now_showing'
GROUP BY m.id;

-- 3. Suất chiếu: phim - rạp - phòng - giờ
SELECT s.id, m.title, c.name AS cinema, r.name AS room, s.start_time, s.end_time, s.base_price
FROM showtimes s
JOIN movies m ON m.id = s.movie_id
JOIN rooms r ON r.id = s.room_id
JOIN cinemas c ON c.id = r.cinema_id
ORDER BY s.start_time;

-- 4. Sơ đồ ghế của phòng 1: số ghế theo loại
SELECT seat_type, COUNT(*) AS so_ghe, MAX(price_surcharge) AS phu_thu
FROM seats WHERE room_id = 1 GROUP BY seat_type;

-- 5. Kiểm tra tài khoản
SELECT id, full_name, email, role FROM users;

-- 6. TEST CHỐNG ĐẶT TRÙNG GHẾ (chạy từng câu theo thứ tự)
INSERT INTO bookings (booking_code, user_id, showtime_id, status, expires_at)
VALUES ('TEST0001', 2, 1, 'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE)),
       ('TEST0002', 3, 1, 'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE));
SET @b1 = (SELECT id FROM bookings WHERE booking_code = 'TEST0001');
SET @b2 = (SELECT id FROM bookings WHERE booking_code = 'TEST0002');
-- Người 1 giữ ghế id=1 -> THÀNH CÔNG
INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price) VALUES (@b1, 1, 1, 90000);
-- Người 2 giữ cùng ghế -> PHẢI BÁO LỖI "Duplicate entry"
INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price) VALUES (@b2, 1, 1, 90000);
-- Người 1 hủy -> nhả ghế; sau đó người 2 đặt lại -> THÀNH CÔNG
UPDATE booking_seats SET active = NULL WHERE booking_id = @b1;
INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price) VALUES (@b2, 1, 1, 90000);
-- Dọn dữ liệu test
DELETE FROM bookings WHERE booking_code IN ('TEST0001','TEST0002');
