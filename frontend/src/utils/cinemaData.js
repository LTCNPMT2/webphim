// ======================================================================
// Nguồn dữ liệu duy nhất cho thông tin cụm rạp CineBooking
// Import file này ở Footer, Home, CinemaShowtimesWidget, v.v.
// để đảm bảo địa chỉ luôn đồng bộ khắp toàn bộ frontend.
// ======================================================================

/**
 * Tạo URL Google Maps từ địa chỉ bất kỳ.
 * @param {string} address - Địa chỉ đầy đủ của rạp
 * @returns {string} URL dẫn đến Google Maps search
 */
export function getMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Danh sách cụm rạp CineBooking chính thức.
 * Mỗi object chứa đầy đủ thông tin hiển thị: tên, địa chỉ, thành phố, SĐT,
 * và các trường phụ trợ cho Footer / trang Cinemas.
 */
export const CINEMAS = [
  {
    id: 1,
    name: 'Cinema Sài Gòn Center',
    address: '613 Âu Cơ, Tân Phú, Hồ Chí Minh, Việt Nam',
    city: 'TP. Hồ Chí Minh',
    cityKey: 'hcm',
    phone: '02838000001',
    mapUrl: 'https://www.google.com/maps/place/Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+h%E1%BB%8Dc+V%C4%83n+Hi%E1%BA%BFn/@10.7846268,106.6394484,927m/data=!3m2!1e3!4b1!4m6!3m5!1s0x31752fe7efcecbd5:0xb4734cea965dd333!8m2!3d10.7846215!4d106.6420233!16s%2Fg%2F11gsbqvgxb?hl=vi&entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',
  },
  {
    id: 2,
    name: 'Cinema Hà Nội Plaza',
    address: '87 Láng Hạ, Ô Chợ Dừa, Hà Nội, Việt Nam',
    city: 'Hà Nội',
    cityKey: 'hn',
    phone: '02438000002',
    mapUrl: 'https://www.google.com/maps/place/Trung+t%C3%A2m+Chi%E1%BA%BFu+phim+Qu%E1%BB%91c+gia/@21.016816,105.8156311,881m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3135ab9ef82fed13:0x1ee04aa292e377a2!8m2!3d21.016816!4d105.8156311!16s%2Fg%2F11f08fxfdq?hl=vi&entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',
  },
];

/**
 * Tìm rạp theo ID.
 * @param {number} id
 * @returns {object|undefined}
 */
export function getCinemaById(id) {
  return CINEMAS.find((c) => c.id === id);
}

/**
 * Lấy địa chỉ rạp mặc định (Sài Gòn Center) — dùng làm fallback.
 */
export const DEFAULT_CINEMA = CINEMAS[0];
