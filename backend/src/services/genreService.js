const ApiError = require('../utils/ApiError');
const { slugify } = require('../utils/slugify');
const genreModel = require('../models/genreModel');

async function uniqueSlug(name, excludeId = 0) {
  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (await genreModel.slugExists(slug, excludeId)) slug = `${base}-${i++}`;
  return slug;
}

exports.list = () => genreModel.listWithCount();

exports.create = async ({ name }) => {
  if (await genreModel.nameExists(name)) throw new ApiError(409, 'Thể loại đã tồn tại');
  const id = await genreModel.create(name, await uniqueSlug(name));
  return genreModel.findById(id);
};

exports.update = async (id, { name }) => {
  if (!(await genreModel.findById(id))) throw new ApiError(404, 'Không tìm thấy thể loại');
  if (await genreModel.nameExists(name, id)) throw new ApiError(409, 'Thể loại đã tồn tại');
  await genreModel.update(id, name, await uniqueSlug(name, id));
  return genreModel.findById(id);
};

exports.remove = async (id) => {
  if (!(await genreModel.findById(id))) throw new ApiError(404, 'Không tìm thấy thể loại');
  await genreModel.remove(id); // các liên kết movie_genres tự xóa theo (ON DELETE CASCADE)
};
