import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-236970479379.asia-south1.run.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
