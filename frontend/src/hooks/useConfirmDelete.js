import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../services/api.js';

// Luồng "bấm Xóa -> hộp thoại xác nhận -> gọi API -> báo kết quả"
//   const del = useConfirmDelete((row) => api.remove(row.id), reload, 'Đã xóa phim');
//   <Button onClick={() => del.ask(row)} />   <ConfirmDialog open={!!del.target} busy={del.busy} onConfirm={del.confirm} onCancel={del.cancel} />
export function useConfirmDelete(deleteFn, onDone, successMessage = 'Đã xóa') {
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await deleteFn(target);
      toast.success(successMessage);
      onDone?.();
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 7000 }); // vd 409: đã có đơn đặt vé nên không xóa được
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  return { target, ask: setTarget, cancel: () => setTarget(null), confirm, busy };
}
