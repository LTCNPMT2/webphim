# STARFLY Cinema

Sơ đồ cấu trúc project: [docs/architecture.md](docs/architecture.md). Mở file rồi nhấn `Ctrl+Shift+V` để xem Mermaid Preview.

## Cấu trúc dự án

```text
webphim/
├── admin/                 Trang quản trị
├── ai/                    Trợ lý STARFLY và tài nguyên riêng
├── assets/
│   ├── css/               Giao diện các trang
│   └── js/                Mã giao diện và luồng đặt vé
├── backend/
│   ├── server.js          API và máy chủ web
│   └── run-migration.js   Trình chạy migration
├── database/              SQL, migration và dữ liệu
├── pages/                 Trang đăng nhập và trang vé
├── index.html             Trang chủ
├── package.json           Lệnh chạy và dependencies (giữ ở gốc cho npm)
└── .env.example           Mẫu cấu hình
```

## Chạy STARFLY

Tại thư mục gốc, chạy `npm start`, rồi mở:

- Trang chủ: `http://localhost:3000/`
- Quản trị: `http://localhost:3000/admin/`
- Trợ lý AI: `http://localhost:3000/ai/`
- Đăng nhập: `http://localhost:3000/pages/auth.html`
- Vé: `http://localhost:3000/pages/ticket.html`

Chạy cập nhật cơ sở dữ liệu bằng `npm run migrate`. Cấu hình kết nối nằm trong `.env` ở thư mục gốc; dùng `.env.example` làm mẫu.

Các lệnh cũ `node server.js` và `node run-migration.js` vẫn dùng được; hai file ở gốc chỉ chuyển tiếp sang mã trong `backend/`.

Các URL cũ `/admin.html`, `/auth.html`, `/ticket.html` và `/chat/` vẫn được chuyển tiếp sang vị trí mới.

## Đăng nhập admin

Tài khoản admin cục bộ đã được tạo trong file `.env` ở thư mục gốc. Mở `http://localhost:3000/admin/` để đăng nhập. Nếu đổi máy hoặc tạo lại `.env`, hãy đặt `ADMIN_USERNAME`, `ADMIN_PASSWORD` và `ADMIN_SESSION_SECRET` theo mẫu trong `.env.example`, rồi khởi động lại server. Phiên đăng nhập hết hạn sau 8 giờ.
