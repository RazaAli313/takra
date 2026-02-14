import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    allowedHosts: [
      'unvolcanically-dorsolateral-sharilyn.ngrok-free.dev' // 👈 your ngrok domain
    ],
    port: 5173
  }
})
