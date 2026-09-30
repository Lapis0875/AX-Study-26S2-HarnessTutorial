import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: 'node_modules/vite-cache',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { emptyOutDir: false },
});
