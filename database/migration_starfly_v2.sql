-- =========================================================
-- STARFLY — MIGRATION v2  (AN TOÀN: KHÔNG XOÁ / KHÔNG RESET DỮ LIỆU)
-- ---------------------------------------------------------
-- Cách chạy:
--   Cách 1: node run-migration.js     (khuyến nghị)
--   Cách 2: phpMyAdmin -> chọn database "starfly" -> tab SQL -> dán -> Go
-- Chạy lại nhiều lần cũng không sinh dữ liệu trùng.
--
-- LƯU Ý: file này tự kiểm tra cột/bảng trước khi thay đổi,
--        chỉ THÊM cột - THÊM bảng - THÊM dữ liệu, không bao giờ DROP bảng.
-- =========================================================

USE starfly;

-- ---------------------------------------------------------
-- 1) SỬA POSTER / BACKDROP BỊ LỖI 404
--    (The Super Mario Bros. Movie + A Quiet Place)
-- ---------------------------------------------------------
UPDATE movies
SET poster   = 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg',
    backdrop = 'https://image.tmdb.org/t/p/original/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg'
WHERE title = 'The Super Mario Bros. Movie';

UPDATE movies
SET poster   = 'https://upload.wikimedia.org/wikipedia/en/a/a0/A_Quiet_Place_film_poster.png',
    backdrop = 'https://upload.wikimedia.org/wikipedia/en/a/a0/A_Quiet_Place_film_poster.png'
WHERE title = 'A Quiet Place';

-- ---------------------------------------------------------
-- 2) ĐỒNG BỘ SCHEMA (chỉ thêm, không xoá)
-- ---------------------------------------------------------
-- 2.1 movies.id cần AUTO_INCREMENT để Admin thêm phim mới
SET @need_ai = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'movies'
      AND COLUMN_NAME = 'id'
      AND EXTRA NOT LIKE '%auto_increment%'
);

SET @s = IF(@need_ai > 0,
    'ALTER TABLE movies MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT',
    'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- 2.2 Hàm phụ trợ: thêm cột nếu chưa tồn tại (MySQL 8 không có ADD COLUMN IF NOT EXISTS)
DROP PROCEDURE IF EXISTS starfly_add_column;
CREATE PROCEDURE starfly_add_column(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_ddl);
        PREPARE st2 FROM @ddl; EXECUTE st2; DEALLOCATE PREPARE st2;
    END IF;
END;

-- 2.3 orders: bổ sung các cột cần cho luồng đặt vé + SePay
CALL starfly_add_column('orders', 'showtime_id', 'showtime_id BIGINT UNSIGNED NULL AFTER customer_id');
CALL starfly_add_column('orders', 'payment_content', 'payment_content VARCHAR(255) NULL');
CALL starfly_add_column('orders', 'sepay_reference', 'sepay_reference VARCHAR(120) NULL');
CALL starfly_add_column('orders', 'food_amount', 'food_amount DECIMAL(12,2) NOT NULL DEFAULT 0');
CALL starfly_add_column('customers', 'password_hash', 'password_hash VARCHAR(255) NULL');

DROP PROCEDURE IF EXISTS starfly_add_column;

-- 2.4 orders.status: bổ sung trạng thái paid / failed (giữ nguyên dữ liệu cũ)
ALTER TABLE orders
    MODIFY status ENUM('pending','confirmed','paid','cancelled','failed')
    NOT NULL DEFAULT 'pending';

-- 2.5 orders: thêm index cho tìm kiếm / thống kê
SET @need_idx = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND INDEX_NAME = 'idx_orders_showtime'
);
SET @s = IF(@need_idx = 0,
    'ALTER TABLE orders ADD INDEX idx_orders_showtime (showtime_id)',
    'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @need_idx2 = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND INDEX_NAME = 'idx_orders_status'
);
SET @s = IF(@need_idx2 = 0,
    'ALTER TABLE orders ADD INDEX idx_orders_status (status)',
    'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;


-- ---------------------------------------------------------
-- 3) BẮP NƯỚC / COMBO  (bảng mới — không đụng bảng cũ)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    category ENUM('popcorn','drink','snack','combo') DEFAULT 'snack',
    icon VARCHAR(10) DEFAULT '🍿',
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_food_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    food_item_id INT NULL,
    food_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_food FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sản phẩm mẫu (INSERT IGNORE dựa trên UNIQUE KEY uniq_food_name)
INSERT IGNORE INTO food_items (name, description, category, icon, price) VALUES
('Bắp rang bơ (L)', 'Bắp rang bơ nóng giòn, size lớn', 'popcorn', '🍿', 65000),
('Bắp rang bơ (M)', 'Bắp rang bơ size vừa, vị truyền thống', 'popcorn', '🍿', 50000),
('Coca-Cola (L)', 'Ly Coca-Cola size lớn, đá đầy', 'drink', '🥤', 45000),
('Pepsi (L)', 'Ly Pepsi size lớn, mát lạnh', 'drink', '🥤', 45000),
('Nước suối Aquafina', 'Chai nước suối 500ml', 'drink', '💧', 25000),
('Combo STARFLY', '1 bắp rang bơ (L) + 2 nước ngọt (L)', 'combo', '🎟️', 135000),
('Combo Đôi', '2 bắp rang bơ (L) + 2 nước ngọt (L)', 'combo', '🎟️', 185000),
('Nachos phô mai', 'Bánh nachos giòn kèm sốt phô mai', 'snack', '🧀', 75000),
('Khoai tây chiên', 'Khoai tây chiên vàng giòn', 'snack', '🍟', 55000),
('Hotdog STARFLY', 'Xúc xích nướng kèm bánh mì mềm', 'snack', '🌭', 60000);

-- ---------------------------------------------------------
-- 3) THÊM PHIM MỚI (chỉ thêm phim CHƯA tồn tại — không sửa/xoá phim cũ)
--    Poster/backdrop/trailer bên dưới đều đã được kiểm tra tồn tại (HTTP 200).
-- ---------------------------------------------------------
CREATE TEMPORARY TABLE IF NOT EXISTS seed_movies_v2 (
    title VARCHAR(255),
    year INT,
    genre VARCHAR(100),
    rating DECIMAL(3,1),
    description TEXT,
    poster VARCHAR(500),
    backdrop VARCHAR(500),
    trailer VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO seed_movies_v2 (title, year, genre, rating, description, poster, backdrop, trailer) VALUES
('Inception', 2010, 'Sci-Fi', 8.8, 'Dom Cobb chuyên đánh cắp bí mật trong giấc mơ và nhận nhiệm vụ cuối cùng: cấy một ý tưởng vào tiềm thức của mục tiêu.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'https://www.youtube.com/embed/YoHD9XEInc0'),
('The Dark Knight', 2008, 'Action', 9.0, 'Batman đối đầu Joker — kẻ hỗn loạn muốn chứng minh rằng Gotham chỉ cần một ngày tồi tệ để sụp đổ.', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'https://www.youtube.com/embed/EXeTwQWrcwY'),
('Parasite', 2019, 'Thriller', 8.5, 'Gia đình nghèo khó len lỏi vào cuộc sống của một gia đình giàu có, mở ra chuỗi biến cố không thể kiểm soát.', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 'https://www.youtube.com/embed/5xH0HfJHsaY'),
('Spirited Away', 2001, 'Anime', 8.6, 'Chihiro lạc vào thế giới của các vị thần và phải tìm cách giải cứu cha mẹ trước khi quá muộn.', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'https://image.tmdb.org/t/p/original/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 'https://www.youtube.com/embed/ByXuk9QqQkk'),
('Avatar: The Way of Water', 2022, 'Sci-Fi', 7.6, 'Gia đình Sully rời rừng già Pandora để tìm nơi trú ẩn mới giữa đại dương rực rỡ.', 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 'https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 'https://www.youtube.com/embed/d9MyW72ELq0'),
('Top Gun: Maverick', 2022, 'Action', 8.3, 'Maverick trở lại trường Top Gun để huấn luyện một thế hệ phi công cho nhiệm vụ gần như bất khả thi.', 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', 'https://image.tmdb.org/t/p/original/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', 'https://www.youtube.com/embed/qSqVVswa420'),
('Everything Everywhere All at Once', 2022, 'Comedy', 7.8, 'Một người phụ nữ bình dị bất ngờ nắm trong tay vận mệnh của cả đa vũ trụ.', 'https://image.tmdb.org/t/p/w500/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', 'https://image.tmdb.org/t/p/original/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', 'https://www.youtube.com/embed/wxN1T1uxQ2g'),
('The Godfather', 1972, 'Crime', 8.7, 'Bi kịch của gia tộc Corleone và hành trình Michael trở thành ông trùm mafia mới.', 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'https://image.tmdb.org/t/p/original/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 'https://www.youtube.com/embed/sY1S34973zA'),
('Pulp Fiction', 1994, 'Crime', 8.5, 'Những câu chuyện tội phạm được đan cài khéo léo trong một Los Angeles đậm chất Tarantino.', 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', 'https://www.youtube.com/embed/s7EdQ4FqbhY'),
('Whiplash', 2014, 'Drama', 8.5, 'Tay trống trẻ theo đuổi sự hoàn hảo dưới áp lực tàn nhẫn của người thầy.', 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg', 'https://image.tmdb.org/t/p/original/7fn624j5lj3xTme2SgiLCeuedmO.jpg', 'https://www.youtube.com/embed/7d_jQycdQGo'),
('The Shawshank Redemption', 1994, 'Drama', 8.7, 'Hai người tù tìm thấy hy vọng và tình bạn giữa bốn bức tường nhà tù Shawshank.', 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'https://image.tmdb.org/t/p/original/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'https://www.youtube.com/embed/6hB3S9bIaco'),
('Hereditary', 2018, 'Horror', 7.3, 'Sau cái chết của bà nội, gia đình Graham dần bị di sản đen tối của dòng họ nuốt chửng.', 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3HtEJEqbIwkFGUhVXD.jpg', 'https://image.tmdb.org/t/p/original/p9fmuz2Oj3HtEJEqbIwkFGUhVXD.jpg', 'https://www.youtube.com/embed/V6wWKNij_1M'),
('Get Out', 2017, 'Horror', 7.7, 'Một chàng trai da màu nhận ra chuyến thăm nhà bạn gái hoá ra là cơn ác mộng được dàn dựng.', 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', 'https://image.tmdb.org/t/p/original/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', 'https://www.youtube.com/embed/DzfpyUB60YY'),
('La La Land', 2016, 'Romance', 7.9, 'Chuyện tình của một nghệ sĩ piano và một diễn viên trẻ giữa thành phố Los Angeles.', 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'https://image.tmdb.org/t/p/original/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 'https://www.youtube.com/embed/0pdqf4P9MB8'),
('Spider-Man: Across the Spider-Verse', 2023, 'Animation', 8.4, 'Miles Morales du hành đa vũ trụ nhện và đối đầu với hội đồng những Spider-Man.', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 'https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 'https://www.youtube.com/embed/cqGjhVJWtEg'),
('Dune', 2021, 'Sci-Fi', 7.8, 'Paul Atreides bị cuốn vào cuộc chiến giành Arrakis — hành tinh của loại gia vị quyền lực nhất vũ trụ.', 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', 'https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', 'https://www.youtube.com/embed/n9xhJrPXop4'),
('Joker', 2019, 'Crime', 8.2, 'Arthur Fleck dần biến thành Joker giữa thành phố Gotham lạnh lùng và bất công.', 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', 'https://image.tmdb.org/t/p/original/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', 'https://www.youtube.com/embed/zAGVQLHvwOY'),
('1917', 2019, 'Drama', 7.9, 'Hai người lính Anh băng qua chiến tuyến để ngăn một cuộc tấn công thảm khốc.', 'https://image.tmdb.org/t/p/w500/iZf0KyrE25z1sage4SYFLCCrMi9.jpg', 'https://image.tmdb.org/t/p/original/iZf0KyrE25z1sage4SYFLCCrMi9.jpg', 'https://www.youtube.com/embed/gZjQROMAh_s'),
('Nope', 2022, 'Horror', 6.9, 'Hai anh em chủ trang trại ngựa ghi lại một thứ kỳ lạ đang lơ lửng trên bầu trời California.', 'https://image.tmdb.org/t/p/w500/AcKVlWaNVVVFQwro3nLXqPljcYA.jpg', 'https://image.tmdb.org/t/p/original/AcKVlWaNVVVFQwro3nLXqPljcYA.jpg', ''),
('The Lion King', 1994, 'Animation', 8.5, 'Simba chạy trốn quá khứ và tìm lại vương quốc mà mình thuộc về.', 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', 'https://image.tmdb.org/t/p/original/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg', 'https://www.youtube.com/embed/7TavVZMewpY'),
('Titanic', 1997, 'Romance', 7.9, 'Tình yêu chớp nhoáng trên con tàu định mệnh giữa đại dương.', 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 'https://image.tmdb.org/t/p/original/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 'https://www.youtube.com/embed/kVrqfYjkTdQ'),
('The Lord of the Rings: The Fellowship of the Ring', 2001, 'Fantasy', 8.6, 'Frodo cùng những người bạn đồng hành lên đường hủy diệt Chiếc Nhẫn Quyền Năng.', 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 'https://image.tmdb.org/t/p/original/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', ''),
('Harry Potter and the Sorcerer''s Stone', 2001, 'Fantasy', 7.6, 'Cậu bé Harry Potter khám phá thế giới pháp thuật và những bí mật tại trường Hogwarts.', 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', 'https://image.tmdb.org/t/p/original/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', 'https://www.youtube.com/embed/VyHV0BRtdxo'),

('Pirates of the Caribbean: The Curse of the Black Pearl', 2003, 'Adventure', 7.7, 'Thuyền trưởng Jack Sparrow truy đuổi băng cướp biển bị nguyền rủa.', 'https://image.tmdb.org/t/p/w500/z8onk7LV9Mmw6zKz4hT6pzzvmvl.jpg', 'https://image.tmdb.org/t/p/original/z8onk7LV9Mmw6zKz4hT6pzzvmvl.jpg', 'https://www.youtube.com/embed/naQr0uTrH_s'),
('The Revenant', 2015, 'Adventure', 7.5, 'Hugh Glass sống sót kỳ diệu sau cuộc tấn công của gấu và bắt đầu hành trình báo thù.', 'https://image.tmdb.org/t/p/w500/ji3ecJphATlVgWNY0B0RVXZizdf.jpg', 'https://image.tmdb.org/t/p/original/ji3ecJphATlVgWNY0B0RVXZizdf.jpg', 'https://www.youtube.com/embed/LoebZZ8K5N0'),
('Mad Max: Fury Road', 2015, 'Action', 7.6, 'Mad Max hợp sức cùng Furiosa chạy trốn khỏi bạo chúa Immortan Joe.', 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg', 'https://image.tmdb.org/t/p/original/hA2ple9q4qnwxp3hKVNhroipsir.jpg', 'https://www.youtube.com/embed/hEJnMQG9ev8'),
('Tenet', 2020, 'Sci-Fi', 7.3, 'Một điệp viên vô danh chiến đấu để ngăn Thế chiến thứ ba bằng cách đảo ngược dòng thời gian.', 'https://image.tmdb.org/t/p/w500/k68nPLbIST6NP96JmTxmZijEvCA.jpg', 'https://image.tmdb.org/t/p/original/k68nPLbIST6NP96JmTxmZijEvCA.jpg', 'https://www.youtube.com/embed/LdOM0x0XDMo'),
('Blade Runner 2049', 2017, 'Sci-Fi', 7.5, 'Một thợ săn replicant khám phá bí mật có thể thay đổi cả xã hội tương lai.', 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', 'https://image.tmdb.org/t/p/original/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', 'https://www.youtube.com/embed/gCcx85zbxz4'),
('The Matrix', 1999, 'Sci-Fi', 8.2, 'Neo nhận ra thế giới anh biết chỉ là mô phỏng và phải chọn viên thuốc đỏ.', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', 'https://www.youtube.com/embed/vKQi3bBA1y8'),
('The Conjuring', 2013, 'Horror', 7.0, 'Vợ chồng nhà Warren điều tra thế lực ma quỷ trong một trang trại bị nguyền rủa.', 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg', 'https://image.tmdb.org/t/p/original/wVYREutTvI2tmxr6ujrHT704wGF.jpg', 'https://www.youtube.com/embed/k10ETZ41q5o'),
('It', 2017, 'Horror', 7.0, 'Bảy đứa trẻ ở thị trấn Derry đối đầu Pennywise — thứ ác mộng mang hình hài chú hề.', 'https://image.tmdb.org/t/p/w500/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg', 'https://image.tmdb.org/t/p/original/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg', 'https://www.youtube.com/embed/xKJmEC5ieOk'),
('Smile', 2022, 'Horror', 6.5, 'Một bác sĩ tâm lý bị ám bởi lời nguyền lây lan qua những nụ cười kỳ dị.', 'https://image.tmdb.org/t/p/w500/aPqcQwu4VGEewPhagWNncDbJ9Xp.jpg', 'https://image.tmdb.org/t/p/original/aPqcQwu4VGEewPhagWNncDbJ9Xp.jpg', ''),
('The Notebook', 2004, 'Romance', 7.8, 'Mối tình mùa hè định mệnh giữa một cô gái giàu có và chàng trai thị trấn nhỏ.', 'https://image.tmdb.org/t/p/w500/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg', 'https://image.tmdb.org/t/p/original/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg', ''),
('Me Before You', 2016, 'Romance', 7.3, 'Cô gái lạc quan trở thành người chăm sóc cho một chàng trai tài giỏi nhưng tuyệt vọng.', 'https://image.tmdb.org/t/p/w500/Ia3dzj5LnCj1ZBdlVeJrbKJQxG.jpg', 'https://image.tmdb.org/t/p/original/Ia3dzj5LnCj1ZBdlVeJrbKJQxG.jpg', ''),
('Barbie', 2023, 'Comedy', 7.0, 'Barbie rời xứ sở hoàn hảo để khám phá thế giới thật đầy bất ngờ.', 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 'https://image.tmdb.org/t/p/original/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 'https://www.youtube.com/embed/pBk4NYhWNMM'),
('Coco', 2017, 'Animation', 8.1, 'Cậu bé Miguel lạc vào xứ sở người chết để tìm lại âm nhạc của gia đình.', 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', 'https://image.tmdb.org/t/p/original/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg', 'https://www.youtube.com/embed/Ga6RYejo6Hk'),
('Soul', 2020, 'Animation', 8.0, 'Một nhạc sĩ jazz bước vào thế giới linh hồn ngay trước ngày trình diễn lớn nhất đời.', 'https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', 'https://image.tmdb.org/t/p/original/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', ''),
('Suzume', 2022, 'Anime', 7.6, 'Cô gái trẻ cùng một chiếc ghế biết nói phải phong ấn những cánh cửa thảm hoạ.', 'https://image.tmdb.org/t/p/w500/vIeu8WysZrTSFb2uhPViKjX9EcC.jpg', 'https://image.tmdb.org/t/p/original/vIeu8WysZrTSFb2uhPViKjX9EcC.jpg', 'https://www.youtube.com/embed/5pTcio2hTSw'),
('A Silent Voice', 2016, 'Anime', 8.1, 'Chàng trai từng bắt nạt bạn học khiếm thính tìm cách chuộc lại lỗi lầm năm xưa.', 'https://image.tmdb.org/t/p/w500/tuFaWiqX0TXoWu7DGNcmX3UW7sT.jpg', 'https://image.tmdb.org/t/p/original/tuFaWiqX0TXoWu7DGNcmX3UW7sT.jpg', ''),
('Se7en', 1995, 'Thriller', 8.5, 'Hai thám tử truy đuổi kẻ giết người hàng loạt theo bảy tội lỗi chết chóc.', 'https://image.tmdb.org/t/p/w500/6yoghtyTpznpBik8EngEmJskVUO.jpg', 'https://image.tmdb.org/t/p/original/6yoghtyTpznpBik8EngEmJskVUO.jpg', 'https://www.youtube.com/embed/znmZoVkCjpI'),
('Shutter Island', 2010, 'Thriller', 8.1, 'Một luật sư liên bang điều tra vụ mất tích tại bệnh viện tâm thần biệt lập.', 'https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg', 'https://image.tmdb.org/t/p/original/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg', 'https://www.youtube.com/embed/v8yrZSkKxTA'),
('The Silence of the Lambs', 1991, 'Crime', 8.3, 'Nữ thực tập sinh FBI buộc phải nhờ tới trí tuệ của kẻ sát nhân Hannibal Lecter.', 'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg', 'https://image.tmdb.org/t/p/original/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg', 'https://www.youtube.com/embed/W6Mm8Sbe__o'),
('Goodfellas', 1990, 'Crime', 8.5, 'Hành trình ba thập kỷ của Henry Hill trong thế giới mafia New York.', 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', 'https://image.tmdb.org/t/p/original/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', 'https://www.youtube.com/embed/qo5jJpHtI1Y'),
('Forrest Gump', 1994, 'Drama', 8.5, 'Chàng trai chậm hiểu tình cờ đi qua những cột mốc lớn nhất của nước Mỹ.', 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'https://image.tmdb.org/t/p/original/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'https://www.youtube.com/embed/bLvqoHBptjg'),
('The Green Mile', 1999, 'Drama', 8.6, 'Người cai ngục ở khu tử tù gặp một tù nhân sở hữu năng lực kỳ lạ.', 'https://image.tmdb.org/t/p/w500/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg', 'https://image.tmdb.org/t/p/original/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg', 'https://www.youtube.com/embed/Ki4haFrqSrw'),
('Up', 2009, 'Animation', 8.1, 'Ông lão Carl bay lên trời bằng bóng bay để thực hiện lời hứa với người vợ quá cố.', 'https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg', 'https://image.tmdb.org/t/p/original/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg', 'https://www.youtube.com/embed/qas5lWp7_R0'),
('The Jungle Book', 2016, 'Adventure', 7.4, 'Cậu bé Mowgli lớn lên giữa rừng già và phải đối mặt với hổ Shere Khan.', 'https://image.tmdb.org/t/p/w500/3bN675X0K2E5QiAZVChzB5wq90B.jpg', 'https://image.tmdb.org/t/p/original/3bN675X0K2E5QiAZVChzB5wq90B.jpg', 'https://www.youtube.com/embed/5mkm22yO-bs'),
('Uncharted', 2022, 'Adventure', 6.3, 'Nathan Drake truy tìm kho báu thất lạc trong cuộc phiêu lưu vòng quanh thế giới.', 'https://image.tmdb.org/t/p/w500/r7XifzvtezNt31ypvsmb6Oqxw49.jpg', 'https://image.tmdb.org/t/p/original/r7XifzvtezNt31ypvsmb6Oqxw49.jpg', 'https://www.youtube.com/embed/eHp3MbsCbMg'),
('The Hobbit: An Unexpected Journey', 2012, 'Fantasy', 7.2, 'Bilbo Baggins bị cuốn vào hành trình cùng Gandalf và đoàn lùn tới núi Erebor.', 'https://image.tmdb.org/t/p/w500/yHA9Fc37VmpUA5UncTxxo3rTGVA.jpg', 'https://image.tmdb.org/t/p/original/yHA9Fc37VmpUA5UncTxxo3rTGVA.jpg', 'https://www.youtube.com/embed/SDnYMbYB-nU'),
('Fantastic Beasts and Where to Find Them', 2016, 'Fantasy', 7.3, 'Newt Scamander tới New York cùng chiếc vali đầy những sinh vật phép thuật.', 'https://image.tmdb.org/t/p/w500/fMMrl8fD9gRCFJvsx0SuFwkEOop.jpg', 'https://image.tmdb.org/t/p/original/fMMrl8fD9gRCFJvsx0SuFwkEOop.jpg', 'https://www.youtube.com/embed/Vso5o11LuGU'),
('Encanto', 2021, 'Animation', 7.2, 'Cô bé Mirabel là người duy nhất trong gia đình không được ban phép thuật.', 'https://image.tmdb.org/t/p/w500/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg', 'https://image.tmdb.org/t/p/original/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg', 'https://www.youtube.com/embed/CaimKeDcudo'),
('WALL-E', 2008, 'Animation', 8.4, 'Robot nhỏ bé dọn dẹp Trái Đất và vô tình thay đổi vận mệnh của loài người.', 'https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg', 'https://image.tmdb.org/t/p/original/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg', ''),
('The Avengers', 2012, 'Action', 7.7, 'Những siêu anh hùng đầu tiên tập hợp để chặn Loki và đội quân Chitauri.', 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', 'https://image.tmdb.org/t/p/original/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', 'https://www.youtube.com/embed/eOrNdBpGMv8'),
('Avengers: Endgame', 2019, 'Action', 8.2, 'Các Avengers thực hiện nước đi cuối cùng để đảo ngược cú búng tay của Thanos.', 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'https://image.tmdb.org/t/p/original/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'https://www.youtube.com/embed/TcMBFSGVi1c');

-- Chỉ chèn những phim CHƯA có trong bảng movies (so khớp theo title)
INSERT INTO movies (title, year, genre, rating, description, poster, backdrop, trailer)
SELECT s.title, s.year, s.genre, s.rating, s.description, s.poster, s.backdrop, s.trailer
FROM seed_movies_v2 s
WHERE NOT EXISTS (
    SELECT 1 FROM movies m WHERE m.title = s.title
);

DROP TEMPORARY TABLE IF EXISTS seed_movies_v2;

-- ---------------------------------------------------------
-- 4) KIỂM TRA KẾT QUẢ
-- ---------------------------------------------------------
SELECT COUNT(*) AS tong_so_phim FROM movies;
SELECT COUNT(*) AS tong_so_do_an FROM food_items;
SELECT genre, COUNT(*) AS so_phim FROM movies GROUP BY genre ORDER BY so_phim DESC;
