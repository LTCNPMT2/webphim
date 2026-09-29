// =========================================================
// STARFLY — Chạy migration an toàn (KHÔNG xoá / reset database)
// Cách dùng:  npm run migrate
// Chạy lại nhiều lần cũng không tạo dữ liệu trùng.
// =========================================================
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const PROJECT_ROOT = path.resolve(__dirname, "..");

const envPath = path.join(PROJECT_ROOT, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const sqlFile = path.join(PROJECT_ROOT, "database", "migration_starfly_v2.sql");

async function main() {
  if (!fs.existsSync(sqlFile)) {
    console.error("❌ Không tìm thấy file migration_starfly_v2.sql");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "starfly",
    multipleStatements: true,
  });

  console.log("🚀 Đang chạy migration_starfly_v2.sql ...");

  try {
    const [results] = await connection.query(sql);
    const sets = Array.isArray(results) ? results.filter(Array.isArray) : [];

    sets.forEach((rows) => {
      rows.forEach((row) => console.log("   ", JSON.stringify(row)));
    });

    console.log("✅ Migration hoàn tất. Dữ liệu cũ được giữ nguyên.");
  } catch (error) {
    console.error("❌ Migration thất bại:", error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
