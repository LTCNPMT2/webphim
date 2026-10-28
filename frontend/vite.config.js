import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // báo lỗi nếu 5173 đang bị chiếm (backend chỉ cho phép CORS từ 5173)
  },
});
