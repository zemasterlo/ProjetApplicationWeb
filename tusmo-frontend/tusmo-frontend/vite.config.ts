import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define:{
    global: 'globalThis',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://147.127.135.173:8080/tusmo-0.0.1-SNAPSHOT',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://147.127.135.173:8080/tusmo-0.0.1-SNAPSHOT',
        changeOrigin: true,
        ws: true,
      },
    },
    host: true,
  },
})
