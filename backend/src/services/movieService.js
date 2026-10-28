const ApiError = require('../utils/ApiError');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildMeta } = require('../utils/pagination');
const withTransaction = require('../utils/transaction');
const { toPublicPath, removeFile } = require('../middlewares/upload');
const movieModel = require('../models/movieModel');

// Chuỗi rỗng -> null để DB lưu NULL thay vì ''
const textOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

const jsonOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string') {
    try {
      JSON.parse(v);
      return v;
    } catch {
      return JSON.stringify(v);
    }
  }
  return null;
};

const safeParseJson = (str, fallback = []) => {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

async function uniqueSlug(db, title, excludeId = 0) {
  const base = slugify(title);
  let slug = base;
  let i = 2;
  while (await movieModel.slugExists(slug, excludeId, db)) slug = `${base}-${i++}`;
  return slug;
}

async function assertGenresExist(db, genreIds) {
  if (!genreIds.length) return;
  if ((await movieModel.countExistingGenres(db, genreIds)) !== genreIds.length) {
    throw new ApiError(400, 'Có thể loại không tồn tại');
  }
}

exports.list = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { rows, total } = await movieModel.list(query, { limit, offset });

  // Gắn thể loại cho cả trang phim bằng 1 query
  const genreRows = await movieModel.getGenresByMovieIds(rows.map((m) => m.id));
  rows.forEach((m) => {
    m.genres = genreRows
      .filter((g) => g.movie_id === m.id)
      .map(({ id, name, slug }) => ({ id, name, slug }));
  });

  return { items: rows, pagination: buildMeta(page, limit, total) };
};

exports.getById = async (id) => {
  const movie = await movieModel.findById(id);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim');
  movie.genres = await movieModel.getGenres(id);
  movie.cast_data = safeParseJson(movie.cast_data, []);
  movie.gallery_images = safeParseJson(movie.gallery_images, []);
  movie.custom_faqs = safeParseJson(movie.custom_faqs, []);
  return movie;
};

exports.create = async (data, files = {}) => {
  const genreIds = [...new Set(data.genre_ids || [])];

  const id = await withTransaction(async (conn) => {
    await assertGenresExist(conn, genreIds);
    const movieId = await movieModel.create(conn, {
      title: data.title,
      tagline: textOrNull(data.tagline),
      slug: await uniqueSlug(conn, data.title),
      description: textOrNull(data.description),
      duration_minutes: data.duration_minutes,
      release_date: data.release_date,
      director: textOrNull(data.director),
      cast_members: textOrNull(data.cast_members),
      cast_data: jsonOrNull(data.cast_data),
      language: textOrNull(data.language) || 'Tiếng Việt',
      country: textOrNull(data.country) || 'Việt Nam',
      age_rating: data.age_rating || 'P',
      poster_url: toPublicPath(files.poster?.[0]) ?? textOrNull(data.poster_url),
      banner_url: toPublicPath(files.banner?.[0]) ?? textOrNull(data.banner_url),
      gallery_images: jsonOrNull(data.gallery_images),
      custom_faqs: jsonOrNull(data.custom_faqs),
      trailer_url: textOrNull(data.trailer_url),
      status: data.status || 'coming_soon',
    });
    await movieModel.setGenres(conn, movieId, genreIds);
    return movieId;
  });

  return exports.getById(id);
};

// Cập nhật một phần: field nào không gửi thì giữ nguyên
exports.update = async (id, data, files = {}) => {
  const old = await movieModel.findById(id);
  if (!old) throw new ApiError(404, 'Không tìm thấy phim');

  const pick = (key) => (data[key] !== undefined ? textOrNull(data[key]) : old[key]);
  const pickJson = (key) => (data[key] !== undefined ? jsonOrNull(data[key]) : old[key]);

  const merged = {
    title: data.title ?? old.title,
    tagline: pick('tagline'),
    slug: old.slug,
    description: pick('description'),
    duration_minutes: data.duration_minutes ?? old.duration_minutes,
    release_date: data.release_date ?? old.release_date,
    director: pick('director'),
    cast_members: pick('cast_members'),
    cast_data: pickJson('cast_data'),
    language: data.language !== undefined ? textOrNull(data.language) || 'Tiếng Việt' : old.language,
    country: data.country !== undefined ? textOrNull(data.country) || 'Việt Nam' : old.country,
    age_rating: data.age_rating ?? old.age_rating,
    poster_url: toPublicPath(files.poster?.[0]) ?? pick('poster_url'),
    banner_url: toPublicPath(files.banner?.[0]) ?? pick('banner_url'),
    gallery_images: pickJson('gallery_images'),
    custom_faqs: pickJson('custom_faqs'),
    trailer_url: pick('trailer_url'),
    status: data.status ?? old.status,
  };

  await withTransaction(async (conn) => {
    if (merged.title !== old.title) merged.slug = await uniqueSlug(conn, merged.title, id);
    if (data.genre_ids !== undefined) {
      const genreIds = [...new Set(data.genre_ids)];
      await assertGenresExist(conn, genreIds);
      await movieModel.setGenres(conn, id, genreIds);
    }
    await movieModel.update(conn, id, merged);
  });

  // Ảnh cũ không còn dùng thì xóa khỏi ổ đĩa
  if (merged.poster_url !== old.poster_url) removeFile(old.poster_url);
  if (merged.banner_url !== old.banner_url) removeFile(old.banner_url);

  return exports.getById(id);
};

exports.remove = async (id) => {
  const movie = await movieModel.findById(id);
  if (!movie) throw new ApiError(404, 'Không tìm thấy phim');
  await movieModel.remove(id); // nếu đã có đơn đặt vé -> DB từ chối -> errorHandler trả 409
  removeFile(movie.poster_url);
  removeFile(movie.banner_url);
};
