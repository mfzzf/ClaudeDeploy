import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const uiServerPort = Number(process.env.CLAUDEDEPLOY_PORT || '3456')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${uiServerPort}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://localhost:${uiServerPort}`,
        ws: true,
      },
    },
  },
})
