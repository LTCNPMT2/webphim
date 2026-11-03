-- =====================================================================
-- CẬP NHẬT PHÂN QUYỀN NHÂN VIÊN (RBAC) CHO CINEBOOKING
-- Hỗ trợ phân quyền nhân viên linh hoạt theo chức năng
-- =====================================================================

USE movie_booking;

-- 1. Bổ sung role 'staff', cột staff_title và permissions cho bảng users
ALTER TABLE users MODIFY COLUMN role ENUM('user','staff','admin') NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_title VARCHAR(100) NULL DEFAULT NULL AFTER role;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT NULL DEFAULT NULL AFTER staff_title;

-- 2. Bổ sung trường soát vé cho bảng bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_at DATETIME NULL DEFAULT NULL AFTER cancelled_at;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_by INT UNSIGNED NULL DEFAULT NULL AFTER checked_in_at;

-- 3. Tạo tài khoản nhân viên mẫu (Mật khẩu: Staff@123456)
-- Hash: $2a$10$SCQqClqt34uMguEd/IiPUukil35VqGL9EizkYXmfm7DZq2iHVbs3K
INSERT INTO users (full_name, email, password_hash, phone, role, staff_title, permissions)
VALUES 
('Nhân Viên Tổng Hợp', 'staff@cinebooking.vn', '$2a$10$SCQqClqt34uMguEd/IiPUukil35VqGL9EizkYXmfm7DZq2iHVbs3K', '0911000001', 'staff', 'Nhân viên Vận hành Rạp', '["dashboard:view","movies:manage","genres:manage","cinemas:manage","rooms:manage","showtimes:manage","combos:manage","promotions:manage","bookings:manage","tickets:checkin"]'),
('Nhân Viên Quầy Vé', 've@cinebooking.vn', '$2a$10$SCQqClqt34uMguEd/IiPUukil35VqGL9EizkYXmfm7DZq2iHVbs3K', '0911000002', 'staff', 'Nhân viên Quầy vé & Soát vé', '["bookings:manage","tickets:checkin"]'),
('Nhân Viên Lịch Chiếu', 'lichchieu@cinebooking.vn', '$2a$10$SCQqClqt34uMguEd/IiPUukil35VqGL9EizkYXmfm7DZq2iHVbs3K', '0911000003', 'staff', 'Nhân viên Lịch chiếu & Phim', '["movies:manage","genres:manage","showtimes:manage","rooms:manage"]')
ON DUPLICATE KEY UPDATE 
role = VALUES(role),
staff_title = VALUES(staff_title),
permissions = VALUES(permissions);
