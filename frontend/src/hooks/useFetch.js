import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

// Gọi API và quản lý 3 trạng thái: đang tải / lỗi / có dữ liệu.
//   const { data, loading, error, status, reload } = useFetch(() => getMovie(id), [id]);
// - Khi deps đổi sẽ tải lại; kết quả của lần gọi cũ (đã bị bỏ) không ghi đè kết quả mới.
// - Giữ dữ liệu cũ trong lúc tải lại và cả khi tải lại bị lỗi (chuyển trang / tải nền không bị nháy trắng).
//   Muốn biết lỗi thì kiểm tra `error`.
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '', status: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '', status: null }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: '', status: 200 });
      })
      .catch((err) => {
        if (!cancelled) {
          setState((s) => ({ data: s.data, loading: false, error: getErrorMessage(err), status: err.response?.status ?? 0 }));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
