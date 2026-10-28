import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { getCinemas } from '../services/catalogService.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { assetUrl } from '../utils/format.js';

const CITY_TABS = [
  { key: 'all', label: 'Tất cả khu vực' },
  { key: 'hcm', label: 'TP. Hồ Chí Minh', match: 'Hồ Chí Minh' },
  { key: 'hn', label: 'Hà Nội', match: 'Hà Nội' },
];

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
    <div className="space-y-8 py-4">
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
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách rạp */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl w-full" />
          ))}
        </div>
      ) : filteredCinemas.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          Chưa tìm thấy rạp chiếu nào tại khu vực này.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredCinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg hover:border-slate-700 transition"
            >
              {/* Ảnh rạp */}
              <div className="relative h-48 sm:h-auto sm:w-52 shrink-0 bg-slate-800">
                {cinema.image_url ? (
                  <img
                    src={assetUrl(cinema.image_url)}
                    alt={cinema.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand-900/40 to-slate-800 text-3xl">
                    🏢
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-brand-400 backdrop-blur">
                  {cinema.city}
                </span>
              </div>

              {/* Thông tin rạp */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{cinema.name}</h3>
                  <p className="flex items-start gap-1.5 text-xs text-slate-300">
                    <span className="shrink-0 text-slate-400">📍</span>
                    <span>{cinema.address}, {cinema.city}</span>
                  </p>
                  {cinema.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>📞</span>
                      <span>{cinema.phone}</span>
                    </p>
                  )}
                  <div className="flex gap-2 pt-1 text-[11px]">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-medium">
                      {cinema.room_count || 2} phòng chiếu
                    </span>
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 text-purple-300 font-medium">
                      2D / 3D / IMAX
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium">● Đang mở cửa đón khách</span>
                  <Link
                    to={`/movies?cinema_id=${cinema.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-brand-500"
                  >
                    Xem lịch chiếu →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
