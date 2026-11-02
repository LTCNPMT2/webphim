import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getCinemas } from '../services/catalogService.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { getMapUrlByCity } from '../utils/constants.js';

const CITY_TABS = [
  { key: 'all', label: 'Tất cả khu vực' },
  { key: 'hcm', label: 'TP. Hồ Chí Minh', match: 'Hồ Chí Minh' },
  { key: 'hn', label: 'Hà Nội', match: 'Hà Nội' },
];

function resolveCinemaLogo(cinema) {
  const text = `${cinema.id} ${cinema.name || ''} ${cinema.city || ''} ${cinema.address || ''}`.toLowerCase();
  if (text.includes('hà nội') || text.includes('hanoi') || text.includes('hn') || String(cinema.id) === '2') {
    return '/images/cinemas/cinema-hanoi-plaza.jpg';
  }
  return '/images/cinemas/cinema-saigon-center.jpg';
}

function getEmbedMapUrl(city = '', address = '') {
  const text = `${city || ''} ${address || ''}`.toLowerCase();
  if (text.includes('hà nội') || text.includes('ha noi') || text.includes('láng hạ') || text.includes('tràng tiền')) {
    return 'https://maps.google.com/maps?q=21.016816,105.8156311&hl=vi&z=16&output=embed';
  }
  return 'https://maps.google.com/maps?q=10.7846215,106.6420233&hl=vi&z=16&output=embed';
}

export default function Cinemas() {
  const [params, setParams] = useSearchParams();
  const cityParam = params.get('city') || 'all';

  const [activeTab, setActiveTab] = useState(cityParam);
  const { data: cinemas, loading, error, reload } = useFetch(getCinemas, []);

  // Đồng bộ tab khi URL thay đổi
  useEffect(() => {
    setActiveTab(cityParam);
  }, [cityParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'all') {
      params.delete('city');
    } else {
      params.set('city', key);
    }
    setParams(params);
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;

  // Lọc rạp theo thành phố đã chọn
  const filteredCinemas = (cinemas || []).filter((c) => {
    if (activeTab === 'all') return true;
    const tabObj = CITY_TABS.find((t) => t.key === activeTab);
    return tabObj ? c.city?.toLowerCase().includes(tabObj.match.toLowerCase()) : true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      {/* Header trang rạp */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
          Hệ Thống <span className="text-brand-500">Rạp Chiếu</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Trải nghiệm rạp chiếu phim chất lượng chuẩn quốc tế với phòng chiếu IMAX, 3D hiện đại tại TP. Hồ Chí Minh và Hà Nội.
        </p>

        {/* Bộ lọc thành phố */}
        <div className="inline-flex rounded-xl bg-slate-900 p-1.5 border border-slate-800 mt-4">
          {CITY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                activeTab === tab.key ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách rạp dạng thẻ ngang chuẩn, căng đều 3 phần: Logo - Thông tin - Bản đồ */}
      {loading ? (
        <div className="w-full space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl w-full" />
          ))}
        </div>
      ) : filteredCinemas.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          Chưa tìm thấy rạp chiếu nào tại khu vực này.
        </div>
      ) : (
        <div className="w-full space-y-6">
          {filteredCinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl transition-all duration-300 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10"
            >
              {/* 1. CỘT TRÁI: Logo rạp mới (1024x571 chuẩn 16:9 sắc nét) */}
              <div className="relative w-full md:w-72 lg:w-80 xl:w-96 shrink-0 bg-[#060911] overflow-hidden border-b md:border-b-0 md:border-r border-slate-800/80 flex items-center justify-center">
                <img
                  src={resolveCinemaLogo(cinema)}
                  alt={cinema.name}
                  className="w-full h-full object-cover min-h-[180px] md:min-h-full transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-md bg-black/80 border border-white/15 px-2.5 py-0.5 text-xs font-bold text-brand-400 backdrop-blur-md shadow-md">
                  {cinema.city}
                </span>
              </div>

              {/* 2. CỘT GIỮA: Thông tin rạp chi tiết (Đã bỏ logo CINE màu hồng theo yêu cầu) */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{cinema.name}</h3>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                    <p className="flex items-start gap-2">
                      <span className="shrink-0 text-brand-400 mt-0.5">📍</span>
                      <span>
                        {cinema.address}
                        <a
                          href={getMapUrlByCity(cinema.city, cinema.address)}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 font-bold text-pink-400 hover:text-pink-300 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>[ Bản đồ ]</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </span>
                    </p>

                    {cinema.phone && (
                      <p className="flex items-center gap-2 text-slate-400">
                        <span className="text-brand-400">📞</span>
                        <span>{cinema.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-lg bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 text-xs text-slate-300 font-medium">
                      🍿 {cinema.room_count || 9} phòng chiếu
                    </span>
                    <span className="rounded-lg bg-pink-500/15 border border-pink-500/30 px-2.5 py-1 text-xs text-pink-300 font-bold">
                      ⚡ 2D Chuẩn · 3D Siêu Thực · IMAX Laser
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Đang mở cửa đón khách
                  </span>
                  <Link
                    to={`/movies?cinema_id=${cinema.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-pink-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition duration-200 hover:from-brand-500 hover:to-pink-500 hover:scale-105 active:scale-95"
                  >
                    <span>Xem lịch chiếu</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* 3. CỘT PHẢI: Bản đồ Google Maps nhúng trực tiếp */}
              <div className="relative w-full md:w-64 lg:w-72 xl:w-80 shrink-0 h-52 md:h-auto min-h-[200px] bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/80 overflow-hidden group/map">
                <iframe
                  title={`Bản đồ ${cinema.name}`}
                  src={getEmbedMapUrl(cinema.city, cinema.address)}
                  className="w-full h-full border-0 filter contrast-105"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={getMapUrlByCity(cinema.city, cinema.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/90 hover:bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1.5 shadow-lg border border-white/20 backdrop-blur-md transition duration-200 group-hover/map:scale-105"
                >
                  <span>Mở Google Maps</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
