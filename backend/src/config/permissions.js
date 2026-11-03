const PERMISSIONS = [
  {
    id: 'dashboard:view',
    name: 'Xem báo cáo doanh thu',
    group: 'Báo cáo & Thống kê',
    description: 'Xem trang Dashboard tổng quan, doanh thu theo ngày/tháng, top phim, tỷ lệ lấp đầy',
  },
  {
    id: 'movies:manage',
    name: 'Quản lý phim điện ảnh',
    group: 'Phim & Lịch chiếu',
    description: 'Thêm mới, chỉnh sửa thông tin, đổi trạng thái và xóa phim',
  },
  {
    id: 'genres:manage',
    name: 'Quản lý thể loại phim',
    group: 'Phim & Lịch chiếu',
    description: 'Thêm, sửa tên và xóa thể loại phim',
  },
  {
    id: 'cinemas:manage',
    name: 'Quản lý cụm rạp',
    group: 'Cơ sở & Phòng chiếu',
    description: 'Thêm mới, cập nhật thông tin địa chỉ và quản lý cụm rạp',
  },
  {
    id: 'rooms:manage',
    name: 'Quản lý phòng chiếu & ghế',
    group: 'Cơ sở & Phòng chiếu',
    description: 'Thêm phòng chiếu mới, cấu hình sơ đồ ghế và loại phòng',
  },
  {
    id: 'showtimes:manage',
    name: 'Quản lý lịch & suất chiếu',
    group: 'Phim & Lịch chiếu',
    description: 'Tạo lịch chiếu phim, chỉnh sửa giá vé cơ bản và hủy suất chiếu',
  },
  {
    id: 'combos:manage',
    name: 'Quản lý combo bắp nước',
    group: 'Dịch vụ & Khuyến mãi',
    description: 'Thêm, sửa giá, tải ảnh và kích hoạt combo bắp nước',
  },
  {
    id: 'promotions:manage',
    name: 'Quản lý mã giảm giá',
    group: 'Dịch vụ & Khuyến mãi',
    description: 'Tạo voucher khuyến mãi, giới hạn lượt dùng và chỉnh sửa giảm giá',
  },
  {
    id: 'bookings:manage',
    name: 'Quản lý đơn vé & hủy vé',
    group: 'Bán vé & Soát vé',
    description: 'Tra cứu danh sách đơn vé, xem chi tiết vé, hủy vé cho khách hàng',
  },
  {
    id: 'tickets:checkin',
    name: 'Soát vé & check-in tại quầy',
    group: 'Bán vé & Soát vé',
    description: 'Quét hoặc nhập mã vé, tra cứu thông tin vé và xác nhận khách vào phòng chiếu',
  },
  {
    id: 'users:manage',
    name: 'Quản lý khách hàng & phân quyền',
    group: 'Hệ thống & Tài khoản',
    description: 'Xem danh sách thành viên, khóa tài khoản, tạo nhân viên và phân quyền',
  },
];

const PRESET_ROLES = [
  {
    key: 'box_office',
    title: 'Nhân viên Quầy vé & Soát vé',
    permissions: ['bookings:manage', 'tickets:checkin'],
  },
  {
    key: 'projectionist',
    title: 'Nhân viên Lịch chiếu & Phim',
    permissions: ['movies:manage', 'genres:manage', 'showtimes:manage', 'rooms:manage'],
  },
  {
    key: 'service_marketing',
    title: 'Nhân viên Dịch vụ & Marketing',
    permissions: ['combos:manage', 'promotions:manage', 'movies:manage'],
  },
  {
    key: 'supervisor',
    title: 'Giám sát Vận hành Rạp',
    permissions: [
      'dashboard:view',
      'movies:manage',
      'genres:manage',
      'cinemas:manage',
      'rooms:manage',
      'showtimes:manage',
      'combos:manage',
      'promotions:manage',
      'bookings:manage',
      'tickets:checkin',
    ],
  },
];

module.exports = { PERMISSIONS, PRESET_ROLES };
