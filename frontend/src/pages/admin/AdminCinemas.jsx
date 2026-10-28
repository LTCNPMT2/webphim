import toast from 'react-hot-toast';
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { createCinema, deleteCinema, getCinemas, updateCinema } from '../../services/adminService.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import FormField from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';

function CinemaForm({ cinema, onClose, onSaved }) {
  const form = useFormState({
    name: cinema?.name || '', address: cinema?.address || '', city: cinema?.city || '',
    phone: cinema?.phone || '', image_url: cinema?.image_url || '', is_active: cinema ? Boolean(cinema.is_active) : true,
  });
  const { values: v, errors, change } = form;

  const validate = (x) => {
    const er = {};
    if (!x.name.trim()) er.name = 'Vui lòng nhập tên rạp';
    if (!x.address.trim()) er.address = 'Vui lòng nhập địa chỉ';
    if (!x.city.trim()) er.city = 'Vui lòng nhập thành phố';
    if (x.phone.trim() && !/^[0-9+\s.-]{8,20}$/.test(x.phone.trim())) er.phone = 'Số điện thoại không hợp lệ';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit((x) => {
      const body = { name: x.name.trim(), address: x.address.trim(), city: x.city.trim(), phone: x.phone.trim(), image_url: x.image_url.trim(), is_active: x.is_active };
      return cinema ? updateCinema(cinema.id, body) : createCinema(body);
    }, validate);
    if (ok) { toast.success(cinema ? 'Đã cập nhật rạp' : 'Đã thêm rạp'); onSaved(); }
  };

  return (
    <FormModal title={cinema ? `Sửa rạp: ${cinema.name}` : 'Thêm rạp mới'} onClose={onClose} onSubmit={handleSubmit} saving={form.saving}>
      <FormField label="Tên rạp *" name="name" value={v.name} onChange={change} error={errors.name} />
      <FormField label="Địa chỉ *" name="address" value={v.address} onChange={change} error={errors.address} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Thành phố *" name="city" value={v.city} onChange={change} error={errors.city} />
        <FormField label="Số điện thoại" name="phone" value={v.phone} onChange={change} error={errors.phone} />
      </div>
      <FormField label="Link ảnh" name="image_url" placeholder="https://..." value={v.image_url} onChange={change} error={errors.image_url} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked={v.is_active} onChange={change} className="accent-rose-600" /> Đang hoạt động (hiện cho người dùng)</label>
    </FormModal>
  );
}

export default function AdminCinemas() {
  const [editing, setEditing] = useState(null);
  const cinemas = useFetch(getCinemas, []);
  const del = useConfirmDelete((c) => deleteCinema(c.id), cinemas.reload, 'Đã xóa rạp');

  const columns = [
    { key: 'name', header: 'Rạp', render: (c) => <div><p className="font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.address}</p></div> },
    { key: 'city', header: 'Thành phố', render: (c) => c.city },
    { key: 'phone', header: 'Điện thoại', render: (c) => c.phone || '—' },
    { key: 'rooms', header: 'Số phòng', render: (c) => c.room_count },
    { key: 'status', header: 'Trạng thái', render: (c) => <ActiveBadge active={Boolean(c.is_active)} on="Hoạt động" off="Đã ẩn" /> },
    { key: 'actions', header: '', className: 'text-right', render: (c) => <RowActions onEdit={() => setEditing(c)} onDelete={() => del.ask(c)} /> },
  ];

  return (
    <div>
      <PageHeader title="Quản trị cụm rạp CINE" subtitle={cinemas.data ? `${cinemas.data.length} cụm rạp đang vận hành` : ' '}>
        <Button onClick={() => setEditing('new')}>＋ Thêm cụm rạp</Button>
      </PageHeader>
      <AdminTable columns={columns} rows={cinemas.data} loading={cinemas.loading} error={cinemas.error} onRetry={cinemas.reload} />
      {editing && <CinemaForm cinema={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); cinemas.reload(); }} />}
      <ConfirmDialog open={!!del.target} title="Xóa rạp" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa rạp <b>{del.target?.name}</b>? Toàn bộ phòng chiếu, ghế và suất chiếu của rạp cũng bị xóa. Nếu đã có đơn đặt vé thì không xóa được, khi đó hãy sửa rạp và bỏ chọn "Đang hoạt động".
      </ConfirmDialog>
    </div>
  );
}
