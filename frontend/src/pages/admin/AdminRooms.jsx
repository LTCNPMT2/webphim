import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useFormState } from '../../hooks/useFormState.js';
import { useConfirmDelete } from '../../hooks/useConfirmDelete.js';
import { createRoom, deleteRoom, getCinemas, getRoomSeats, getRooms, updateRoom } from '../../services/adminService.js';
import { estimateSeats, parseLetters } from '../../utils/admin.js';
import { groupByRow } from '../../utils/booking.js';
import { formatPrice } from '../../utils/format.js';
import { SEAT_TYPE_LABELS } from '../../utils/constants.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import AdminTable, { RowActions } from '../../components/admin/AdminTable.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FormModal from '../../components/admin/FormModal.jsx';
import { ActiveBadge } from '../../components/admin/Badge.jsx';
import FormField from '../../components/ui/FormField.jsx';
import FormSelect from '../../components/ui/FormSelect.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Button from '../../components/ui/Button.jsx';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ROOM_TYPES = ['2D', '3D', 'IMAX'];

// Tạo phòng mới: nhập cấu hình, hệ thống tự sinh sơ đồ ghế
function CreateRoomForm({ cinemas, defaultCinemaId, onClose, onSaved }) {
  const form = useFormState({
    cinema_id: defaultCinemaId || '', name: '', room_type: '2D', rows: 8, cols: 10,
    vip_rows: 'D,E,F,G', couple_rows: 'H', vip_surcharge: 20000, couple_surcharge: 40000,
  });
  const { values: v, errors, change } = form;

  const validate = (x) => {
    const er = {};
    const rows = Number(x.rows);
    const cols = Number(x.cols);
    if (!x.cinema_id) er.cinema_id = 'Vui lòng chọn rạp';
    if (!x.name.trim()) er.name = 'Vui lòng nhập tên phòng';
    if (!Number.isInteger(rows) || rows < 1 || rows > 26) er.rows = 'Từ 1 đến 26 hàng';
    if (!Number.isInteger(cols) || cols < 1 || cols > 20) er.cols = 'Từ 1 đến 20 ghế mỗi hàng';
    const valid = LETTERS.slice(0, rows || 0);
    const vip = parseLetters(x.vip_rows);
    const couple = parseLetters(x.couple_rows);
    const outside = [...vip, ...couple].find((l) => !valid.includes(l));
    if (outside) er[vip.includes(outside) ? 'vip_rows' : 'couple_rows'] = `Hàng ${outside} không nằm trong sơ đồ (A đến ${valid.slice(-1) || 'A'})`;
    const both = vip.find((l) => couple.includes(l));
    if (both) er.couple_rows = `Hàng ${both} không thể vừa là VIP vừa là ghế đôi`;
    if (couple.length && cols < 2) er.couple_rows = 'Hàng ghế đôi cần ít nhất 2 ghế mỗi hàng';
    return er;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit((x) => createRoom({
      cinema_id: Number(x.cinema_id), name: x.name.trim(), room_type: x.room_type,
      rows: Number(x.rows), cols: Number(x.cols),
      vip_rows: parseLetters(x.vip_rows), couple_rows: parseLetters(x.couple_rows),
      vip_surcharge: Number(x.vip_surcharge) || 0, couple_surcharge: Number(x.couple_surcharge) || 0,
    }), validate);
    if (ok) { toast.success('Đã tạo phòng chiếu và sơ đồ ghế'); onSaved(); }
  };

  const total = estimateSeats({ rows: v.rows, cols: v.cols, coupleRows: v.couple_rows });

  return (
    <FormModal title="Thêm phòng chiếu" onClose={onClose} onSubmit={handleSubmit} saving={form.saving} submitLabel="Tạo phòng" maxWidth="max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect label="Rạp *" name="cinema_id" value={v.cinema_id} onChange={change} error={errors.cinema_id}>
          <option value="">-- Chọn rạp --</option>
          {(cinemas || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FormSelect>
        <FormField label="Tên phòng *" name="name" placeholder="Phòng 3" value={v.name} onChange={change} error={errors.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormSelect label="Loại phòng" name="room_type" value={v.room_type} onChange={change}>{ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}</FormSelect>
        <FormField label="Số hàng ghế *" name="rows" type="number" min="1" max="26" value={v.rows} onChange={change} error={errors.rows} hint="Hàng A, B, C..." />
        <FormField label="Ghế mỗi hàng *" name="cols" type="number" min="1" max="20" value={v.cols} onChange={change} error={errors.cols} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Các hàng VIP" name="vip_rows" placeholder="D,E,F,G" value={v.vip_rows} onChange={change} error={errors.vip_rows} hint="Cách nhau bằng dấu phẩy" />
        <FormField label="Các hàng ghế đôi" name="couple_rows" placeholder="H" value={v.couple_rows} onChange={change} error={errors.couple_rows} hint="Mỗi hàng chỉ có một nửa số ghế" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phụ thu ghế VIP (đ)" name="vip_surcharge" type="number" min="0" value={v.vip_surcharge} onChange={change} />
        <FormField label="Phụ thu ghế đôi (đ)" name="couple_surcharge" type="number" min="0" value={v.couple_surcharge} onChange={change} />
      </div>
      <p className="rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300">Phòng sẽ có <b>{total}</b> ghế. Hàng còn lại là ghế thường. Sơ đồ ghế không sửa được sau khi tạo.</p>
    </FormModal>
  );
}

// Sửa phòng: chỉ đổi tên / loại / trạng thái (sơ đồ ghế đã gắn với vé nên không đổi)
function EditRoomForm({ room, onClose, onSaved }) {
  const form = useFormState({ name: room.name, room_type: room.room_type, is_active: Boolean(room.is_active) });
  const { values: v, errors, change } = form;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await form.submit(
      (x) => updateRoom(room.id, { name: x.name.trim(), room_type: x.room_type, is_active: x.is_active }),
      (x) => (x.name.trim() ? {} : { name: 'Vui lòng nhập tên phòng' })
    );
    if (ok) { toast.success('Đã cập nhật phòng chiếu'); onSaved(); }
  };

  return (
    <FormModal title={`Sửa phòng: ${room.cinema_name} - ${room.name}`} onClose={onClose} onSubmit={handleSubmit} saving={form.saving} maxWidth="max-w-md">
      <FormField label="Tên phòng *" name="name" value={v.name} onChange={change} error={errors.name} />
      <FormSelect label="Loại phòng" name="room_type" value={v.room_type} onChange={change}>{ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}</FormSelect>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked={v.is_active} onChange={change} className="accent-rose-600" /> Đang hoạt động</label>
    </FormModal>
  );
}

const SEAT_CLS = { standard: 'bg-slate-700 text-slate-200', vip: 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200', couple: 'bg-pink-900/40 border-pink-500/70 text-pink-200' };

function SeatsModal({ room, onClose }) {
  const { data, error, reload } = useFetch(() => getRoomSeats(room.id), [room.id]);
  const rows = useMemo(() => (data ? groupByRow(data.seats) : []), [data]);
  const count = (t) => data?.seats.filter((s) => s.seat_type === t).length ?? 0;
  const surcharge = (t) => data?.seats.find((s) => s.seat_type === t)?.price_surcharge ?? 0;

  return (
    <Modal open onClose={onClose} title={`Sơ đồ ghế: ${room.cinema_name} - ${room.name}`} maxWidth="max-w-3xl">
      <div className="max-h-[75vh] overflow-auto p-5">
        {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-56" /> : (
          <>
            <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-300">
              {Object.keys(SEAT_TYPE_LABELS).map((t) => count(t) > 0 && (
                <li key={t}><b>{count(t)}</b> ghế {SEAT_TYPE_LABELS[t].toLowerCase()}{surcharge(t) > 0 && ` (+${formatPrice(surcharge(t))})`}</li>
              ))}
              <li className="text-slate-500">Tổng {data.seats.length} ghế</li>
            </ul>
            <div className="mx-auto mb-1 h-1.5 w-2/3 rounded-full bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            <p className="mb-4 text-center text-xs tracking-[0.3em] text-slate-500">MÀN HÌNH</p>
            <div className="space-y-1.5">
              {rows.map(([label, list]) => (
                <div key={label} className="flex items-center justify-center gap-1.5">
                  <span className="w-5 text-center text-xs text-slate-500">{label}</span>
                  {list.map((s) => (
                    <span key={s.id} title={`${s.row_label}${s.seat_number} · ${SEAT_TYPE_LABELS[s.seat_type]}`}
                      className={`grid h-8 place-items-center rounded-md border border-transparent text-[11px] font-semibold ${s.seat_type === 'couple' ? 'w-[4.5rem]' : 'w-8'} ${SEAT_CLS[s.seat_type]}`}>
                      {s.seat_number}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function AdminRooms() {
  const [cinemaId, setCinemaId] = useState('');
  const [mode, setMode] = useState(null); // null | { type: 'create' | 'edit' | 'seats', room? }

  const cinemas = useFetch(getCinemas, []);
  const rooms = useFetch(() => getRooms({ cinema_id: cinemaId || undefined }), [cinemaId]);
  const del = useConfirmDelete((r) => deleteRoom(r.id), rooms.reload, 'Đã xóa phòng chiếu');

  const columns = [
    { key: 'cinema', header: 'Rạp', render: (r) => r.cinema_name },
    { key: 'name', header: 'Phòng', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'type', header: 'Loại', render: (r) => r.room_type },
    { key: 'seats', header: 'Số ghế', render: (r) => r.total_seats },
    { key: 'status', header: 'Trạng thái', render: (r) => <ActiveBadge active={Boolean(r.is_active)} on="Hoạt động" off="Tạm ngưng" /> },
    { key: 'actions', header: '', className: 'text-right', render: (r) => (
      <RowActions onEdit={() => setMode({ type: 'edit', room: r })} onDelete={() => del.ask(r)}
        extra={<button onClick={() => setMode({ type: 'seats', room: r })} className="rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition active:scale-95 cursor-pointer">Sơ đồ ghế</button>} />) },
  ];

  const close = () => setMode(null);
  const saved = () => { setMode(null); rooms.reload(); };

  return (
    <div>
      <PageHeader title="Quản lý phòng chiếu & Ghế VIP" subtitle="Mỗi phòng chiếu sẽ tự động tạo lập sơ đồ ghế VIP, Sweetbox chuẩn CINE Cinema.">
        <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} aria-label="Lọc theo rạp"
          className="rounded-xl border border-slate-700/80 bg-[#0F1523] px-3.5 py-2 text-xs font-medium text-slate-200 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer transition">
          <option value="">🏛️ Mọi cụm rạp</option>
          {(cinemas.data || []).map((c) => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
        </select>
        <Button onClick={() => setMode({ type: 'create' })}>＋ Thêm phòng chiếu</Button>
      </PageHeader>

      <AdminTable columns={columns} rows={rooms.data} loading={rooms.loading} error={rooms.error} onRetry={rooms.reload} emptyText="Chưa có phòng chiếu nào" />

      {mode?.type === 'create' && <CreateRoomForm cinemas={cinemas.data} defaultCinemaId={cinemaId} onClose={close} onSaved={saved} />}
      {mode?.type === 'edit' && <EditRoomForm room={mode.room} onClose={close} onSaved={saved} />}
      {mode?.type === 'seats' && <SeatsModal room={mode.room} onClose={close} />}

      <ConfirmDialog open={!!del.target} title="Xóa phòng chiếu" busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel}>
        Xóa phòng <b>{del.target?.cinema_name} - {del.target?.name}</b>? Toàn bộ ghế và suất chiếu của phòng cũng bị xóa. Nếu đã có đơn đặt vé thì không xóa được, khi đó hãy sửa phòng và bỏ chọn "Đang hoạt động".
      </ConfirmDialog>
    </div>
  );
}
