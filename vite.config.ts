import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
      // Proxy for suits API to bypass CORS
      '/suits-api': {
        target: 'https://kct-suits-services-production.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/suits-api/, ''),
      },
    },
  },
}) 