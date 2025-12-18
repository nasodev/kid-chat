import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 3001,
    open: true,
  },
  preview: {
    host: true,
    port: 3001,
    allowedHosts: ['chat.funq.kr'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
