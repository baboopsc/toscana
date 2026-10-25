import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Geliştirme: arayüz 5173'te, API ve Socket.io istekleri 3000'deki sunucuya aktarılır.
// Canlı kullanım: "npm run build" → sunucu client/dist klasörünü 3000 portundan yayınlar.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // 127.0.0.1: Windows'ta "localhost" IPv6'ya (::1) çözülüp bağlanamayabiliyor.
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/socket.io': { target: 'http://127.0.0.1:3000', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
