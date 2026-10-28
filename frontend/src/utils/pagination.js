// Tạo dãy số trang để hiển thị, ví dụ trang 5/10 -> [1, '…', 4, 5, 6, '…', 10]
export function getPageNumbers(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [1];
  if (page > 3) pages.push('…');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
  if (page < totalPages - 2) pages.push('…');
  pages.push(totalPages);
  return pages;
}
