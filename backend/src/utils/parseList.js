// Form multipart gửi mọi thứ dưới dạng chuỗi nên danh sách có thể đến ở nhiều dạng:
// "[1,2]" (JSON), "1,2" (phẩy), hoặc mảng thật. Hàm này chuẩn hóa về mảng.
const toArray = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : String(parsed).split(',');
    } catch {
      return value.split(',');
    }
  }
  return [value];
};

// -> mảng số (phần tử sai sẽ thành NaN để validator bắt lỗi)
exports.parseIdList = (value) => toArray(value).map((v) => Number(String(v).trim()));

// -> mảng chữ cái in hoa, ví dụ "d,e" -> ["D","E"]
exports.parseLetterList = (value) =>
  toArray(value).map((v) => String(v).trim().toUpperCase()).filter((v) => v !== '');
