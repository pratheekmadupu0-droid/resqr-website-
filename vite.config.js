import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase SDK is large and stable — cache it separately from app code
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/analytics'],
          // Animation + QR render libraries used across the app
          vendor: ['framer-motion', 'qrcode.react', 'lucide-react'],
        },
      },
    },
  },
})
