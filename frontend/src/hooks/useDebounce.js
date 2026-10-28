import { useEffect, useState } from 'react';

// Trả về giá trị sau khi người dùng ngừng thay đổi `delay` ms (dùng cho ô tìm kiếm, đỡ gọi API mỗi phím gõ)
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
