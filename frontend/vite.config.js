import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Tambahkan blok server ini untuk bypass CORS di local dev
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788', // Port lokal backend (Cloudflare Pages)
        changeOrigin: true,
      }
    }
  }
})