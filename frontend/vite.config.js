import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE se fija en GitHub Pages (/<repo>/); en local es "/".
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    // viem es la única dependencia pesada; en una SPA de una página no hay nada que partir.
    chunkSizeWarningLimit: 600,
  },
})
