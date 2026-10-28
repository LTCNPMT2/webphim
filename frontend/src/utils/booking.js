// Các hàm thuần (không phụ thuộc React) cho luồng đặt vé: dễ kiểm tra riêng
export const seatLabel = (s) => `${s.row_label}${s.seat_number}`;

export const sortSeats = (list) =>
  [...list].sort((a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number);

// Gom ghế theo hàng: [['A', [ghế A1, A2...]], ['B', [...]]]
export const groupByRow = (seats) => {
  const map = new Map();
  sortSeats(seats).forEach((s) => {
    if (!map.has(s.row_label)) map.set(s.row_label, []);
    map.get(s.row_label).push(s);
  });
  return [...map.entries()];
};

// Sau khi tải lại sơ đồ ghế: giữ lại các ghế đang chọn mà còn trống,
// ghế vừa bị người khác lấy thì tách ra (lost = danh sách tên ghế để báo người dùng)
export const pruneSelection = (selectedIds, seats) => {
  const byId = new Map(seats.map((s) => [s.id, s]));
  const keep = [];
  const lost = [];
  selectedIds.forEach((id) => {
    const s = byId.get(id);
    if (!s) return; // không còn trong sơ đồ: bỏ im lặng
    if (s.status === 'available') keep.push(id);
    else lost.push(seatLabel(s));
  });
  return { keep, lost };
};

// seatLines: [{ price }], comboLines: [{ total }]
export const calcTotals = ({ seatLines = [], comboLines = [], discount = 0 }) => {
  const seatTotal = seatLines.reduce((sum, s) => sum + s.price, 0);
  const comboTotal = comboLines.reduce((sum, c) => sum + c.total, 0);
  const subtotal = seatTotal + comboTotal;
  return { seatTotal, comboTotal, subtotal, discount, total: Math.max(subtotal - discount, 0) };
};
