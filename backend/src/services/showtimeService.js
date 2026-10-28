const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/transaction');
const { parseDateTime } = require('../utils/datetime');
const { parsePagination, buildMeta } = require('../utils/pagination');
const showtimeModel = require('../models/showtimeModel');
const movieModel = require('../models/movieModel');
const roomModel = require('../models/roomModel');
const seatModel = require('../models/seatModel');

const CLEANING_MINUTES = 15; // thời gian dọn phòng giữa 2 suất

// Chuyển danh sách phẳng thành nhóm theo rạp: [{ cinema, showtimes: [...] }]
function groupByCinema(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.cinema_id)) {
      map.set(r.cinema_id, {
        cinema: { id: r.cinema_id, name: r.cinema_name, address: r.cinema_address, city: r.cinema_city },
        showtimes: [],
      });
    }
    map.get(r.cinema_id).showtimes.push({
      id: r.id,
      movie_id: r.movie_id,
      movie_title: r.movie_title,
      poster_url: r.poster_url,
      duration_minutes: r.duration_minutes,
      age_rating: r.age_rating,
      genres: r.genres,
      start_time: r.start_time,
      end_time: r.end_time,
      base_price: r.base_price,
      room_id: r.room_id,
      room_name: r.room_name,
      room_type: r.room_type,
      total_seats: r.total_seats,
      available_seats: r.total_seats - r.booked_seats,
    });
  }
  return [...map.values()];
}

exports.listPublic = async (query) => groupByCinema(await showtimeModel.publicList(query));

exports.getPublicById = async (id) => {
  const s = await showtimeModel.findPublicById(id);
  if (!s) throw new ApiError(404, 'Không tìm thấy suất chiếu');
  s.available_seats = s.total_seats - s.booked_seats;
  return s;
};

// Sơ đồ ghế của suất chiếu: mỗi ghế có trạng thái available / holding / booked và giá cuối cùng
exports.getSeatMap = async (id) => {
  const s = await showtimeModel.findPublicById(id);
  if (!s) throw new ApiError(404, 'Không tìm thấy suất chiếu');

  const rows = await seatModel.getSeatMap(id, s.room_id);
  const seats = rows.map((r) => ({
    id: r.id,
    row_label: r.row_label,
    seat_number: r.seat_number,
    seat_type: r.seat_type,
    price: s.base_price + r.price_surcharge, // giá vé thực tế của ghế này
    status: r.status,
  }));

  return {
    showtime: {
      id: s.id, movie_title: s.movie_title, cinema_name: s.cinema_name, room_name: s.room_name,
      room_type: s.room_type, start_time: s.start_time, end_time: s.end_time, base_price: s.base_price,
    },
    seats,
    summary: {
      total: seats.length,
      available: seats.filter((x) => x.status === 'available').length,
      holding: seats.filter((x) => x.status === 'holding').length,
      booked: seats.filter((x) => x.status === 'booked').length,
    },
  };
};

exports.listAdmin = async (query) => {
  const { page, limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const { rows, total } = await showtimeModel.adminList(query, { limit, offset });
  return { items: rows, pagination: buildMeta(page, limit, total) };
};

// Kiểm tra hợp lệ rồi tính end_time. Gọi bên trong transaction sau khi đã khóa phòng.
async function checkSlot(conn, { movie, roomId, start, excludeId = 0, requireFuture }) {
  const { end_time, is_future } = await showtimeModel.computeTimes(
    conn, start, movie.duration_minutes + CLEANING_MINUTES
  );
  if (requireFuture && !is_future) throw new ApiError(400, 'Giờ chiếu phải ở tương lai');

  const clash = await showtimeModel.findOverlap(conn, roomId, start, end_time, excludeId);
  if (clash) {
    throw new ApiError(409, `Trùng giờ với suất chiếu phim "${clash.title}" trong cùng phòng (mã suất ${clash.id})`);
  }
  return end_time;
}

async function loadMovieAndRoom(movieId, roomId) {
  const movie = await movieModel.findById(movieId);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim');
  if (movie.status === 'ended') throw new ApiError(400, 'Phim đã ngừng chiếu, không thể tạo suất');

  const room = await roomModel.findById(roomId);
  if (!room) throw new ApiError(404, 'Không tìm thấy phòng chiếu');
  if (!room.is_active) throw new ApiError(400, 'Phòng chiếu đang tạm ngưng hoạt động');
  return { movie, room };
}

exports.create = async (data) => {
  const start = parseDateTime(data.start_time);
  const { movie } = await loadMovieAndRoom(data.movie_id, data.room_id);

  const id = await withTransaction(async (conn) => {
    await showtimeModel.lockRoom(conn, data.room_id); // chống 2 người tạo trùng giờ cùng lúc
    const end_time = await checkSlot(conn, { movie, roomId: data.room_id, start, requireFuture: true });
    return showtimeModel.create(conn, {
      movie_id: data.movie_id,
      room_id: data.room_id,
      start_time: start,
      end_time,
      base_price: data.base_price,
    });
  });

  return showtimeModel.findRawById(id);
};

exports.update = async (id, data) => {
  const old = await showtimeModel.findRawById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy suất chiếu');

  const movieId = data.movie_id ?? old.movie_id;
  const roomId = data.room_id ?? old.room_id;
  const start = data.start_time !== undefined ? parseDateTime(data.start_time) : old.start_time_str;

  const slotChanged = movieId !== old.movie_id || roomId !== old.room_id || start !== old.start_time_str;

  // Đã có người giữ/đặt ghế thì không được dời phim/phòng/giờ (sẽ làm sai vé của khách)
  if (slotChanged && (await showtimeModel.hasActiveSeats(id))) {
    throw new ApiError(409, 'Suất chiếu đã có người đặt vé, không thể đổi phim, phòng hoặc giờ chiếu');
  }

  const base_price = data.base_price ?? old.base_price;
  const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : old.is_active;

  if (slotChanged) {
    const { movie } = await loadMovieAndRoom(movieId, roomId);
    await withTransaction(async (conn) => {
      await showtimeModel.lockRoom(conn, roomId);
      const end_time = await checkSlot(conn, { movie, roomId, start, excludeId: id, requireFuture: true });
      await showtimeModel.update(conn, id, {
        movie_id: movieId, room_id: roomId, start_time: start, end_time, base_price, is_active,
      });
    });
  } else {
    // Chỉ đổi giá / trạng thái: không cần kiểm tra trùng giờ
    await showtimeModel.updatePriceStatus(id, { base_price, is_active });
  }

  return showtimeModel.findRawById(id);
};

exports.remove = async (id) => {
  if (!(await showtimeModel.findRawById(id))) throw new ApiError(404, 'Không tìm thấy suất chiếu');
  await showtimeModel.remove(id); // đã có đơn đặt vé -> 409. Muốn ẩn suất thì cập nhật is_active = false
};
