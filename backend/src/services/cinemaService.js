const ApiError = require('../utils/ApiError');
const cinemaModel = require('../models/cinemaModel');

const textOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

exports.listPublic = async (query) => {
  const cinemas = await cinemaModel.list({ city: query.city, onlyActive: true });
  for (const c of cinemas) {
    c.rooms = await cinemaModel.getActiveRooms(c.id);
  }
  return cinemas;
};
exports.listAdmin = (query) => cinemaModel.list({ city: query.city, onlyActive: false });

exports.getPublicById = async (id) => {
  const cinema = await cinemaModel.findById(id);
  if (!cinema || !cinema.is_active) throw new ApiError(404, 'Không tìm thấy rạp');
  cinema.rooms = await cinemaModel.getActiveRooms(id);
  return cinema;
};

exports.create = async (data) => {
  const id = await cinemaModel.create({
    name: data.name,
    address: data.address,
    city: data.city,
    phone: textOrNull(data.phone),
    image_url: textOrNull(data.image_url),
    is_active: data.is_active === false ? 0 : 1,
  });
  return cinemaModel.findById(id);
};

exports.update = async (id, data) => {
  const old = await cinemaModel.findById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy rạp');

  await cinemaModel.update(id, {
    name: data.name ?? old.name,
    address: data.address ?? old.address,
    city: data.city ?? old.city,
    phone: data.phone !== undefined ? textOrNull(data.phone) : old.phone,
    image_url: data.image_url !== undefined ? textOrNull(data.image_url) : old.image_url,
    is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : old.is_active,
  });
  return cinemaModel.findById(id);
};

exports.remove = async (id) => {
  if (!(await cinemaModel.findById(id))) throw new ApiError(404, 'Không tìm thấy rạp');
  await cinemaModel.remove(id); // đã có đơn đặt vé -> 409. Muốn ẩn rạp thì cập nhật is_active = false
};
