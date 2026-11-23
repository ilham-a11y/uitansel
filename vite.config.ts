import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Saat pengembangan / preview lokal, permintaan /api diteruskan ke server Express di port 3001.
const apiProxy = { '/api': 'http://localhost:3001' }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
})
