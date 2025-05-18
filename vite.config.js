import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.csv'],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
        secure: false
      },
      '/data': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    },
    fs: {
      strict: false // Cho phép truy cập file bên ngoài thư mục src
    }
  }
})