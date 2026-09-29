const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Đọc .env nếu có; không cần lưu thông tin tài khoản trong frontend.
(function loadDotEnv() {
  const envFile = path.join(PROJECT_ROOT, ".env");
  if (!fs.existsSync(envFile)) return;
  const content = fs.readFileSync(envFile, "utf8").replace(/^\uFEFF/, "");
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) return;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  });
})();

const sepayConfig = {
  bank: process.env.SEPAY_BANK || "",
  account: process.env.SEPAY_ACCOUNT || "",
  accountName: process.env.SEPAY_ACCOUNT_NAME || "",
  qrImageUrl: process.env.SEPAY_QR_IMAGE_URL || "",
  qrBase: process.env.SEPAY_QR_BASE || "https://qr.sepay.vn/img",
  template: process.env.SEPAY_QR_TEMPLATE || "compact",
  get configured() {
    return Boolean(this.qrImageUrl || (this.bank && this.account));
  },
};

const SEAT_PRICE = Number(process.env.SEAT_PRICE || 95000);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434")
  .replace(/\/+$/, "")
  .replace(/\/api(?:\/chat)?$/, "");
const OLLAMA_CHAT_URL = `${OLLAMA_BASE_URL}/api/chat`;
const SUPPORT_SYSTEM_PROMPT = [
  "Khi khách muốn đặt vé, hướng dẫn họ nhắn 'đặt vé' kèm đúng tên phim để website mở quy trình chọn suất và ghế. Bạn không được tự nhận đã đặt vé; chỉ website mới xác nhận sau khi khách chọn ghế và bấm Đặt vé.",
  "Bạn là trợ lý hỗ trợ khách hàng của rạp phim STARFLY. Trả lời tự nhiên, thân thiện, ngắn gọn bằng tiếng Việt.",
  "Hướng dẫn khách chọn phim, suất chiếu, ghế, bắp nước, đăng nhập, lưu vé và thanh toán.",
  "STARFLY hỗ trợ tiền mặt tại quầy và chuyển khoản SePay bằng QR nếu rạp đã cấu hình.",
  "Mã xác nhận hiện trên trang vé; khách đưa mã cho nhân viên để tra đơn. Mã SePay cũng là nội dung chuyển khoản.",
  "Bạn không thể đặt, giữ chỗ hoặc xác nhận ghế thay khách. Không được nói một ghế cụ thể còn trống/đã đặt vì bạn không xem được sơ đồ ghế trực tiếp. Hãy hướng dẫn khách tự chọn ghế còn bấm được trên sơ đồ; ghế đã bán sẽ bị khóa và hệ thống từ chối đặt trùng.",
  `Giá vé cơ bản hiện cấu hình là ${SEAT_PRICE.toLocaleString("vi-VN")} đồng; bắp nước và tổng tiền thay đổi theo lựa chọn.`,
  "Bạn không truy cập được cơ sở dữ liệu, lịch chiếu trực tiếp, đơn hàng hay thông tin tài khoản. Đừng bịa trạng thái đơn, suất chiếu, giá món hoặc tình trạng ghế; hướng dẫn khách xem trực tiếp trên STARFLY hoặc đưa mã cho nhân viên.",
  "Nếu câu hỏi ngoài phạm vi rạp, vẫn có thể trả lời ngắn gọn và lịch sự. Không dùng Markdown hoặc danh sách dài.",
].join(" ");

function buildPaymentQrUrl(amount, content) {
  if (sepayConfig.qrImageUrl) return sepayConfig.qrImageUrl;
  if (!sepayConfig.bank || !sepayConfig.account) return "";
  const params = new URLSearchParams({
    acc: sepayConfig.account,
    bank: sepayConfig.bank,
    amount: String(Math.round(Number(amount) || 0)),
    des: content,
    template: sepayConfig.template,
  });
  return `${sepayConfig.qrBase}?${params.toString()}`;
}


// =========================
// CẤU HÌNH MYSQL
// =========================
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "starfly",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// =========================
// MIDDLEWARE
// =========================
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));

const ADMIN_COOKIE = "starfly_admin";
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

function adminCredentialsReady() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

function createAdminToken(expiresAt) {
  const payload = String(expiresAt);
  const signature = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function hasAdminSession(req) {
  if (!adminCredentialsReady()) return false;
  const cookie = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  if (!cookie) return false;
  let token;
  try { token = decodeURIComponent(cookie.slice(ADMIN_COOKIE.length + 1)); } catch { return false; }
  const [payload, suppliedSignature] = token.split(".");
  if (!/^\d+$/.test(payload || "") || !suppliedSignature || Number(payload) <= Date.now()) return false;
  const expected = createAdminToken(Number(payload)).split(".")[1];
  const supplied = Buffer.from(suppliedSignature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return supplied.length === expectedBuffer.length && crypto.timingSafeEqual(supplied, expectedBuffer);
}

function requireAdmin(req, res, next) {
  if (hasAdminSession(req)) return next();
  if (req.originalUrl.startsWith("/api/")) return res.status(401).json({ error: "Vui lòng đăng nhập admin." });
  return res.redirect(302, "/admin/adminlogin.html");
}

app.get(["/admin/adminlogin.html", "/adminlogin"], (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "admin", "adminlogin.html"));
});
app.get("/admin/login.html", (req, res) => res.redirect(302, "/admin/adminlogin.html"));
app.get(["/admin", "/admin/"], requireAdmin, (req, res) => res.sendFile(path.join(PROJECT_ROOT, "admin", "admin.html")));
app.get("/admin/index.html", (req, res) => res.redirect(302, "/admin/"));

app.post("/api/admin/login", (req, res) => {
  if (!adminCredentialsReady()) {
    return res.status(503).json({ error: "Chưa cấu hình tài khoản admin. Hãy thêm ADMIN_USERNAME, ADMIN_PASSWORD và ADMIN_SESSION_SECRET vào file .env rồi khởi động lại server." });
  }
  const username = crypto.createHash("sha256").update(String(req.body?.username || "")).digest();
  const password = crypto.createHash("sha256").update(String(req.body?.password || "")).digest();
  const expectedUsername = crypto.createHash("sha256").update(process.env.ADMIN_USERNAME).digest();
  const expectedPassword = crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD).digest();
  if (!crypto.timingSafeEqual(username, expectedUsername) || !crypto.timingSafeEqual(password, expectedPassword)) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." });
  }
  const expiresAt = Date.now() + ADMIN_SESSION_MS;
  res.setHeader("Set-Cookie", [
    `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0${req.secure ? "; Secure" : ""}`,
    `${ADMIN_COOKIE}=${createAdminToken(expiresAt)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ADMIN_SESSION_MS / 1000}${req.secure ? "; Secure" : ""}`,
  ]);
  return res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.setHeader("Set-Cookie", [
    `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${req.secure ? "; Secure" : ""}`,
    `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0${req.secure ? "; Secure" : ""}`,
  ]);
  return res.json({ ok: true });
});

app.use("/admin", (req, res, next) => {
  if (req.path === "/adminlogin.html") return next();
  return requireAdmin(req, res, next);
}, express.static(path.join(PROJECT_ROOT, "admin")));

// Cho phép các trang STARFLY còn lại chạy trực tiếp.
app.use(express.static(PROJECT_ROOT));

// Keep previously shared page URLs working after the frontend folders move.
app.get("/auth.html", (req, res) => res.redirect(302, "/pages/auth.html"));
app.get("/ticket.html", (req, res) => res.redirect(302, "/pages/ticket.html"));
app.get("/admin.html", (req, res) => res.redirect(302, "/admin/"));
app.get(["/chat", "/chat/", "/chat/index.html"], (req, res) => res.redirect(302, "/ai/"));

app.post("/api/chat", async (req, res) => {
  const messages = Array.isArray(req.body?.messages)
    ? req.body.messages
        .filter((message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string",
        )
        .slice(-24)
        .map((message) => ({
          role: message.role,
          content: message.content.trim().slice(0, 6000),
        }))
        .filter((message) => message.content)
    : [];

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Tin nhắn chưa hợp lệ, bạn thử gửi lại nhé." });
  }

  try {
    const upstream = await fetch(OLLAMA_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "system", content: SUPPORT_SYSTEM_PROMPT }, ...messages],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      if (upstream.status === 404) {
        return res.status(503).json({ error: `Ollama chưa có model ${OLLAMA_MODEL}. Hãy tải model rồi thử lại.` });
      }
      throw new Error(data.error || `Ollama HTTP ${upstream.status}`);
    }

    const reply = data?.message?.content?.trim();
    if (!reply) throw new Error("Ollama returned an empty response");
    return res.json({ reply });
  } catch (error) {
    console.error("STARFLY chat failed:", error.message);
    return res.status(503).json({
      error: "Chưa kết nối được trợ lý AI. Kiểm tra Ollama đang chạy rồi thử lại.",
    });
  }
});

// =========================
// KIỂM TRA DATABASE
// =========================
async function checkDatabase() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Đã kết nối MySQL - database starfly");
    connection.release();
  } catch (error) {
    console.error("❌ Không kết nối được MySQL:");
    console.error(error.message);
    return false;
  }

  return true;
}

// =========================
// TỰ ĐỘNG ĐỒNG BỘ SCHEMA (an toàn: chỉ THÊM cột/bảng, không xoá dữ liệu)
// =========================
async function hasColumn(table, column) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [table, column],
  );

  return Number(rows[0].total) > 0;
}

async function hasIndex(table, indexName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    `,
    [table, indexName],
  );

  return Number(rows[0].total) > 0;
}

// orders.status: trạng thái chờ / đã thanh toán / huỷ đơn
async function ensureOrderStatusEnum() {
  const [statusRow] = await db.query(
    `
    SELECT COLUMN_TYPE AS type
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'status'
    `,
  );

  const statusType = statusRow[0] ? String(statusRow[0].type) : "";

  if (statusType && !statusType.includes("'paid'")) {
    await db.query(`
      ALTER TABLE orders
      MODIFY status ENUM('pending','confirmed','paid','cancelled','failed')
      NOT NULL DEFAULT 'pending'
    `);
    console.log("🔧 orders.status: đã bổ sung trạng thái paid / failed");
  }
}

// movies.id cần AUTO_INCREMENT để Admin thêm phim mới
async function ensureMoviesAutoIncrement() {
  const [idRow] = await db.query(
    `
    SELECT EXTRA AS extra
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'movies'
      AND COLUMN_NAME = 'id'
    `,
  );

  if (idRow[0] && !String(idRow[0].extra).includes("auto_increment")) {
    await db.query(
      "ALTER TABLE movies MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT",
    );
    console.log("🔧 movies.id: đã bật AUTO_INCREMENT");
  }
}

// Bảng bắp nước / combo + dữ liệu mẫu
async function ensureFoodTables() {
  await db.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
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
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_order_items_food FOREIGN KEY (food_item_id)
        REFERENCES food_items(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [foodCount] = await db.query("SELECT COUNT(*) AS total FROM food_items");

  if (Number(foodCount[0].total) === 0) {
    await db.query(
      `
      INSERT IGNORE INTO food_items
        (name, description, category, icon, price)
      VALUES ?
      `,
      [
        [
          ["Bắp rang bơ (L)", "Bắp rang bơ nóng giòn, size lớn", "popcorn", "🍿", 65000],
          ["Bắp rang bơ (M)", "Bắp rang bơ size vừa, vị truyền thống", "popcorn", "🍿", 50000],
          ["Coca-Cola (L)", "Ly Coca-Cola size lớn, đá đầy", "drink", "🥤", 45000],
          ["Pepsi (L)", "Ly Pepsi size lớn, mát lạnh", "drink", "🥤", 45000],
          ["Nước suối Aquafina", "Chai nước suối 500ml", "drink", "💧", 25000],
          ["Combo STARFLY", "1 bắp rang bơ (L) + 2 nước ngọt (L)", "combo", "🎟️", 135000],
          ["Combo Đôi", "2 bắp rang bơ (L) + 2 nước ngọt (L)", "combo", "🎟️", 185000],
          ["Nachos phô mai", "Bánh nachos giòn kèm sốt phô mai", "snack", "🧀", 75000],
          ["Khoai tây chiên", "Khoai tây chiên vàng giòn", "snack", "🍟", 55000],
          ["Hotdog STARFLY", "Xúc xích nướng kèm bánh mì mềm", "snack", "🌭", 60000],
        ],
      ],
    );
    console.log("🔧 food_items: đã thêm danh sách bắp nước mẫu");
  }
}


async function ensureSchema() {
  try {
    if (!(await hasColumn("customers", "password_hash"))) {
      await db.query("ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255) NULL");
      console.log("🔧 customers: đã thêm cột password_hash");
    }

    // ---- orders: bổ sung cột phục vụ đặt vé + thanh toán tiền mặt ----
    const orderColumns = [
      ["showtime_id", "BIGINT UNSIGNED NULL AFTER customer_id"],
      ["payment_content", "VARCHAR(255) NULL"],
      ["food_amount", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
    ];

    for (const [column, definition] of orderColumns) {
      if (!(await hasColumn("orders", column))) {
        await db.query(`ALTER TABLE orders ADD COLUMN ${column} ${definition}`);
        console.log(`🔧 orders: đã thêm cột ${column}`);
      }
    }

    if (!(await hasIndex("orders", "idx_orders_showtime"))) {
      await db.query(
        "ALTER TABLE orders ADD INDEX idx_orders_showtime (showtime_id)",
      );
    }

    if (!(await hasIndex("orders", "idx_orders_status"))) {
      await db.query("ALTER TABLE orders ADD INDEX idx_orders_status (status)");
    }

    await ensureOrderStatusEnum();
    await ensureMoviesAutoIncrement();
    await ensureFoodTables();

    console.log("✅ Schema STARFLY đã sẵn sàng");
  } catch (error) {
    console.error("⚠️  Không đồng bộ được schema:", error.message);
    console.error(
      "   Hãy chạy: npm run migrate để bổ sung bảng/cột còn thiếu.",
    );
  }
}


// =========================
// API: LẤY DANH SÁCH PHIM
// =========================
app.get("/api/movies", async (req, res) => {
  try {
    const [movies] = await db.query(`
      SELECT
        id,
        title,
        year,
        genre,
        rating,
        description,
        poster,
        backdrop,
        trailer
      FROM movies
      ORDER BY id ASC
    `);

    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể lấy danh sách phim.",
    });
  }
});

// =========================
// API: THÊM / SỬA / XOÁ PHIM (Admin)
// =========================
function normalizeMovie(body = {}) {
  const title = String(body.title || "").trim();
  const year = Number(body.year) || 0;
  const genre = String(body.genre || "").trim() || "Khác";
  const rating = Number(body.rating) || 0;
  const description = String(body.description || "").trim();
  const poster = String(body.poster || "").trim();
  const backdrop = String(body.backdrop || "").trim() || poster;
  const trailer = String(body.trailer || "").trim();

  return {
    title,
    year,
    genre,
    rating,
    description,
    poster,
    backdrop,
    trailer,
  };
}

app.post("/api/movies", requireAdmin, async (req, res) => {
  try {
    const movie = normalizeMovie(req.body);

    if (!movie.title || !movie.year) {
      return res.status(400).json({
        error: "Vui lòng nhập tên phim và năm sản xuất.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO movies
        (
          title,
          year,
          genre,
          rating,
          description,
          poster,
          backdrop,
          trailer
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        movie.title,
        movie.year,
        movie.genre,
        movie.rating,
        movie.description,
        movie.poster,
        movie.backdrop,
        movie.trailer,
      ],
    );

    const [created] = await db.query(
      "SELECT * FROM movies WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json(created[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể thêm phim mới.",
    });
  }
});

app.put("/api/movies/:id", requireAdmin, async (req, res) => {
  try {
    const movieId = Number(req.params.id);
    const movie = normalizeMovie(req.body);

    if (!movieId || !movie.title || !movie.year) {
      return res.status(400).json({
        error: "Thông tin phim không hợp lệ.",
      });
    }

    await db.query(
      `
      UPDATE movies
      SET
        title = ?,
        year = ?,
        genre = ?,
        rating = ?,
        description = ?,
        poster = ?,
        backdrop = ?,
        trailer = ?
      WHERE id = ?
      `,
      [
        movie.title,
        movie.year,
        movie.genre,
        movie.rating,
        movie.description,
        movie.poster,
        movie.backdrop,
        movie.trailer,
        movieId,
      ],
    );

    const [updated] = await db.query("SELECT * FROM movies WHERE id = ?", [
      movieId,
    ]);

    res.json(updated[0] || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể cập nhật phim.",
    });
  }
});

app.delete("/api/movies/:id", requireAdmin, async (req, res) => {
  try {
    const movieId = Number(req.params.id);
    const [tickets] = await db.query(
      "SELECT COUNT(*) AS total FROM tickets WHERE movie_id = ?",
      [movieId],
    );

    if (Number(tickets[0].total) > 0) {
      return res.status(400).json({
        error:
          "Phim này đã có vé bán ra, không thể xoá. Hãy xoá suất chiếu liên quan trước.",
      });
    }

    await db.query("DELETE FROM movies WHERE id = ?", [movieId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể xoá phim.",
    });
  }
});

// =========================
// API: BẮP NƯỚC / COMBO
// =========================
app.get("/api/food-items", async (req, res) => {
  try {
    const [foods] = await db.query(`
      SELECT
        id,
        name,
        description,
        category,
        icon,
        price
      FROM food_items
      WHERE is_active = 1
      ORDER BY FIELD(category, 'combo', 'popcorn', 'drink', 'snack'), id ASC
    `);

    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể lấy danh sách bắp nước.",
    });
  }
});

// =========================
// API: XÁC NHẬN THANH TOÁN THỦ CÔNG (Admin)
// =========================
app.post("/api/orders/:id/mark-paid", requireAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).json({ error: "Thiếu orderId." });
    }

    await db.query(
      "UPDATE orders SET status = 'paid' WHERE id = ?",
      [orderId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể cập nhật đơn hàng." });
  }
});

// =========================
// API: DANH SÁCH ĐƠN HÀNG (Admin)
// =========================
app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;

    let sql = `
      SELECT
        o.id,
        o.customer_id,
        o.showtime_id,
        o.total_amount,
        o.food_amount,
        o.payment_content,
        o.status,
        o.created_at,
        c.full_name,
        c.email,
        c.phone,
        m.title,
        s.show_date,
        TIME_FORMAT(s.show_time, '%H:%i') AS show_time,
        s.room,
        (
          SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id
        ) AS ticket_count,
        (
          SELECT COALESCE(SUM(oi.quantity), 0)
          FROM order_items oi WHERE oi.order_id = o.id
        ) AS food_quantity
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN showtimes s ON s.id = o.showtime_id
      LEFT JOIN movies m ON m.id = s.movie_id
      WHERE 1 = 1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          o.payment_content LIKE ?
          OR c.full_name LIKE ?
          OR c.email LIKE ?
          OR c.phone LIKE ?
          OR m.title LIKE ?
        )
      `;

      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (status) {
      sql += " AND o.status = ?";
      params.push(status);
    }

    sql += " ORDER BY o.id DESC LIMIT 300";

    const [orders] = await db.query(sql, params);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể lấy danh sách đơn hàng.",
    });
  }
});

// =========================
// API: ĐỔI TRẠNG THÁI ĐƠN HÀNG (Admin)
// =========================
app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const status = String(req.body.status || "");
    const allowed = ["pending", "confirmed", "paid", "cancelled", "failed"];

    if (!orderId || !allowed.includes(status)) {
      return res.status(400).json({
        error: "Trạng thái đơn hàng không hợp lệ.",
      });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      orderId,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể đổi trạng thái đơn hàng.",
    });
  }
});

// =========================
// API: XOÁ ĐƠN HÀNG (Admin)
// =========================
app.delete("/api/orders/:id", requireAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).json({ error: "Thiếu orderId." });
    }

    // Trả ghế về trạng thái trống rồi xoá vé + đơn
    const [tickets] = await db.query(
      "SELECT seat_id FROM tickets WHERE order_id = ?",
      [orderId],
    );

    for (const ticket of tickets) {
      await db.query("UPDATE seats SET status = 'available' WHERE id = ?", [
        ticket.seat_id,
      ]);
    }

    await db.query("DELETE FROM tickets WHERE order_id = ?", [orderId]);
    await db.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
    await db.query("DELETE FROM orders WHERE id = ?", [orderId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể xoá đơn hàng.",
    });
  }
});

// =========================
// API: LẤY SUẤT CHIẾU
// =========================
app.get("/api/showtimes", async (req, res) => {
  try {
    const { movieId } = req.query;

    let sql = `
      SELECT
        s.id,
        s.movie_id,
        s.show_date,
        TIME_FORMAT(s.show_time, '%H:%i') AS show_time,
        s.room,
        s.total_seats,
        m.title
      FROM showtimes s
      JOIN movies m ON m.id = s.movie_id
    `;

    const params = [];

    if (movieId) {
      sql += " WHERE s.movie_id = ?";
      params.push(Number(movieId));
    }

    sql += " ORDER BY s.show_date ASC, s.show_time ASC";

    const [showtimes] = await db.query(sql, params);

    res.json(showtimes);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể lấy suất chiếu.",
    });
  }
});

// =========================
// GHẾ: sinh 60 ghế cho một suất chiếu (6 hàng x 10 ghế)
// =========================
async function createSeatsForShowtime(connection, showtimeId) {
  const seatRows = [];

  for (let row = 0; row < 6; row++) {
    const letter = String.fromCharCode(65 + row);

    for (let number = 1; number <= 10; number++) {
      seatRows.push([showtimeId, `${letter}${number}`, "available"]);
    }
  }

  await connection.query(
    `
    INSERT INTO seats
      (showtime_id, seat_number, status)
    VALUES ?
    `,
    [seatRows],
  );

  return seatRows.length;
}

// =========================
// API: XOÁ SUẤT CHIẾU
// =========================
app.delete("/api/showtimes/:id", requireAdmin, async (req, res) => {
  try {
    const showtimeId = Number(req.params.id);

    if (!showtimeId) {
      return res.status(400).json({ error: "Thiếu showtimeId." });
    }

    const [tickets] = await db.query(
      "SELECT COUNT(*) AS total FROM tickets WHERE showtime_id = ?",
      [showtimeId],
    );

    if (Number(tickets[0].total) > 0) {
      return res.status(400).json({
        error: "Suất chiếu này đã có vé bán ra nên không thể xoá.",
      });
    }

    await db.query("DELETE FROM orders WHERE showtime_id = ?", [showtimeId]);
    await db.query("DELETE FROM showtimes WHERE id = ?", [showtimeId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể xoá suất chiếu.",
    });
  }
});

// =========================
// API: TẠO NHANH NHIỀU SUẤT CHIẾU (Admin)
// body: { movieId, fromDate, days, times: ["09:00","19:00"], room, totalSeats }
// =========================
app.post("/api/showtimes/bulk", requireAdmin, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      movieId,
      fromDate,
      days = 3,
      times = ["10:00", "19:00"],
      room = "Phòng 1",
      totalSeats = 60,
    } = req.body;

    if (!movieId || !fromDate || !Array.isArray(times) || !times.length) {
      connection.release();
      return res.status(400).json({
        error: "Thiếu thông tin tạo suất chiếu hàng loạt.",
      });
    }

    const dayCount = Math.min(Math.max(Number(days) || 1, 1), 14);
    const created = [];
    const start = new Date(`${fromDate}T00:00:00Z`);

    await connection.beginTransaction();

    for (let offset = 0; offset < dayCount; offset++) {
      const current = new Date(start);
      current.setUTCDate(start.getUTCDate() + offset);
      const showDate = current.toISOString().slice(0, 10);

      for (const time of times) {
        const showTime = String(time).length === 5 ? `${time}:00` : String(time);

        const [existing] = await connection.query(
          `
          SELECT id FROM showtimes
          WHERE movie_id = ?
            AND show_date = ?
            AND show_time = ?
            AND room = ?
          LIMIT 1
          `,
          [movieId, showDate, showTime, room],
        );

        if (existing.length) continue;

        const [result] = await connection.query(
          `
          INSERT INTO showtimes
            (movie_id, show_date, show_time, room, total_seats)
          VALUES (?, ?, ?, ?, ?)
          `,
          [movieId, showDate, showTime, room, totalSeats],
        );

        await createSeatsForShowtime(
          connection,
          result.insertId,
        );

        created.push(result.insertId);
      }
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, created: created.length });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    connection.release();

    console.error(error);

    res.status(500).json({
      error: "Không thể tạo suất chiếu hàng loạt.",
    });
  }
});

// =========================
// API: LẤY GHẾ
// =========================
app.get("/api/seats", async (req, res) => {
  try {
    const showtimeId = Number(req.query.showtimeId);

    if (!showtimeId) {
      return res.status(400).json({
        error: "Thiếu showtimeId.",
      });
    }

    const [seats] = await db.query(
      `
      SELECT
        id,
        showtime_id,
        seat_number,
        status
      FROM seats
      WHERE showtime_id = ?
      ORDER BY id ASC
      `,
      [showtimeId],
    );

    res.json(seats);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể lấy danh sách ghế.",
    });
  }
});

// =========================
// API: CẬP NHẬT TRẠNG THÁI GHẾ (Admin)
// body: { status: 'available' | 'sold' }
// =========================
app.patch("/api/seats/:id", requireAdmin, async (req, res) => {
  try {
    const seatId = Number(req.params.id);
    const status = String(req.body.status || "");

    if (!seatId || !["available", "sold"].includes(status)) {
      return res.status(400).json({
        error: "Trạng thái ghế không hợp lệ.",
      });
    }

    await db.query("UPDATE seats SET status = ? WHERE id = ?", [status, seatId]);

    const [seats] = await db.query(
      `
      SELECT
        id,
        showtime_id,
        seat_number,
        status
      FROM seats
      WHERE id = ?
      `,
      [seatId],
    );

    res.json(seats[0] || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể cập nhật ghế.",
    });
  }
});

// =========================
// API: TẠO / LẤY KHÁCH HÀNG
// =========================
function hashCustomerPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyCustomerPassword(password, storedHash) {
  const [salt, hashHex] = String(storedHash || "").split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function publicCustomer(customer) {
  return {
    id: customer.id,
    full_name: customer.full_name,
    email: customer.email,
    phone: customer.phone,
  };
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "");

    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !phone || password.length < 8) {
      return res.status(400).json({
        error: "Nhập đúng họ tên, email, số điện thoại và mật khẩu từ 8 ký tự.",
      });
    }

    const [existing] = await db.query(
      "SELECT id, full_name, email, phone, password_hash FROM customers WHERE email = ? OR phone = ? LIMIT 1",
      [email, phone],
    );

    let customerId;
    if (existing.length) {
      const customer = existing[0];
      if (customer.password_hash) {
        return res.status(409).json({ error: "Email hoặc số điện thoại đã có tài khoản." });
      }
      if (customer.email.toLowerCase() !== email || customer.phone !== phone) {
        return res.status(409).json({
          error: "Thông tin trùng với hồ sơ khách cũ nhưng email và số điện thoại không khớp.",
        });
      }
      customerId = customer.id;
      await db.query(
        "UPDATE customers SET full_name = ?, password_hash = ? WHERE id = ?",
        [fullName, hashCustomerPassword(password), customerId],
      );
    } else {
      const [created] = await db.query(
        "INSERT INTO customers (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
        [fullName, email, phone, hashCustomerPassword(password)],
      );
      customerId = created.insertId;
    }

    const [rows] = await db.query(
      "SELECT id, full_name, email, phone FROM customers WHERE id = ?",
      [customerId],
    );
    res.status(201).json(publicCustomer(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể tạo tài khoản." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone, password_hash FROM customers WHERE email = ? LIMIT 1",
      [email],
    );

    if (!rows.length || !verifyCustomerPassword(password, rows[0].password_hash)) {
      return res.status(401).json({ error: "Email hoặc mật khẩu chưa chính xác." });
    }

    res.json(publicCustomer(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không thể đăng nhập." });
  }
});

app.post("/api/customer", async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        error: "Vui lòng nhập đầy đủ họ tên, email và số điện thoại.",
      });
    }

    const [existing] = await db.query(
      `
      SELECT id, full_name, email, phone, password_hash
      FROM customers
      WHERE email = ? OR phone = ?
      ORDER BY id ASC
      LIMIT 1
      `,
      [email, phone],
    );

    if (existing.length) {
      const customer = existing[0];

      if (
        customer.password_hash &&
        (customer.full_name !== fullName || customer.email.toLowerCase() !== email.toLowerCase() || customer.phone !== phone)
      ) {
        return res.status(403).json({
          error: "Thông tin tài khoản không khớp. Hãy đăng nhập để đặt vé bằng tài khoản này.",
        });
      }

      await db.query(
        `
        UPDATE customers
        SET full_name = ?, email = ?, phone = ?
        WHERE id = ?
        `,
        [fullName, email, phone, customer.id],
      );

      const [updated] = await db.query(
        `
        SELECT id, full_name, email, phone
        FROM customers
        WHERE id = ?
        `,
        [customer.id],
      );

      return res.json(updated[0]);
    }

    const [result] = await db.query(
      `
      INSERT INTO customers
        (full_name, email, phone)
      VALUES (?, ?, ?)
      `,
      [fullName, email, phone],
    );

    const [customer] = await db.query(
      `
      SELECT id, full_name, email, phone
      FROM customers
      WHERE id = ?
      `,
      [result.insertId],
    );

    res.json(customer[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể lưu thông tin khách hàng.",
    });
  }
});

// =========================
// API: ĐẶT VÉ
// =========================
app.post("/api/booking", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      customerId,
      showtimeId,
      seatIds,
      foodItems,
      paymentMethod = "cash",
    } = req.body;

    if (!["cash", "sepay"].includes(paymentMethod)) {
      connection.release();
      return res.status(400).json({ error: "Phương thức thanh toán không hợp lệ." });
    }

    if (paymentMethod === "sepay" && !sepayConfig.configured) {
      connection.release();
      return res.status(503).json({
        error: "Chưa cấu hình mã QR SePay. Thêm SEPAY_QR_IMAGE_URL hoặc SEPAY_BANK và SEPAY_ACCOUNT vào file .env.",
      });
    }

    if (
      !customerId ||
      !showtimeId ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0
    ) {
      connection.release();

      return res.status(400).json({
        error: "Thông tin đặt vé không hợp lệ.",
      });
    }

    await connection.beginTransaction();

    // Kiểm tra ghế
    const placeholders = seatIds.map(() => "?").join(",");

    const [seats] = await connection.query(
      `
      SELECT *
      FROM seats
      WHERE id IN (${placeholders})
      AND showtime_id = ?
      FOR UPDATE
      `,
      [...seatIds, showtimeId],
    );

    if (seats.length !== seatIds.length) {
      await connection.rollback();
      connection.release();

      return res.status(400).json({
        error: "Một hoặc nhiều ghế không tồn tại.",
      });
    }

    const soldSeats = seats.filter(
      (seat) => seat.status === "sold",
    );

    if (soldSeats.length > 0) {
      await connection.rollback();
      connection.release();

      return res.status(400).json({
        error: "Một hoặc nhiều ghế đã được người khác đặt.",
      });
    }

    // ---- Suất chiếu (cần movie_id để lưu vào bảng tickets) ----
    const [showtimeRows] = await connection.query(
      `
      SELECT id, movie_id
      FROM showtimes
      WHERE id = ?
      LIMIT 1
      `,
      [showtimeId],
    );

    if (!showtimeRows.length) {
      await connection.rollback();
      connection.release();

      return res.status(400).json({
        error: "Suất chiếu không tồn tại.",
      });
    }

    const movieId = showtimeRows[0].movie_id;

    // ---- Bắp & nước (khách có thể chọn thêm) ----
    const foodList = Array.isArray(foodItems) ? foodItems : [];
    const foodIds = foodList
      .map((item) => Number(item.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    let foodRows = [];
    let foodAmount = 0;

    if (foodIds.length) {
      const [rows] = await connection.query(
        `
        SELECT id, name, price
        FROM food_items
        WHERE id IN (${foodIds.map(() => "?").join(",")})
          AND is_active = 1
        `,
        foodIds,
      );

      foodRows = rows
        .map((item) => {
          const requested = foodList.find(
            (entry) => Number(entry.id) === Number(item.id),
          );
          const quantity = Math.min(
            Math.max(Number(requested && requested.quantity) || 1, 1),
            20,
          );

          foodAmount += Number(item.price) * quantity;

          return {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity,
          };
        })
        .filter((item) => item.quantity > 0);
    }

    // ---- Tính tiền ----
    const price = SEAT_PRICE;
    const seatAmount = price * seatIds.length;
    const totalAmount = seatAmount + foodAmount;

    const paymentContent = `${paymentMethod === "cash" ? "CASH" : "STARFLY"}${Date.now()}`;

    // Tạo order
    const [orderResult] = await connection.query(
      `
      INSERT INTO orders
        (
          customer_id,
          showtime_id,
          total_amount,
          food_amount,
          payment_content,
          status
        )
      VALUES (?, ?, ?, ?, ?, 'pending')
      `,
      [customerId, showtimeId, totalAmount, foodAmount, paymentContent],
    );

    const orderId = orderResult.insertId;

    // Lưu bắp nước vào đơn hàng
    if (foodRows.length) {
      await connection.query(
        `
        INSERT INTO order_items
          (order_id, food_item_id, food_name, quantity, unit_price)
        VALUES ?
        `,
        [
          foodRows.map((item) => [
            orderId,
            item.id,
            item.name,
            item.quantity,
            item.price,
          ]),
        ],
      );
    }

    const ticketCodes = [];

    // Tạo vé
    for (const seat of seats) {
      const ticketCode =
        `SF-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      ticketCodes.push(ticketCode);

      await connection.query(
        `
        INSERT INTO tickets
          (
            order_id,
            customer_id,
            movie_id,
            showtime_id,
            seat_id,
            seat_number,
            ticket_code,
            price,
            status
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'valid')
        `,
        [
          orderId,
          customerId,
          movieId,
          showtimeId,
          seat.id,
          seat.seat_number,
          ticketCode,
          price,
        ],
      );

      // Khóa ghế
      await connection.query(
        `
        UPDATE seats
        SET status = 'sold'
        WHERE id = ?
        `,
        [seat.id],
      );
    }

    await connection.commit();
    connection.release();

    const qrUrl = paymentMethod === "sepay"
      ? buildPaymentQrUrl(totalAmount, paymentContent)
      : "";

    res.json({
      success: true,
      orderId,
      tickets: ticketCodes,
      paymentContent,
      paymentMethod,
      qrUrl,
      seatAmount,
      foodAmount,
      totalAmount,
      foodItems: foodRows,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    connection.release();

    console.error(error);

    res.status(500).json({
      error: "Không thể tạo đơn đặt vé.",
    });
  }
});

// =========================
// API: KIỂM TRA ĐƠN HÀNG
// =========================
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    const [orders] = await db.query(
      `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
      `,
      [orderId],
    );

    if (!orders.length) {
      return res.status(404).json({
        error: "Không tìm thấy đơn hàng.",
      });
    }

    const [foodItems] = await db.query(
      `
      SELECT
        food_item_id,
        food_name,
        quantity,
        unit_price
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
      `,
      [orderId],
    );

    res.json({
      order: orders[0],
      foodItems,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Không thể kiểm tra đơn hàng.",
    });
  }
});

// =========================
// API: LẤY VÉ
// =========================
app.get("/api/tickets", (req, res, next) => req.query.customer_id ? next() : requireAdmin(req, res, next), async (req, res) => {
  try {
    const { search = "", status = "", customer_id: customerId = "" } = req.query;

    let sql = `
      SELECT
        t.id,
        t.ticket_code,
        t.customer_id,
        t.price,
        t.status,
        c.full_name,
        c.email,
        m.title,
        s.show_date,
        TIME_FORMAT(s.show_time, '%H:%i') AS show_time,
        s.room,
        seats.seat_number
      FROM tickets t
      JOIN customers c
        ON c.id = t.customer_id
      JOIN showtimes s
        ON s.id = t.showtime_id
      JOIN movies m
        ON m.id = s.movie_id
      JOIN seats
        ON seats.id = t.seat_id
      WHERE 1 = 1
    `;

    const params = [];

    if (customerId) {
      sql += " AND t.customer_id = ?";
      params.push(Number(customerId));
    }

    if (search) {
      sql += `
        AND (
          t.ticket_code LIKE ?
          OR c.full_name LIKE ?
          OR c.email LIKE ?
          OR m.title LIKE ?
        )
      `;

      const keyword = `%${search}%`;

      params.push(
        keyword,
        keyword,
        keyword,
        keyword,
      );
    }

    if (status) {
      sql += " AND t.status = ?";
      params.push(status);
    }

    sql += " ORDER BY t.id DESC";

    const [tickets] = await db.query(sql, params);

    res.json(tickets);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Không thể lấy danh sách vé.",
    });
  }
});

// =========================
// API: ĐỔI TRẠNG THÁI VÉ (Admin)
// =========================
app.patch("/api/tickets/:id", requireAdmin, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const status = String(req.body.status || "");
    const allowed = ["valid", "used", "cancelled"];

    if (!ticketId || !allowed.includes(status)) {
      return res.status(400).json({
        error: "Trạng thái vé không hợp lệ.",
      });
    }

    await db.query("UPDATE tickets SET status = ? WHERE id = ?", [
      status,
      ticketId,
    ]);

    // Vé bị huỷ thì mở lại ghế
    if (status === "cancelled") {
      const [rows] = await db.query(
        "SELECT seat_id FROM tickets WHERE id = ?",
        [ticketId],
      );

      if (rows.length) {
        await db.query("UPDATE seats SET status = 'available' WHERE id = ?", [
          rows[0].seat_id,
        ]);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể đổi trạng thái vé.",
    });
  }
});

// =========================
// API: XOÁ VÉ (Admin)
// =========================
app.delete("/api/tickets/:id", requireAdmin, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    if (!ticketId) {
      return res.status(400).json({ error: "Thiếu ticketId." });
    }

    const [rows] = await db.query(
      "SELECT seat_id FROM tickets WHERE id = ?",
      [ticketId],
    );

    if (rows.length) {
      await db.query("UPDATE seats SET status = 'available' WHERE id = ?", [
        rows[0].seat_id,
      ]);
    }

    await db.query("DELETE FROM tickets WHERE id = ?", [ticketId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể xoá vé.",
    });
  }
});

// =========================
// API: DANH SÁCH KHÁCH HÀNG
// =========================
app.get("/api/customers", requireAdmin, async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT
        c.id,
        c.full_name,
        c.email,
        c.phone,

        GROUP_CONCAT(DISTINCT m.title
          ORDER BY m.title
          SEPARATOR ', '
        ) AS movies,

        GROUP_CONCAT(DISTINCT seats.seat_number
          ORDER BY seats.seat_number
          SEPARATOR ', '
        ) AS seats,

        COUNT(t.id) AS ticket_count,

        COALESCE(
          SUM(
            CASE
              WHEN t.status != 'cancelled'
              THEN t.price
              ELSE 0
            END
          ),
          0
        ) AS total_spent,

        CASE
          WHEN COUNT(t.id) > 0
          THEN 'Đã đặt vé'
          ELSE 'Chưa đặt vé'
        END AS status

      FROM customers c

      LEFT JOIN tickets t
        ON t.customer_id = c.id

      LEFT JOIN showtimes s
        ON s.id = t.showtime_id

      LEFT JOIN movies m
        ON m.id = s.movie_id

      LEFT JOIN seats
        ON seats.id = t.seat_id

      GROUP BY
        c.id,
        c.full_name,
        c.email,
        c.phone

      ORDER BY c.id DESC
    `);

    res.json(customers);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Không thể lấy danh sách khách hàng.",
    });
  }
});

// =========================
// API: SỬA / XOÁ KHÁCH HÀNG (Admin)
// =========================
app.put("/api/customers/:id", requireAdmin, async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!customerId || !fullName || !email || !phone) {
      return res.status(400).json({
        error: "Vui lòng nhập đủ họ tên, email và số điện thoại.",
      });
    }

    await db.query(
      `
      UPDATE customers
      SET full_name = ?, email = ?, phone = ?
      WHERE id = ?
      `,
      [fullName, email, phone, customerId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể cập nhật khách hàng (email/số điện thoại có thể đã tồn tại).",
    });
  }
});

app.delete("/api/customers/:id", requireAdmin, async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!customerId) {
      return res.status(400).json({ error: "Thiếu customerId." });
    }

    const [tickets] = await db.query(
      "SELECT COUNT(*) AS total FROM tickets WHERE customer_id = ?",
      [customerId],
    );
    const [orders] = await db.query(
      "SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?",
      [customerId],
    );

    if (Number(tickets[0].total) > 0 || Number(orders[0].total) > 0) {
      return res.status(400).json({
        error: "Khách hàng đã có đơn/vé, không thể xoá. Hãy xoá đơn hàng trước.",
      });
    }

    await db.query("DELETE FROM customers WHERE id = ?", [customerId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể xoá khách hàng.",
    });
  }
});

// =========================
// API: THÊM SUẤT CHIẾU
// =========================
app.post("/api/showtimes", requireAdmin, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      movieId,
      showDate,
      showTime,
      room,
      totalSeats = 60,
    } = req.body;

    if (!movieId || !showDate || !showTime || !room) {
      connection.release();

      return res.status(400).json({
        error: "Thiếu thông tin suất chiếu.",
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO showtimes
        (
          movie_id,
          show_date,
          show_time,
          room,
          total_seats
        )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        movieId,
        showDate,
        showTime,
        room,
        totalSeats,
      ],
    );

    const showtimeId = result.insertId;

    // Tạo 60 ghế
    const seatRows = [];

    for (let row = 0; row < 6; row++) {
      const letter = String.fromCharCode(65 + row);

      for (let number = 1; number <= 10; number++) {
        seatRows.push([
          showtimeId,
          `${letter}${number}`,
          "available",
        ]);
      }
    }

    await connection.query(
      `
      INSERT INTO seats
        (
          showtime_id,
          seat_number,
          status
        )
      VALUES ?
      `,
      [seatRows],
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      showtimeId,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    connection.release();

    console.error(error);

    res.status(500).json({
      error: "Không thể tạo suất chiếu.",
    });
  }
});

// =========================
// TRANG CHỦ
// =========================
app.get("/", (req, res) => {
  res.sendFile(
    path.join(PROJECT_ROOT, "index.html"),
  );
});

// =========================
// CHẠY SERVER
// =========================
app.listen(PORT, async () => {
  console.log("");
  console.log("🚀 STARFLY SERVER ĐANG CHẠY");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("");

  const connected = await checkDatabase();

  if (!connected) return;

  await ensureSchema();

  console.log("💵 Thanh toán tiền mặt tại quầy STARFLY");
});
