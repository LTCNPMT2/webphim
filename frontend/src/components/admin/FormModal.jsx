import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

// Hộp thoại chứa form thêm/sửa: nội dung cuộn được, nút Hủy + Lưu ở cuối
export default function FormModal({ title, onClose, onSubmit, saving, submitLabel = 'Lưu', maxWidth = 'max-w-xl', children }) {
  return (
    <Modal open onClose={saving ? () => {} : onClose} title={title} maxWidth={maxWidth}>
      <form onSubmit={onSubmit} noValidate>
        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-6 scrollbar-thin">{children}</div>
        <div className="flex justify-end gap-3 border-t border-white/10 bg-slate-950/40 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" loading={saving}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
