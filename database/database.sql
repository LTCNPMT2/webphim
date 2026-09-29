CREATE DATABASE IF NOT EXISTS starfly
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE starfly;

-- =========================
-- PHIM
-- =========================
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    genre VARCHAR(100),
    rating DECIMAL(3,1) DEFAULT 0,
    description TEXT,
    poster VARCHAR(500),
    backdrop VARCHAR(500),
    trailer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- KHÁCH HÀNG
-- =========================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SUẤT CHIẾU
-- =========================
CREATE TABLE showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    room VARCHAR(100) NOT NULL,
    total_seats INT DEFAULT 60,

    FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE
);

-- =========================
-- GHẾ
-- =========================
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    status ENUM('available','sold') DEFAULT 'available',

    FOREIGN KEY (showtime_id)
        REFERENCES showtimes(id)
        ON DELETE CASCADE,

    UNIQUE(showtime_id, seat_number)
);

-- =========================
-- ĐƠN HÀNG
-- =========================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    showtime_id INT NOT NULL,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_content VARCHAR(255),
    status ENUM(
        'pending',
        'paid',
        'cancelled',
        'failed'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    FOREIGN KEY (showtime_id)
        REFERENCES showtimes(id)
);

-- =========================
-- VÉ
-- =========================
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    showtime_id INT NOT NULL,
    seat_id INT NOT NULL,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(12,2) DEFAULT 95000,
    status ENUM('valid','used','cancelled') DEFAULT 'valid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    FOREIGN KEY (showtime_id)
        REFERENCES showtimes(id),

    FOREIGN KEY (seat_id)
        REFERENCES seats(id)
);
