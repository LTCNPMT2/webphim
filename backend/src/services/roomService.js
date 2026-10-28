const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/transaction');
const roomModel = require('../models/roomModel');
const cinemaModel = require('../models/cinemaModel');

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

exports.list = (query) => roomModel.list({ cinema_id: query.cinema_id });

exports.getSeats = async (id) => {
  const room = await roomModel.findById(id);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng chiếu');
  return { room, seats: await roomModel.getSeats(id) };
};

// Tạo phòng và TỰ SINH sơ đồ ghế theo cấu hình:
//   rows hàng (A, B, C...) x cols ghế/hàng; vip_rows = hàng VIP; couple_rows = hàng ghế đôi (cols/2 ghế)
exports.create = async (d) => {
  if (!(await cinemaModel.findById(d.cinema_id))) throw new ApiError(404, 'Không tìm thấy rạp');
  if (await roomModel.nameExists(d.cinema_id, d.name)) {
    throw new ApiError(409, 'Tên phòng đã tồn tại trong rạp này');
  }

  const rowLabels = LETTERS.slice(0, d.rows).split('');
  const vip = new Set(d.vip_rows || []);
  const couple = new Set(d.couple_rows || []);

  for (const r of [...vip, ...couple]) {
    if (!rowLabels.includes(r)) {
      throw new ApiError(400, `Hàng ${r} không nằm trong sơ đồ (${rowLabels[0]}-${rowLabels[rowLabels.length - 1]})`);
    }
  }
  for (const r of vip) {
    if (couple.has(r)) throw new ApiError(400, `Hàng ${r} không thể vừa là VIP vừa là ghế đôi`);
  }
  if (couple.size && d.cols < 2) throw new ApiError(400, 'Hàng ghế đôi cần ít nhất 2 ghế mỗi hàng');

  const surcharge = { standard: 0, vip: d.vip_surcharge ?? 20000, couple: d.couple_surcharge ?? 40000 };
  const coupleSeats = Math.floor(d.cols / 2);

  // Sinh danh sách ghế: [hàng, số ghế, loại]
  const layout = [];
  for (const row of rowLabels) {
    const type = couple.has(row) ? 'couple' : vip.has(row) ? 'vip' : 'standard';
    const count = type === 'couple' ? coupleSeats : d.cols;
    for (let n = 1; n <= count; n++) layout.push([row, n, type]);
  }

  // Tạo phòng + toàn bộ ghế trong 1 transaction: lỗi giữa chừng thì không để lại phòng thiếu ghế
  const roomId = await withTransaction(async (conn) => {
    const id = await roomModel.create(conn, {
      cinema_id: d.cinema_id,
      name: d.name,
      room_type: d.room_type || '2D',
      total_seats: layout.length,
    });
    await roomModel.insertSeats(
      conn,
      layout.map(([row, n, type]) => [id, row, n, type, surcharge[type]])
    );
    return id;
  });

  return exports.getSeats(roomId);
};

// Chỉ sửa tên / loại phòng / trạng thái. Không sửa sơ đồ ghế vì ghế đã gắn với vé đã đặt.
exports.update = async (id, data) => {
  const old = await roomModel.findById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy phòng chiếu');
  if (data.name && (await roomModel.nameExists(old.cinema_id, data.name, id))) {
    throw new ApiError(409, 'Tên phòng đã tồn tại trong rạp này');
  }
  await roomModel.update(id, {
    name: data.name ?? old.name,
    room_type: data.room_type ?? old.room_type,
    is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : old.is_active,
  });
  return roomModel.findById(id);
};

exports.remove = async (id) => {
  if (!(await roomModel.findById(id))) throw new ApiError(404, 'Không tìm thấy phòng chiếu');
  await roomModel.remove(id); // ghế + suất chiếu xóa theo; nếu đã có vé -> 409
};
