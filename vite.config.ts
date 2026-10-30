import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()], server: { proxy: { '/api': 'http://127.0.0.1:3000' } }, build: { rollupOptions: { output: { manualChunks(id) {
  if (!id.includes('node_modules')) return;
  if (/jspdf|autotable/.test(id)) return 'pdf';
  if (/recharts|d3-|redux|immer|decimal|victory/.test(id)) return 'charts';
  if (/react|scheduler/.test(id)) return 'react';
} } } } });
