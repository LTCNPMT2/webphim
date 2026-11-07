import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
  getStaff,
  createStaff,
  changeStaffRole,
  changeStaffStatus,
  resetStaffPassword,
  getCinemas,
  getRoles,
  createRole,
} from '../../services/adminService.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { formatDateTime } from '../../utils/format.js';

// Ma trận quyền mẫu hiển thị ở chế độ chỉ xem
const PERMISSIONS_MATRIX_DATA = [
  { module: 'Tổng quan doanh thu / Báo cáo chi tiết', admin: 'VCUD', manager: 'V', staff: '-', concession: '-' },
  { module: 'Phim, Thể loại, Diễn viên, Đạo diễn, Định dạng', admin: 'VCUD', manager: 'VCUD', staff: '-', concession: '-' },
  { module: 'Cụm rạp, Phòng chiếu & Ghế', admin: 'VCUD', manager: 'VCU', staff: '-', concession: '-' },
  { module: 'Lịch & Suất chiếu', admin: 'VCUD', manager: 'VCUD', staff: 'V', concession: 'V' },
  { module: 'Giá vé', admin: 'VCUD', manager: 'VCU', staff: '-', concession: '-' },
  { module: 'Combo bắp nước & Mã giảm giá', admin: 'VCUD', manager: 'VCUD', staff: '-', concession: 'VCUD' },
  { module: 'Đơn vé đã đặt', admin: 'VCUD', manager: 'V, U (hủy/đổi)', staff: 'V (tra cứu)', concession: 'V (tra cứu)' },
  { module: 'Thanh toán & Giao dịch', admin: 'VCUD', manager: 'V', staff: '-', concession: '-' },
  { module: 'Soát vé / Check-in', admin: 'VCUD', manager: 'V', staff: 'V, U (soát vé)', concession: '-' },
  { module: 'Đánh giá & Bình luận', admin: 'VCUD', manager: 'V, U (duyệt/ẩn)', staff: '-', concession: '-' },
  { module: 'Thông báo', admin: 'VCUD', manager: 'VCU', staff: '-', concession: '-' },
  { module: 'Khách hàng & Người dùng', admin: 'VCUD', manager: 'V', staff: '-', concession: '-' },
  { module: 'Nhân viên & Phân quyền', admin: 'VCUD', manager: '-', staff: '-', concession: '-' },
  { module: 'Cài đặt hệ thống', admin: 'VCUD', manager: '-', staff: '-', concession: '-' },
];

// Danh sách các module và quyền khả dụng khi tạo chức vụ mới
const AVAILABLE_PERM_MODULES = [
  {
    id: 'combos',
    label: 'Combo bắp nước & Khuyến mãi',
    icon: '🍿',
    actions: [
      { key: 'combos:view', label: 'Xem combo' },
      { key: 'combos:create', label: 'Thêm combo' },
      { key: 'combos:update', label: 'Sửa combo' },
      { key: 'combos:delete', label: 'Xóa combo' },
    ],
  },
  {
    id: 'bookings',
    label: 'Đơn vé & Soát vé check-in',
    icon: '🎟️',
    actions: [
      { key: 'bookings:view', label: 'Xem & tra cứu đơn vé' },
      { key: 'bookings:update', label: 'Đổi / hủy đơn vé' },
      { key: 'bookings:checkin', label: 'Soát vé / Check-in' },
    ],
  },
  {
    id: 'showtimes',
    label: 'Lịch & Suất chiếu',
    icon: '🕒',
    actions: [
      { key: 'showtimes:view', label: 'Xem suất chiếu' },
      { key: 'showtimes:create', label: 'Tạo suất chiếu' },
      { key: 'showtimes:update', label: 'Sửa suất chiếu' },
      { key: 'showtimes:delete', label: 'Xóa suất chiếu' },
    ],
  },
  {
    id: 'movies',
    label: 'Phim & Danh mục',
    icon: '🎬',
    actions: [
      { key: 'movies:view', label: 'Xem phim' },
      { key: 'movies:create', label: 'Thêm phim' },
      { key: 'movies:update', label: 'Sửa phim' },
      { key: 'movies:delete', label: 'Xóa phim' },
    ],
  },
  {
    id: 'cinemas',
    label: 'Cụm rạp & Phòng chiếu',
    icon: '🏛️',
    actions: [
      { key: 'cinemas:view', label: 'Xem rạp & phòng' },
      { key: 'cinemas:create', label: 'Thêm rạp / phòng' },
      { key: 'cinemas:update', label: 'Sửa rạp / ghế' },
    ],
  },
  {
    id: 'prices',
    label: 'Bảng giá vé',
    icon: '💰',
    actions: [
      { key: 'prices:view', label: 'Xem giá vé' },
      { key: 'prices:update', label: 'Sửa giá vé' },
    ],
  },
  {
    id: 'stats',
    label: 'Báo cáo doanh thu',
    icon: '📊',
    actions: [
      { key: 'stats:view', label: 'Xem báo cáo doanh thu' },
    ],
  },
  {
    id: 'users',
    label: 'Khách hàng & Người dùng',
    icon: '👥',
    actions: [
      { key: 'users:view', label: 'Xem danh sách khách hàng' },
    ],
  },
];

export default function AdminStaff() {
  const { user: currentUser } = useAuth();

  const [staffList, setStaffList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Danh sách các vai trò / chức vụ từ database
  const [roles, setRoles] = useState([
    { id: 1, code: 'ADMIN', name: 'Quản trị viên' },
    { id: 2, code: 'MANAGER', name: 'Quản lý rạp' },
    { id: 3, code: 'TICKET_STAFF', name: 'Nhân viên soát vé' },
    { id: 4, code: 'CONCESSION_STAFF', name: 'Nhân viên bắp nước' },
  ]);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Danh sách rạp
  const [cinemas, setCinemas] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(null); // staff item
  const [showResetModal, setShowResetModal] = useState(null); // staff item
  const [statusConfirm, setStatusConfirm] = useState(null); // staff item

  // Form states cho Thêm nhân viên
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role_id: '4', // Mặc định là nhân viên bắp nước hoặc soát vé
    cinema_id: '',
  });

  // Form states cho Tạo chức vụ mới
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [selectedPerms, setSelectedPerms] = useState([
    'combos:view',
    'combos:create',
    'combos:update',
    'bookings:view',
  ]);
  const [creatingRole, setCreatingRole] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState('3');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tải danh sách vai trò
  const loadRoles = async () => {
    try {
      const data = await getRoles();
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
      }
    } catch (err) {
      console.error('Không thể tải danh sách vai trò:', err);
    }
  };

  // Tải danh sách rạp & vai trò
  useEffect(() => {
    getCinemas()
      .then(setCinemas)
      .catch(() => {});
    loadRoles();
  }, []);

  // Tải danh sách nhân viên
  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await getStaff({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setStaffList(res.items || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  // Thêm nhân viên
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (addForm.password.length < 8) {
      toast.error('Mật khẩu nhân viên phải có tối thiểu 8 ký tự');
      return;
    }
    setSubmitting(true);
    try {
      await createStaff({
        ...addForm,
        role_id: Number(addForm.role_id),
        cinema_id: addForm.cinema_id ? Number(addForm.cinema_id) : null,
      });
      toast.success('Tạo tài khoản nhân viên thành công');
      setShowAddModal(false);
      setAddForm({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        role_id: '4',
        cinema_id: '',
      });
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tạo nhân viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Tạo chức vụ mới
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error('Vui lòng nhập tên chức vụ');
      return;
    }
    setCreatingRole(true);
    try {
      const created = await createRole({
        name: roleForm.name.trim(),
        code: roleForm.code.trim() || undefined,
        description: roleForm.description.trim() || undefined,
        permissions: selectedPerms,
      });
      toast.success(`Đã tạo chức vụ "${created.name}" thành công!`);
      await loadRoles();
      // Tự động chọn chức vụ mới tạo cho form Thêm nhân viên
      setAddForm((prev) => ({ ...prev, role_id: String(created.id) }));
      setShowCreateRoleModal(false);
      setRoleForm({ name: '', code: '', description: '' });
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tạo chức vụ mới');
    } finally {
      setCreatingRole(false);
    }
  };

  // Toggle permission checkbox
  const togglePermission = (permKey) => {
    setSelectedPerms((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  // Chọn tất cả quyền
  const selectAllPermissions = () => {
    const all = [];
    AVAILABLE_PERM_MODULES.forEach((mod) => {
      mod.actions.forEach((act) => all.push(act.key));
    });
    setSelectedPerms(all);
  };

  // Bỏ chọn tất cả quyền
  const clearAllPermissions = () => {
    setSelectedPerms([]);
  };

  // Đổi vai trò
  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!showRoleModal) return;
    setSubmitting(true);
    try {
      await changeStaffRole(showRoleModal.id, Number(selectedRoleId));
      toast.success('Đổi vai trò nhân viên thành công');
      setShowRoleModal(null);
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đổi vai trò');
    } finally {
      setSubmitting(false);
    }
  };

  // Đổi trạng thái (khóa / mở khóa)
  const handleToggleStatus = async () => {
    if (!statusConfirm) return;
    const nextStatus = statusConfirm.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setSubmitting(true);
    try {
      await changeStaffStatus(statusConfirm.id, nextStatus);
      toast.success(nextStatus === 'LOCKED' ? 'Đã khóa tài khoản nhân viên' : 'Đã mở khóa tài khoản nhân viên');
      setStatusConfirm(null);
      loadStaff();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  // Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!showResetModal) return;
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    setSubmitting(true);
    try {
      await resetStaffPassword(showResetModal.id, newPassword);
      toast.success('Đặt lại mật khẩu thành công');
      setShowResetModal(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper hiển thị badge vai trò
  const getRoleMeta = (roleCode) => {
    switch (roleCode) {
      case 'ADMIN':
        return {
          name: 'Quản trị viên',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'MANAGER':
        return {
          name: 'Quản lý rạp',
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      case 'TICKET_STAFF':
        return {
          name: 'Nhân viên soát vé',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'CONCESSION_STAFF':
        return {
          name: 'Nhân viên bắp nước',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      default:
        return {
          name: roleCode,
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header trang (CHỈ CÓ DUY NHẤT 1 NÚT THÊM NHÂN VIÊN TẠI ĐÂY) */}
      <PageHeader
        title="Nhân viên & Phân quyền"
        subtitle="Quản lý danh sách tài khoản nội bộ, phân bổ rạp và kiểm soát ma trận quyền hạn theo vai trò"
      >
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="md">
          ➕ Thêm nhân viên
        </Button>
      </PageHeader>

      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Tổng nhân sự</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <p className="text-xs text-rose-300 font-medium">Quản trị viên (ADMIN)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {staffList.filter((s) => s.role === 'ADMIN').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-xs text-indigo-300 font-medium">Quản lý rạp (MANAGER)</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {staffList.filter((s) => s.role === 'MANAGER').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-300 font-medium">Soát vé (TICKET_STAFF)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {staffList.filter((s) => s.role === 'TICKET_STAFF').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 col-span-2 sm:col-span-1">
          <p className="text-xs text-amber-300 font-medium">Bắp nước (CONCESSION)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {staffList.filter((s) => s.role === 'CONCESSION_STAFF').length}
          </p>
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc (ĐÃ BỎ NÚT TRÙNG LẶP THEO YÊU CẦU) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">Tất cả vai trò ({roles.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.code} - {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách nhân viên */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nhân viên</th>
                <th className="px-5 py-3.5">Liên hệ</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Rạp phụ trách</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Đăng nhập cuối</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    Đang tải dữ liệu nhân viên...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    Không tìm thấy nhân viên nào phù hợp
                  </td>
                </tr>
              ) : (
                staffList.map((item) => {
                  const isSelf = Number(item.id) === Number(currentUser?.id);
                  const roleObj = roles.find((r) => r.code === item.role);
                  const meta = getRoleMeta(item.role);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Tên & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-500/20 to-pink-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-white shrink-0">
                            {item.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{item.full_name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.2 rounded border border-brand-500/30">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">ID: #{item.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email & SĐT */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-slate-200">{item.email}</div>
                        <div className="text-[11px] text-slate-400">{item.phone || 'Chưa cập nhật'}</div>
                      </td>

                      {/* Vai trò */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${meta.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {roleObj?.name || item.role_name || item.role}
                        </span>
                      </td>

                      {/* Rạp phụ trách */}
                      <td className="px-5 py-3.5">
                        {item.role === 'ADMIN' ? (
                          <span className="text-slate-400 italic">Toàn hệ thống</span>
                        ) : item.cinema_name ? (
                          <span className="font-medium text-slate-200">{item.cinema_name}</span>
                        ) : (
                          <span className="text-slate-500">Chưa chỉ định</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-3.5">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Lần đăng nhập cuối */}
                      <td className="px-5 py-3.5 text-slate-400">
                        {item.last_login_at ? formatDateTime(item.last_login_at) : 'Chưa đăng nhập'}
                      </td>

                      {/* Nút thao tác */}
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedRoleId(String(item.role_id || 3));
                            setShowRoleModal(item);
                          }}
                          disabled={isSelf}
                          title={isSelf ? 'Không thể đổi vai trò của chính mình' : 'Đổi vai trò'}
                          className={`p-1.5 rounded-lg border text-xs transition ${
                            isSelf
                              ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                              : 'border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:border-indigo-500 cursor-pointer'
                          }`}
                        >
                          🛡️ Đổi vai trò
                        </button>

                        <button
                          onClick={() => setShowResetModal(item)}
                          title="Đặt lại mật khẩu"
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:border-amber-500 transition text-xs cursor-pointer"
                        >
                          🔑 Đổi mật khẩu
                        </button>

                        <button
                          onClick={() => setStatusConfirm(item)}
                          disabled={isSelf}
                          title={isSelf ? 'Không thể khóa tài khoản của chính mình' : 'Khóa/Mở khóa'}
                          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            isSelf
                              ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600'
                              : item.status === 'ACTIVE'
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {item.status === 'ACTIVE' ? '🔒 Khóa' : '🔓 Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* KHU VỰC: MA TRẬN PHÂN QUYỀN VAI TRÒ (BAO GỒM NHÂN VIÊN BẮP NƯỚC) */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> Ma trận phân quyền chi tiết (Role & Permission Matrix)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Quy tắc quyền hạn áp dụng cho từng vai trò trên toàn bộ hệ thống API và giao diện quản trị.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span><b>V</b>: Xem (View)</span>
            <span><b>C</b>: Tạo (Create)</span>
            <span><b>U</b>: Sửa (Update)</span>
            <span><b>D</b>: Xóa (Delete)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Chức năng / Module nghiệp vụ</th>
                <th className="px-4 py-3 text-center text-rose-400 bg-rose-500/5">ADMIN (Quản trị viên)</th>
                <th className="px-4 py-3 text-center text-indigo-400 bg-indigo-500/5">MANAGER (Quản lý rạp)</th>
                <th className="px-4 py-3 text-center text-emerald-400 bg-emerald-500/5">TICKET_STAFF (Soát vé)</th>
                <th className="px-4 py-3 text-center text-amber-400 bg-amber-500/5">CONCESSION (Bắp nước)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {PERMISSIONS_MATRIX_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-sans font-medium text-slate-200">{row.module}</td>
                  <td className="px-4 py-2.5 text-center text-rose-400 bg-rose-500/5 font-bold">{row.admin}</td>
                  <td className="px-4 py-2.5 text-center text-indigo-400 bg-indigo-500/5 font-bold">{row.manager}</td>
                  <td className="px-4 py-2.5 text-center text-emerald-400 bg-emerald-500/5 font-bold">{row.staff}</td>
                  <td className="px-4 py-2.5 text-center text-amber-400 bg-amber-500/5 font-bold">{row.concession}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Lưu ý bảo mật quan trọng:</strong> Tất cả tài khoản nội bộ (ADMIN, MANAGER, TICKET_STAFF, CONCESSION_STAFF) đều không thể mua vé xem phim. Quyền mua vé và thanh toán chỉ áp dụng cho tài khoản <strong>CUSTOMER (Khách hàng)</strong>.
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: THÊM NHÂN VIÊN MỚI */}
      {/* ============================================================== */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm tài khoản nhân viên mới"
      >
        <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={addForm.full_name}
              onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email đăng nhập <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="nhanvien@cinema.vn"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mật khẩu khởi tạo (tối thiểu 8 ký tự) <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Số điện thoại liên hệ
            </label>
            <input
              type="tel"
              placeholder="0901234567"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* VÙNG CHỌN CHỨC VỤ + NÚT TẠO CHỨC VỤ MỚI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Vai trò chức vụ <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(true)}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold underline flex items-center gap-1 transition cursor-pointer"
              >
                <span>✨</span>
                <span>+ Tạo chức vụ mới</span>
              </button>
            </div>
            <select
              value={addForm.role_id}
              onChange={(e) => setAddForm({ ...addForm, role_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name} {r.description ? `(${r.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          {addForm.role_id !== '1' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Cụm rạp phụ trách
              </label>
              <select
                value={addForm.cinema_id}
                onChange={(e) => setAddForm({ ...addForm, cinema_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
              >
                <option value="">-- Chọn cụm rạp --</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} type="button">
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL MỚI: TẠO CHỨC VỤ / VAI TRÒ CÔNG VIỆC MỚI */}
      {/* ============================================================== */}
      <Modal
        open={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        title="Tạo chức vụ / vai trò công việc mới"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateRole} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Thêm chức vụ công việc mới vào hệ thống và lựa chọn các quyền hạn cụ thể mà chức vụ này được phép thao tác.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tên chức vụ công việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Kế toán rạp, Kỹ thuật phòng chiếu..."
                value={roleForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  // Tự động tạo mã vai trò nếu chưa nhập
                  const autoCode = val
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-zA-Z0-9]/g, '_')
                    .toUpperCase()
                    .replace(/_+/g, '_')
                    .slice(0, 25);
                  setRoleForm({
                    ...roleForm,
                    name: val,
                    code: roleForm.code ? roleForm.code : autoCode,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Mã hệ thống (Code)
              </label>
              <input
                type="text"
                placeholder="VD: ACCOUNTANT, PROJECTIONIST..."
                value={roleForm.code}
                onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mô tả trách nhiệm công việc
            </label>
            <input
              type="text"
              placeholder="VD: Quản lý chứng từ, kiểm tra suất chiếu..."
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Chọn quyền cho chức vụ mới */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Phân quyền cho chức vụ ({selectedPerms.length} quyền đã chọn)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-[11px] text-brand-400 hover:text-brand-300 underline cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
              {AVAILABLE_PERM_MODULES.map((mod) => (
                <div key={mod.id} className="border-b border-slate-800/60 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{mod.icon}</span>
                    <span className="text-xs font-bold text-slate-200">{mod.label}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6">
                    {mod.actions.map((act) => {
                      const isChecked = selectedPerms.includes(act.key);
                      return (
                        <label
                          key={act.key}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition ${
                            isChecked
                              ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(act.key)}
                            className="rounded border-slate-700 text-brand-500 focus:ring-0"
                          />
                          <span className="truncate">{act.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setShowCreateRoleModal(false)}
              type="button"
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={creatingRole}>
              {creatingRole ? 'Đang tạo...' : 'Lưu chức vụ mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: ĐỔI VAI TRÒ */}
      {/* ============================================================== */}
      <Modal
        open={Boolean(showRoleModal)}
        onClose={() => setShowRoleModal(null)}
        title={`Đổi vai trò: ${showRoleModal?.full_name}`}
      >
        <form onSubmit={handleChangeRole} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Chọn vai trò mới cho tài khoản <strong className="text-white">{showRoleModal?.email}</strong>. Quyền hạn sẽ được cập nhật ngay lập tức.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Vai trò mới <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setShowRoleModal(null)} type="button">
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu vai trò'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: ĐẶT LẠI MẬT KHẨU */}
      {/* ============================================================== */}
      <Modal
        open={Boolean(showResetModal)}
        onClose={() => {
          setShowResetModal(null);
          setNewPassword('');
        }}
        title={`Đặt lại mật khẩu: ${showResetModal?.full_name}`}
      >
        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Nhập mật khẩu mới cho tài khoản <strong className="text-white">{showResetModal?.email}</strong> (tối thiểu 8 ký tự).
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              onClick={() => {
                setShowResetModal(null);
                setNewPassword('');
              }}
              type="button"
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* DIALOG XÁC NHẬN KHÓA / MỞ KHÓA */}
      {/* ============================================================== */}
      <ConfirmDialog
        open={Boolean(statusConfirm)}
        onClose={() => setStatusConfirm(null)}
        onConfirm={handleToggleStatus}
        title={statusConfirm?.status === 'ACTIVE' ? 'Khóa tài khoản nhân viên?' : 'Mở khóa tài khoản?'}
        message={
          statusConfirm?.status === 'ACTIVE'
            ? `Bạn có chắc muốn khóa tài khoản của ${statusConfirm?.full_name} (${statusConfirm?.email})? Nhân viên này sẽ không thể đăng nhập vào hệ thống.`
            : `Bạn có muốn mở khóa lại cho tài khoản ${statusConfirm?.full_name} (${statusConfirm?.email})?`
        }
        confirmText={statusConfirm?.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
        confirmVariant={statusConfirm?.status === 'ACTIVE' ? 'danger' : 'primary'}
      />
    </div>
  );
}
