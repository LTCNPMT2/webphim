import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

// Hộp thoại xác nhận trước thao tác nguy hiểm (xóa, khóa tài khoản, hủy đơn...)
export default function ConfirmDialog({ open, title, children, confirmLabel = 'Xóa', danger = true, busy = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={title} maxWidth="max-w-md">
      <div className="p-6">
        <div className="text-sm leading-relaxed text-slate-300">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={busy}>Hủy bỏ</Button>
          <Button onClick={onConfirm} loading={busy} className={danger ? 'bg-rose-600! hover:bg-rose-700! shadow-lg shadow-rose-950/50 text-white' : ''}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
