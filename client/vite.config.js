import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the React dev server proxies /api to the Express server, so cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 250 },
});
