// Đổi link YouTube bất kỳ (watch?v=, youtu.be/, /embed/, /shorts/) thành link nhúng iframe. Link sai trả null.
export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1);
    } else if (u.hostname === 'youtube.com' || u.hostname.endsWith('.youtube.com')) {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
    }
    return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null; // không phải URL hợp lệ
  }
}
