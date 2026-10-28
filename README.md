# CineBooking - Website Bán Vé Xem Phim Trực Tuyến 🎬🍿

Dự án website đặt vé xem phim trực tuyến hiện đại, hỗ trợ chọn rạp, chọn suất chiếu, chọn ghế trực quan theo thời gian thực, đặt combo bắp nước, thanh toán tự động qua SePay (VietQR), đăng nhập Google OAuth, và gửi email thông báo đặt vé thành công kèm mã QR soát vé.

---

## 🌟 Tính Năng Nổi Bật

### Phía Khách Hàng (Client)
- **Trang chủ & Lịch chiếu**: Banner slider phim nổi bật, danh sách phim đang chiếu và sắp chiếu, lọc suất chiếu theo ngày và thành phố (Hồ Chí Minh, Hà Nội).
- **Chi tiết phim chuẩn rạp**: Trailer YouTube modal, phân loại độ tuổi (P, T13, T16, T18), thông tin chi tiết (đạo diễn, diễn viên, thời lượng), danh sách diễn viên & hình ảnh cảnh phim, câu hỏi thường gặp (FAQ).
- **Đánh giá & Bình luận**: Đánh giá phim theo thang điểm 10.0 sao, tag cảm xúc, nhận xét từ người xem đã mua vé.
- **Chọn ghế trực quan**: Sơ đồ rạp phân loại ghế Thường, VIP, Đôi (Couple), khóa giữ ghế tạm thời (10 phút) chống đặt trùng ghế thời gian thực (Concurrency Safe).
- **Combo Bắp Nước**: Chọn thêm bắp rang, nước ngọt, combo gia đình tích hợp vào đơn đặt vé.
- **Thanh toán VietQR SePay**: Quét mã QR chuyển khoản ngân hàng tự động xác nhận qua SePay Webhook trong vài giây.
- **Gửi Email Xác Nhận & QR Code Vé**: Tự động gửi email vé điện tử đính kèm mã QR soát vé chữ ký HMAC và email thông báo đăng nhập.
- **Quản lý vé**: Xem lịch sử đặt vé, chi tiết mã vé, trạng thái thanh toán.

### Phía Quản Trị (Admin)
- **Dashboard doanh thu**: Thống kê doanh thu theo ngày, tháng, tổng doanh thu, tỷ lệ lấp đầy rạp, biểu đồ doanh thu theo phim.
- **Quản lý phim**: Thêm/sửa/xóa tác phẩm điện ảnh, upload poster/banner, quản lý diễn viên, hình ảnh, câu hỏi thường gặp.
- **Quản lý rạp & phòng chiếu**: Cấu hình rạp chiếu, loại phòng (2D, 3D, IMAX) và sơ đồ ghế.
- **Quản lý suất chiếu**: Lên lịch chiếu theo phòng, cấu hình giá vé cơ bản.
- **Quản lý đơn hàng & thanh toán**: Tra cứu đơn hàng, soát vé mã QR.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React / Heroicons, Axios, React Router v6.
- **Backend**: Node.js, Express.js, MySQL (mysql2 pool with prepared statements), JWT Authentication, Nodemailer.
- **Database**: MySQL / MariaDB (XAMPP).
- **Cổng thanh toán**: SePay (VietQR chuyển khoản ngân hàng tự động).
- **Gửi Email**: Gmail SMTP / Nodemailer.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Chuẩn Bị
- Cài đặt [Node.js](https://nodejs.org/) (phiên bản 18+ trở lên).
- Cài đặt [XAMPP](https://www.apachefriends.org/) (khởi động Apache & MySQL).

### 2. Nạp Cơ Sở Dữ Liệu
1. Mở phpMyAdmin: `http://localhost/phpmyadmin/`.
2. Import file database đầy đủ tại:
   ```
   database/movie_sales.sql
   ```
   *(File đã tích hợp sẵn lệnh tạo database `movie_booking` và 16 bảng dữ liệu hoàn chỉnh).*

### 3. Cài Đặt Backend
1. Truy cập thư mục backend và cài đặt thư viện:
   ```bash
   cd backend
   npm install
   ```
2. Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Cấu hình thông tin trong file `backend/.env`:
   - `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=movie_booking`
   - `SEPAY_*`: Cấu hình token SePay của bạn.
   - `SMTP_*`: Cấu hình Gmail SMTP (Email + App Password).
4. Khởi động backend server:
   ```bash
   npm run dev
   ```
   *(Backend chạy tại `http://localhost:5000`)*

### 4. Cài Đặt Frontend
1. Mở cửa sổ terminal mới, truy cập thư mục frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Tạo file `.env` từ `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Khởi động giao diện:
   ```bash
   npm run dev
   ```
   *(Frontend chạy tại `http://localhost:5173`)*

---

## 👥 Tài Khoản Mẫu Để Trải Nghiệm

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** | `admin@cinebooking.vn` | `Admin@123456` |
| **Khách hàng** | `user1@gmail.com` | `User@123456` |

---

## 📁 Cấu Trúc Thư Mục

```
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình DB pool, mailer, env
│   │   ├── controllers/     # Controller API
│   │   ├── models/          # Model thao tác DB MySQL
│   │   ├── routes/          # Express routes (auth, catalog, booking, admin...)
│   │   ├── services/        # Business logic (email, sepay webhook, booking...)
│   │   └── validators/      # Validate dữ liệu đầu vào
│   ├── uploads/             # Thư mục lưu ảnh upload
│   └── server.js            # Entry point backend
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Header, Footer, MovieCard, Modal...)
│   │   ├── pages/           # Pages (Home, MovieDetail, Booking, Admin...)
│   │   ├── services/        # Gọi API backend
│   │   └── utils/           # Helper format, constants
│   └── index.html
└── database/
    └── movie_sales.sql      # Database dump hoàn chỉnh
```

