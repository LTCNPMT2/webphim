import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { getCinemas, getMovies, getShowtimes } from '../../services/catalogService.js';
import { assetUrl, formatTime, toDateKey } from '../../utils/format.js';
import MoMoBookingModal from '../booking/MoMoBookingModal.jsx';

// Danh sách các loại phòng chiếu & trải nghiệm công nghệ của hệ thống rạp CINE khớp với Admin
const CINE_ROOM_TYPES = [
  { id: 'all', name: 'Tất cả rạp', isStar: true },
  { id: '2D', name: 'Phòng 2D Chuẩn', icon: '🍿', tag: '2D' },
  { id: 'IMAX', name: 'IMAX Laser', icon: '🚀', tag: 'IMAX' },
  { id: '3D', name: '3D Kỹ Thuật Số', icon: '🕶️', tag: '3D' },
];

// Danh sách chính xác 4 rạp theo 2 khu vực (2 rạp tại TP. Hồ Chí Minh & 2 rạp tại Hà Nội) khớp 100% với Admin
const CINE_BRANCHES = [
  // ================= TP. HỒ CHÍ MINH (2 RẠP) =================
  {
    id: 'cine-sg-p1',
    realId: 1,
    realRoomId: 1,
    name: 'Cinema Sài Gòn Center - Phòng 1',
    cinemaName: 'Cinema Sài Gòn Center',
    roomName: 'Phòng 1',
    roomTypeName: '2D Chuẩn',
    roomType: '2D',
    seatsCount: 75,
    tag: '2D TIÊU CHUẨN',
    address: 'Tầng 4 | Sài Gòn Center, 65 Lê Lợi, P. Bến Nghé, Quận 1',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    features: ['2D Tiêu chuẩn', 'Ghế Sweetbox', 'Âm thanh vòm'],
  },
  {
    id: 'cine-sg-p2',
    realId: 1,
    realRoomId: 2,
    name: 'Cinema Sài Gòn Center - Phòng 2 (IMAX)',
    cinemaName: 'Cinema Sài Gòn Center',
    roomName: 'Phòng 2 (IMAX)',
    roomTypeName: 'IMAX Laser',
    roomType: 'IMAX',
    seatsCount: 75,
    tag: 'IMAX LASER',
    address: 'Tầng 4 | Sài Gòn Center, 65 Lê Lợi, P. Bến Nghé, Quận 1',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    features: ['IMAX Laser Màn Cực Đại', 'Dolby Atmos', 'Ghế VIP'],
  },

  // ================= HÀ NỘI (2 RẠP) =================
  {
    id: 'cine-hn-p1',
    realId: 2,
    realRoomId: 3,
    name: 'Cinema Hà Nội Plaza - Phòng 1',
    cinemaName: 'Cinema Hà Nội Plaza',
    roomName: 'Phòng 1',
    roomTypeName: '2D Chuẩn',
    roomType: '2D',
    seatsCount: 75,
    tag: '2D TIÊU CHUẨN',
    address: 'Tầng 5 | Tràng Tiền Plaza, 25 Tràng Tiền, P. Tràng Tiền, Hoàn Kiếm',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    features: ['2D Tiêu chuẩn', 'Ghế VIP', 'Âm thanh số'],
  },
  {
    id: 'cine-hn-p2',
    realId: 2,
    realRoomId: 4,
    name: 'Cinema Hà Nội Plaza - Phòng 2 (3D)',
    cinemaName: 'Cinema Hà Nội Plaza',
    roomName: 'Phòng 2 (3D)',
    roomTypeName: '3D Kỹ Thuật Số',
    roomType: '3D',
    seatsCount: 75,
    tag: '3D SIÊU THỰC',
    address: 'Tầng 5 | Tràng Tiền Plaza, 25 Tràng Tiền, P. Tràng Tiền, Hoàn Kiếm',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    features: ['3D Kỹ Thuật Số', 'Kính 3D RealD', 'Ghế VIP'],
  },
];

export default function CinemaShowtimesWidget() {
  // Bộ lọc vị trí: 'Hồ Chí Minh' hoặc 'Hà Nội' hoặc 'all'
  const [selectedCity, setSelectedCity] = useState('Hồ Chí Minh');
  // Bộ lọc loại phòng chiếu: 'all', '2D', 'IMAX', '3D'
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [searchCinema, setSearchCinema] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState('cine-sg-p1');
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [bookingModalData, setBookingModalData] = useState(null);

  // Lấy dữ liệu từ API
  const dbCinemasFetch = useFetch(getCinemas, []);
  const dbMoviesFetch = useFetch(() => getMovies({ page: 1, limit: 12 }), []);
  const dbShowtimesFetch = useFetch(() => getShowtimes({ date: selectedDate }), [selectedDate]);

  // Sinh 7 ngày liên tiếp tính từ hôm nay
  const next7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayNum = d.getDate();
      const dayOfWeek = dayNames[d.getDay()];
      const dateKey = toDateKey(d);
      days.push({
        dateKey,
        dayNumber: dayNum,
        dayOfWeek: i === 0 ? 'Hôm nay' : dayOfWeek,
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  // Đồng bộ động 100% danh sách Cụm rạp & Phòng chiếu từ Database (khớp với Admin khi thêm/sửa)
  const allCinemas = useMemo(() => {
    const apiCinemas = dbCinemasFetch.data;
    if (Array.isArray(apiCinemas) && apiCinemas.length > 0) {
      const dynamicList = [];

      apiCinemas.forEach((cinema) => {
        const rawCity = cinema.city || '';
        const cityClean = rawCity.toLowerCase().includes('hà nội') || rawCity.toLowerCase().includes('ha noi')
          ? 'Hà Nội'
          : 'Hồ Chí Minh';

        // Lấy danh sách các phòng chiếu của cụm rạp từ Database
        const rooms = Array.isArray(cinema.rooms) && cinema.rooms.length > 0
          ? cinema.rooms
          : [{ id: 1, name: 'Phòng 1', room_type: '2D', total_seats: 75 }];

        rooms.forEach((room) => {
          const type = (room.room_type || '2D').toUpperCase();
          let tag = '2D TIÊU CHUẨN';
          let roomTypeName = '2D Chuẩn';
          let features = ['2D Tiêu chuẩn', 'Ghế Sweetbox', 'Âm thanh vòm'];

          if (type.includes('IMAX')) {
            tag = 'IMAX LASER';
            roomTypeName = 'IMAX Laser';
            features = ['IMAX Laser Màn Cực Đại', 'Dolby Atmos', 'Ghế VIP'];
          } else if (type.includes('3D')) {
            tag = '3D SIÊU THỰC';
            roomTypeName = '3D Kỹ Thuật Số';
            features = ['3D Kỹ Thuật Số', 'Kính 3D RealD', 'Ghế VIP'];
          }

          const addressParts = (cinema.address || '').split(',').map((p) => p.trim());
          const district = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';

          dynamicList.push({
            id: `cine-${cinema.id}-p${room.id}`,
            realId: cinema.id,
            realRoomId: room.id,
            name: `${cinema.name} – ${room.name}`,
            cinemaName: cinema.name,
            roomName: room.name,
            roomTypeName,
            roomType: type.includes('IMAX') ? 'IMAX' : type.includes('3D') ? '3D' : '2D',
            seatsCount: room.total_seats || 75,
            tag,
            address: cinema.address,
            city: cityClean,
            district,
            features,
          });
        });
      });

      if (dynamicList.length > 0) {
        return dynamicList;
      }
    }
    return CINE_BRANCHES;
  }, [dbCinemasFetch.data]);

  // Lọc rạp theo Thành phố (HCM / Hà Nội), Loại phòng và Từ khóa tìm kiếm
  const filteredCinemas = useMemo(() => {
    return allCinemas.filter((c) => {
      const matchCity = selectedCity === 'all' || c.city.toLowerCase() === selectedCity.toLowerCase();
      const matchType = selectedRoomType === 'all' || c.roomType === selectedRoomType || (c.features && c.features.some((f) => f.toLowerCase().includes(selectedRoomType.toLowerCase())));
      const matchSearch =
        !searchCinema.trim() ||
        c.name.toLowerCase().includes(searchCinema.trim().toLowerCase()) ||
        c.address.toLowerCase().includes(searchCinema.trim().toLowerCase()) ||
        (c.district && c.district.toLowerCase().includes(searchCinema.trim().toLowerCase()));
      return matchCity && matchType && matchSearch;
    });
  }, [allCinemas, selectedCity, selectedRoomType, searchCinema]);

  // Khi thay đổi thành phố hoặc bộ lọc, tự động chọn rạp đầu tiên phù hợp
  useEffect(() => {
    if (filteredCinemas.length > 0) {
      if (!filteredCinemas.some((c) => c.id === selectedCinemaId)) {
        setSelectedCinemaId(filteredCinemas[0].id);
      }
    }
  }, [filteredCinemas, selectedCinemaId]);

  const currentCinema = useMemo(() => {
    return allCinemas.find((c) => c.id === selectedCinemaId) || filteredCinemas[0] || CINE_BRANCHES[0];
  }, [allCinemas, filteredCinemas, selectedCinemaId]);

  // Lấy các suất chiếu cho rạp hiện tại
  const movieShowtimesList = useMemo(() => {
    const moviesMap = new Map();
    const availableMovies = dbMoviesFetch.data?.items || [];

    // Xác định định dạng phòng chiếu đang được kích hoạt:
    // Nếu chọn tab lọc cụ thể ('2D', 'IMAX', '3D') -> dùng selectedRoomType
    // Nếu chọn 'all' -> lấy theo roomType của phòng chiếu đang chọn (currentCinema.roomType)
    const activeRoomType = selectedRoomType !== 'all'
      ? selectedRoomType
      : (currentCinema?.roomType || '2D');

    // 1. Kiểm tra nếu rạp này có suất chiếu trong Database
    if (dbShowtimesFetch.data && currentCinema?.realId) {
      const cinemaGroup = dbShowtimesFetch.data.find((g) => g.cinema.id === currentCinema.realId);
      if (cinemaGroup && cinemaGroup.showtimes.length > 0) {
        // Lọc các suất chiếu theo đúng định dạng phòng được chọn (IMAX / 3D / 2D)
        const formatFiltered = cinemaGroup.showtimes.filter((st) => {
          const stType = (st.room_type || '2D').toUpperCase();
          if (activeRoomType === 'IMAX') return stType.includes('IMAX');
          if (activeRoomType === '3D') return stType.includes('3D');
          if (activeRoomType === '2D') return !stType.includes('IMAX') && !stType.includes('3D');
          return true;
        });

        // Nếu phòng cụ thể đang chọn có suất chiếu đúng định dạng thì ưu tiên phòng đó
        const roomFiltered = formatFiltered.filter((st) => st.room_id === currentCinema.realRoomId);
        const targetShowtimes = roomFiltered.length > 0 ? roomFiltered : formatFiltered;

        targetShowtimes.forEach((st) => {
          const formatLabel =
            st.room_type === 'IMAX'
              ? 'IMAX Laser'
              : st.room_type === '3D'
                ? '3D Kỹ Thuật Số'
                : '2D Chuẩn';

          if (!moviesMap.has(st.movie_id)) {
            moviesMap.set(st.movie_id, {
              movieId: st.movie_id,
              title: st.movie_title,
              poster_url: st.poster_url,
              duration: st.duration_minutes || 110,
              age_rating: st.age_rating || 'T13',
              genres: st.genres || 'Hành Động, Hài, Phiêu Lưu',
              room_type: formatLabel,
              showtimes: [],
            });
          }
          const movieObj = moviesMap.get(st.movie_id);
          const startTime = new Date(st.start_time);
          const endTime = new Date(st.end_time || startTime.getTime() + (st.duration_minutes || 110) * 60000);

          movieObj.showtimes.push({
            id: st.id,
            startTimeStr: formatTime(startTime),
            endTimeStr: formatTime(endTime),
            available: st.available_seats > 0,
            basePrice: st.base_price,
            roomName: st.room_name,
            roomType: formatLabel,
          });
        });
      }
    }

    // 2. Nếu rạp chưa có suất thật -> sinh lịch chiếu sống động theo đúng định dạng (IMAX / 3D / 2D)
    if (moviesMap.size === 0 && availableMovies.length > 0) {
      const sampleMovies = availableMovies.slice(0, 3);
      const timeSlotsMatrix = [
        [
          { start: '14:50', end: '17:01' },
          { start: '16:20', end: '18:35' },
          { start: '19:40', end: '21:55' },
        ],
        [
          { start: '13:40', end: '15:55' },
          { start: '14:30', end: '16:45' },
          { start: '15:40', end: '17:55' },
          { start: '18:10', end: '20:25' },
          { start: '19:10', end: '21:25' },
          { start: '20:10', end: '22:25' },
          { start: '21:20', end: '23:35' },
          { start: '22:40', end: '00:55' },
        ],
        [
          { start: '15:10', end: '17:25' },
          { start: '17:45', end: '20:00' },
          { start: '20:30', end: '22:45' },
        ],
      ];

      const formatLabel =
        activeRoomType === 'IMAX'
          ? 'IMAX Laser'
          : activeRoomType === '3D'
            ? '3D Kỹ Thuật Số'
            : '2D Chuẩn';

      const basePrice =
        activeRoomType === 'IMAX'
          ? 140000
          : activeRoomType === '3D'
            ? 110000
            : 90000;

      sampleMovies.forEach((m, idx) => {
        const slots = timeSlotsMatrix[idx % timeSlotsMatrix.length];
        moviesMap.set(m.id, {
          movieId: m.id,
          title: m.title,
          poster_url: m.poster_url,
          duration: m.duration_minutes || 115,
          age_rating: m.age_rating || (idx === 1 ? '18+' : '13+'),
          genres: (m.genres || []).map((g) => g.name).join(', ') || 'Hài, Hoạt Hình, Phiêu Lưu, Hành Động',
          room_type: formatLabel,
          showtimes: slots.map((s, slotIdx) => ({
            id: `cine-${m.id}-${activeRoomType}-${slotIdx}`,
            startTimeStr: s.start,
            endTimeStr: s.end,
            available: true,
            basePrice,
            roomName: currentCinema?.roomName || `${activeRoomType} Cinema`,
            roomType: formatLabel,
          })),
        });
      });
    }

    return Array.from(moviesMap.values());
  }, [dbShowtimesFetch.data, currentCinema, dbMoviesFetch.data, selectedRoomType]);

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-2 sm:px-4 font-sans">
      
      {/* 1. Tiêu đề chính giữa */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#d82d8b] tracking-tight flex items-center justify-center gap-2">
          <span>🎬</span>
          <span>Lịch chiếu phim</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hệ thống cụm rạp CINE Cinema hiện đại tại TP. Hồ Chí Minh & Hà Nội
        </p>
      </div>

      {/* 2. Thanh lọc: Nút chọn Thành phố (HCM / Hà Nội) + Lọc phòng chiếu CINE */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Nút bấm chọn vị trí: Hồ Chí Minh - Hà Nội */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Khu vực:</span>
            
            <button
              type="button"
              onClick={() => setSelectedCity('Hồ Chí Minh')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                selectedCity === 'Hồ Chí Minh'
                  ? 'bg-[#d82d8b] text-white ring-2 ring-pink-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-pink-50 hover:text-[#d82d8b]'
              }`}
            >
              <span>📍</span>
              <span>TP. Hồ Chí Minh</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCity('Hà Nội')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                selectedCity === 'Hà Nội'
                  ? 'bg-[#d82d8b] text-white ring-2 ring-pink-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-pink-50 hover:text-[#d82d8b]'
              }`}
            >
              <span>📍</span>
              <span>Hà Nội</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCity('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedCity === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Nút Gần bạn */}
          <button
            type="button"
            onClick={() => setSelectedCity('Hồ Chí Minh')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#d82d8b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Rạp gần bạn</span>
          </button>
        </div>

        {/* Dải lọc Trải nghiệm phòng chiếu CINE (Thay thế đối tác cũ) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {CINE_ROOM_TYPES.map((b) => {
            const isSelected = selectedRoomType === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedRoomType(b.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 transition shadow-xs cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-tr from-[#d82d8b] to-rose-600 text-white border-transparent scale-102 ring-2 ring-pink-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-pink-200 hover:bg-pink-50/40'
                }`}
              >
                <span className="text-sm">{b.icon}</span>
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {b.name}
                </span>
                {b.tag && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tight ${
                      isSelected ? 'bg-white text-[#d82d8b]' : 'bg-pink-100 text-[#d82d8b]'
                    }`}
                  >
                    {b.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Khung hiển thị Lịch chiếu: Chia 2 Cột (Trái: Danh sách rạp CINE, Phải: Lịch suất chiếu) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-md grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
        
        {/* CỘT TRÁI: Tìm kiếm & Danh sách cụm rạp CINE (md:col-span-4) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-white">
          
          {/* Ô tìm kiếm theo tên rạp hoặc khu vực */}
          <div className="p-3 border-b border-slate-100 relative">
            <input
              type="text"
              value={searchCinema}
              onChange={(e) => setSearchCinema(e.target.value)}
              placeholder="Tìm theo tên rạp, quận, đường ..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#d82d8b] focus:bg-white focus:outline-none transition"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute right-6 top-5 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Danh sách rạp cuộn dọc */}
          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100">
            {filteredCinemas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">Không tìm thấy cụm rạp CINE phù hợp</p>
                <p>Thử tìm theo từ khóa khác hoặc chuyển khu vực.</p>
              </div>
            ) : (
              filteredCinemas.map((c) => {
                const isActive = c.id === selectedCinemaId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCinemaId(c.id)}
                    className={`w-full flex items-center justify-between p-3.5 text-left transition group cursor-pointer ${
                      isActive
                        ? 'bg-pink-50/80 border-l-4 border-l-[#d82d8b] text-[#d82d8b]'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Huy hiệu thương hiệu CINE của dự án */}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#d82d8b] to-rose-600 text-[10px] font-black text-white shadow-2xs tracking-tighter">
                        CINE
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs block truncate ${isActive ? 'font-bold text-[#d82d8b]' : 'font-medium text-slate-900'}`}>
                          {c.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-medium">
                            {c.city}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[9px] font-mono font-bold text-pink-700 bg-pink-100 px-1.5 py-0.2 rounded">
                            {c.tag || c.roomType}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            ({c.seatsCount} ghế)
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isActive ? 'text-[#d82d8b] translate-x-0.5' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })
            )}
          </div>

          {/* Chân cột trái hiển thị tổng số rạp */}
          <div className="p-3 border-t border-slate-100 text-center bg-slate-50/60 text-xs text-slate-500">
            <span>Hiển thị <b>{filteredCinemas.length}</b> rạp tại {selectedCity === 'all' ? 'Toàn quốc' : (selectedCity === 'Hồ Chí Minh' ? 'TP. Hồ Chí Minh' : 'Hà Nội')}</span>
          </div>
        </div>

        {/* CỘT PHẢI: Chi tiết rạp, dải ngày & lịch chiếu phim (md:col-span-8) */}
        <div className="md:col-span-8 flex flex-col bg-white">
          
          {/* Header thông tin rạp đang chọn */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#d82d8b] to-rose-600 text-xs font-black text-white shadow-xs tracking-tighter">
              CINE
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                <span>{currentCinema?.name}</span>
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[9px] font-bold text-[#d82d8b]">
                  {currentCinema?.city}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 uppercase">
                  {currentCinema?.tag || currentCinema?.roomTypeName || currentCinema?.roomType}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {currentCinema?.address}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    (currentCinema?.name || '') + ' ' + (currentCinema?.address || '')
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-medium text-sky-600 hover:text-sky-700 hover:underline"
                >
                  [ Bản đồ ]
                </a>
              </p>
            </div>
          </div>

          {/* Dải 7 ngày chọn nhanh dạng thẻ chữ nhật bo góc */}
          <div className="flex border-b border-slate-200 bg-slate-100/60 overflow-x-auto scrollbar-none">
            {next7Days.map((d) => {
              const isActive = d.dateKey === selectedDate;
              return (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(d.dateKey)}
                  className={`flex-1 min-w-[70px] py-2 px-1 text-center transition border-r border-slate-200 last:border-r-0 cursor-pointer ${
                    isActive ? 'bg-[#d82d8b] text-white shadow-inner font-bold' : 'hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="text-base font-extrabold leading-none">{d.dayNumber}</div>
                  <div className={`text-[11px] mt-1 ${isActive ? 'text-white' : 'text-slate-500 font-medium'}`}>
                    {d.dayOfWeek}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Danh sách phim và các suất chiếu */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto max-h-[500px] space-y-6">
            {movieShowtimesList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <span className="text-3xl">🎬</span>
                <p className="text-sm font-semibold text-slate-600">Cụm rạp chưa có lịch chiếu vào ngày đã chọn.</p>
                <p className="text-xs text-slate-400">Vui lòng chọn ngày khác hoặc chi nhánh rạp CINE lân cận.</p>
              </div>
            ) : (
              movieShowtimesList.map((m) => (
                <div key={m.movieId} className="flex flex-col sm:flex-row gap-4 border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                  
                  {/* Poster phim */}
                  <div className="w-24 sm:w-28 shrink-0">
                    <div className="aspect-2/3 w-full rounded-xl overflow-hidden bg-slate-800 shadow-md border border-slate-100 relative group">
                      {m.poster_url ? (
                        <img
                          src={assetUrl(m.poster_url)}
                          alt={m.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-800 via-rose-950 to-slate-900 flex items-center justify-center p-2 text-center text-[10px] text-white font-bold">
                          {m.title}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin phim & Dải giờ chiếu */}
                  <div className="flex-1 min-w-0">
                    {/* Tag độ tuổi + Tên phim */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="rounded-md bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.5 shadow-2xs">
                        {m.age_rating}
                      </span>
                      <Link
                        to={`/movies/${m.movieId}`}
                        className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-[#d82d8b] uppercase tracking-wide transition truncate"
                      >
                        {m.title}
                      </Link>
                    </div>

                    {/* Thể loại */}
                    <p className="text-xs text-slate-500 mb-2">{m.genres}</p>

                    {/* Định dạng phòng chiếu */}
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d82d8b]"></span>
                      <span>{m.room_type}</span>
                    </div>

                    {/* Lưới các suất chiếu (Pills: 14:50 ~ 17:01) */}
                    <div className="flex flex-wrap gap-2.5">
                      {m.showtimes.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            setBookingModalData({
                              showtime: st,
                              movie: m,
                              cinema: currentCinema,
                            })
                          }
                          className="group flex items-center justify-center rounded-xl border border-sky-400 bg-sky-50/40 px-3 py-1.5 text-xs font-bold text-sky-700 hover:border-[#d82d8b] hover:bg-[#d82d8b] hover:text-white transition shadow-2xs active:scale-95 cursor-pointer"
                          title="Bấm để chọn ghế cho suất chiếu này"
                        >
                          <span>{st.startTimeStr} ~ {st.endTimeStr}</span>
                        </button>
                      ))}
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Modal Đặt vé xem phim chuẩn MoMo 3 bước */}
      <MoMoBookingModal
        open={Boolean(bookingModalData)}
        onClose={() => setBookingModalData(null)}
        showtime={bookingModalData?.showtime}
        movie={bookingModalData?.movie}
        cinema={bookingModalData?.cinema}
      />

    </div>
  );
}
