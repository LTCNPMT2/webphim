import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage, getFieldErrors } from '../services/api.js';

// Quản lý state của 1 form: giá trị, lỗi từng ô, trạng thái đang lưu.
//   const form = useFormState({ name: '' });
//   <FormField name="name" value={form.values.name} onChange={form.change} error={form.errors.name} />
//   const ok = await form.submit((values) => api.save(values), (values) => validate(values));
export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Dùng chung cho input, select, textarea và checkbox (đọc từ name/value/checked của sự kiện)
  const change = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    setErrors((er) => ({ ...er, [name]: '' })); // gõ lại thì xóa lỗi của ô đó
  }, []);

  const setValue = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  }, []);

  // validate(values) trả { tên_field: 'thông báo' } (rỗng = hợp lệ). save(values) gọi API.
  // Lỗi 422 từ server hiện dưới từng ô; lỗi khác hiện bằng toast. Trả true nếu lưu thành công.
  const submit = async (save, validate) => {
    const found = validate ? validate(values) : {};
    setErrors(found);
    if (Object.keys(found).length) return false;

    setSaving(true);
    try {
      await save(values);
      return true;
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(getErrorMessage(err), { duration: 6000 });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { values, errors, saving, change, setValue, setValues, setErrors, submit };
}
