import toast from 'react-hot-toast';
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { createPromotion, deletePromotion, getPromotions, updatePromotion } from '../../services/adminService.js';
import { PROMO_STATE, describeDiscount, toInputDateTime } from '../../utils/admin.js';
import { formatDay, formatPrice } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import Badge from '../../components/admin/Badge.jsx';
import FormField from '../../components/ui/FormField.jsx';
import FormSelect from '../../components/ui/FormSelect.jsx';
import Button from '../../components/ui/Button.jsx';

function PromotionForm({ promo, onClose, onSaved }) {
  const now = new Date();
  const form = useFormState({
    code: promo?.code || '',
    description: promo?.description || '',
    discount_type: promo?.discount_type || 'percent',
    discount_value: promo?.discount_value ?? 10,
    max_discount: promo?.max_discount ?? '',
    min_order: promo?.min_order ?? 0,
    start_date: promo ? toInputDateTime(promo.start_date) : toInputDateTime(now.toISOString()),
    end_date: promo ? toInputDateTime(promo.end_date) : toInputDateTime(new Date(now.getTime() + 30 * 86400000).toISOString()),
    usage_limit: promo?.usage_limit ?? '',
    is_active: promo ? Boolean(promo.is_active) : true,
  });
  const { values: v, errors, change } = form;
  const isPercent = v.discount_type === 'percent';

  const validate = (x) => {
    const er = {};
    if (!promo && !/^[A-Za-z0-9_-]{3,30}$/.test(x.code.trim())) er.code = 'Mã gồm 3 đến 30 ký tự: chữ không dấu, số, gạch ngang hoặc gạch dưới';
    const value = Number(x.discount_value);
    if (!Number.isInteger(value) || value < 1) er.discount_value = 'Giá trị giảm phải là số nguyên từ 1 trở lên';
    else if (x.discount_type === 'percent' && value > 100) er.discount_value = 'Giảm theo phần trăm tối đa 100%';
    if (x.max_discount !== '' && !(Number(x.max_discount) >= 1)) er.max_discount = 'Mức giảm tối đa không hợp lệ';
    if (!(Number(x.min_order) >= 0)) er.min_order = 'Đơn tối thiểu không hợp lệ';
    if (!x.start_date) er.start_date = 'Vui lòng chọn ngày bắt đầu';
    if (!x.end_date) er.end_date = 'Vui lòng chọn ngày kết thúc';
    else if (x.start_date && x.end_date <= x.start_date) er.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
    if (x.usage_limit !== '' && !(Number(x.usage_limit) >= 1)) er.usage_limit = 'Số lượt dùng phải từ 1 trở lên (để trống = không giới hạn)';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit((x) => {
      const body = {
        description: x.description.trim(),
        discount_type: x.discount_type,
        discount_value: Number(x.discount_value),
        max_discount: x.discount_type === 'percent' && x.max_discount !== '' ? Number(x.max_discount) : undefined,
        min_order: Number(x.min_order) || 0,
        start_date: x.start_date,
        end_date: x.end_date,
        usage_limit: x.usage_limit !== '' ? Number(x.usage_limit) : undefined,
        is_active: x.is_active,
      };
      return promo ? updatePromotion(promo.id, body) : createPromotion({ code: x.code.trim().toUpperCase(), ...body });
    }, validate);
    if (ok) { toast.success(promo ? 'Đã cập nhật mã giảm giá' : 'Đã thêm mã giảm giá'); onSaved(); }
  };

  return (
    <FormModal title={promo ? `Sửa mã: ${promo.code}` : 'Thêm mã giảm giá'} onClose={onClose} onSubmit={handleSubmit} saving={form.saving} maxWidth="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Mã *" name="code" value={v.code} onChange={change} error={errors.code} disabled={Boolean(promo)}
          className="[&_input]:uppercase" hint={promo ? 'Không đổi được mã sau khi tạo' : 'Ví dụ: SALE20 (tự viết hoa)'} />
        <FormField label="Mô tả" name="description" value={v.description} onChange={change} error={errors.description} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormSelect label="Loại giảm giá" name="discount_type" value={v.discount_type} onChange={change}>
          <option value="percent">Theo phần trăm (%)</option>
          <option value="fixed">Số tiền cố định (đ)</option>
        </FormSelect>
        <FormField label={isPercent ? 'Giảm (%) *' : 'Giảm (đ) *'} name="discount_value" type="number" min="1" max={isPercent ? 100 : undefined} value={v.discount_value} onChange={change} error={errors.discount_value} />
        {isPercent && <FormField label="Giảm tối đa (đ)" name="max_discount" type="number" min="1" value={v.max_discount} onChange={change} error={errors.max_discount} hint="Để trống = không giới hạn" />}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Đơn tối thiểu (đ)" name="min_order" type="number" min="0" step="1000" value={v.min_order} onChange={change} error={errors.min_order} />
        <FormField label="Bắt đầu *" name="start_date" type="datetime-local" value={v.start_date} onChange={change} error={errors.start_date} />
        <FormField label="Kết thúc *" name="end_date" type="datetime-local" value={v.end_date} onChange={change} error={errors.end_date} />
      </div>
      <FormField label="Số lượt dùng tối đa" name="usage_limit" type="number" min="1" value={v.usage_limit} onChange={change} error={errors.usage_limit} hint="Để trống = không giới hạn" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked={v.is_active} onChange={change} className="accent-rose-600" /> Đang bật</label>
    </FormModal>
  );
}

export default function AdminPromotions() {
  const [editing, setEditing] = useState(null);
  const promos = useFetch(getPromotions, []);
  const del = useConfirmDelete((p) => deletePromotion(p.id), promos.reload, 'Đã xóa mã giảm giá');

  const columns = [
    { key: 'code', header: 'Mã', render: (p) => <div><p className="font-mono font-bold">{p.code}</p><p className="max-w-52 truncate text-xs text-slate-500">{p.description}</p></div> },
    { key: 'discount', header: 'Giảm', render: (p) => describeDiscount(p) },
    { key: 'min', header: 'Đơn tối thiểu', render: (p) => (p.min_order > 0 ? formatPrice(p.min_order) : '—') },
    { key: 'time', header: 'Thời gian', render: (p) => <span className="whitespace-nowrap">{formatDay(p.start_date)} → {formatDay(p.end_date)}</span> },
    { key: 'used', header: 'Đã dùng', render: (p) => `${p.used_count}/${p.usage_limit ?? '∞'}` },
    { key: 'state', header: 'Trạng thái', render: (p) => <Badge cls={PROMO_STATE[p.state].cls}>{PROMO_STATE[p.state].label}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (p) => <RowActions onEdit={() => setEditing(p)} onDelete={() => del.ask(p)} /> },
  ];

  return (
    <div>
      <PageHeader title="Quản lý mã giảm giá"><Button onClick={() => setEditing('new')}>+ Thêm mã</Button></PageHeader>
      <AdminTable columns={columns} rows={promos.data} loading={promos.loading} error={promos.error} onRetry={promos.reload} />
      {editing && <PromotionForm promo={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); promos.reload(); }} />}
      <ConfirmDialog open={!!del.target} title="Xóa mã giảm giá" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa mã <b>{del.target?.code}</b>?
        {del.target?.used_count > 0 && <> Mã này đã được dùng {del.target.used_count} lần nên sẽ không xóa được, hãy sửa mã và tắt "Đang bật".</>}
      </ConfirmDialog>
    </div>
  );
}
