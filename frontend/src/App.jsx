import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Movies from './pages/Movies.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import Cinemas from './pages/Cinemas.jsx';
import Showtimes from './pages/Showtimes.jsx';
import SeatSelection from './pages/SeatSelection.jsx';
import Checkout from './pages/Checkout.jsx';
import BookingSuccess from './pages/BookingSuccess.jsx';
import MyBookings from './pages/MyBookings.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMovies from './pages/admin/AdminMovies.jsx';
import AdminGenres from './pages/admin/AdminGenres.jsx';
import AdminCinemas from './pages/admin/AdminCinemas.jsx';
import AdminRooms from './pages/admin/AdminRooms.jsx';
import AdminShowtimes from './pages/admin/AdminShowtimes.jsx';
import AdminCombos from './pages/admin/AdminCombos.jsx';
import AdminPromotions from './pages/admin/AdminPromotions.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import RequirePhoneModal from './components/auth/RequirePhoneModal.jsx';

// Bản đồ trang: website cho khách (Layout chung) và khu quản trị (AdminLayout riêng, chỉ role admin)
export default function App() {
  return (
    <>
      <ScrollToTop />
      <RequirePhoneModal />
      <Routes>
        <Route element={<Layout />}>
          {/* Công khai */}
          <Route index element={<Home />} />
          <Route path="movies" element={<Movies />} />
          <Route path="movies/:id" element={<MovieDetail />} />
          <Route path="cinemas" element={<Cinemas />} />
          <Route path="showtimes" element={<Showtimes />} />
          <Route path="schedule" element={<Showtimes />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile />} />
            <Route path="booking/:showtimeId/seats" element={<SeatSelection />} />
            <Route path="checkout/:bookingId" element={<Checkout />} />
            <Route path="booking-success/:bookingId" element={<BookingSuccess />} />
            <Route path="my-bookings" element={<MyBookings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Khu quản trị: chỉ admin, không dùng Header/Footer của website */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="genres" element={<AdminGenres />} />
            <Route path="cinemas" element={<AdminCinemas />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="showtimes" element={<AdminShowtimes />} />
            <Route path="combos" element={<AdminCombos />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
