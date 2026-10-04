import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import writingPlugin from './scripts/writing-plugin.js'

const root = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), writingPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
  base: '/portfolio/', // GitHub Pages base path
  define: {
    // Uncompressed model size: Pages gzips the GLB, so Content-Length can't drive the loader's progress.
    'import.meta.env.MODEL_BYTES': fs.statSync(path.resolve(root, 'public/assets/models/macbook-pro-m5.glb')).size,
  },
})
