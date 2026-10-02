import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/soundfonts': 'http://localhost:3000',
      '/preview.png': 'http://localhost:3000',
      '/preview.pdf': 'http://localhost:3000',
      '/preview.midi': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
  },
})
