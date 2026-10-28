import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#080b12] text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Hiệu ứng ánh sáng rạp phim ở đỉnh trang */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-600/15 via-purple-600/5 to-transparent blur-[140px]" />

      <Header />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
