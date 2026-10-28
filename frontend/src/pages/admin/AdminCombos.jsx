import toast from 'react-hot-toast';
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { createCombo, deleteCombo, getCombos, updateCombo } from '../../services/adminService.js';
import { assetUrl, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import FormField from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';

function ComboForm({ combo, onClose, onSaved }) {
  const form = useFormState({
    name: combo?.name || '', description: combo?.description || '', price: combo?.price ?? '',
    image_url: combo?.image_url || '', is_active: combo ? Boolean(combo.is_active) : true,
  });
  const { values: v, errors, change } = form;

  const validate = (x) => {
    const er = {};
    if (!x.name.trim()) er.name = 'Vui lòng nhập tên combo';
    const price = Number(x.price);
    if (!Number.isInteger(price) || price < 1000 || price > 10000000) er.price = 'Giá từ 1.000 đến 10.000.000';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit((x) => {
      const body = { name: x.name.trim(), description: x.description.trim(), price: Number(x.price), image_url: x.image_url.trim(), is_active: x.is_active };
      return combo ? updateCombo(combo.id, body) : createCombo(body);
    }, validate);
    if (ok) { toast.success(combo ? 'Đã cập nhật combo' : 'Đã thêm combo'); onSaved(); }
  };

  return (
    <FormModal title={combo ? `Sửa combo: ${combo.name}` : 'Thêm combo mới'} onClose={onClose} onSubmit={handleSubmit} saving={form.saving}>
      <FormField label="Tên combo *" name="name" value={v.name} onChange={change} error={errors.name} />
      <FormField label="Mô tả" name="description" placeholder="1 bắp ngọt size M + 1 nước ngọt size M" value={v.description} onChange={change} error={errors.description} />
      <FormField label="Giá (đ) *" name="price" type="number" min="1000" step="1000" value={v.price} onChange={change} error={errors.price} />
      <FormField label="Link ảnh" name="image_url" placeholder="https://..." value={v.image_url} onChange={change} error={errors.image_url} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked={v.is_active} onChange={change} className="accent-rose-600" /> Đang bán (hiện ở bước chọn bắp nước)</label>
    </FormModal>
  );
}

export default function AdminCombos() {
  const [editing, setEditing] = useState(null);
  const combos = useFetch(getCombos, []);
  const del = useConfirmDelete((c) => deleteCombo(c.id), combos.reload, 'Đã xóa combo');

  const columns = [
    { key: 'img', header: 'Ảnh', render: (c) => (
      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-slate-800 text-xl">{c.image_url ? <img src={assetUrl(c.image_url)} alt="" loading="lazy" className="h-full w-full object-cover" /> : '🍿'}</div>) },
    { key: 'name', header: 'Combo', render: (c) => <div><p className="font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.description}</p></div> },
    { key: 'price', header: 'Giá', render: (c) => formatPrice(c.price) },
    { key: 'status', header: 'Trạng thái', render: (c) => <ActiveBadge active={Boolean(c.is_active)} on="Đang bán" off="Ngừng bán" /> },
    { key: 'actions', header: '', className: 'text-right', render: (c) => <RowActions onEdit={() => setEditing(c)} onDelete={() => del.ask(c)} /> },
  ];

  return (
    <div>
      <PageHeader title="Quản lý combo bắp nước"><Button onClick={() => setEditing('new')}>+ Thêm combo</Button></PageHeader>
      <AdminTable columns={columns} rows={combos.data} loading={combos.loading} error={combos.error} onRetry={combos.reload} />
      {editing && <ComboForm combo={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); combos.reload(); }} />}
      <ConfirmDialog open={!!del.target} title="Xóa combo" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa combo <b>{del.target?.name}</b>? Nếu combo đã có trong đơn đặt vé thì không xóa được, khi đó hãy sửa combo và bỏ chọn "Đang bán".
      </ConfirmDialog>
    </div>
  );
}
