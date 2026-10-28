import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { getUsers, setUserStatus } from '../../services/adminService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDay, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import Badge, { ActiveBadge } from '../../components/admin/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null); // người dùng đang chờ xác nhận khóa / mở khóa
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(1), [search, role, status]);

  const list = useFetch(
    () => getUsers({ search: search || undefined, role: role || undefined, status: status || undefined, page, limit: 10 }),
    [search, role, status, page]
  );
  const rows = list.data?.items ?? null;

  const handleConfirm = async () => {
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

  const columns = [
    { key: 'name', header: 'Họ tên', render: (u) => <span className="font-semibold">{u.full_name}{u.id === me?.id && <span className="ml-2 text-xs font-normal text-brand-400">(Bạn)</span>}</span> },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'phone', header: 'Điện thoại', render: (u) => u.phone || '—' },
    { key: 'role', header: 'Vai trò', render: (u) => (u.role === 'admin' ? <Badge cls="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Quản trị</Badge> : <Badge>Thành viên</Badge>) },
    { key: 'status', header: 'Trạng thái', render: (u) => <ActiveBadge active={Boolean(u.is_active)} on="Hoạt động" off="Bị khóa" /> },
    { key: 'bookings', header: 'Đơn đã trả tiền', render: (u) => u.paid_bookings },
    { key: 'spent', header: 'Tổng chi tiêu', render: (u) => formatPrice(u.total_spent) },
    { key: 'created', header: 'Tham gia', render: (u) => formatDay(u.created_at) },
    { key: 'actions', header: '', className: 'text-right', render: (u) => (
      <button onClick={() => setTarget(u)} disabled={u.id === me?.id} title={u.id === me?.id ? 'Bạn không thể khóa chính mình' : undefined}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
          u.is_active ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'}`}>
        {u.is_active ? 'Khóa' : 'Mở khóa'}
      </button>) },
  ];

  const field = 'rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition';
  const locking = target?.is_active;

  return (
    <div>
      <PageHeader title="Quản lý người dùng" subtitle={list.data ? `${list.data.pagination.total} người dùng` : ' '}>
        <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tên, email hoặc số điện thoại..." aria-label="Tìm người dùng" className={`${field} w-60`} />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Lọc vai trò" className={field}>
          <option value="">Mọi vai trò</option><option value="user">Thành viên</option><option value="admin">Quản trị</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái" className={field}>
          <option value="">Mọi trạng thái</option><option value="active">Hoạt động</option><option value="locked">Bị khóa</option>
        </select>
      </PageHeader>

      <AdminTable columns={columns} rows={rows} loading={list.loading} error={list.error} onRetry={list.reload} emptyText="Không có người dùng nào phù hợp" />
      {list.data && <Pagination page={list.data.pagination.page} totalPages={list.data.pagination.totalPages} onChange={setPage} />}

      <ConfirmDialog open={!!target} title={locking ? 'Khóa tài khoản' : 'Mở khóa tài khoản'} confirmLabel={locking ? 'Khóa' : 'Mở khóa'} danger={Boolean(locking)}
        busy={busy} onConfirm={handleConfirm} onCancel={() => setTarget(null)}>
        {locking
          ? <>Khóa tài khoản <b>{target?.full_name}</b> ({target?.email})? Người này sẽ không đăng nhập được và phiên đang dùng cũng bị chặn ngay.</>
          : <>Mở khóa tài khoản <b>{target?.full_name}</b> ({target?.email})? Người này sẽ đăng nhập được trở lại.</>}
      </ConfirmDialog>
    </div>
  );
}
