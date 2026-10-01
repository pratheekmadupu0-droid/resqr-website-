import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1400 kB warning limit: Specifically calibrated for @vladmandic/face-api (~1.32 MB),
    // which is an intentional, client-side WebGL neural network model engine loaded asynchronously on-demand.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Isolate heavy neural vision engine into on-demand chunk
            if (id.includes('@vladmandic/face-api')) {
              return 'face-api';
            }
            // Isolate Firebase backend services
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Isolate Camera / QR Code Scanner engine
            if (id.includes('html5-qrcode')) {
              return 'html5-qrcode';
            }
            // Isolate UI Motion Framework
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // Isolate Icon library
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            // Isolate React runtime core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core';
            }
          }
        },
      },
    },
  },
})