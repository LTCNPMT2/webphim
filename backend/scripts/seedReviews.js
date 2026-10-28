const { pool } = require('../src/config/db');

async function addReviews() {
  let [u1] = await pool.execute('SELECT id FROM users WHERE full_name = ?', ['Trần Ngọc Diệp']);
  let u1Id = u1[0]?.id;
  if (!u1Id) {
    const [res] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      ['Trần Ngọc Diệp', 'diep@example.com', '$2a$10$abcdef']
    );
    u1Id = res.insertId;
  }

  let [u2] = await pool.execute('SELECT id FROM users WHERE full_name = ?', ['Nguyễn Quốc Duy']);
  let u2Id = u2[0]?.id;
  if (!u2Id) {
    const [res] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      ['Nguyễn Quốc Duy', 'duy@example.com', '$2a$10$abcdef']
    );
    u2Id = res.insertId;
  }

  await pool.execute(
    'INSERT INTO reviews (movie_id, user_id, rating, comment, created_at) VALUES (?, ?, 5, ?, NOW() - INTERVAL 2 HOUR)',
    [12, u1Id, 'Gây cấn, vừa hài vừa buồn vừa sợ mà thấy hài nhiều hơn. Phim đáng xem, siu hay, rất thích xem phim Việt.']
  );
  await pool.execute(
    'INSERT INTO reviews (movie_id, user_id, rating, comment, created_at) VALUES (?, ?, 5, ?, NOW() - INTERVAL 5 HOUR)',
    [12, u2Id, 'Phim rất hay luôn nha, mình thấy nhiều bạn bảo không bằng Thiên Đường Máu nhưng riêng mình thấy phim có chất riêng. Khúc đầu hơi hụt hẫng xíu nhưng càng xem càng có nhiều tình tiết ăn sâu vào não, kiểu tình tiết gài gắm cũng rất ẩn ý. Tóm lại bản thân mình thấy rất đáng tiền!']
  );
  console.log('Reviews inserted successfully');
  pool.end();
}

addReviews();
