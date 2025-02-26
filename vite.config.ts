import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import electron from 'vite-plugin-electron'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: 'electron/main.js',
      vite: {
        build: {
          outDir: 'dist-electron',
          rollupOptions: {
            external: ['electron', 'electron-store', 'sqlite3']
          }
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.ELECTRON ? './' : '/',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      overlay: true,
      timeout: 30000,
    }
  },
  clearScreen: false,
  build: {
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist',
    rollupOptions: {
      external: ['electron']
    }
  }
}) 