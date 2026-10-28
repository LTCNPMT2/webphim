import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

// Danh mục điều hướng chuẩn Enterprise SaaS (Modern Dark Obsidian & Electric Indigo)
const NAV_GROUPS = [
  {
    title: 'BÁO CÁO & THỐNG KÊ',
    items: [
      {
        to: '/admin',
        label: 'Tổng quan doanh thu',
        end: true,
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'QUẢN LÝ PHIM & RẠP',
    items: [
      {
        to: '/admin/movies',
        label: 'Phim điện ảnh',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        ),
      },
      {
        to: '/admin/genres',
        label: 'Thể loại phim',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
      },
      {
        to: '/admin/cinemas',
        label: 'Cụm rạp CINE',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        to: '/admin/rooms',
        label: 'Phòng chiếu & Ghế',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        to: '/admin/showtimes',
        label: 'Lịch & Suất chiếu',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'BÁN VÉ & KHÁCH HÀNG',
    items: [
      {
        to: '/admin/combos',
        label: 'Combo bắp nước',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9V9a2 2 0 00-2-2H8a2 2 0 00-2 2v3h10z" />
          </svg>
        ),
      },
      {
        to: '/admin/promotions',
        label: 'Mã giảm giá',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        ),
      },
      {
        to: '/admin/bookings',
        label: 'Đơn vé đã đặt',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        to: '/admin/users',
        label: 'Khách hàng & Người dùng',
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ],
  },
];

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
    isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
  }`;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Đồng hồ thời gian thực
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* ============================================================== */}
      {/* SIDEBAR TỐI GIẢN - HIỆN ĐẠI - SIÊU SANG (MODERN SLATE & INDIGO) */}
      {/* ============================================================== */}
      <aside className="w-full md:w-68 md:shrink-0 border-b md:border-b-0 md:border-r border-slate-800/80 bg-[#0c101b]/95 backdrop-blur-2xl md:sticky md:top-0 md:h-screen md:flex md:flex-col justify-between z-30 shadow-2xl">
        <div>
          {/* Logo Studio Hiện Đại */}
          <div className="flex h-18 items-center justify-between px-5 border-b border-slate-800/80 bg-[#090d16]/50">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-white tracking-tight">
                    Cine<span className="text-indigo-400">Admin</span>
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wide text-slate-400 block">
                  Studio Enterprise
                </span>
              </div>
            </Link>

            <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
              PRO
            </span>
          </div>

          {/* Danh mục menu */}
          <nav className="p-3 md:p-4 space-y-6 overflow-x-auto md:overflow-y-auto max-h-[calc(100vh-10.5rem)] scrollbar-thin scrollbar-thumb-slate-800">
            {NAV_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <h4 className="hidden md:block px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </h4>
                <div className="flex md:flex-col gap-1">
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                      <span className="text-slate-400 group-hover:text-slate-200 transition-colors shrink-0">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar: Profile Người Quản Trị */}
        <div className="hidden md:block p-3.5 border-t border-slate-800/80 bg-[#090d16]/70">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-xs font-bold text-white uppercase shadow-sm">
                  {user?.full_name?.trim().charAt(0) || 'A'}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090d16]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-200">{user?.full_name || 'Quản trị viên'}</p>
                <p className="truncate text-[10px] text-slate-400">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* VÙNG NỘI DUNG CHÍNH (MAIN CONTENT) */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl px-5 sm:px-8 shadow-xs">
          
          {/* Trạng thái hệ thống */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống trực tuyến ổn định</span>
            </span>
          </div>

          {/* Đồng hồ số & Nút xem website người dùng */}
          <div className="flex items-center gap-3.5 text-xs">
            
            <div className="hidden lg:flex items-center gap-2 text-slate-400 font-mono bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-indigo-400">🕒</span>
              <span className="text-slate-200">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-600">|</span>
              <span>{currentTime.toLocaleDateString('vi-VN')}</span>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/70 hover:bg-slate-700/80 px-3.5 py-1.5 font-semibold text-slate-200 hover:text-white transition shadow-xs cursor-pointer group"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Xem trang khách hàng</span>
              <span className="group-hover:translate-x-0.5 transition-transform text-slate-400">→</span>
            </Link>

            <button
              onClick={handleLogout}
              className="font-semibold text-rose-400 hover:text-rose-300 md:hidden"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Nội dung các trang Admin */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
