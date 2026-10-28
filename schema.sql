-- =====================================================================
-- DATABASE: movie_booking  (Website đặt vé xem phim)
-- Tương thích: XAMPP (MariaDB 10.4+) và MySQL 5.7/8.0
-- Cách chạy: phpMyAdmin -> tab Import, hoặc command line (xem README)
-- Lưu ý: file này sẽ XÓA và TẠO LẠI toàn bộ bảng (chỉ dùng khi dev)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS movie_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE movie_booking;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS booking_combos;
DROP TABLE IF EXISTS booking_seats;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS combos;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS cinemas;
DROP TABLE IF EXISTS movie_genres;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS: người dùng và quản trị viên
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,              -- lưu hash bcrypt, KHÔNG lưu mật khẩu thô
  phone         VARCHAR(20)  NULL,
  avatar_url    VARCHAR(255) NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,    -- 0 = bị khóa tài khoản
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. GENRES: thể loại phim
-- ---------------------------------------------------------------------
CREATE TABLE genres (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  slug VARCHAR(60)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_genres_name (name),
  UNIQUE KEY uq_genres_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. MOVIES: phim
-- ---------------------------------------------------------------------
CREATE TABLE movies (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title            VARCHAR(200) NOT NULL,
  slug             VARCHAR(220) NOT NULL,
  description      TEXT         NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,       -- thời lượng (phút)
  release_date     DATE         NOT NULL,
  director         VARCHAR(100) NULL,
  cast_members     VARCHAR(500) NULL,                -- danh sách diễn viên, cách nhau bởi dấu phẩy
  language         VARCHAR(50)  NOT NULL DEFAULT 'Tiếng Việt',
  age_rating       ENUM('P','K','T13','T16','T18') NOT NULL DEFAULT 'P',
  poster_url       VARCHAR(255) NULL,
  banner_url       VARCHAR(255) NULL,
  trailer_url      VARCHAR(255) NULL,                -- link YouTube
  status           ENUM('coming_soon','now_showing','ended') NOT NULL DEFAULT 'coming_soon',
  rating_avg       DECIMAL(4,2) NOT NULL DEFAULT 0.00, -- điểm TB (thang 10), cập nhật khi có review
  rating_count     INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_movies_slug (slug),
  KEY idx_movies_status (status),
  KEY idx_movies_release (release_date),
  FULLTEXT KEY ft_movies_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. MOVIE_GENRES: bảng trung gian N-N giữa phim và thể loại
-- ---------------------------------------------------------------------
CREATE TABLE movie_genres (
  movie_id INT UNSIGNED NOT NULL,
  genre_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (movie_id, genre_id),
  KEY idx_mg_genre (genre_id),
  CONSTRAINT fk_mg_movie FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
  CONSTRAINT fk_mg_genre FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. CINEMAS: cụm rạp
-- ---------------------------------------------------------------------
CREATE TABLE cinemas (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(150) NOT NULL,
  address   VARCHAR(255) NOT NULL,
  city      VARCHAR(100) NOT NULL,
  phone     VARCHAR(20)  NULL,
  image_url VARCHAR(255) NULL,
  is_active TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cinemas_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. ROOMS: phòng chiếu thuộc rạp
-- ---------------------------------------------------------------------
CREATE TABLE rooms (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cinema_id   INT UNSIGNED NOT NULL,
  name        VARCHAR(50)  NOT NULL,                 -- VD: "Phòng 1"
  room_type   ENUM('2D','3D','IMAX') NOT NULL DEFAULT '2D',
  total_seats SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rooms_cinema_name (cinema_id, name),
  CONSTRAINT fk_rooms_cinema FOREIGN KEY (cinema_id) REFERENCES cinemas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. SEATS: sơ đồ ghế cố định của từng phòng
--    price_surcharge: phụ thu theo loại ghế, cộng vào giá cơ bản của suất chiếu
-- ---------------------------------------------------------------------
CREATE TABLE seats (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id         INT UNSIGNED NOT NULL,
  row_label       CHAR(1)      NOT NULL,             -- A, B, C...
  seat_number     TINYINT UNSIGNED NOT NULL,         -- 1, 2, 3...
  seat_type       ENUM('standard','vip','couple') NOT NULL DEFAULT 'standard',
  price_surcharge INT UNSIGNED NOT NULL DEFAULT 0,   -- VND
  PRIMARY KEY (id),
  UNIQUE KEY uq_seats_position (room_id, row_label, seat_number),
  CONSTRAINT fk_seats_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. SHOWTIMES: suất chiếu (phim + phòng + thời gian)
-- ---------------------------------------------------------------------
CREATE TABLE showtimes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  movie_id   INT UNSIGNED NOT NULL,
  room_id    INT UNSIGNED NOT NULL,
  start_time DATETIME     NOT NULL,
  end_time   DATETIME     NOT NULL,
  base_price INT UNSIGNED NOT NULL,                  -- giá vé cơ bản (VND)
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_showtimes_movie_time (movie_id, start_time),
  KEY idx_showtimes_room_time (room_id, start_time, end_time),  -- kiểm tra trùng giờ trong phòng
  CONSTRAINT fk_showtimes_movie FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
  CONSTRAINT fk_showtimes_room  FOREIGN KEY (room_id)  REFERENCES rooms (id)  ON DELETE CASCADE,
  CONSTRAINT chk_showtimes_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. COMBOS: combo bắp nước
-- ---------------------------------------------------------------------
CREATE TABLE combos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  price       INT UNSIGNED NOT NULL,
  image_url   VARCHAR(255) NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. PROMOTIONS: mã giảm giá
-- ---------------------------------------------------------------------
CREATE TABLE promotions (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code           VARCHAR(30)  NOT NULL,
  description    VARCHAR(255) NULL,
  discount_type  ENUM('percent','fixed') NOT NULL,
  discount_value INT UNSIGNED NOT NULL,              -- % hoặc số tiền VND
  max_discount   INT UNSIGNED NULL,                  -- trần giảm khi dùng kiểu percent
  min_order      INT UNSIGNED NOT NULL DEFAULT 0,    -- giá trị đơn tối thiểu
  start_date     DATETIME     NOT NULL,
  end_date       DATETIME     NOT NULL,
  usage_limit    INT UNSIGNED NULL,                  -- NULL = không giới hạn
  used_count     INT UNSIGNED NOT NULL DEFAULT 0,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_promotions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. BOOKINGS: đơn đặt vé
--    status: pending (đang giữ ghế) -> paid | cancelled | expired
--    expires_at: hết giờ này mà chưa thanh toán thì chuyển expired và nhả ghế
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_code    VARCHAR(20)  NOT NULL,             -- mã vé / nội dung mã QR
  user_id         INT UNSIGNED NOT NULL,
  showtime_id     INT UNSIGNED NOT NULL,
  promotion_id    INT UNSIGNED NULL,
  subtotal        INT UNSIGNED NOT NULL DEFAULT 0,   -- tiền ghế + combo
  discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
  total_amount    INT UNSIGNED NOT NULL DEFAULT 0,   -- = subtotal - discount_amount
  status          ENUM('pending','paid','cancelled','expired') NOT NULL DEFAULT 'pending',
  expires_at      DATETIME     NULL,
  cancelled_at    DATETIME     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_code (booking_code),
  KEY idx_bookings_user (user_id, created_at),
  KEY idx_bookings_showtime (showtime_id),
  KEY idx_bookings_status_exp (status, expires_at),  -- cron quét đơn hết hạn
  CONSTRAINT fk_bookings_user      FOREIGN KEY (user_id)      REFERENCES users (id)      ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_showtime  FOREIGN KEY (showtime_id)  REFERENCES showtimes (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. BOOKING_SEATS: ghế thuộc từng đơn  (BẢNG CHỐNG ĐẶT TRÙNG GHẾ)
--
--  Cột "active" = 1 khi ghế đang bị giữ/đã bán, = NULL khi đã nhả ghế
--  (đơn bị hủy hoặc hết hạn). UNIQUE(showtime_id, seat_id, active):
--    - 2 dòng cùng suất + cùng ghế + active=1  -> DB từ chối (chống trùng)
--    - MySQL/MariaDB cho phép nhiều dòng NULL  -> vẫn giữ được lịch sử
--  Khi hủy/hết hạn: UPDATE booking_seats SET active = NULL WHERE booking_id = ?
-- ---------------------------------------------------------------------
CREATE TABLE booking_seats (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id  INT UNSIGNED NOT NULL,
  showtime_id INT UNSIGNED NOT NULL,
  seat_id     INT UNSIGNED NOT NULL,
  price       INT UNSIGNED NOT NULL,                 -- giá ghế tại thời điểm đặt
  active      TINYINT(1)   NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bs_showtime_seat_active (showtime_id, seat_id, active),
  KEY idx_bs_booking (booking_id),
  KEY idx_bs_seat (seat_id),
  CONSTRAINT fk_bs_booking  FOREIGN KEY (booking_id)  REFERENCES bookings (id)  ON DELETE CASCADE,
  CONSTRAINT fk_bs_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_bs_seat     FOREIGN KEY (seat_id)     REFERENCES seats (id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. BOOKING_COMBOS: combo trong đơn
-- ---------------------------------------------------------------------
CREATE TABLE booking_combos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  combo_id   INT UNSIGNED NOT NULL,
  quantity   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price INT UNSIGNED NOT NULL,                  -- giá combo tại thời điểm đặt
  PRIMARY KEY (id),
  UNIQUE KEY uq_bc_booking_combo (booking_id, combo_id),
  KEY idx_bc_combo (combo_id),
  CONSTRAINT fk_bc_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT fk_bc_combo   FOREIGN KEY (combo_id)   REFERENCES combos (id)   ON DELETE RESTRICT,
  CONSTRAINT chk_bc_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. PAYMENTS: thanh toán (1 đơn có thể có nhiều lần thử thanh toán)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id       INT UNSIGNED NOT NULL,
  method           ENUM('mock','momo','vnpay','card') NOT NULL DEFAULT 'mock',
  amount           INT UNSIGNED NOT NULL,
  status           ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_code VARCHAR(100) NULL,                -- mã giao dịch từ cổng thanh toán
  paid_at          DATETIME     NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. REVIEWS: đánh giá phim (mỗi user 1 đánh giá / phim)
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  movie_id   INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  comment    TEXT         NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_movie (user_id, movie_id),
  KEY idx_reviews_movie (movie_id),
  CONSTRAINT fk_reviews_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_reviews_movie FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
