import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { buttonClass } from '../ui/Button.jsx';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State cho dropdowns trên desktop
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // State cho mobile drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileScheduleOpen, setMobileScheduleOpen] = useState(false);
  const [mobileCinemaOpen, setMobileCinemaOpen] = useState(false);

  // State thanh tìm kiếm phim
  const [searchTerm, setSearchTerm] = useState('');

  const scheduleRef = useRef(null);
  const cinemaRef = useRef(null);
  const userRef = useRef(null);

  // Đóng tất cả menu khi chuyển trang
  useEffect(() => {
    setScheduleOpen(false);
    setCinemaOpen(false);
    setUserOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (scheduleRef.current && !scheduleRef.current.contains(e.target)) {
        setScheduleOpen(false);
      }
      if (cinemaRef.current && !cinemaRef.current.contains(e.target)) {
        setCinemaOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1 px-3 py-2 text-sm font-medium transition rounded-lg ${
      isActive ? 'text-brand-400 font-semibold bg-slate-900/80' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo thương hiệu */}
        <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold text-white shrink-0 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-pink-500 text-base shadow-md shadow-brand-500/20 transition duration-300 group-hover:scale-105">
            🎬
          </span>
          <span className="tracking-tight">
            Cine<span className="text-brand-500">Booking</span>
          </span>
        </Link>

        {/* Menu điều hướng chính trên Desktop */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {/* 1. Trang chủ */}
          <NavLink to="/" end className={navLinkClass}>
            Trang chủ
          </NavLink>

          {/* 2. Lịch chiếu (Dropdown) */}
          <div className="relative" ref={scheduleRef}>
            <button
              onClick={() => {
                setScheduleOpen((prev) => !prev);
                setCinemaOpen(false);
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
              aria-expanded={scheduleOpen}
            >
              <span>Lịch chiếu</span>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${scheduleOpen ? 'rotate-180 text-brand-400' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {scheduleOpen && (
              <div className="absolute left-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-fade-in z-50">
                <Link
                  to="/showtimes"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-brand-400"
                >
                  <span className="text-brand-400">📅</span>
                  <span>Lịch chiếu phim</span>
                </Link>
                <Link
                  to="/movies?status=now_showing"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-brand-400"
                >
                  <span className="text-emerald-400">🎞️</span>
                  <span>Phim đang chiếu</span>
                </Link>
                <Link
                  to="/movies?status=coming_soon"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-brand-400"
                >
                  <span className="text-sky-400">✨</span>
                  <span>Phim sắp chiếu</span>
                </Link>
              </div>
            )}
          </div>

          {/* 3. Rạp chiếu (Dropdown) */}
          <div className="relative" ref={cinemaRef}>
            <button
              onClick={() => {
                setCinemaOpen((prev) => !prev);
                setScheduleOpen(false);
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
              aria-expanded={cinemaOpen}
            >
              <span>Rạp chiếu</span>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${cinemaOpen ? 'rotate-180 text-brand-400' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {cinemaOpen && (
              <div className="absolute left-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-fade-in z-50">
                <Link
                  to="/cinemas?city=hcm"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-brand-400"
                >
                  <span>📍</span>
                  <div>
                    <div className="font-medium">TP. Hồ Chí Minh</div>
                    <div className="text-[11px] text-slate-400">Cinema Sài Gòn Center</div>
                  </div>
                </Link>
                <Link
                  to="/cinemas?city=hn"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-brand-400"
                >
                  <span>📍</span>
                  <div>
                    <div className="font-medium">Hà Nội</div>
                    <div className="text-[11px] text-slate-400">Cinema Hà Nội Plaza</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Phim chiếu */}
          <NavLink to="/movies" className={navLinkClass}>
            Phim chiếu
          </NavLink>

          {/* 5. Vé của tôi */}
          <NavLink to="/my-bookings" className={navLinkClass}>
            Vé của tôi
          </NavLink>
        </nav>

        {/* 6. Thanh tìm kiếm tên phim + Khối người dùng */}
        <div className="flex items-center gap-3">
          {/* Thanh tìm kiếm trên Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-48 xl:w-64">
            <input
              type="text"
              placeholder="Tìm tên phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-900/90 py-1.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-400 transition focus:border-brand-500 focus:bg-slate-900 focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-400"
              aria-label="Tìm kiếm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Phần tài khoản đăng nhập */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-slate-800 border border-slate-800"
                aria-haspopup="menu"
                aria-expanded={userOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-brand-600 to-pink-500 text-sm font-bold uppercase text-white shadow">
                  {user.full_name?.trim().charAt(0) || '?'}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium sm:block text-slate-200">
                  {user.full_name}
                </span>
                <svg className="hidden sm:block h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-2xl z-50">
                  <div className="border-b border-slate-800 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                    <span>👤</span> Hồ sơ cá nhân
                  </Link>
                  <Link to="/my-bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                    <span>🎟️</span> Vé của tôi
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-slate-800">
                      <span>⚙️</span> Trang quản trị
                    </Link>
                  )}
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800"
                  >
                    <span>🚪</span> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className={buttonClass('outline', 'sm')}>
                Đăng nhập
              </Link>
              <Link to="/register" className={buttonClass('primary', 'sm')}>
                Đăng ký
              </Link>
            </div>
          )}

          {/* Nút Hamburger menu trên Mobile */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
            aria-label="Mở menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu xổ xuống trên Điện thoại (Mobile Drawer) */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Ô tìm kiếm phim trên mobile */}
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              placeholder="Tìm tên phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <nav className="flex flex-col space-y-1">
            <Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900">
              Trang chủ
            </Link>

            {/* Accordion Lịch chiếu */}
            <div>
              <button
                onClick={() => setMobileScheduleOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                <span>Lịch chiếu</span>
                <svg className={`h-4 w-4 transform transition ${mobileScheduleOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileScheduleOpen && (
                <div className="ml-4 pl-2 border-l border-slate-800 space-y-1 py-1">
                  <Link to="/showtimes" className="block rounded-md px-3 py-1.5 text-xs text-slate-300 hover:text-white">
                    📅 Lịch chiếu phim
                  </Link>
                  <Link to="/movies?status=now_showing" className="block rounded-md px-3 py-1.5 text-xs text-slate-300 hover:text-white">
                    🎞️ Phim đang chiếu
                  </Link>
                  <Link to="/movies?status=coming_soon" className="block rounded-md px-3 py-1.5 text-xs text-slate-300 hover:text-white">
                    ✨ Phim sắp chiếu
                  </Link>
                </div>
              )}
            </div>

            {/* Accordion Rạp chiếu */}
            <div>
              <button
                onClick={() => setMobileCinemaOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                <span>Rạp chiếu</span>
                <svg className={`h-4 w-4 transform transition ${mobileCinemaOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileCinemaOpen && (
                <div className="ml-4 pl-2 border-l border-slate-800 space-y-1 py-1">
                  <Link to="/cinemas?city=hcm" className="block rounded-md px-3 py-1.5 text-xs text-slate-300 hover:text-white">
                    📍 TP. Hồ Chí Minh (Cinema Sài Gòn Center)
                  </Link>
                  <Link to="/cinemas?city=hn" className="block rounded-md px-3 py-1.5 text-xs text-slate-300 hover:text-white">
                    📍 Hà Nội (Cinema Hà Nội Plaza)
                  </Link>
                </div>
              )}
            </div>

            <Link to="/movies" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900">
              Phim chiếu
            </Link>

            <Link to="/my-bookings" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900">
              Vé của tôi
            </Link>

            {!user && (
              <div className="mt-4 flex gap-2 pt-2 border-t border-slate-800">
                <Link to="/login" className={buttonClass('outline', 'md', 'flex-1 text-center')}>
                  Đăng nhập
                </Link>
                <Link to="/register" className={buttonClass('primary', 'md', 'flex-1 text-center')}>
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
