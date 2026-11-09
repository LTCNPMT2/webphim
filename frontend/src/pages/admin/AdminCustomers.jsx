import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
  getUsers,
  setUserStatus,
} from '../../services/adminService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDay, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';

export default function AdminCustomers() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null); // người dùng đang chờ xác nhận khóa / mở khóa
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(1), [search, status]);

  // CHỈ LẤY KHÁCH HÀNG (role: 'user')
  const list = useFetch(
    () =>
      getUsers({
        search: search || undefined,
        role: 'user',
        status: status || undefined,
        page,
        limit: 10,
      }),
    [search, status, page]
  );
  const rows = list.data?.items ?? null;

  // Xử lý khóa / mở khóa tài khoản khách hàng
  const handleConfirmStatus = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const updated = await setUserStatus(target.id, !target.is_active);
      toast.success(
        updated.is_active
          ? `Đã mở khóa tài khoản ${target.full_name}`
          : `Đã khóa tài khoản ${target.full_name}`
      );
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Khách hàng',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (u.full_name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5 truncate">
              {u.full_name}
              {u.id === me?.id && (
                <span className="rounded bg-brand-500/20 px-1.5 py-0.2 text-[10px] font-bold text-brand-300 border border-brand-500/30">
                  Bạn
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-400 truncate">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      render: (u) => <span className="font-mono text-xs">{u.phone || '—'}</span>,
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
        <span className="text-xs font-semibold text-slate-200">
          <span className="text-brand-400 font-bold">{u.paid_bookings}</span> đơn ({formatPrice(u.total_spent)})
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Ngày tham gia',
      render: (u) => <span className="text-xs text-slate-400">{formatDay(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          {/* Chỉ giữ lại nút Khóa / Mở khóa, KHÔNG có nút Phân quyền */}
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
      {/* Header trang (Giữ nguyên tiêu đề và số lượng tổng cộng khách hàng) */}
      <PageHeader
        title="Quản lý Khách hàng"
        subtitle={list.data ? `Tổng cộng ${list.data.pagination.total} khách hàng trong hệ thống` : ' '}
      />

      {/* Bộ lọc: Chỉ có tìm kiếm và trạng thái (Bỏ chọn vai trò) */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên, email, số điện thoại..."
          aria-label="Tìm khách hàng"
          className={`${field} w-72`}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Lọc trạng thái"
          className={field}
        >
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
        emptyText="Không tìm thấy khách hàng nào phù hợp"
      />
      {list.data && (
        <Pagination
          page={list.data.pagination.page}
          totalPages={list.data.pagination.totalPages}
          onChange={setPage}
        />
      )}

      {/* Xác nhận Khóa / Mở khóa tài khoản */}
      <ConfirmDialog
        open={Boolean(target)}
        title={locking ? 'Khóa tài khoản khách hàng' : 'Mở khóa tài khoản khách hàng'}
        confirmLabel={locking ? 'Khóa' : 'Mở khóa'}
        danger={Boolean(locking)}
        busy={busy}
        onConfirm={handleConfirmStatus}
        onCancel={() => setTarget(null)}
      >
        {locking ? (
          <>
            Khóa tài khoản khách hàng <b>{target?.full_name}</b> ({target?.email})? Khách hàng sẽ không thể đăng nhập và đặt vé được nữa.
          </>
        ) : (
          <>
            Mở khóa tài khoản khách hàng <b>{target?.full_name}</b> ({target?.email})? Khách hàng sẽ có thể đăng nhập và đặt vé bình thường trở lại.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
