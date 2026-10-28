import { useEffect, useState } from 'react';

// Đếm ngược tới mốc `deadline` (mili giây, kiểu Date.now()). Trả về số giây còn lại,
// hoặc null nếu chưa có mốc. Đếm về 0 thì dừng.
export function useCountdown(deadline) {
  const calc = () => (deadline ? Math.max(Math.ceil((deadline - Date.now()) / 1000), 0) : null);
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!deadline) return undefined;
    const timer = setInterval(() => {
      const v = calc();
      setLeft(v);
      if (v <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  return left;
}
