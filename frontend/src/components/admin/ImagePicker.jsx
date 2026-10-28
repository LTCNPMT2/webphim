import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { assetUrl } from '../../utils/format.js';

const MAX_MB = 5;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Chọn ảnh upload: xem trước ảnh mới chọn, hoặc ảnh hiện tại (khi sửa). file = File | null
export default function ImagePicker({ label, name, file, currentUrl, onChange, wide = false }) {
  const [preview, setPreview] = useState('');

  // Tạo link xem trước tạm cho file vừa chọn, dọn dẹp khi đổi file / đóng form
  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`Ảnh quá lớn, tối đa ${MAX_MB}MB`);
    onChange(f);
  };

  const shown = preview || assetUrl(currentUrl);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-300">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`grid shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-800 text-slate-600 ${wide ? 'h-16 w-28' : 'h-24 w-16'}`}>
          {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : '🖼️'}
        </div>
        <div className="min-w-0 text-xs text-slate-400">
          <label htmlFor={name} className="inline-block cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-700">
            {shown ? 'Đổi ảnh' : 'Chọn ảnh'}
          </label>
          <input id={name} type="file" accept={TYPES.join(',')} onChange={handlePick} className="sr-only" />
          {file && <p className="mt-1 truncate">{file.name}</p>}
          <p className="mt-1">JPG, PNG, WEBP · tối đa {MAX_MB}MB</p>
        </div>
      </div>
    </div>
  );
}
