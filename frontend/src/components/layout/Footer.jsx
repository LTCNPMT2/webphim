import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/[0.08] bg-[#06080e]/90 backdrop-blur-xl text-slate-400 print:hidden">
      {/* Đường viền ánh sáng gradient nhẹ nhàng */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-extrabold text-white group">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 text-lg shadow-lg shadow-brand-500/25">
                🎬
              </span>
              <span className="tracking-tight text-2xl font-black">
                Cine<span className="text-brand-500">Booking</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Hệ thống rạp chiếu phim hiện đại hàng đầu Việt Nam. Đặt vé xem phim trực tuyến siêu tốc, giữ ghế đẹp tức thì với phòng chiếu chuẩn IMAX & công nghệ âm thanh Dolby Atmos.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-emerald-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống bán vé trực tuyến 24/7
              </span>
            </div>
          </div>

          {/* Cột 2: Phim & Lịch chiếu */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Khám Phá Phim</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/movies?status=now_showing" className="transition hover:text-brand-400">
                  Phim đang chiếu
                </Link>
              </li>
              <li>
                <Link to="/movies?status=coming_soon" className="transition hover:text-brand-400">
                  Phim sắp chiếu
                </Link>
              </li>
              <li>
                <Link to="/movies?status=now_showing&filter=today" className="transition hover:text-brand-400">
                  Lịch chiếu hôm nay
                </Link>
              </li>
              <li>
                <Link to="/movies" className="transition hover:text-brand-400">
                  Toàn bộ danh mục phim
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hệ thống rạp */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Cụm Rạp Chiếu</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/cinemas?city=hcm" className="transition hover:text-brand-400 flex items-center gap-1.5">
                  <span>📍</span> Cinema Sài Gòn Center
                </Link>
              </li>
              <li>
                <Link to="/cinemas?city=hn" className="transition hover:text-brand-400 flex items-center gap-1.5">
                  <span>📍</span> Cinema Hà Nội Plaza
                </Link>
              </li>
              <li>
                <span className="text-slate-500 text-xs block pt-1">
                  Trang bị màn chiếu IMAX thế hệ mới & ghế đôi Sweetbox cao cấp.
                </span>
              </li>
            </ul>
          </div>

          {/* Cột 4: Chăm sóc & Thanh toán */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Hỗ Trợ Khách Hàng</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-brand-400">📞</span>
                <span className="font-semibold text-slate-200">1900 6868</span> (Miễn phí)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-400">✉️</span>
                <span>cskh@cinebooking.vn</span>
              </li>
              <li className="pt-2">
                <span className="text-xs text-slate-400 block mb-2 font-medium">Phương thức thanh toán:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-300">
                  <span className="rounded bg-slate-900 border border-slate-700/80 px-2 py-0.5">VietQR</span>
                  <span className="rounded bg-slate-900 border border-slate-700/80 px-2 py-0.5">SePay</span>
                  <span className="rounded bg-slate-900 border border-slate-700/80 px-2 py-0.5">MBBank</span>
                  <span className="rounded bg-slate-900 border border-slate-700/80 px-2 py-0.5">Visa / Napas</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Thanh bản quyền phía dưới */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CineBooking. Bản quyền thuộc về Hệ thống Đặt vé Rạp chiếu phim Việt Nam.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer transition">Điều khoản sử dụng</span>
            <span>·</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Chính sách bảo mật</span>
            <span>·</span>
            <Link to="/admin" className="text-amber-500/80 hover:text-amber-400 font-medium transition">
              Cổng Quản trị viên
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
