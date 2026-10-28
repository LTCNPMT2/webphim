import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../hooks/useAuth.js';
import { getMovie, getMovies, getCinemas, getShowtimes, getReviews, saveReview, deleteMyReview, getMyReview } from '../services/catalogService.js';
import { assetUrl, formatDate, formatDateTime, formatPrice, formatRating, formatTime, toDateKey } from '../utils/format.js';
import { AGE_COLORS, AGE_LABELS, STATUS_LABELS } from '../utils/constants.js';
import { getYoutubeEmbedUrl } from '../utils/youtube.js';
import StarRating from '../components/ui/StarRating.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Button, { buttonClass } from '../components/ui/Button.jsx';
import MoMoBookingModal from '../components/booking/MoMoBookingModal.jsx';

// Danh sách tag cảm xúc đánh giá mô phỏng theo app xem phim
const REVIEW_TAGS = ['Khóc trôi rạp', 'Cười banh rạp', 'Hài hước', 'Tuyệt vời', 'Hài lòng', 'Cảm động', 'Kịch tính'];

// Danh sách các ngày: từ hôm nay và 13 ngày tiếp theo
function generateDates() {
  const list = [];
  const today = new Date();
  const dayNames = ['CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateKey = toDateKey(d);
    const dayOfWeek = i === 0 ? 'HÔM NAY' : dayNames[d.getDay()];
    const dayNumber = d.getDate();
    list.push({ dateKey, dayOfWeek, dayNumber, fullDate: d });
  }
  return list;
}

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tải thông tin phim chi tiết
  const { data: movie, loading, error, status, reload: reloadMovie } = useFetch(() => getMovie(id), [id]);

  // Tải danh sách rạp của dự án
  const cinemasFetch = useFetch(getCinemas, []);
  const allCinemas = cinemasFetch.data || [];

  // Tải danh sách phim đang chiếu cho cột bên phải
  const nowShowingFetch = useFetch(() => getMovies({ status: 'now_showing', limit: 8 }), []);
  const otherMovies = useMemo(() => {
    return (nowShowingFetch.data?.items || []).filter((m) => String(m.id) !== String(id)).slice(0, 5);
  }, [nowShowingFetch.data, id]);

  // State chọn ngày & rạp cho lịch chiếu
  const dateList = useMemo(() => generateDates(), []);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCinemaId, setSelectedCinemaId] = useState('all');
  const [expandedCinemas, setExpandedCinemas] = useState({}); // { [cinemaId]: boolean }

  // State đánh giá
  const [reviewVersion, setReviewVersion] = useState(0);
  const reviewsFetch = useFetch(() => getReviews(id, { page: 1, limit: 10 }), [id, reviewVersion]);
  const myReviewFetch = useFetch(() => (user ? getMyReview(id) : Promise.resolve(null)), [id, user?.id, reviewVersion]);

  // Form viết đánh giá
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // State các section tương tác
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showFullIntro, setShowFullIntro] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [bookingModalData, setBookingModalData] = useState(null);

  // Tải danh sách suất chiếu theo ngày và rạp
  const showtimesFetch = useFetch(
    () => getShowtimes({
      movie_id: id,
      date: selectedDate,
      ...(selectedCinemaId !== 'all' && { cinema_id: selectedCinemaId }),
    }),
    [id, selectedDate, selectedCinemaId]
  );

  // Mặc định mở rộng rạp đầu tiên khi có suất chiếu
  useEffect(() => {
    if (showtimesFetch.data && showtimesFetch.data.length > 0) {
      const initOpen = {};
      showtimesFetch.data.forEach((c, idx) => {
        initOpen[c.cinema.id] = idx === 0 || true; // Mở sẵn cho tiện người dùng
      });
      setExpandedCinemas(initOpen);
    }
  }, [showtimesFetch.data]);

  // Đồng bộ đánh giá cũ nếu có
  useEffect(() => {
    if (myReviewFetch.data) {
      setMyRating(myReviewFetch.data.rating || 5);
      setMyComment(myReviewFetch.data.comment || '');
    }
  }, [myReviewFetch.data]);

  // Scroll ngang thanh ngày
  const dateRibbonRef = useRef(null);
  const scrollDateRibbon = (direction) => {
    if (dateRibbonRef.current) {
      dateRibbonRef.current.scrollBy({ left: direction * 240, behavior: 'smooth' });
    }
  };

  // Scroll ngang danh sách diễn viên
  const castListRef = useRef(null);
  const scrollCast = (direction) => {
    if (castListRef.current) {
      castListRef.current.scrollBy({ left: direction * 280, behavior: 'smooth' });
    }
  };

  // Xử lý gửi đánh giá
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để viết đánh giá');
      return navigate('/login');
    }
    if (!myRating) return toast.error('Vui lòng chọn số sao');

    setSubmittingReview(true);
    try {
      await saveReview(id, { rating: myRating, comment: myComment.trim() });
      toast.success('Cảm ơn bạn đã gửi đánh giá!');
      setReviewVersion((v) => v + 1);
      reloadMovie();
    } catch (err) {
      toast.error(err.message || 'Chưa thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !movie) {
    return (
      <div className="space-y-8 py-8">
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (status === 404 || status === 422 || !movie) {
    return (
      <div className="py-24 text-center">
        <p className="text-6xl">🎞️</p>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Không tìm thấy phim</h1>
        <p className="mt-2 text-slate-400">Tác phẩm điện ảnh này không tồn tại hoặc đã ngừng phát hành.</p>
        <Link to="/movies" className={`mt-6 ${buttonClass('primary')}`}>Xem tất cả phim</Link>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reloadMovie} />;

  const embedUrl = getYoutubeEmbedUrl(movie.trailer_url);
  const backdrop = movie.banner_url || movie.poster_url;
  const totalReviews = Number(reviewsFetch.data?.pagination?.total ?? movie.rating_count) || 0;
  const ratingScore = totalReviews > 0 ? formatRating(reviewsFetch.data?.summary?.average ?? movie.rating_avg, '0.0') : 'Chưa có';
  const ratingCount = totalReviews.toLocaleString();

  // Dữ liệu diễn viên (nếu DB chưa có cast_data thì tự sinh mô phỏng đẹp như screenshot)
  const castList = (movie.cast_data && movie.cast_data.length > 0)
    ? movie.cast_data
    : [
        { name: 'Steven Nguyễn', role: 'Trần Duy Ny (700)', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80' },
        { name: 'Trầm Minh Hoàng', role: 'Báu (669)', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80' },
        { name: 'Huỳnh Minh Kiên', role: 'Út Đẹt (512)', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80' },
        { name: 'Tùng Mint', role: 'Nguyễn Thanh Tùng (198)', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80' },
        { name: 'Võ Đình Hiếu', role: 'Hiếu (010)', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80' },
      ];

  // 2 ảnh cảnh phim / stills (Hình ảnh & Video)
  const galleryImages = (movie.gallery_images && movie.gallery_images.length > 0)
    ? movie.gallery_images
    : [
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
      ];

  // Danh sách câu hỏi thường gặp
  const faqs = (movie.custom_faqs && movie.custom_faqs.length > 0)
    ? movie.custom_faqs
    : [
        { question: `Mấy tuổi xem được phim ${movie.title}?`, answer: `Phim được phân loại độ tuổi ${movie.age_rating} (${AGE_LABELS[movie.age_rating] || 'Dành cho khán giả theo quy định'}). Vui lòng mang giấy tờ tùy thân khi đến rạp.` },
        { question: `Phim ${movie.title} khi nào chiếu?`, answer: `Phim chính thức khởi chiếu từ ngày ${formatDate(movie.release_date)} tại tất cả các cụm rạp của hệ thống trên toàn quốc.` },
        { question: `Phim ${movie.title} có dựa trên chuyện có thật không?`, answer: `Kịch bản phim lấy cảm hứng từ những chất liệu đời sống chân thực, được xây dựng tỉ mỉ và kịch tính dưới bàn tay của đạo diễn ${movie.director || 'hàng đầu'}.` },
        { question: `Thời lượng phim ${movie.title} là bao nhiêu phút?`, answer: `Phim có tổng thời lượng ${movie.duration_minutes} phút, bao gồm các phân cảnh cao trào nghẹt thở và lắng đọng cảm xúc.` },
      ];

  // Lọc rạp hiển thị theo thành phố nếu có
  const filteredShowtimesCinemas = (showtimesFetch.data || []).filter((item) => {
    if (selectedCity === 'all') return true;
    return item.cinema.city?.toLowerCase().includes(selectedCity.toLowerCase());
  });

  const handleQuickBook = () => {
    let foundSt = null;
    let foundCinema = null;
    for (const c of filteredShowtimesCinemas) {
      if (c.showtimes && c.showtimes.length > 0) {
        foundSt = c.showtimes.find((s) => s.available_seats == null || s.available_seats > 0) || c.showtimes[0];
        foundCinema = c.cinema;
        break;
      }
    }

    if (foundSt) {
      setBookingModalData({
        showtime: {
          id: foundSt.id,
          startTimeStr: formatTime(foundSt.start_time),
          endTimeStr: formatTime(foundSt.end_time),
          basePrice: foundSt.base_price,
          roomName: foundSt.room_name,
          roomType: foundSt.room_type,
        },
        movie,
        cinema: foundCinema,
      });
    } else {
      document.getElementById('lich-chieu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-8 bg-[#14080e] text-slate-100 min-h-screen">
      
      {/* =========================================================================
          1. HERO BANNER CHÍNH (ẢNH 1)
          ========================================================================= */}
      <section className="relative overflow-hidden border-b border-white/5 bg-[#1a0b12]">
        
        {/* Ảnh nền mờ cinematic và gradient đỏ rượu đặc trưng */}
        {backdrop && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={assetUrl(backdrop)}
              alt=""
              className="h-full w-full object-cover object-center scale-105 opacity-30 filter blur-xs"
            />
            {/* Lớp phủ gradient chuyển mượt sang màu tối của web */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#14080e] via-[#14080e]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14080e] via-transparent to-[#14080e]/60" />
          </div>
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
            
            {/* Cột trái: Thông tin chính của phim */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Badge Siêu phẩm */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1 text-xs font-bold text-pink-300 backdrop-blur-xs">
                  <span className="text-pink-400">💖</span> Siêu phẩm
                </span>
              </div>

              {/* Tên phim to nổi bật */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>

              {/* Tên phụ, năm sản xuất, thời lượng */}
              <p className="text-xs sm:text-sm font-medium text-slate-300/90 flex flex-wrap items-center gap-2">
                <span>{movie.slug || movie.title}</span>
                <span>•</span>
                <span>{new Date(movie.release_date).getFullYear() || 2026}</span>
                <span>•</span>
                <span>{movie.duration_minutes} phút</span>
              </p>

              {/* Điểm đánh giá & Độ tuổi */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                {totalReviews > 0 ? (
                  <a href="#danh-gia" className="flex items-center gap-2.5 group cursor-pointer">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-400 text-slate-950 font-black text-base shadow-md">
                      ★
                    </span>
                    <div>
                      <span className="text-xl font-black text-white group-hover:text-amber-400 transition">
                        {ratingScore}
                      </span>
                      <span className="text-xs text-slate-400 block group-hover:text-slate-300">
                        từ {ratingCount} đánh giá &gt;
                      </span>
                    </div>
                  </a>
                ) : (
                  <a href="#danh-gia" className="flex items-center gap-2.5 group cursor-pointer">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-700 text-amber-400 font-black text-base shadow-md">
                      ★
                    </span>
                    <div>
                      <span className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition">
                        Chưa có đánh giá
                      </span>
                      <span className="text-xs text-slate-400 block group-hover:text-slate-300">
                        Viết đánh giá đầu tiên &gt;
                      </span>
                    </div>
                  </a>
                )}

                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-black text-white tracking-wider">
                    {movie.age_rating || '18+'}
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-slate-200 block">Độ tuổi</span>
                    <span className="text-slate-400">
                      {movie.age_rating === 'P' ? 'Mọi lứa tuổi' : `Khán giả từ ${movie.age_rating?.replace(/\D/g, '') || '18'} tuổi`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Câu Slogan / Tagline */}
              <p className="text-sm italic text-slate-300 font-serif border-l-2 border-pink-500/50 pl-3">
                &ldquo;{movie.tagline || 'Khi gia đình là lý do để sống sót'}&rdquo;
              </p>

              {/* Nút Mua vé ngay & Xem review */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleQuickBook}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d82d8b] to-rose-600 hover:from-[#c2185b] hover:to-rose-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition active:scale-95 cursor-pointer"
                >
                  <span>🎟️</span> Mua vé ngay
                </button>
                <a
                  href="#danh-gia"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3.5 text-sm font-semibold text-white transition active:scale-95 cursor-pointer backdrop-blur-xs"
                >
                  <span>⭐</span> Xem review
                </a>
              </div>

              {/* Thẻ tóm tắt nội dung nổi góc dưới */}
              <div className="mt-6 flex gap-4 rounded-2xl bg-black/40 border border-white/10 p-3.5 backdrop-blur-md max-w-xl">
                <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-800 shadow-md">
                  {movie.poster_url && (
                    <img src={assetUrl(movie.poster_url)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Nội dung
                    </span>
                    <p className={`text-slate-300 leading-relaxed ${showFullSynopsis ? '' : 'line-clamp-2'}`}>
                      {movie.description || 'Nội dung bộ phim đang được cập nhật.'}
                    </p>
                    {movie.description && movie.description.length > 80 && (
                      <button
                        type="button"
                        onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                        className="text-amber-400 hover:text-amber-300 font-bold ml-1 cursor-pointer"
                      >
                        {showFullSynopsis ? 'Thu gọn' : '...Xem thêm'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">NGÀY CHIẾU</span>
                      <strong className="text-white font-semibold truncate block">{formatDate(movie.release_date)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">QUỐC GIA</span>
                      <strong className="text-white font-semibold truncate block">{movie.country || 'Việt Nam'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">THỂ LOẠI</span>
                      <strong className="text-white font-semibold truncate block">
                        {movie.genres?.map((g) => g.name).join(', ') || 'Gay cấn, Hành động'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Cột phải: Khung Trailer có nút Play tròn to */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative group cursor-pointer" onClick={() => setTrailerOpen(true)}>
                <div className="relative h-64 sm:h-72 w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                  <img
                    src={assetUrl(backdrop)}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition" />
                  
                  {/* Nút Play tròn to chính giữa */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 border-2 border-white/80 text-white backdrop-blur-md shadow-xl group-hover:scale-110 group-hover:bg-[#d82d8b] group-hover:border-transparent transition duration-300">
                      <span className="text-2xl ml-1">▶</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">Bấm để xem Trailer chính thức</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. THANH LỊCH CHIẾU & CHỌN RẠP (ẢNH 1, 2, 3)
          Sticky khi cuộn để khách hàng dễ dàng theo dõi và chọn suất
          ========================================================================= */}
      <section id="lich-chieu" className="sticky top-16 z-30 bg-[#160a12]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-3">
          
          {/* Dòng tiêu đề + Chọn Tỉnh/Thành phố */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Lịch chiếu</span>
              <span className="text-pink-400">{movie.title}</span>
            </h2>

            <div className="flex items-center gap-2">
              {/* Dropdown Thành phố */}
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none rounded-lg bg-[#25121c] border border-white/10 px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 cursor-pointer focus:border-pink-500"
                >
                  <option value="all">📍 Toàn quốc</option>
                  <option value="Hồ Chí Minh">📍 Hồ Chí Minh</option>
                  <option value="Hà Nội">📍 Hà Nội</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">⌵</span>
              </div>

              {/* Nút Gần bạn */}
              <button
                type="button"
                onClick={() => toast('Đang định vị cụm rạp gần bạn nhất...', { icon: '🎯' })}
                className="rounded-lg bg-[#25121c] hover:bg-[#321726] border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🎯</span> Gần bạn
              </button>
            </div>
          </div>

          {/* Dải chọn ngày cuộn ngang (Date Ribbon) */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => scrollDateRibbon(-1)}
              className="absolute left-0 z-10 flex h-8 w-8 -translate-x-3 items-center justify-center rounded-full bg-slate-900/90 border border-white/20 text-white shadow-md hover:bg-pink-600 transition cursor-pointer"
            >
              ‹
            </button>

            <div
              ref={dateRibbonRef}
              className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 w-full"
            >
              {dateList.map((item) => {
                const isSelected = selectedDate === item.dateKey;
                return (
                  <button
                    key={item.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(item.dateKey)}
                    className={`flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] h-[60px] rounded-xl text-xs transition duration-200 cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-[#d82d8b] border-[#d82d8b] text-white font-bold shadow-md shadow-pink-600/40 scale-102'
                        : 'bg-[#220f1a] border-white/5 text-slate-300 hover:bg-[#2c1322] hover:border-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-semibold opacity-90">{item.dayOfWeek}</span>
                    <span className="text-base font-extrabold">{item.dayNumber}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollDateRibbon(1)}
              className="absolute right-0 z-10 flex h-8 w-8 translate-x-3 items-center justify-center rounded-full bg-slate-900/90 border border-white/20 text-white shadow-md hover:bg-pink-600 transition cursor-pointer"
            >
              ›
            </button>
          </div>

          {/* Thanh lọc theo Rạp của dự án (Tất cả + Danh sách rạp) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setSelectedCinemaId('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedCinemaId === 'all'
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-[#220f1a] text-slate-300 border-white/5 hover:bg-[#2c1322]'
              }`}
            >
              <span>★</span> Tất cả rạp
            </button>

            {allCinemas.map((c) => {
              const active = String(selectedCinemaId) === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCinemaId(String(c.id))}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-2 border ${
                    active
                      ? 'bg-gradient-to-r from-[#d82d8b] to-rose-600 text-white border-pink-500 shadow-md'
                      : 'bg-[#220f1a] text-slate-300 border-white/5 hover:bg-[#2c1322]'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {c.name}
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. DANH SÁCH SUẤT CHIẾU THEO RẠP & PHÒNG CHIẾU (ẢNH 2)
          ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        
        {showtimesFetch.loading && !showtimesFetch.data ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : filteredShowtimesCinemas.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#1c0d16] p-8 text-center space-y-3">
            <p className="text-4xl">📅</p>
            <h3 className="text-base font-bold text-white">Chưa có suất chiếu vào ngày này</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Rạp chưa mở lịch chiếu cho ngày được chọn. Bạn hãy thử chọn ngày khác hoặc chọn rạp khác ở trên nhé.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShowtimesCinemas.map(({ cinema, showtimes: sList }) => {
              const isOpen = expandedCinemas[cinema.id] ?? true;

              // Gom nhóm suất chiếu theo Phòng chiếu / Định dạng
              const roomGroups = {};
              sList.forEach((s) => {
                const roomKey = `${s.room_name || 'Phòng chiếu'} · ${s.room_type || '2D'}`;
                if (!roomGroups[roomKey]) roomGroups[roomKey] = [];
                roomGroups[roomKey].push(s);
              });

              return (
                <div
                  key={cinema.id}
                  className="rounded-2xl border border-white/5 bg-[#1c0d16] overflow-hidden transition shadow-md"
                >
                  {/* Header rạp (Bấm để mở/đóng) */}
                  <div
                    onClick={() => setExpandedCinemas((prev) => ({ ...prev, [cinema.id]: !isOpen }))}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 font-black text-sm">
                        🎬
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">{cinema.name}</h3>
                        <p className="text-xs text-slate-400">
                          {cinema.address}, {cinema.city}{' '}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.name + ' ' + cinema.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-pink-400 hover:underline font-semibold ml-1"
                          >
                            [ Bản đồ ]
                          </a>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:text-white transition"
                    >
                      {isOpen ? '⌵' : '›'}
                    </button>
                  </div>

                  {/* Body: Danh sách phòng và các nút giờ suất chiếu */}
                  {isOpen && (
                    <div className="border-t border-white/5 bg-black/20 p-4 space-y-4">
                      {Object.entries(roomGroups).map(([roomTitle, times]) => (
                        <div key={roomTitle} className="space-y-2">
                          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                            {roomTitle}
                          </span>

                          <div className="flex flex-wrap gap-2.5">
                            {times.map((st) => {
                              const isSoldOut = st.available_seats <= 0;
                              const start = formatTime(st.start_time);
                              const end = formatTime(st.end_time);

                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  disabled={isSoldOut}
                                  onClick={() => {
                                    if (isSoldOut) return;
                                    setBookingModalData({
                                      showtime: {
                                        id: st.id,
                                        startTimeStr: start,
                                        endTimeStr: end,
                                        basePrice: st.base_price,
                                        roomName: st.room_name || roomTitle.split('·')[0].trim(),
                                        roomType: st.room_type || (roomTitle.includes('IMAX') ? 'IMAX Laser' : roomTitle.includes('3D') ? '3D Kỹ Thuật Số' : '2D Chuẩn'),
                                      },
                                      movie,
                                      cinema,
                                    });
                                  }}
                                  className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer ${
                                    isSoldOut
                                      ? 'cursor-not-allowed border-white/5 bg-white/5 text-slate-500'
                                      : 'border-white/10 bg-[#24111d] hover:border-pink-500 hover:bg-[#341629] text-white hover:scale-102'
                                  }`}
                                  title="Bấm để chọn ghế cho suất chiếu này"
                                >
                                  <span className="text-sm font-extrabold group-hover:text-pink-400 transition">
                                    {start}
                                  </span>
                                  <span className="text-slate-400 text-[11px] font-normal">→ {end}</span>
                                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-amber-300 font-semibold">
                                    {formatPrice(st.base_price)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* =========================================================================
          4. PHẦN CHIA 2 CỘT: ĐÁNH GIÁ (70%) & PHIM ĐANG CHIẾU (30%) (ẢNH 3)
          ========================================================================= */}
      <section id="danh-gia" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI (Khoảng 70%): ĐÁNH GIÁ TỪ NGƯỜI XEM & CHI TIẾT */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 4.1 Khung đánh giá người xem */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-white">Đánh giá từ người xem</h2>
                <div className="flex items-center gap-2">
                  {totalReviews > 0 ? (
                    <>
                      <span className="text-amber-400 text-xl font-black">★ {ratingScore}</span>
                      <span className="text-xs text-slate-400">/ 10 • {ratingCount} đánh giá</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Chưa có lượt đánh giá nào</span>
                  )}
                </div>
              </div>

              {/* Form gửi đánh giá của người dùng */}
              <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-white/10 bg-[#1c0d16] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {user ? `Chia sẻ cảm nhận của bạn (${user.full_name}):` : 'Đăng nhập để đánh giá phim:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMyRating(star)}
                        className={`text-xl transition cursor-pointer ${star <= myRating ? 'text-amber-400 scale-110' : 'text-slate-600'}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1.5">{myRating * 2}/10</span>
                  </div>
                </div>

                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Góp ý hoặc cảm nhận của bạn sau khi xem bộ phim..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-pink-500"
                />

                <div className="flex justify-end gap-2">
                  <Button type="submit" variant="primary" loading={submittingReview}>
                    Gửi đánh giá
                  </Button>
                </div>
              </form>

              {/* Danh sách review từ người xem */}
              <div className="space-y-4">
                {(reviewsFetch.data?.items || []).map((rev) => {
                  const displayName = rev.full_name || rev.user_name || 'Khán giả';
                  const initial = displayName.charAt(0).toUpperCase();
                  const timeStr = rev.created_at ? formatDateTime(rev.created_at) : 'Vừa xong';

                  return (
                    <div key={rev.id} className="rounded-2xl border border-white/5 bg-[#1a0a14] p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center font-bold text-white text-sm shadow">
                            {initial}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">{displayName}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span>{timeStr}</span>
                              <span className="text-pink-400 font-semibold">• Đã mua vé</span>
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 text-xs font-black text-amber-300">
                          ★ {formatRating(rev.rating, '10.0')}/10 - Cực phẩm!
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>

                      {/* Tag cảm xúc */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {REVIEW_TAGS.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* =========================================================================
                5. DIỄN VIÊN & ĐOÀN LÀM PHIM (ẢNH 5)
                ========================================================================= */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-white">Diễn viên &amp; Đoàn làm phim</h3>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollCast(-1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCast(1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Danh sách thẻ diễn viên cuộn ngang */}
              <div ref={castListRef} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1">
                {castList.map((actor, idx) => (
                  <div key={idx} className="w-28 sm:w-32 shrink-0 space-y-2 group cursor-pointer text-center">
                    <div className="aspect-[3/4] overflow-hidden rounded-xl bg-slate-800 border border-white/10 shadow group-hover:border-pink-500 transition">
                      <img
                        src={actor.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                        alt={actor.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-sky-400 group-hover:text-white transition block truncate">
                        {actor.name}
                      </strong>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {actor.role || 'Diễn viên'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* =========================================================================
                6. HÌNH ẢNH & VIDEO (ẢNH 5)
                ========================================================================= */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-lg sm:text-xl font-bold text-white">Hình ảnh &amp; Video</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {galleryImages.slice(0, 2).map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 shadow-lg group">
                    <img
                      src={imgUrl}
                      alt={`Cảnh phim ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                      <span className="text-xs text-white font-semibold">Cảnh quay ấn tượng #{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (Khoảng 30%): PHIM ĐANG CHIẾU (ẢNH 3, 5) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-40 rounded-2xl border border-white/10 bg-[#1c0d16] p-4 sm:p-5 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
                <span>Phim đang chiếu</span>
                <Link to="/movies?status=now_showing" className="text-xs text-pink-400 hover:underline font-normal">
                  Xem tất cả &gt;
                </Link>
              </h3>

              <div className="space-y-3.5">
                {otherMovies.map((m, index) => (
                  <Link
                    key={m.id}
                    to={`/movies/${m.id}`}
                    className="flex gap-3 group rounded-xl p-2 hover:bg-white/5 transition cursor-pointer"
                  >
                    {/* Số thứ tự & Poster */}
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800 shadow">
                      {m.poster_url && (
                        <img src={assetUrl(m.poster_url)} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" />
                      )}
                      <span className="absolute top-0 left-0 flex h-5 w-5 items-center justify-center rounded-br-md bg-black/80 font-black text-white text-[10px]">
                        {index + 1}
                      </span>
                    </div>

                    {/* Chi tiết phim */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="rounded bg-red-600 px-1 py-0.2 text-[9px] font-bold text-white">
                            {m.age_rating || '18+'}
                          </span>
                          <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] font-semibold text-sky-300">
                            SNEAKSHOW
                          </span>
                        </div>
                        <h4 className="font-bold text-white group-hover:text-pink-400 transition truncate text-xs sm:text-sm">
                          {m.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {m.genres?.map((g) => g.name).join(', ') || 'Hài, Kịch tính'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <span>★</span>
                        <span>{Number(m.rating_avg) > 0 ? formatRating(m.rating_avg) : 'Mới'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. CÂU HỎI THƯỜNG GẶP VỀ PHIM (ẢNH 4, 5) - CĂN GIỮA
          ========================================================================= */}
      <section className="border-t border-white/5 py-12 bg-black/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Cột trái tiêu đề phong cách nghệ thuật */}
            <div className="md:col-span-5 space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                Câu hỏi thường gặp về phim{' '}
                <span className="font-serif italic text-pink-500 block text-2xl sm:text-3xl mt-1">
                  {movie.title}
                </span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Những thắc mắc khán giả quan tâm về bộ phim {movie.title} trước khi ra rạp thưởng thức.
              </p>
            </div>

            {/* Cột phải accordion danh sách câu hỏi */}
            <div className="md:col-span-7 space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-white/5 bg-[#1c0d16] overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-bold text-white hover:text-pink-400 transition cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <span className="text-xs text-slate-400 ml-2">{isOpen ? '⌃' : '⌵'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-black/20">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          8. GIỚI THIỆU PHIM (ẢNH 4) - CĂN GIỮA
          ========================================================================= */}
      <section className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Giới thiệu phim{' '}
              <span className="font-serif italic text-pink-500 text-2xl sm:text-3xl">
                {movie.title}
              </span>
            </h3>
          </div>

          {/* Bảng thông tin chi tiết */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#1a0a14] overflow-hidden shadow-lg">
            <div className="bg-[#240f1c] px-4 py-3 border-b border-white/10 text-center sm:text-left">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Thông tin phim {movie.title} - The Journey of Heroes
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="w-1/3 p-3 font-semibold text-slate-400 bg-white/2">Tên phim chính thức</td>
                  <td className="p-3 text-white font-medium">{movie.title} (Tựa tiếng Anh: {movie.slug})</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Đạo diễn</td>
                  <td className="p-3 text-white">{movie.director || 'Đang cập nhật'}</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Diễn viên</td>
                  <td className="p-3 text-white">{movie.cast_members || 'Đang cập nhật'}</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Thể loại</td>
                  <td className="p-3 text-white">{movie.genres?.map((g) => g.name).join(', ') || 'Gay cấn, Hành động'}</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Khởi chiếu</td>
                  <td className="p-3 text-white">{formatDate(movie.release_date)}</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Thời lượng</td>
                  <td className="p-3 text-white">{movie.duration_minutes} phút</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Ngôn ngữ</td>
                  <td className="p-3 text-white">{movie.language || 'Tiếng Việt'}</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Quốc gia</td>
                  <td className="p-3 text-white">{movie.country || 'Việt Nam'}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-400 bg-white/2">Độ tuổi</td>
                  <td className="p-3 text-white">
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white mr-1.5">
                      {movie.age_rating}
                    </span>
                    {AGE_LABELS[movie.age_rating] || 'Khán giả đủ 18 tuổi trở lên'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Nút Xem thêm */}
            <div className="p-3 text-center border-t border-white/5 bg-black/20">
              <button
                type="button"
                onClick={() => setShowFullIntro(!showFullIntro)}
                className="text-xs font-bold text-slate-300 hover:text-pink-400 transition cursor-pointer"
              >
                {showFullIntro ? 'Thu gọn ⌃' : 'Xem thêm ⌵'}
              </button>
              {showFullIntro && (
                <p className="mt-3 text-xs text-slate-300 leading-relaxed text-left p-4 bg-white/5 rounded-xl border border-white/5">
                  {movie.description || 'Chưa có thông tin mô tả chi tiết thêm cho tác phẩm này.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal phát Trailer YouTube */}
      <Modal open={trailerOpen} onClose={() => setTrailerOpen(false)} title={`Trailer: ${movie.title}`}>
        <div className="aspect-video bg-black">
          {embedUrl ? (
            <iframe
              src={`${embedUrl}?autoplay=1&rel=0`}
              title={`Trailer ${movie.title}`}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Phim chưa có liên kết trailer
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Đặt vé xem phim - Chọn dãy ghế trực tiếp */}
      <MoMoBookingModal
        open={Boolean(bookingModalData)}
        onClose={() => setBookingModalData(null)}
        showtime={bookingModalData?.showtime}
        movie={bookingModalData?.movie || movie}
        cinema={bookingModalData?.cinema}
      />

    </div>
  );
}
