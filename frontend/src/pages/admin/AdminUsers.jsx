import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
  getUsers,
  setUserStatus,
  updateUserRole,
  createStaff,
  getPermissionsList,
} from '../../services/adminService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDay, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import Badge, { ActiveBadge } from '../../components/admin/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null); // người dùng đang chờ xác nhận khóa / mở khóa
  const [busy, setBusy] = useState(false);

  // Dữ liệu danh mục quyền hạn
  const [permMeta, setPermMeta] = useState({ permissions: [], preset_roles: [] });
  useEffect(() => {
    getPermissionsList()
      .then(setPermMeta)
      .catch((err) => console.error('Lỗi tải danh mục quyền:', err));
  }, []);

  // Modal phân quyền người dùng
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');
  const [staffTitle, setStaffTitle] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [savingRole, setSavingRole] = useState(false);

  // Modal tạo nhân viên mới
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    staff_title: 'Nhân viên quầy vé',
    permissions: ['bookings:manage', 'tickets:checkin'],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => setPage(1), [search, role, status]);

  const list = useFetch(
    () =>
      getUsers({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
        limit: 10,
      }),
    [search, role, status, page]
  );
  const rows = list.data?.items ?? null;

  // Xử lý khóa / mở khóa tài khoản
  const handleConfirmStatus = async () => {
    setBusy(true);
    try {
      const updated = await setUserStatus(target.id, !target.is_active);
      toast.success(updated.is_active ? `Đã mở khóa ${target.full_name}` : `Đã khóa ${target.full_name}`);
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  // Mở modal phân quyền
  const openRoleModal = (u) => {
    setRoleModalUser(u);
    setSelectedRole(u.role || 'user');
    setStaffTitle(u.staff_title || (u.role === 'staff' ? 'Nhân viên' : ''));
    setSelectedPerms(Array.isArray(u.permissions) ? u.permissions : []);
  };

  // Áp dụng nhóm quyền mẫu (Preset)
  const applyPreset = (presetKey) => {
    const found = permMeta.preset_roles.find((p) => p.key === presetKey);
    if (found) {
      setStaffTitle(found.title);
      setSelectedPerms(found.permissions);
    }
  };

  // Toggle 1 quyền
  const togglePermission = (permId) => {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Chọn tất cả quyền
  const selectAllPerms = () => {
    setSelectedPerms(permMeta.permissions.map((p) => p.id));
  };

  // Bỏ chọn tất cả quyền
  const clearAllPerms = () => {
    setSelectedPerms([]);
  };

  // Lưu phân quyền
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setSavingRole(true);
    try {
      await updateUserRole(roleModalUser.id, {
        role: selectedRole,
        staff_title: selectedRole === 'staff' ? staffTitle : null,
        permissions: selectedRole === 'staff' ? selectedPerms : [],
      });
      toast.success(`Đã cập nhật phân quyền cho ${roleModalUser.full_name}`);
      setRoleModalUser(null);
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingRole(false);
    }
  };

  // Tạo nhân viên mới
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error('Vui lòng điền đủ họ tên, email và mật khẩu');
      return;
    }
    setCreating(true);
    try {
      await createStaff(createForm);
      toast.success(`Đã tạo nhân viên ${createForm.full_name} thành công`);
      setCreateModalOpen(false);
      setCreateForm({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        staff_title: 'Nhân viên quầy vé',
        permissions: ['bookings:manage', 'tickets:checkin'],
      });
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  // Nhóm danh sách quyền theo Category
  const groupedPermissions = permMeta.permissions.reduce((acc, p) => {
    const group = p.group || 'Chung';
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  const columns = [
    {
      key: 'name',
      header: 'Họ tên',
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
            {u.full_name}
            {u.id === me?.id && (
              <span className="rounded bg-brand-500/20 px-1.5 py-0.2 text-[10px] font-bold text-brand-300 border border-brand-500/30">
                Bạn
              </span>
            )}
          </span>
          <span className="text-[11px] text-slate-400">{u.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      render: (u) => <span className="font-mono text-xs">{u.phone || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Vai trò & Phân quyền',
      render: (u) => {
        if (u.role === 'admin') {
          return (
            <Badge cls="bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 font-bold">
              👑 Quản trị viên
            </Badge>
          );
        }
        if (u.role === 'staff') {
          const count = Array.isArray(u.permissions) ? u.permissions.length : 0;
          return (
            <div className="flex flex-col items-start gap-1">
              <Badge cls="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                💼 {u.staff_title || 'Nhân viên'}
              </Badge>
              <span className="text-[10px] text-slate-400">
                Được cấp: <span className="text-cyan-400 font-semibold">{count}</span>/{permMeta.permissions.length || 11} quyền
              </span>
            </div>
          );
        }
        return <Badge cls="bg-slate-800 text-slate-300 border border-slate-700">Khách hàng</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (u) => <ActiveBadge active={Boolean(u.is_active)} on="Hoạt động" off="Bị khóa" />,
    },
    {
      key: 'bookings',
      header: 'Đã mua',
      render: (u) => (
        <span className="text-xs font-semibold">
          {u.paid_bookings} đơn ({formatPrice(u.total_spent)})
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Tham gia',
      render: (u) => <span className="text-xs text-slate-400">{formatDay(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          {/* Nút Phân quyền */}
          <button
            onClick={() => openRoleModal(u)}
            className="rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 px-2.5 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            title="Điều chỉnh vai trò và quyền hạn"
          >
            <span>🛡️</span>
            <span>Phân quyền</span>
          </button>

          {/* Nút Khóa / Mở khóa */}
          <button
            onClick={() => setTarget(u)}
            disabled={u.id === me?.id}
            title={u.id === me?.id ? 'Bạn không thể tự khóa chính mình' : undefined}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
              u.is_active
                ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
            }`}
          >
            {u.is_active ? 'Khóa' : 'Mở khóa'}
          </button>
        </div>
      ),
    },
  ];

  const field =
    'rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition';
  const locking = target?.is_active;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quản lý Người dùng & Phân quyền Nhân viên"
          subtitle={list.data ? `Tổng cộng ${list.data.pagination.total} tài khoản trong hệ thống` : ' '}
        />

        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-pink-600 hover:from-brand-500 hover:to-pink-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Thêm nhân viên mới</span>
        </button>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên, email, số điện thoại..."
          aria-label="Tìm người dùng"
          className={`${field} w-72`}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Lọc vai trò" className={field}>
          <option value="">Tất cả vai trò</option>
          <option value="user">Khách hàng</option>
          <option value="staff">Nhân viên</option>
          <option value="admin">Quản trị viên</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái" className={field}>
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
      </div>

      {/* Bảng danh sách */}
      <AdminTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        emptyText="Không tìm thấy người dùng nào phù hợp"
      />
      {list.data && (
        <Pagination
          page={list.data.pagination.page}
          totalPages={list.data.pagination.totalPages}
          onChange={setPage}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL PHÂN QUYỀN CHO NGƯỜI DÙNG HIỆN CÓ */}
      {/* ============================================================== */}
      <Modal
        open={Boolean(roleModalUser)}
        onClose={() => setRoleModalUser(null)}
        title={`Phân quyền tài khoản: ${roleModalUser?.full_name || ''}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveRole} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Thông tin tài khoản */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 block">Email người dùng:</span>
              <span className="font-mono font-semibold text-slate-200">{roleModalUser?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Số điện thoại:</span>
              <span className="font-mono text-slate-200">{roleModalUser?.phone || 'Chưa cập nhật'}</span>
            </div>
          </div>

          {/* Chọn vai trò chính */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Chọn vai trò trong hệ thống <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'user', label: 'Khách hàng', desc: 'Đặt vé, xem phim, quản lý hồ sơ cá nhân' },
                { key: 'staff', label: 'Nhân viên', desc: 'Truy cập quản lý theo các quyền được cấp bên dưới' },
                { key: 'admin', label: 'Quản trị viên', desc: 'Toàn quyền điều hành toàn bộ hệ thống' },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRole(r.key)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedRole === r.key
                      ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500/50'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <span>{r.key === 'admin' ? '👑' : r.key === 'staff' ? '💼' : '👤'}</span>
                    <span>{r.label}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cấu hình chi tiết cho Nhân viên */}
          {selectedRole === 'staff' && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Chức danh / Vị trí */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chức danh / Vị trí làm việc <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={staffTitle}
                  onChange={(e) => setStaffTitle(e.target.value)}
                  placeholder="VD: Nhân viên quầy vé, Quản lý ca chiếu..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              {/* Nhóm quyền mẫu nhanh (Presets) */}
              <div>
                <span className="block text-xs font-bold text-slate-300 mb-1.5">
                  Chọn nhanh theo nhóm quyền mẫu:
                </span>
                <div className="flex flex-wrap gap-2">
                  {permMeta.preset_roles.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-brand-500/20 hover:text-brand-300 hover:border-brand-500/40 transition cursor-pointer"
                    >
                      ⚡ {p.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={selectAllPerms}
                    className="px-2 py-1 text-xs rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                  >
                    ✓ Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={clearAllPerms}
                    className="px-2 py-1 text-xs rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    ✕ Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Danh sách Checkbox quyền chi tiết theo nhóm */}
              <div className="space-y-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Danh sách quyền chi tiết ({selectedPerms.length} quyền đã chọn):
                </span>

                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, items]) => (
                    <div key={category} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
                        {category}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((perm) => {
                          const checked = selectedPerms.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer select-none ${
                                checked
                                  ? 'border-brand-500/50 bg-brand-500/10 text-white'
                                  : 'border-slate-800/60 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(perm.id)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold leading-tight">{perm.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setRoleModalUser(null)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={savingRole}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {savingRole ? 'Đang lưu...' : 'Lưu phân quyền'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL THÊM NHÂN VIÊN MỚI */}
      {/* ============================================================== */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm tài khoản nhân viên mới"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateStaff} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Họ và tên <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email đăng nhập <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="nhanvien@cinebooking.vn"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mật khẩu khởi tạo <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="0912345678"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Chức danh / Vị trí làm việc <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={createForm.staff_title}
                onChange={(e) => setCreateForm({ ...createForm, staff_title: e.target.value })}
                placeholder="Nhân viên quầy vé, Lịch chiếu..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Nhóm mẫu phân quyền */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="block text-xs font-bold text-slate-300">Áp dụng mẫu phân quyền:</span>
            <div className="flex flex-wrap gap-2">
              {permMeta.preset_roles.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    setCreateForm({
                      ...createForm,
                      staff_title: p.title,
                      permissions: p.permissions,
                    })
                  }
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-brand-500/20 hover:text-brand-300 hover:border-brand-500/40 transition cursor-pointer"
                >
                  ⚡ {p.title}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setCreateForm({
                    ...createForm,
                    permissions: permMeta.permissions.map((p) => p.id),
                  })
                }
                className="px-2 py-1 text-xs rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                ✓ Chọn tất cả
              </button>
            </div>
          </div>

          {/* Checkboxes phân quyền */}
          <div className="space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Quyền hạn cấp cho nhân viên ({createForm.permissions.length} quyền):
            </span>
            <div className="space-y-3">
              {Object.entries(groupedPermissions).map(([category, items]) => (
                <div key={category} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 space-y-1.5">
                  <h5 className="text-[10px] font-bold uppercase tracking-wide text-brand-400">{category}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {items.map((perm) => {
                      const checked = createForm.permissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2 p-1.5 rounded-lg border transition cursor-pointer text-xs select-none ${
                            checked
                              ? 'border-brand-500/40 bg-brand-500/10 text-white'
                              : 'border-slate-800 bg-slate-900/20 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const newPerms = checked
                                ? createForm.permissions.filter((p) => p !== perm.id)
                                : [...createForm.permissions, perm.id];
                              setCreateForm({ ...createForm, permissions: newPerms });
                            }}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-brand-600"
                          />
                          <span className="font-medium text-[11px] truncate">{perm.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-pink-600 hover:from-brand-500 hover:to-pink-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Tạo nhân viên'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Xác nhận Khóa / Mở khóa tài khoản */}
      <ConfirmDialog
        open={Boolean(target)}
        title={locking ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        confirmLabel={locking ? 'Khóa' : 'Mở khóa'}
        danger={Boolean(locking)}
        busy={busy}
        onConfirm={handleConfirmStatus}
        onCancel={() => setTarget(null)}
      >
        {locking ? (
          <>
            Khóa tài khoản <b>{target?.full_name}</b> ({target?.email})? Người này sẽ không đăng nhập được và phiên đang dùng cũng bị chặn ngay lập tức.
          </>
        ) : (
          <>
            Mở khóa tài khoản <b>{target?.full_name}</b> ({target?.email})? Người này sẽ đăng nhập và thực hiện thao tác được trở lại.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
