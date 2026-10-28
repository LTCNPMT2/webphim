# ERD - movie_booking

Xem sơ đồ: dán khối `mermaid` bên dưới vào https://mermaid.live hoặc mở file này bằng VS Code (cài extension "Markdown Preview Mermaid Support").

```mermaid
erDiagram
    users ||--o{ bookings : "đặt (1-N)"
    users ||--o{ reviews : "viết (1-N)"
    movies ||--o{ reviews : "có (1-N)"
    movies ||--o{ showtimes : "có suất chiếu (1-N)"
    movies }o--o{ genres : "movie_genres (N-N)"
    cinemas ||--o{ rooms : "có (1-N)"
    rooms ||--o{ seats : "gồm (1-N)"
    rooms ||--o{ showtimes : "chiếu tại (1-N)"
    showtimes ||--o{ bookings : "được đặt (1-N)"
    promotions |o--o{ bookings : "áp dụng (0..1 - N)"
    bookings ||--o{ booking_seats : "gồm ghế (1-N)"
    seats ||--o{ booking_seats : "được đặt (1-N)"
    showtimes ||--o{ booking_seats : "của suất (1-N)"
    bookings ||--o{ booking_combos : "gồm combo (1-N)"
    combos ||--o{ booking_combos : "được chọn (1-N)"
    bookings ||--o{ payments : "thanh toán (1-N)"

    users {
        int id PK
        varchar email UK
        varchar password_hash
        enum role "user|admin"
        tinyint is_active
    }
    movies {
        int id PK
        varchar title
        varchar slug UK
        smallint duration_minutes
        enum age_rating
        enum status "coming_soon|now_showing|ended"
    }
    genres { int id PK  varchar name UK }
    movie_genres { int movie_id PK,FK  int genre_id PK,FK }
    cinemas { int id PK  varchar name  varchar city }
    rooms { int id PK  int cinema_id FK  enum room_type }
    seats {
        int id PK
        int room_id FK
        char row_label
        tinyint seat_number
        enum seat_type "standard|vip|couple"
    }
    showtimes {
        int id PK
        int movie_id FK
        int room_id FK
        datetime start_time
        datetime end_time
        int base_price
    }
    promotions { int id PK  varchar code UK  enum discount_type }
    bookings {
        int id PK
        varchar booking_code UK
        int user_id FK
        int showtime_id FK
        int promotion_id FK
        enum status "pending|paid|cancelled|expired"
        datetime expires_at
    }
    booking_seats {
        int id PK
        int booking_id FK
        int showtime_id FK
        int seat_id FK
        tinyint active "UNIQUE(showtime_id,seat_id,active)"
    }
    combos { int id PK  varchar name  int price }
    booking_combos { int id PK  int booking_id FK  int combo_id FK  int quantity }
    payments { int id PK  int booking_id FK  enum method  enum status }
    reviews { int id PK  int user_id FK  int movie_id FK  tinyint rating }
```

## Quan hệ chính
| Loại | Quan hệ |
|---|---|
| 1-N | users→bookings, movies→showtimes, cinemas→rooms, rooms→seats, rooms→showtimes, bookings→booking_seats/booking_combos/payments |
| N-N | movies ↔ genres (qua movie_genres), bookings ↔ seats (qua booking_seats), bookings ↔ combos (qua booking_combos) |
| 1-1 (logic) | 1 ghế trong 1 suất chiếu chỉ thuộc 1 booking đang hoạt động (ràng buộc UNIQUE) |

## Cơ chế chống đặt trùng ghế
`booking_seats` có `UNIQUE(showtime_id, seat_id, active)`:
- Ghế đang giữ/đã bán: `active = 1` → DB không cho chèn dòng thứ 2 cùng suất + cùng ghế.
- Khi hủy/hết hạn: `UPDATE booking_seats SET active = NULL WHERE booking_id = ?` → ghế được nhả, vẫn giữ lịch sử (MySQL/MariaDB cho phép nhiều giá trị NULL trong UNIQUE).
- Giai đoạn 4 sẽ kết hợp thêm transaction + `SELECT ... FOR UPDATE` để lỗi báo thân thiện hơn.

## Luồng trạng thái booking
`pending` (giữ ghế, có `expires_at`) → `paid` (thanh toán thành công) | `cancelled` (người dùng hủy) | `expired` (quá hạn, cron nhả ghế)
